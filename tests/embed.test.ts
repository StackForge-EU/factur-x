import { describe, it, expect } from "vitest";
import { PDFDocument, PDFName, PDFDict, PDFArray } from "pdf-lib";
import { embedFacturX } from "../src/core/embed";
import { buildXml } from "../src/core/xml-builder";
import { Profile, Flavor } from "../src/flavors/constants";
import { DocumentTypeCode } from "../src/types/input";
import {
  createMinimumInput,
  createBasicWlInput,
  createBasicInput,
  createEn16931Input,
} from "./helpers";

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

    expect(result.xml).toContain("urn:factur-x.eu:1p0:en16931");
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
