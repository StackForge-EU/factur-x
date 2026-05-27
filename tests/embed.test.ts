import { describe, it, expect } from "vitest";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFHexString } from "pdf-lib";
import { embedFacturX } from "../src/core/embed";
import { buildXml } from "../src/core/xml-builder";
import { Profile, Flavor } from "../src/flavors/constants";
import { DocumentTypeCode } from "../src/types/input";
import {
  createMinimumInput,
  createBasicWlInput,
  createBasicInput,
  createEn16931Input,
  createExtendedInput,
  createXRechnungInput,
} from "./helpers";
import type { FacturXInvoiceInput } from "../src/types/input";

async function createTestPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  return doc.save();
}

describe("embedFacturX", () => {
  it("embeds XML from input object into PDF (returns pdf bytes and xml string)", async () => {
    const pdf = await createTestPdf();
    const input = createEn16931Input();
    const result = await embedFacturX({
      pdf,
      input,
      profile: Profile.EN16931,
    });

    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.pdf.length).toBeGreaterThan(0);
    expect(typeof result.xml).toBe("string");
    expect(result.xml.length).toBeGreaterThan(0);
  });

  it("accepts pre-built xml string instead of input", async () => {
    const pdf = await createTestPdf();
    const xml = buildXml(createEn16931Input(), Profile.EN16931);
    const result = await embedFacturX({
      pdf,
      xml,
      profile: Profile.EN16931,
    });

    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml).toBe(xml);
  });

  it("throws when neither xml nor input is provided", async () => {
    const pdf = await createTestPdf();
    await expect(
      embedFacturX({
        pdf,
        profile: Profile.EN16931,
      } as any),
    ).rejects.toThrow('Either "xml" or "input" must be provided to embedFacturX.');
  });

  it("throws when input validation fails (provide input missing required fields for the profile)", async () => {
    const pdf = await createTestPdf();
    const invalidInput = createBasicWlInput({
      document: { id: "", issueDate: "2025-06-15", typeCode: DocumentTypeCode.COMMERCIAL_INVOICE },
    });

    await expect(
      embedFacturX({
        pdf,
        input: invalidInput,
        profile: Profile.BASIC_WL,
      }),
    ).rejects.toThrow(/Input validation failed/);
  });

  it("uses factur-x as default flavor", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    expect(result.xml).toContain("urn:cen.eu:en16931:2017");
  });

  it("validates input by default (validateBeforeEmbed=true)", async () => {
    const pdf = await createTestPdf();
    const invalidInput = createBasicWlInput({
      seller: { name: "", address: createBasicWlInput().seller!.address },
    });

    await expect(
      embedFacturX({
        pdf,
        input: invalidInput,
        profile: Profile.BASIC_WL,
      }),
    ).rejects.toThrow(/Input validation failed/);
  });

  it("skips validation when validateBeforeEmbed=false", async () => {
    const pdf = await createTestPdf();
    const invalidInput = createBasicWlInput({
      document: { id: "", issueDate: "2025-01-01", typeCode: DocumentTypeCode.COMMERCIAL_INVOICE },
      seller: { name: "" },
    });

    const result = await embedFacturX({
      pdf,
      input: invalidInput,
      profile: Profile.BASIC_WL,
      validateBeforeEmbed: false,
    });

    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml.length).toBeGreaterThan(0);
  });

  it("result PDF is larger than input PDF (has attachment)", async () => {
    const pdf = await createTestPdf();
    const inputSize = pdf.length;
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    expect(result.pdf.length).toBeGreaterThan(inputSize);
  });

  it("generated XML contains CrossIndustryInvoice", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    expect(result.xml).toContain("CrossIndustryInvoice");
  });

  it("sets custom metadata when meta option is provided", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      meta: {
        author: "Test Author",
        title: "Test Invoice Title",
        subject: "Test Subject",
        creator: "Test Creator",
      },
    });

    const doc = await PDFDocument.load(result.pdf);
    expect(doc.getTitle()).toBe("Test Invoice Title");
    expect(doc.getAuthor()).toBe("Test Author");
    expect(doc.getSubject()).toBe("Test Subject");
    expect(doc.getCreator()).toBe("Test Creator");
  });
});

describe("Flavor handling", () => {
  it("works with flavor zugferd", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      flavor: Flavor.ZUGFERD,
    });

    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml.length).toBeGreaterThan(0);
  });

  it("works with flavor factur-x", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      flavor: Flavor.FACTUR_X,
    });

    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml.length).toBeGreaterThan(0);
  });

  it("throws for invalid flavor+profile combination (xrechnung + MINIMUM)", async () => {
    const pdf = await createTestPdf();
    await expect(
      embedFacturX({
        pdf,
        input: createBasicWlInput(),
        profile: Profile.MINIMUM,
        flavor: Flavor.XRECHNUNG,
      }),
    ).rejects.toThrow(/Profile "MINIMUM" is not supported for flavor "xrechnung"/);
  });
});

describe("addPdfA3Metadata", () => {
  function getIdTrailerValues(pdfDoc: PDFDocument): [string, string] | undefined {
    const id = pdfDoc.context.trailerInfo.ID;
    if (!(id instanceof PDFArray) || id.size() !== 2) return undefined;

    const first = id.lookup(0);
    const second = id.lookup(1);
    if (!(first instanceof PDFHexString) || !(second instanceof PDFHexString)) return undefined;

    return [first.asString(), second.asString()];
  }

  it("adds XMP metadata by default", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const metadataRef = pdfDoc.catalog.get(PDFName.of("Metadata"));
    expect(metadataRef).toBeDefined();
  });

  const profileCases: Array<{
    profile: Profile;
    expected: string;
    makeInput: () => FacturXInvoiceInput;
  }> = [
    { profile: Profile.MINIMUM, expected: "MINIMUM", makeInput: createMinimumInput },
    { profile: Profile.BASIC_WL, expected: "BASIC WL", makeInput: createBasicWlInput },
    { profile: Profile.BASIC, expected: "BASIC", makeInput: createBasicInput },
    { profile: Profile.EN16931, expected: "EN 16931", makeInput: createEn16931Input },
    { profile: Profile.EXTENDED, expected: "EXTENDED", makeInput: createExtendedInput },
  ];

  it.each(profileCases)(
    "writes XMP fx:ConformanceLevel '$expected' for profile $profile",
    async ({ profile, expected, makeInput }) => {
      const result = await embedFacturX({
        pdf: await createTestPdf(),
        input: makeInput(),
        profile,
      });

      const pdfText = new TextDecoder().decode(result.pdf);
      expect(pdfText).toContain(`<fx:ConformanceLevel>${expected}</fx:ConformanceLevel>`);
      // For profiles whose spec label differs from the enum identifier
      // (EN16931 → "EN 16931", BASIC_WL → "BASIC WL"), make sure the raw
      // enum identifier never leaks into the XMP tag.
      if (profile !== expected) {
        expect(pdfText).not.toMatch(new RegExp(`<fx:ConformanceLevel>${profile}<`));
      }
    },
  );

  it("writes XMP fx:ConformanceLevel 'XRECHNUNG' when flavor=XRECHNUNG", async () => {
    const input = createXRechnungInput({
      document: {
        id: "XR-TEST-001",
        issueDate: "2025-06-25",
        typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
        buyerReference: "04011000-12345-67",
        businessProcessId: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
      },
    });

    const result = await embedFacturX({
      pdf: await createTestPdf(),
      input,
      profile: Profile.EN16931,
      flavor: Flavor.XRECHNUNG,
    });

    const pdfText = new TextDecoder().decode(result.pdf);
    expect(pdfText).toContain("<fx:ConformanceLevel>XRECHNUNG</fx:ConformanceLevel>");
    expect(pdfText).not.toMatch(/<fx:ConformanceLevel>EN 16931</);
  });

  describe("adds an /ID entry to the document trailer dictionary", () => {
    it("when the document has no such trailer, the two identifiers are the same", async () => {
      const pdf = await createTestPdf();
      const result = await embedFacturX({
        pdf,
        input: createEn16931Input(),
        profile: Profile.EN16931,
      });

      const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
      const fileIds = getIdTrailerValues(pdfDoc);

      expect(fileIds).toBeDefined();
      expect(fileIds![0]).toMatch(/^[0-9a-f]{32}$/i);
      expect(fileIds![1]).toMatch(/^[0-9a-f]{32}$/i);
      expect(fileIds![1]).toBe(fileIds![0]);
    });

    it("when the document has such trailer, preserves the first identifier and refreshes the second identifier based on the updated file content", async () => {
      const seedDoc = await PDFDocument.create();
      seedDoc.addPage([595, 842]);
      const originalFileIds: [string, string] = [
        "00112233445566778899aabbccddeeff",
        "ffeeddccbbaa99887766554433221100",
      ];
      seedDoc.context.trailerInfo.ID = seedDoc.context.obj(
        originalFileIds.map((id) => PDFHexString.of(id)),
      );
      const pdf = await seedDoc.save();

      const result = await embedFacturX({
        pdf,
        input: createEn16931Input(),
        profile: Profile.EN16931,
      });

      const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
      const fileIds = getIdTrailerValues(pdfDoc);
      expect(fileIds).toBeDefined();
      expect(fileIds![0]).toBe(originalFileIds[0]);
      expect(fileIds![1]).toMatch(/^[0-9a-f]{32}$/i);
      expect(fileIds![1]).not.toBe(originalFileIds[1]);
    });
  });

  it("omits XMP metadata when addPdfA3Metadata=false", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      addPdfA3Metadata: false,
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const metadataRef = pdfDoc.catalog.get(PDFName.of("Metadata"));
    expect(metadataRef).toBeUndefined();
  });
});

describe("AFRelationship", () => {
  function getAfRelationship(pdfDoc: PDFDocument): string | undefined {
    const namesDict = pdfDoc.catalog.get(PDFName.of("Names"));
    if (!namesDict) return undefined;
    const resolved = namesDict instanceof PDFDict ? namesDict : pdfDoc.context.lookup(namesDict);
    if (!(resolved instanceof PDFDict)) return undefined;
    const ef = resolved.get(PDFName.of("EmbeddedFiles"));
    const efResolved = ef instanceof PDFDict ? ef : pdfDoc.context.lookup(ef as any);
    if (!(efResolved instanceof PDFDict)) return undefined;
    const namesArr = efResolved.get(PDFName.of("Names"));
    const namesArrResolved =
      namesArr instanceof PDFArray ? namesArr : pdfDoc.context.lookup(namesArr as any);
    if (!(namesArrResolved instanceof PDFArray)) return undefined;
    for (let i = 0; i < namesArrResolved.size(); i += 2) {
      const fsRef = namesArrResolved.get(i + 1);
      const fs = pdfDoc.context.lookup(fsRef as any);
      if (fs instanceof PDFDict) {
        const afRel = fs.get(PDFName.of("AFRelationship"));
        return afRel?.toString();
      }
    }
    return undefined;
  }

  it("uses Data AFRelationship for MINIMUM profile", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createMinimumInput(),
      profile: Profile.MINIMUM,
      validateBeforeEmbed: false,
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const afRel = getAfRelationship(pdfDoc);
    expect(afRel).toContain("Data");
  });

  it("uses Data AFRelationship for BASIC_WL profile", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createBasicWlInput(),
      profile: Profile.BASIC_WL,
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const afRel = getAfRelationship(pdfDoc);
    expect(afRel).toContain("Data");
  });

  it("uses Alternative AFRelationship for EN16931 profile", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const afRel = getAfRelationship(pdfDoc);
    expect(afRel).toContain("Alternative");
  });

  it("uses Alternative AFRelationship for BASIC profile", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createBasicInput(),
      profile: Profile.BASIC,
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const afRel = getAfRelationship(pdfDoc);
    expect(afRel).toContain("Alternative");
  });

  it("allows overriding afRelationship", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createMinimumInput(),
      profile: Profile.MINIMUM,
      validateBeforeEmbed: false,
      afRelationship: "Source",
    });

    const pdfDoc = await PDFDocument.load(result.pdf, { updateMetadata: false });
    const afRel = getAfRelationship(pdfDoc);
    expect(afRel).toContain("Source");
  });
});

describe("Embed with all profiles", () => {
  it("embeds MINIMUM profile successfully", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createMinimumInput(),
      profile: Profile.MINIMUM,
      validateBeforeEmbed: false,
    });
    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml).toContain("urn:factur-x.eu:1p0:minimum");
  });

  it("embeds BASIC_WL profile successfully", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createBasicWlInput(),
      profile: Profile.BASIC_WL,
    });
    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml).toContain("urn:factur-x.eu:1p0:basicwl");
  });

  it("embeds BASIC profile successfully", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createBasicInput(),
      profile: Profile.BASIC,
    });
    expect(result.pdf).toBeInstanceOf(Uint8Array);
    expect(result.xml).toContain("urn:factur-x.eu:1p0:basic");
  });

  it("returns validation result when validation passes", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });
    expect(result.validation).toBeDefined();
    expect(result.validation!.valid).toBe(true);
    expect(result.validation!.errors).toHaveLength(0);
  });
});

describe("PDF/A-3 OutputIntent injection", () => {
  // A non-functional placeholder profile blob — pdf-lib only embeds the bytes,
  // it never parses them, so this is enough to exercise the injection path.
  const dummyIcc = new Uint8Array([
    0x00, 0x00, 0x0c, 0x48, 0x4c, 0x69, 0x6e, 0x6f, 0x02, 0x10, 0x00, 0x00,
  ]);

  it("adds an /OutputIntents entry when one is missing and an ICC profile is provided", async () => {
    const pdf = await createTestPdf();
    const result = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      rgbIccProfile: dummyIcc,
    });

    const out = await PDFDocument.load(result.pdf);
    const intents = out.catalog.lookup(PDFName.of("OutputIntents"));
    expect(intents).toBeInstanceOf(PDFArray);
    const arr = intents as PDFArray;
    expect(arr.size()).toBeGreaterThan(0);
    const intent = arr.lookup(0) as PDFDict;
    expect((intent.lookup(PDFName.of("S")) as PDFName).asString()).toBe("/GTS_PDFA1");
    expect(intent.has(PDFName.of("DestOutputProfile"))).toBe(true);
  });

  it("does not overwrite an existing /OutputIntents array", async () => {
    // Build an input PDF that already has an OutputIntents entry.
    const seedDoc = await PDFDocument.create();
    seedDoc.addPage([595, 842]);
    const seedIcc = seedDoc.context.flateStream(new Uint8Array([0x42]), { N: 3 });
    const seedRef = seedDoc.context.register(seedIcc);
    const intent = seedDoc.context.obj({
      Type: "OutputIntent",
      S: "GTS_PDFA1",
      OutputConditionIdentifier: "preexisting",
      DestOutputProfile: seedRef,
    });
    const intents = seedDoc.context.obj([intent]);
    seedDoc.catalog.set(PDFName.of("OutputIntents"), intents);
    const pdfBytes = await seedDoc.save();

    const result = await embedFacturX({
      pdf: pdfBytes,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      rgbIccProfile: dummyIcc,
    });

    const out = await PDFDocument.load(result.pdf);
    const finalIntents = out.catalog.lookup(PDFName.of("OutputIntents")) as PDFArray;
    expect(finalIntents.size()).toBe(1);
    const finalIntent = finalIntents.lookup(0) as PDFDict;
    const id = finalIntent.lookup(PDFName.of("OutputConditionIdentifier"));
    // Original identifier preserved.
    expect(id?.toString()).toContain("preexisting");
  });

  it("throws when unembeddedFonts=throw and the PDF references base-14 fonts", async () => {
    const seedDoc = await PDFDocument.create();
    const page = seedDoc.addPage([595, 842]);
    const helvetica = await seedDoc.embedFont("Helvetica"); // standard 14, not embedded
    page.drawText("Hello", { x: 50, y: 800, font: helvetica, size: 12 });
    const pdfBytes = await seedDoc.save();

    await expect(
      embedFacturX({
        pdf: pdfBytes,
        input: createEn16931Input(),
        profile: Profile.EN16931,
        rgbIccProfile: dummyIcc,
        unembeddedFonts: "throw",
      }),
    ).rejects.toThrow(/not embedded/i);
  });

  it("ignores font check when unembeddedFonts=ignore", async () => {
    const seedDoc = await PDFDocument.create();
    const page = seedDoc.addPage([595, 842]);
    const helvetica = await seedDoc.embedFont("Helvetica");
    page.drawText("Hello", { x: 50, y: 800, font: helvetica, size: 12 });
    const pdfBytes = await seedDoc.save();

    const result = await embedFacturX({
      pdf: pdfBytes,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      rgbIccProfile: dummyIcc,
      unembeddedFonts: "ignore",
    });
    expect(result.pdf).toBeInstanceOf(Uint8Array);
  });
});
