/**
 * Factur-X / ZUGFeRD XML Extraction from PDF
 *
 * Reads an embedded CII XML attachment from a PDF document.
 * Supports detection of all standard attachment filenames
 * (`factur-x.xml`, `xrechnung.xml`, `zugferd-invoice.xml`, `ZUGFeRD-invoice.xml`).
 *
 * @module core/extract
 * @license EUPL-1.2
 */

import type { Buffer } from "node:buffer";
import { Profile } from "../flavors/constants";
import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFArray,
  PDFString,
  PDFHexString,
  PDFStream,
  PDFRef,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";

/** Well-known filenames for Factur-X / ZUGFeRD XML attachments. */
const KNOWN_ATTACHMENT_NAMES = [
  "factur-x.xml",
  "xrechnung.xml",
  "zugferd-invoice.xml",
  "ZUGFeRD-invoice.xml",
];

/**
 * Result returned by {@link extractXml}.
 */
export interface ExtractResult {
  /** The extracted XML string */
  xml: string;
  /** The filename of the embedded attachment */
  filename: string;
  /** The Factur-X profile detected from the XML (if identifiable) */
  profile?: Profile;
}

/**
 * Options for {@link extractXml}.
 */
export interface ExtractOptions {
  /**
   * Specific attachment filename to look for.
   * If not set, searches for all known Factur-X filenames.
   */
  filename?: string;
}

/**
 * Attempts to decode a PDF string (PDFString or PDFHexString) to a JS string.
 */
function decodePdfString(obj: unknown): string | undefined {
  if (obj instanceof PDFString) return obj.decodeText();
  if (obj instanceof PDFHexString) return obj.decodeText();
  if (typeof obj === "string") return obj;
  return undefined;
}

/**
 * Resolves a reference to the actual object if it's a PDFRef.
 */
function resolve(doc: PDFDocument, obj: unknown): unknown {
  if (obj instanceof PDFRef) return doc.context.lookup(obj);
  return obj;
}

/**
 * Detects the Factur-X profile from the GuidelineSpecifiedDocumentContextParameter
 * in the extracted XML.
 */
function detectProfile(xml: string): Profile | undefined {
  const profileMap: Record<string, Profile> = {
    "urn:factur-x.eu:1p0:minimum": Profile.MINIMUM,
    "urn:factur-x.eu:1p0:basicwl": Profile.BASIC_WL,
    "urn:factur-x.eu:1p0:basic": Profile.BASIC,
    "urn:factur-x.eu:1p0:en16931": Profile.EN16931,
    "urn:factur-x.eu:1p0:extended": Profile.EXTENDED,
    "urn:cen.eu:en16931:2017": Profile.EN16931,
    "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0": Profile.EN16931,
    "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_2.3": Profile.EN16931,
    "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_2.2": Profile.EN16931,
  };

  for (const [urn, profile] of Object.entries(profileMap)) {
    if (xml.includes(urn)) return profile;
  }
  return undefined;
}

/**
 * Extracts Factur-X / ZUGFeRD XML from a PDF document.
 *
 * Searches the PDF's embedded files (Names → EmbeddedFiles) for a known
 * Factur-X attachment or a specific filename.  Returns the XML content,
 * the filename, and the detected profile.
 *
 * @param pdf     - Input PDF as `Uint8Array` or `Buffer`
 * @param options - Extraction options (e.g. specific filename)
 * @returns The extracted XML, filename, and detected profile
 *
 * @throws Error if no matching XML attachment is found
 *
 * @example
 * ```ts
 * import { extractXml } from '@stackforge-eu/factur-x';
 * import { readFile } from 'fs/promises';
 *
 * const pdf = await readFile('invoice.pdf');
 * const { xml, filename, profile } = await extractXml(pdf);
 * console.log(`Found ${filename} (profile: ${profile})`);
 * console.log(xml);
 * ```
 */
export async function extractXml(
  pdf: Uint8Array | Buffer,
  options?: ExtractOptions,
): Promise<ExtractResult> {
  const pdfDoc = await PDFDocument.load(pdf, { updateMetadata: false });
  const catalog = pdfDoc.catalog;

  const namesDict = resolve(pdfDoc, catalog.get(PDFName.of("Names")));
  if (!(namesDict instanceof PDFDict)) {
    throw new Error("PDF does not contain a Names dictionary — no embedded files found.");
  }

  const embeddedFilesObj = resolve(pdfDoc, namesDict.get(PDFName.of("EmbeddedFiles")));
  if (!(embeddedFilesObj instanceof PDFDict)) {
    throw new Error("PDF does not contain an EmbeddedFiles name tree.");
  }

  const targetNames = options?.filename ? [options.filename] : KNOWN_ATTACHMENT_NAMES;

  const entries = collectNameTreeEntries(pdfDoc, embeddedFilesObj);

  for (const [name, fileSpecRef] of entries) {
    if (!targetNames.some((t) => name.toLowerCase() === t.toLowerCase())) {
      continue;
    }

    const fileSpec = resolve(pdfDoc, fileSpecRef);
    if (!(fileSpec instanceof PDFDict)) continue;

    const efDict = resolve(pdfDoc, fileSpec.get(PDFName.of("EF")));
    if (!(efDict instanceof PDFDict)) continue;

    const streamRef = efDict.get(PDFName.of("F"));
    const stream = resolve(pdfDoc, streamRef);
    if (!(stream instanceof PDFStream)) continue;

    const rawBytes =
      stream instanceof PDFRawStream ? decodePDFRawStream(stream).decode() : stream.getContents();
    const xml = new TextDecoder("utf-8").decode(rawBytes);
    const profile = detectProfile(xml);

    return { xml, filename: name, profile };
  }

  throw new Error(
    `No Factur-X / ZUGFeRD XML attachment found in PDF. ` +
      `Searched for: ${targetNames.join(", ")}.`,
  );
}

/**
 * Recursively collects all [name, value] pairs from a PDF Name Tree.
 *
 * Name trees may be flat (with a `Names` array) or nested (with a `Kids` array
 * pointing to intermediate nodes).
 */
function collectNameTreeEntries(doc: PDFDocument, node: PDFDict): Array<[string, unknown]> {
  const results: Array<[string, unknown]> = [];

  const namesArray = resolve(doc, node.get(PDFName.of("Names")));
  if (namesArray instanceof PDFArray) {
    for (let i = 0; i < namesArray.size(); i += 2) {
      const keyObj = resolve(doc, namesArray.get(i));
      const valObj = namesArray.get(i + 1);
      const key = decodePdfString(keyObj);
      if (key != null) {
        results.push([key, valObj]);
      }
    }
  }

  const kidsArray = resolve(doc, node.get(PDFName.of("Kids")));
  if (kidsArray instanceof PDFArray) {
    for (let i = 0; i < kidsArray.size(); i++) {
      const kid = resolve(doc, kidsArray.get(i));
      if (kid instanceof PDFDict) {
        results.push(...collectNameTreeEntries(doc, kid));
      }
    }
  }

  return results;
}
