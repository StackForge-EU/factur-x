/**
 * Factur-X PDF Embedding
 *
 * Embeds structured invoice XML into a PDF document and ensures
 * PDF/A-3 compliance via XMP metadata.
 *
 * @module core/embed
 * @license EUPL-1.2
 */

import type { Buffer } from "node:buffer";
import console from "node:console";
import {
  PDFDocument,
  PDFName,
  PDFArray,
  PDFDict,
  PDFRef,
  PDFString,
  AFRelationship,
} from "pdf-lib";

import type { FacturXInvoiceInput } from "../types/input";
import { Profile, Flavor } from "../flavors/constants";
import { getFlavorConfig, validateFlavorProfile } from "../flavors/registry";
import { buildXml } from "./xml-builder";
import type { ValidationResult } from "../validation/profile-validator";
import { validateInput } from "../validation/profile-validator";
import type { XsdValidationResult } from "../validation/xsd-validator";
import { validateXsd } from "../validation/xsd-validator";

/** Options for embedding Factur-X XML into a PDF. */
export interface EmbedOptions {
  /** Input PDF as Buffer or Uint8Array. */
  pdf: Uint8Array | Buffer;

  /** Pre-built XML string. If not provided, will build from {@link input}. */
  xml?: string;

  /** Structured invoice input. Used to build XML if {@link xml} is not provided. */
  input?: FacturXInvoiceInput;

  /** Profile level. */
  profile: Profile;

  /** Flavor (default: {@link Flavor.FACTUR_X}). */
  flavor?: Flavor;

  /** Validate input before generating XML (default: `true`). */
  validateBeforeEmbed?: boolean;

  /**
   * Run XSD schema validation on the generated XML (default: `false`).
   * Requires schema files to be present (shipped with the package).
   */
  validateXsd?: boolean;

  /** Add PDF/A-3 metadata (default: `true`). */
  addPdfA3Metadata?: boolean;

  /**
   * RGB ICC profile bytes used to inject the PDF/A required `/OutputIntents`
   * entry when the input PDF does not already have one.
   *
   * PDF/A-3 forbids DeviceRGB without an OutputIntent that references an
   * RGB destination profile (ISO 19005-3 §6.2.4.3). pdf-lib does not produce
   * PDF/A by default, so this library will add the entry on save when this
   * profile is supplied.
   *
   * Drop in any sRGB ICC v2 profile compatible with your licensing needs
   * (e.g. the ICC.org public profile, or one bundled with Argyll CMS / PDFBox).
   * When omitted and {@link addPdfA3Metadata} is `true`, the library logs a
   * warning and the resulting PDF will not be PDF/A-3 conformant.
   */
  rgbIccProfile?: Uint8Array | Buffer;

  /**
   * Output intent identifier written into the OutputIntent dictionary.
   * Defaults to `"sRGB IEC61966-2.1"` which matches the standard sRGB profile.
   */
  outputIntentIdentifier?: string;

  /**
   * How to react when the input PDF references fonts that are not embedded.
   * PDF/A-3 requires every font to be embedded (ISO 19005-3 §6.2.11.4.1) —
   * this library cannot fix that post-hoc, so it surfaces the gap.
   *
   * - `"warn"` (default): log a warning to `console.warn` and continue.
   * - `"throw"`: reject the PDF with an error.
   * - `"ignore"`: skip the check entirely.
   */
  unembeddedFonts?: "warn" | "throw" | "ignore";

  /**
   * Override the AF relationship for the embedded XML attachment.
   *
   * Per the Factur-X specification:
   * - MINIMUM / BASIC_WL → `Data` (XML carries structured data only)
   * - BASIC / EN16931 / EXTENDED → `Alternative` (XML is a full representation)
   *
   * When not set, the correct value is derived automatically from {@link profile}.
   */
  afRelationship?: "Alternative" | "Data" | "Source";

  /** PDF metadata overrides. */
  meta?: {
    author?: string;
    title?: string;
    subject?: string;
    creator?: string;
  };
}

/** Result returned by {@link embedFacturX}. */
export interface EmbedResult {
  /** The resulting PDF bytes. */
  pdf: Uint8Array;

  /** The XML that was embedded. */
  xml: string;

  /** Profile validation result (if validation was performed). */
  validation?: ValidationResult;

  /** XSD schema validation result (if XSD validation was requested). */
  xsdValidation?: XsdValidationResult;
}

const AF_RELATIONSHIP_MAP: Record<string, AFRelationship> = {
  Alternative: AFRelationship.Alternative,
  Data: AFRelationship.Data,
  Source: AFRelationship.Source,
};

const XMP_CONFORMANCE_LEVEL: Record<Profile, string> = {
  [Profile.MINIMUM]: "MINIMUM",
  [Profile.BASIC_WL]: "BASIC WL",
  [Profile.BASIC]: "BASIC",
  [Profile.EN16931]: "EN 16931",
  [Profile.EXTENDED]: "EXTENDED",
};

/**
 * Adds a PDF/A `/OutputIntents` entry pointing at the supplied RGB ICC
 * profile if the document does not already have one.
 *
 * Per ISO 19005-3 §6.2.4 a PDF/A document that uses DeviceRGB must declare
 * a destination profile via an OutputIntent of subtype `GTS_PDFA1`.
 */
function ensureOutputIntent(
  pdfDoc: PDFDocument,
  iccBytes: Uint8Array,
  identifier: string,
): void {
  const existing = pdfDoc.catalog.lookup(PDFName.of("OutputIntents"));
  if (existing instanceof PDFArray && existing.size() > 0) return;

  // ICC profile stream. `N` is the number of color components — 3 for RGB.
  const iccStream = pdfDoc.context.flateStream(iccBytes, { N: 3 });
  const iccRef = pdfDoc.context.register(iccStream);

  const intent = pdfDoc.context.obj({
    Type: "OutputIntent",
    S: "GTS_PDFA1",
    OutputConditionIdentifier: PDFString.of(identifier),
    RegistryName: PDFString.of("http://www.color.org"),
    Info: PDFString.of(identifier),
    DestOutputProfile: iccRef,
  });

  const intents = PDFArray.withContext(pdfDoc.context);
  intents.push(intent);
  pdfDoc.catalog.set(PDFName.of("OutputIntents"), intents);
}

/**
 * Walks every page's `/Resources/Font` tree and returns the names of fonts
 * whose `FontDescriptor` does not embed a font program (`FontFile`,
 * `FontFile2`, or `FontFile3`). PDF/A-3 forbids unembedded fonts.
 */
function findUnembeddedFonts(pdfDoc: PDFDocument): string[] {
  const seen = new Set<PDFRef>();
  const unembedded = new Set<string>();
  const FONT_FILE_KEYS = [
    PDFName.of("FontFile"),
    PDFName.of("FontFile2"),
    PDFName.of("FontFile3"),
  ];

  const inspectFontDict = (font: PDFDict): void => {
    const subtype = font.lookup(PDFName.of("Subtype"));
    const baseFont = font.lookup(PDFName.of("BaseFont"));
    const baseFontName = baseFont instanceof PDFName ? baseFont.asString() : "<unknown>";
    const subtypeName = subtype instanceof PDFName ? subtype.asString() : "";

    // Type 0 (composite) fonts carry the actual descriptor on their descendants.
    if (subtypeName === "/Type0") {
      const desc = font.lookup(PDFName.of("DescendantFonts"));
      if (desc instanceof PDFArray) {
        for (let i = 0; i < desc.size(); i += 1) {
          const child = desc.lookup(i);
          if (child instanceof PDFDict) inspectFontDict(child);
        }
      }
      return;
    }

    const descriptor = font.lookup(PDFName.of("FontDescriptor"));
    if (!(descriptor instanceof PDFDict)) {
      // Standard 14 fonts (Helvetica, Times, etc.) have no descriptor and
      // are not embedded. PDF/A-3 forbids this.
      unembedded.add(baseFontName);
      return;
    }
    const hasEmbedded = FONT_FILE_KEYS.some((k) => descriptor.has(k));
    if (!hasEmbedded) unembedded.add(baseFontName);
  };

  for (const page of pdfDoc.getPages()) {
    const resources = page.node.Resources();
    if (!resources) continue;
    const fonts = resources.lookup(PDFName.of("Font"));
    if (!(fonts instanceof PDFDict)) continue;
    for (const [, value] of fonts.entries()) {
      const ref = value instanceof PDFRef ? value : undefined;
      if (ref) {
        if (seen.has(ref)) continue;
        seen.add(ref);
      }
      const font = ref ? pdfDoc.context.lookup(ref) : value;
      if (font instanceof PDFDict) inspectFontDict(font);
    }
  }

  return Array.from(unembedded);
}

/**
 * Resolves the AF relationship for the PDF attachment based on profile level.
 *
 * Per the Factur-X 1.08 specification (§6.3):
 * - MINIMUM / BASIC_WL → `Data`
 * - BASIC / EN16931 / EXTENDED → `Alternative`
 */
function resolveAfRelationship(
  profile: Profile,
  override?: "Alternative" | "Data" | "Source",
): AFRelationship {
  if (override) return AF_RELATIONSHIP_MAP[override];
  switch (profile) {
    case Profile.MINIMUM:
    case Profile.BASIC_WL:
      return AFRelationship.Data;
    default:
      return AFRelationship.Alternative;
  }
}

/**
 * Build XMP metadata XML for PDF/A-3b conformance with Factur-X extension schema.
 *
 * @param opts - Metadata parameters
 * @returns XMP XML string (without XML processing instruction — raw packet)
 */
function buildXmpMetadata(opts: {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  createDate: string;
  modifyDate: string;
  documentFileName: string;
  conformanceLevel: string;
}): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${esc(opts.title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${esc(opts.author)}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${esc(opts.subject)}</rdf:li>
        </rdf:Alt>
      </dc:description>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>${esc(opts.producer)}</pdf:Producer>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>${esc(opts.creator)}</xmp:CreatorTool>
      <xmp:CreateDate>${opts.createDate}</xmp:CreateDate>
      <xmp:ModifyDate>${opts.modifyDate}</xmp:ModifyDate>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Factur-X conformance level</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Version of the Factur-X XML schema</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentFileName>${esc(opts.documentFileName)}</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:ConformanceLevel>${esc(opts.conformanceLevel)}</fx:ConformanceLevel>
      <fx:Version>1.0</fx:Version>
    </rdf:Description>

  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Embeds Factur-X / ZUGFeRD XML into a PDF and sets PDF/A-3b metadata.
 *
 * Either provide a pre-built `xml` string or a structured `input` from which
 * the XML will be generated. The resulting PDF contains the XML as an
 * embedded attachment with the correct AF relationship and XMP metadata
 * declaring PDF/A-3b conformance.
 *
 * @param options - Embedding configuration
 * @returns The PDF bytes, embedded XML, and optional validation result
 *
 * @example
 * ```ts
 * const result = await embedFacturX({
 *   pdf: existingPdfBytes,
 *   input: invoiceData,
 *   profile: Profile.EN16931,
 * });
 * fs.writeFileSync('invoice.pdf', result.pdf);
 * ```
 */
export async function embedFacturX(options: EmbedOptions): Promise<EmbedResult> {
  const {
    pdf,
    profile,
    flavor = Flavor.FACTUR_X,
    validateBeforeEmbed = true,
    validateXsd: runXsdValidation = false,
    addPdfA3Metadata = true,
    rgbIccProfile,
    outputIntentIdentifier = "sRGB IEC61966-2.1",
    unembeddedFonts = "warn",
    meta,
  } = options;

  if (!options.xml && !options.input) {
    throw new Error('Either "xml" or "input" must be provided to embedFacturX.');
  }

  validateFlavorProfile(flavor, profile);

  const flavorConfig = getFlavorConfig(flavor);
  let xml = options.xml;
  let validation: ValidationResult | undefined;
  let xsdValidation: XsdValidationResult | undefined;

  if (!xml) {
    const input = options.input!;

    if (validateBeforeEmbed) {
      validation = validateInput(input, profile, flavor);
      if (!validation.valid) {
        throw new Error(
          `Input validation failed for profile "${profile}":\n` +
            validation.errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n"),
        );
      }
    }

    xml = buildXml(input, profile, flavor);
  }

  if (runXsdValidation) {
    xsdValidation = await validateXsd(xml, profile);
    if (!xsdValidation.valid) {
      throw new Error(
        `XSD validation failed for profile "${profile}":\n` +
          xsdValidation.errors.map((e) => `  - ${e.message}`).join("\n"),
      );
    }
  }

  const pdfDoc = await PDFDocument.load(pdf, { updateMetadata: false });

  const xmlBytes = new TextEncoder().encode(xml);
  const afRel = resolveAfRelationship(profile, options.afRelationship);
  await pdfDoc.attach(xmlBytes, flavorConfig.attachmentFilename, {
    mimeType: "text/xml",
    afRelationship: afRel,
    description: "Factur-X Invoice",
  });

  const now = new Date();
  const title = meta?.title ?? "Factur-X Invoice";
  const author = meta?.author ?? "";
  const subject = meta?.subject ?? "";
  const creator = meta?.creator ?? "factur-x";
  const producer = "factur-x (pdf-lib)";

  pdfDoc.setTitle(title);
  if (author) pdfDoc.setAuthor(author);
  if (subject) pdfDoc.setSubject(subject);
  pdfDoc.setCreator(creator);
  pdfDoc.setProducer(producer);
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  if (addPdfA3Metadata) {
    if (rgbIccProfile) {
      const iccBytes =
        rgbIccProfile instanceof Uint8Array ? rgbIccProfile : new Uint8Array(rgbIccProfile);
      ensureOutputIntent(pdfDoc, iccBytes, outputIntentIdentifier);
    } else if (!(pdfDoc.catalog.lookup(PDFName.of("OutputIntents")) instanceof PDFArray)) {
      // Honest XMP: only claim PDF/A when the prerequisites are present.
      // veraPDF would otherwise reject the file with a DeviceRGB / no-output-intent error.
      console.warn(
        "[factur-x] addPdfA3Metadata is enabled but no rgbIccProfile was supplied and the input PDF has no /OutputIntents. The resulting PDF will not be PDF/A-3 conformant.",
      );
    }

    if (unembeddedFonts !== "ignore") {
      const missing = findUnembeddedFonts(pdfDoc);
      if (missing.length > 0) {
        const message = `[factur-x] PDF/A-3 requires every font program to be embedded; the following fonts are not embedded: ${missing.join(", ")}. Configure your PDF generator to embed all fonts.`;
        if (unembeddedFonts === "throw") throw new Error(message);
        console.warn(message);
      }
    }

    const isoDate = now.toISOString();
    const xmpXml = buildXmpMetadata({
      title,
      author,
      subject,
      creator,
      producer,
      createDate: isoDate,
      modifyDate: isoDate,
      documentFileName: flavorConfig.attachmentFilename,
      conformanceLevel: XMP_CONFORMANCE_LEVEL[profile],
    });

    const xmpBytes = new TextEncoder().encode(xmpXml);
    const metadataStream = pdfDoc.context.stream(xmpBytes, {
      Type: "Metadata",
      Subtype: "XML",
      Length: xmpBytes.length,
    });
    const metadataRef = pdfDoc.context.register(metadataStream);
    pdfDoc.catalog.set(PDFName.of("Metadata"), metadataRef);
  }

  const resultPdf = await pdfDoc.save();

  return {
    pdf: resultPdf,
    xml,
    ...(validation ? { validation } : {}),
    ...(xsdValidation ? { xsdValidation } : {}),
  };
}
