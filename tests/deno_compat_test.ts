/**
 * Deno compatibility tests.
 *
 * Mirrors the vitest suite using Deno's native test runner and @std/assert.
 * Run with: deno test --allow-read --allow-env --allow-ffi --unstable-sloppy-imports tests/deno_compat_test.ts
 */

/// <reference types="npm:@types/node" />

import {
  assert,
  assertEquals,
  assertGreater,
  assertStringIncludes,
  assertThrows,
  assertRejects,
} from "jsr:@std/assert";
import * as path from "node:path";

import { buildXml, escapeXml } from "../src/core/xml-builder.ts";
import { embedFacturX } from "../src/core/embed.ts";
import { extractXml } from "../src/core/extract.ts";
import { toXRechnung } from "../src/core/xrechnung.ts";
import { validateInput } from "../src/validation/profile-validator.ts";
import { validateXsd } from "../src/validation/xsd-validator.ts";
import {
  Profile,
  Flavor,
  PROFILE_URNS,
  PROFILE_SCHEMA_DIRS,
  PROFILE_MAIN_XSD,
} from "../src/flavors/constants.ts";
import {
  getFlavorConfig,
  validateFlavorProfile,
  resolveTypeCode,
  resolveBusinessProcessUrn,
} from "../src/flavors/registry.ts";
import { DocumentTypeCode } from "../src/types/input.ts";
import type { FacturXInvoiceInput } from "../src/types/input.ts";
import {
  createMinimumInput,
  createBasicWlInput,
  createBasicInput,
  createEn16931Input,
  createExtendedInput,
  createXRechnungInput,
} from "./helpers.ts";

// Dynamically import pdf-lib for embed/extract tests
const { PDFDocument } = await import("pdf-lib");

const schemaBasePath = path.resolve(Deno.cwd());

async function createTestPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  return doc.save();
}

// ---------------------------------------------------------------------------
// escapeXml
// ---------------------------------------------------------------------------

Deno.test("escapeXml: escapes ampersand", () => {
  assertEquals(escapeXml("A & B"), "A &amp; B");
});

Deno.test("escapeXml: escapes < > \" '", () => {
  assertEquals(escapeXml("a < b"), "a &lt; b");
  assertEquals(escapeXml("a > b"), "a &gt; b");
  assertEquals(escapeXml('say "hello"'), "say &quot;hello&quot;");
  assertEquals(escapeXml("it's"), "it&apos;s");
});

Deno.test("escapeXml: strips control characters but keeps tab/newline/cr", () => {
  assertEquals(escapeXml("hello\x00world"), "helloworld");
  assertEquals(escapeXml("a\tb\nc\rd"), "a\tb\nc\rd");
  assertEquals(escapeXml("\x01A & B\x02"), "A &amp; B");
});

// ---------------------------------------------------------------------------
// buildXml — MINIMUM
// ---------------------------------------------------------------------------

Deno.test("buildXml MINIMUM: valid XML with correct structure", () => {
  const xml = buildXml(createMinimumInput(), Profile.MINIMUM);
  assert(xml.startsWith("<?xml"));
  assertStringIncludes(xml, 'encoding="UTF-8"');
  assertStringIncludes(xml, "<rsm:CrossIndustryInvoice");
  assertStringIncludes(xml, "</rsm:CrossIndustryInvoice>");
  assertStringIncludes(xml, "urn:factur-x.eu:1p0:minimum");
  assertStringIncludes(xml, "INV-TEST-001");
  assertStringIncludes(xml, "20250601");
  assertStringIncludes(xml, "<ram:TypeCode>380</ram:TypeCode>");
});

Deno.test("buildXml MINIMUM: contains seller and buyer, no line items", () => {
  const xml = buildXml(createMinimumInput(), Profile.MINIMUM);
  assertStringIncludes(xml, "StackForge UG (haftungsbeschränkt)");
  assertStringIncludes(xml, "Kite-Engineer by Stefan Merthan");
  assertStringIncludes(xml, "100.00");
  assert(!xml.includes("IncludedSupplyChainTradeLineItem"));
});

// ---------------------------------------------------------------------------
// buildXml — BASIC_WL
// ---------------------------------------------------------------------------

Deno.test("buildXml BASIC_WL: VAT breakdown and payment means", () => {
  const xml = buildXml(createBasicWlInput(), Profile.BASIC_WL);
  assertStringIncludes(xml, "urn:factur-x.eu:1p0:basicwl");
  assertStringIncludes(xml, "ApplicableTradeTax");
  assertStringIncludes(xml, "<ram:TypeCode>58</ram:TypeCode>");
  assertStringIncludes(xml, "DE89370400440532013000");
});

// ---------------------------------------------------------------------------
// buildXml — BASIC
// ---------------------------------------------------------------------------

Deno.test("buildXml BASIC: line items and VAT breakdown", () => {
  const xml = buildXml(createBasicInput(), Profile.BASIC);
  assertStringIncludes(xml, "urn:factur-x.eu:1p0:basic");
  assertStringIncludes(xml, "IncludedSupplyChainTradeLineItem");
  assertStringIncludes(xml, "<ram:LineID>1</ram:LineID>");
  assertStringIncludes(xml, "Widget A");
  assertStringIncludes(xml, "ApplicableTradeTax");
});

// ---------------------------------------------------------------------------
// buildXml — EN16931
// ---------------------------------------------------------------------------

Deno.test("buildXml EN16931: full line items, contacts, delivery", () => {
  const xml = buildXml(createEn16931Input(), Profile.EN16931);
  assertStringIncludes(xml, "urn:factur-x.eu:1p0:en16931");
  assertStringIncludes(xml, "<ram:LineID>1</ram:LineID>");
  assertStringIncludes(xml, "<ram:LineID>2</ram:LineID>");
  assertStringIncludes(xml, "Consulting Services");
  assertStringIncludes(xml, "Software License");
  assertStringIncludes(xml, "Tobias Sittenauer");
  assertStringIncludes(xml, "ActualDeliverySupplyChainEvent");
  assertStringIncludes(xml, "COBADEFFXXX");
});

// ---------------------------------------------------------------------------
// buildXml — EXTENDED
// ---------------------------------------------------------------------------

Deno.test("buildXml EXTENDED: name, language, legal org, delivery party", () => {
  const xml = buildXml(createExtendedInput(), Profile.EXTENDED);
  assertStringIncludes(xml, "urn:factur-x.eu:1p0:extended");
  assertStringIncludes(xml, "<ram:Name>Extended Test Invoice</ram:Name>");
  assertStringIncludes(xml, "<ram:LanguageID>de</ram:LanguageID>");
  assertStringIncludes(xml, "SpecifiedLegalOrganization");
  assertStringIncludes(xml, "ShipToTradeParty");
  assertStringIncludes(xml, "GrossPriceProductTradePrice");
});

// ---------------------------------------------------------------------------
// buildXml — Edge cases & input guards
// ---------------------------------------------------------------------------

Deno.test("buildXml: escapes XML special characters", () => {
  const input = createMinimumInput({ seller: { name: "Smith & Sons <test>" } });
  const xml = buildXml(input, Profile.MINIMUM);
  assertStringIncludes(xml, "Smith &amp; Sons");
  assertStringIncludes(xml, "&lt;test&gt;");
});

Deno.test("buildXml: throws on null/undefined input", () => {
  assertThrows(() => buildXml(null as any, Profile.MINIMUM), Error, '"input" is required');
  assertThrows(() => buildXml(undefined as any, Profile.MINIMUM), Error, '"input" is required');
});

Deno.test("buildXml: throws on missing profile", () => {
  assertThrows(() => buildXml(createMinimumInput(), null as any), Error, '"profile" is required');
});

Deno.test("buildXml: throws on NaN/Infinity amounts", () => {
  const nanInput = createMinimumInput({
    totals: { ...createMinimumInput().totals, taxBasisTotal: NaN },
  });
  assertThrows(() => buildXml(nanInput, Profile.MINIMUM), Error, "Invalid amount value");

  const infInput = createMinimumInput({
    totals: { ...createMinimumInput().totals, grandTotal: Infinity },
  });
  assertThrows(() => buildXml(infInput, Profile.MINIMUM), Error, "Invalid amount value");
});

Deno.test("buildXml: throws on invalid date format", () => {
  const input = createMinimumInput({
    document: { ...createMinimumInput().document, issueDate: "01/06/2025" },
  });
  assertThrows(() => buildXml(input, Profile.MINIMUM), Error, "Invalid date format");
});

// ---------------------------------------------------------------------------
// buildXml — Flavor differences
// ---------------------------------------------------------------------------

Deno.test("buildXml: flavor type code handling", () => {
  const input = createMinimumInput({ document: { id: "INV-001", issueDate: "2025-01-01" } });
  const fxXml = buildXml(input, Profile.MINIMUM, Flavor.FACTUR_X);
  assertStringIncludes(fxXml, "<ram:TypeCode>380</ram:TypeCode>");

  const cnInput = createMinimumInput({
    document: { id: "CN-001", issueDate: "2025-01-01", typeCode: DocumentTypeCode.CREDIT_NOTE },
  });
  const cnXml = buildXml(cnInput, Profile.MINIMUM, Flavor.FACTUR_X);
  assertStringIncludes(cnXml, "<ram:TypeCode>381</ram:TypeCode>");
});

// ---------------------------------------------------------------------------
// validateInput
// ---------------------------------------------------------------------------

Deno.test("validateInput: valid MINIMUM passes", () => {
  const result = validateInput(createMinimumInput(), Profile.MINIMUM);
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateInput: missing document.id fails for MINIMUM", () => {
  const input = createMinimumInput({
    document: { ...createMinimumInput().document!, id: "" },
  });
  const result = validateInput(input, Profile.MINIMUM);
  assert(!result.valid);
  assert(result.errors.some((e) => e.field === "document.id"));
});

Deno.test("validateInput: valid BASIC_WL passes", () => {
  const result = validateInput(createBasicWlInput(), Profile.BASIC_WL);
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateInput: missing seller.address fails for BASIC_WL", () => {
  const input = createBasicWlInput({
    seller: { ...createBasicWlInput().seller!, address: undefined },
  });
  const result = validateInput(input, Profile.BASIC_WL);
  assert(!result.valid);
  assert(result.errors.some((e) => e.field === "seller.address"));
});

Deno.test("validateInput: missing lines fails for BASIC", () => {
  const input = createBasicWlInput({ lines: undefined });
  const result = validateInput(input, Profile.BASIC);
  assert(!result.valid);
  assert(result.errors.some((e) => e.field === "lines"));
});

Deno.test("validateInput: valid EN16931 passes", () => {
  const result = validateInput(createEn16931Input(), Profile.EN16931);
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateInput: valid EXTENDED passes", () => {
  const result = validateInput(createExtendedInput(), Profile.EXTENDED);
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test(
  "validateInput: cumulative — EN16931 catches missing seller.address (BASIC_WL rule)",
  () => {
    const input = createEn16931Input({
      seller: { ...createEn16931Input().seller!, address: undefined },
    });
    const result = validateInput(input, Profile.EN16931);
    assert(!result.valid);
    assert(result.errors.some((e) => e.field === "seller.address"));
  },
);

// ---------------------------------------------------------------------------
// Flavor constants & registry
// ---------------------------------------------------------------------------

Deno.test("PROFILE_URNS: all 5 profiles have URNs containing factur-x.eu", () => {
  const profiles = [
    Profile.MINIMUM,
    Profile.BASIC_WL,
    Profile.BASIC,
    Profile.EN16931,
    Profile.EXTENDED,
  ];
  for (const p of profiles) {
    assertStringIncludes(PROFILE_URNS[p], "factur-x.eu");
  }
});

Deno.test("PROFILE_SCHEMA_DIRS: all profiles have directory names", () => {
  for (const p of Object.values(Profile)) {
    assertGreater(PROFILE_SCHEMA_DIRS[p].length, 0);
  }
});

Deno.test("PROFILE_MAIN_XSD: all profiles have .xsd filenames", () => {
  for (const p of Object.values(Profile)) {
    assert(PROFILE_MAIN_XSD[p].endsWith(".xsd"));
  }
});

Deno.test("getFlavorConfig: factur-x embedInPdf=true", () => {
  const config = getFlavorConfig(Flavor.FACTUR_X);
  assert(config.embedInPdf);
  assertEquals(config.attachmentFilename, "factur-x.xml");
});

Deno.test("getFlavorConfig: xrechnung embedInPdf=false with PEPPOL URN", () => {
  const config = getFlavorConfig(Flavor.XRECHNUNG);
  assert(!config.embedInPdf);
  assertEquals(config.businessProcessUrn, "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
});

Deno.test("validateFlavorProfile: xrechnung + MINIMUM throws", () => {
  assertThrows(() => validateFlavorProfile(Flavor.XRECHNUNG, Profile.MINIMUM));
});

Deno.test("validateFlavorProfile: factur-x supports all profiles", () => {
  for (const p of Object.values(Profile)) {
    validateFlavorProfile(Flavor.FACTUR_X, p);
  }
});

Deno.test("resolveTypeCode: uses input typeCode when set", () => {
  const input = createMinimumInput({
    document: { id: "INV-001", issueDate: "2025-01-01", typeCode: DocumentTypeCode.CREDIT_NOTE },
  });
  assertEquals(resolveTypeCode(input, Flavor.FACTUR_X), DocumentTypeCode.CREDIT_NOTE);
});

Deno.test("resolveTypeCode: falls back to flavor default", () => {
  const input = createMinimumInput({ document: { id: "INV-001", issueDate: "2025-06-01" } });
  assertEquals(resolveTypeCode(input, Flavor.FACTUR_X), DocumentTypeCode.COMMERCIAL_INVOICE);
});

Deno.test("resolveBusinessProcessUrn: xrechnung injects PEPPOL URN by default", () => {
  assertEquals(
    resolveBusinessProcessUrn(createMinimumInput(), Flavor.XRECHNUNG),
    "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
  );
});

// ---------------------------------------------------------------------------
// toXRechnung
// ---------------------------------------------------------------------------

Deno.test("toXRechnung: generates valid CII XML with PEPPOL URN", () => {
  const result = toXRechnung(createXRechnungInput());
  assertStringIncludes(result.xml, "<?xml");
  assertStringIncludes(result.xml, "CrossIndustryInvoice");
  assertStringIncludes(result.xml, "urn:factur-x.eu:1p0:en16931");
  assertStringIncludes(result.xml, "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
  assertStringIncludes(result.xml, "04011000-12345-67");
});

Deno.test("toXRechnung: validates by default", () => {
  const result = toXRechnung(createXRechnungInput());
  assert(result.validation !== undefined);
  assert(result.validation!.valid);
});

Deno.test("toXRechnung: throws for invalid profile", () => {
  assertThrows(() => toXRechnung(createEn16931Input(), { profile: Profile.MINIMUM }), Error);
});

// ---------------------------------------------------------------------------
// validateXsd
// ---------------------------------------------------------------------------

Deno.test("validateXsd: valid MINIMUM XML passes", async () => {
  const xml = buildXml(createMinimumInput(), Profile.MINIMUM);
  const result = await validateXsd(xml, Profile.MINIMUM, { schemaBasePath });
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateXsd: valid BASIC_WL XML passes", async () => {
  const xml = buildXml(createBasicWlInput(), Profile.BASIC_WL);
  const result = await validateXsd(xml, Profile.BASIC_WL, { schemaBasePath });
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateXsd: valid BASIC XML passes", async () => {
  const xml = buildXml(createBasicInput(), Profile.BASIC);
  const result = await validateXsd(xml, Profile.BASIC, { schemaBasePath });
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateXsd: valid EN16931 XML passes", async () => {
  const xml = buildXml(createEn16931Input(), Profile.EN16931);
  const result = await validateXsd(xml, Profile.EN16931, { schemaBasePath });
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateXsd: valid EXTENDED XML passes", async () => {
  const xml = buildXml(createExtendedInput(), Profile.EXTENDED);
  const result = await validateXsd(xml, Profile.EXTENDED, { schemaBasePath });
  assert(result.valid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateXsd: rejects invalid XML", async () => {
  const xml = '<?xml version="1.0" encoding="UTF-8"?><invalid>not a CII document</invalid>';
  const result = await validateXsd(xml, Profile.MINIMUM, { schemaBasePath });
  assert(!result.valid);
  assertGreater(result.errors.length, 0);
});

Deno.test("validateXsd: MINIMUM XML is invalid against EN16931 schema", async () => {
  const xml = buildXml(createMinimumInput(), Profile.MINIMUM);
  const result = await validateXsd(xml, Profile.EN16931, { schemaBasePath });
  assert(!result.valid);
  assertGreater(result.errors.length, 0);
});

Deno.test("validateXsd: throws on missing schema path", async () => {
  await assertRejects(
    () => validateXsd("<xml/>", Profile.EN16931, { schemaBasePath: "/nonexistent/path" }),
    Error,
    "not found",
  );
});

// ---------------------------------------------------------------------------
// embedFacturX
// ---------------------------------------------------------------------------

Deno.test("embedFacturX: embeds XML into PDF", async () => {
  const pdf = await createTestPdf();
  const result = await embedFacturX({
    pdf,
    input: createEn16931Input(),
    profile: Profile.EN16931,
  });

  assert(result.pdf instanceof Uint8Array);
  assertGreater(result.pdf.length, pdf.length);
  assertStringIncludes(result.xml, "CrossIndustryInvoice");
});

Deno.test("embedFacturX: accepts pre-built XML", async () => {
  const pdf = await createTestPdf();
  const xml = buildXml(createEn16931Input(), Profile.EN16931);
  const result = await embedFacturX({ pdf, xml, profile: Profile.EN16931 });

  assert(result.pdf instanceof Uint8Array);
  assertEquals(result.xml, xml);
});

Deno.test("embedFacturX: throws without xml or input", async () => {
  const pdf = await createTestPdf();
  await assertRejects(
    () => embedFacturX({ pdf, profile: Profile.EN16931 } as any),
    Error,
    'Either "xml" or "input" must be provided',
  );
});

Deno.test("embedFacturX: throws on failed input validation", async () => {
  const pdf = await createTestPdf();
  await assertRejects(
    () =>
      embedFacturX({
        pdf,
        input: createBasicWlInput({
          document: {
            id: "",
            issueDate: "2025-06-15",
            typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
          },
        }),
        profile: Profile.BASIC_WL,
      }),
    Error,
    "Input validation failed",
  );
});

Deno.test("embedFacturX: works with all profiles", async () => {
  const pdf = await createTestPdf();
  const cases: [FacturXInvoiceInput, Profile, boolean][] = [
    [createMinimumInput(), Profile.MINIMUM, false],
    [createBasicWlInput(), Profile.BASIC_WL, true],
    [createBasicInput(), Profile.BASIC, true],
    [createEn16931Input(), Profile.EN16931, true],
  ];

  for (const [input, profile, validate] of cases) {
    const result = await embedFacturX({
      pdf,
      input,
      profile,
      validateBeforeEmbed: validate,
    });
    assert(result.pdf instanceof Uint8Array);
    assertStringIncludes(result.xml, PROFILE_URNS[profile]);
  }
});

Deno.test("embedFacturX: custom metadata", async () => {
  const pdf = await createTestPdf();
  const result = await embedFacturX({
    pdf,
    input: createEn16931Input(),
    profile: Profile.EN16931,
    meta: { author: "Test Author", title: "Test Title" },
  });

  const doc = await PDFDocument.load(result.pdf);
  assertEquals(doc.getTitle(), "Test Title");
  assertEquals(doc.getAuthor(), "Test Author");
});

// ---------------------------------------------------------------------------
// extractXml
// ---------------------------------------------------------------------------

Deno.test("extractXml: round-trip — extracted XML matches embedded", async () => {
  const pdf = await createTestPdf();
  const embedResult = await embedFacturX({
    pdf,
    input: createEn16931Input(),
    profile: Profile.EN16931,
  });

  const extractResult = await extractXml(embedResult.pdf);
  assertEquals(extractResult.xml, embedResult.xml);
  assertEquals(extractResult.filename, "factur-x.xml");
  assertEquals(extractResult.profile, Profile.EN16931);
});

Deno.test("extractXml: detects profiles correctly", async () => {
  const pdf = await createTestPdf();

  for (const [input, profile, validate] of [
    [createMinimumInput(), Profile.MINIMUM, false],
    [createBasicWlInput(), Profile.BASIC_WL, true],
    [createBasicInput(), Profile.BASIC, true],
    [createEn16931Input(), Profile.EN16931, true],
  ] as [FacturXInvoiceInput, Profile, boolean][]) {
    const embedResult = await embedFacturX({
      pdf,
      input,
      profile,
      validateBeforeEmbed: validate,
    });
    const extractResult = await extractXml(embedResult.pdf);
    assertEquals(extractResult.profile, profile);
  }
});

Deno.test("extractXml: throws on PDF without Factur-X attachment", async () => {
  const pdf = await createTestPdf();
  await assertRejects(() => extractXml(pdf), Error);
});

Deno.test("extractXml: case-insensitive filename matching", async () => {
  const pdf = await createTestPdf();
  const embedResult = await embedFacturX({
    pdf,
    input: createEn16931Input(),
    profile: Profile.EN16931,
  });

  const extractResult = await extractXml(embedResult.pdf, { filename: "FACTUR-X.XML" });
  assertEquals(extractResult.xml, embedResult.xml);
});
