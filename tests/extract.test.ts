import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { embedFacturX } from "../src/core/embed";
import { extractXml } from "../src/core/extract";
import { Profile, Flavor } from "../src/flavors/constants";
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

describe("Round-trip test", () => {
  it("extracted XML matches embedded XML and detected filename is factur-x.xml", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    const extractResult = await extractXml(embedResult.pdf);

    expect(extractResult.xml).toBe(embedResult.xml);
    expect(extractResult.filename).toBe("factur-x.xml");
    expect(extractResult.profile).toBeDefined();
    expect(extractResult.profile).toBe(Profile.EN16931);
  });
});

describe("Round-trip with ZUGFeRD flavor", () => {
  it("extracted XML matches embedded XML, filename is factur-x.xml", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
      flavor: Flavor.ZUGFERD,
    });

    const extractResult = await extractXml(embedResult.pdf);

    expect(extractResult.xml).toBe(embedResult.xml);
    expect(extractResult.filename).toBe("factur-x.xml");
  });
});

describe("Custom filename extraction", () => {
  it("extracts with specific filename option", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    const extractResult = await extractXml(embedResult.pdf, {
      filename: "factur-x.xml",
    });

    expect(extractResult.xml).toBe(embedResult.xml);
    expect(extractResult.filename).toBe("factur-x.xml");
  });
});

describe("No attachment", () => {
  it("extractXml throws when given a PDF without Factur-X attachments", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]);
    const textBytes = new TextEncoder().encode("hello");
    await doc.attach(textBytes, "other-file.txt", {
      mimeType: "text/plain",
    });
    const pdf = await doc.save();

    await expect(extractXml(pdf)).rejects.toThrow(
      /No Factur-X \/ ZUGFeRD XML attachment found in PDF/,
    );
  });
});

describe("No names dictionary", () => {
  it("extractXml throws with meaningful error on a plain PDF", async () => {
    const pdf = await createTestPdf();

    await expect(extractXml(pdf)).rejects.toThrow(
      "PDF does not contain a Names dictionary — no embedded files found.",
    );
  });
});

describe("Profile detection across profiles", () => {
  it("detects MINIMUM profile", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createMinimumInput(),
      profile: Profile.MINIMUM,
      validateBeforeEmbed: false,
    });

    const extractResult = await extractXml(embedResult.pdf);
    expect(extractResult.profile).toBe(Profile.MINIMUM);
  });

  it("detects BASIC_WL profile", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createBasicWlInput(),
      profile: Profile.BASIC_WL,
    });

    const extractResult = await extractXml(embedResult.pdf);
    expect(extractResult.profile).toBe(Profile.BASIC_WL);
  });

  it("detects BASIC profile", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createBasicInput(),
      profile: Profile.BASIC,
    });

    const extractResult = await extractXml(embedResult.pdf);
    expect(extractResult.profile).toBe(Profile.BASIC);
  });

  it("detects EN16931 profile", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    const extractResult = await extractXml(embedResult.pdf);
    expect(extractResult.profile).toBe(Profile.EN16931);
  });
});

describe("Case-insensitive filename matching", () => {
  it("matches filename case-insensitively", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    const extractResult = await extractXml(embedResult.pdf, {
      filename: "FACTUR-X.XML",
    });
    expect(extractResult.xml).toBe(embedResult.xml);
  });
});

describe("Wrong filename", () => {
  it("throws when searching for non-existent filename", async () => {
    const pdf = await createTestPdf();
    const embedResult = await embedFacturX({
      pdf,
      input: createEn16931Input(),
      profile: Profile.EN16931,
    });

    await expect(extractXml(embedResult.pdf, { filename: "nonexistent.xml" })).rejects.toThrow(
      /No Factur-X/,
    );
  });
});
