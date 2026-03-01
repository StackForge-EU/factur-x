import { describe, it, expect } from "vitest";
import {
  PROFILE_URNS,
  FLAVOR_DEFAULT_TYPE_CODES,
  PROFILE_SCHEMA_DIRS,
  PROFILE_MAIN_XSD,
  Profile,
  Flavor,
} from "../src/flavors/constants";
import {
  getFlavorConfig,
  validateFlavorProfile,
  resolveTypeCode,
  resolveBusinessProcessUrn,
} from "../src/flavors/registry";
import { DocumentTypeCode } from "../src/types/input";
import { createMinimumInput } from "./helpers";

const PROFILES: Profile[] = [
  Profile.MINIMUM,
  Profile.BASIC_WL,
  Profile.BASIC,
  Profile.EN16931,
  Profile.EXTENDED,
];
const FLAVORS: Flavor[] = [Flavor.FACTUR_X, Flavor.ZUGFERD, Flavor.XRECHNUNG, Flavor.CHRONO_PRO];

describe("PROFILE_URNS", () => {
  it("all 5 profiles have URNs", () => {
    expect(PROFILES).toHaveLength(5);
    for (const profile of PROFILES) {
      expect(PROFILE_URNS[profile]).toBeDefined();
      expect(typeof PROFILE_URNS[profile]).toBe("string");
    }
  });

  it("each URN contains factur-x.eu", () => {
    for (const profile of PROFILES) {
      expect(PROFILE_URNS[profile]).toContain("factur-x.eu");
    }
  });
});

describe("FLAVOR_DEFAULT_TYPE_CODES", () => {
  it("all 4 flavors have type codes", () => {
    expect(FLAVORS).toHaveLength(4);
    for (const flavor of FLAVORS) {
      expect(FLAVOR_DEFAULT_TYPE_CODES[flavor]).toBeDefined();
    }
  });

  it("all type codes are COMMERCIAL_INVOICE (380)", () => {
    for (const flavor of FLAVORS) {
      expect(FLAVOR_DEFAULT_TYPE_CODES[flavor]).toBe(DocumentTypeCode.COMMERCIAL_INVOICE);
    }
  });
});

describe("PROFILE_SCHEMA_DIRS", () => {
  it("all 5 profiles have directory names", () => {
    for (const profile of PROFILES) {
      expect(PROFILE_SCHEMA_DIRS[profile]).toBeDefined();
      expect(typeof PROFILE_SCHEMA_DIRS[profile]).toBe("string");
      expect(PROFILE_SCHEMA_DIRS[profile].length).toBeGreaterThan(0);
    }
  });
});

describe("PROFILE_MAIN_XSD", () => {
  it("all 5 profiles have XSD filenames ending in .xsd", () => {
    for (const profile of PROFILES) {
      expect(PROFILE_MAIN_XSD[profile]).toBeDefined();
      expect(PROFILE_MAIN_XSD[profile]).toMatch(/\.xsd$/);
    }
  });
});

describe("getFlavorConfig", () => {
  it("factur-x: embedInPdf=true, attachmentFilename=factur-x.xml", () => {
    const config = getFlavorConfig(Flavor.FACTUR_X);
    expect(config.embedInPdf).toBe(true);
    expect(config.attachmentFilename).toBe("factur-x.xml");
  });

  it("zugferd: embedInPdf=true, attachmentFilename=factur-x.xml", () => {
    const config = getFlavorConfig(Flavor.ZUGFERD);
    expect(config.embedInPdf).toBe(true);
    expect(config.attachmentFilename).toBe("factur-x.xml");
  });

  it("xrechnung: embedInPdf=false, attachmentFilename=xrechnung.xml, has businessProcessUrn", () => {
    const config = getFlavorConfig(Flavor.XRECHNUNG);
    expect(config.embedInPdf).toBe(false);
    expect(config.attachmentFilename).toBe("xrechnung.xml");
    expect(config.businessProcessUrn).toBeDefined();
    expect(config.businessProcessUrn).toBe("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
  });

  it("chrono-pro: embedInPdf=true", () => {
    const config = getFlavorConfig(Flavor.CHRONO_PRO);
    expect(config.embedInPdf).toBe(true);
  });
});

describe("validateFlavorProfile", () => {
  it("does not throw for factur-x + EN16931", () => {
    expect(() => validateFlavorProfile(Flavor.FACTUR_X, Profile.EN16931)).not.toThrow();
  });

  it("does not throw for zugferd + MINIMUM", () => {
    expect(() => validateFlavorProfile(Flavor.ZUGFERD, Profile.MINIMUM)).not.toThrow();
  });

  it("does not throw for xrechnung + EN16931", () => {
    expect(() => validateFlavorProfile(Flavor.XRECHNUNG, Profile.EN16931)).not.toThrow();
  });

  it("throws for xrechnung + MINIMUM (not supported)", () => {
    expect(() => validateFlavorProfile(Flavor.XRECHNUNG, Profile.MINIMUM)).toThrow();
  });

  it("throws for xrechnung + BASIC (not supported)", () => {
    expect(() => validateFlavorProfile(Flavor.XRECHNUNG, Profile.BASIC)).toThrow();
  });

  it("error message includes profile and flavor names", () => {
    try {
      validateFlavorProfile(Flavor.XRECHNUNG, Profile.MINIMUM);
      expect.fail("Should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("MINIMUM");
      expect(message).toContain("xrechnung");
    }
  });
});

describe("resolveTypeCode", () => {
  it("returns input typeCode when set", () => {
    const input = createMinimumInput({ document: { typeCode: DocumentTypeCode.CREDIT_NOTE } });
    expect(resolveTypeCode(input, Flavor.FACTUR_X)).toBe(DocumentTypeCode.CREDIT_NOTE);
    expect(resolveTypeCode(input, Flavor.XRECHNUNG)).toBe(DocumentTypeCode.CREDIT_NOTE);
  });

  it("falls back to flavor default when input typeCode is not set", () => {
    const input = createMinimumInput({
      document: {
        id: "INV-001",
        issueDate: "2025-06-01",
      },
    });
    expect(resolveTypeCode(input, Flavor.FACTUR_X)).toBe(DocumentTypeCode.COMMERCIAL_INVOICE);
    expect(resolveTypeCode(input, Flavor.ZUGFERD)).toBe(DocumentTypeCode.COMMERCIAL_INVOICE);
    expect(resolveTypeCode(input, Flavor.XRECHNUNG)).toBe(DocumentTypeCode.COMMERCIAL_INVOICE);
    expect(resolveTypeCode(input, Flavor.CHRONO_PRO)).toBe(DocumentTypeCode.COMMERCIAL_INVOICE);
  });

  it("works for each flavor", () => {
    const inputWithTypeCode = createMinimumInput({
      document: { typeCode: DocumentTypeCode.SELF_BILLED_INVOICE },
    });
    const inputWithoutTypeCode = createMinimumInput({
      document: { id: "INV-001", issueDate: "2025-06-01" },
    });
    for (const flavor of FLAVORS) {
      expect(resolveTypeCode(inputWithTypeCode, flavor)).toBe(DocumentTypeCode.SELF_BILLED_INVOICE);
      expect(resolveTypeCode(inputWithoutTypeCode, flavor)).toBe(
        DocumentTypeCode.COMMERCIAL_INVOICE,
      );
    }
  });
});

describe("resolveBusinessProcessUrn", () => {
  it("returns input businessProcessId when set", () => {
    const input = createMinimumInput({
      document: { businessProcessId: "urn:custom:test:1.0" },
    });
    expect(resolveBusinessProcessUrn(input, Flavor.FACTUR_X)).toBe("urn:custom:test:1.0");
    expect(resolveBusinessProcessUrn(input, Flavor.XRECHNUNG)).toBe("urn:custom:test:1.0");
  });

  it("returns flavor businessProcessUrn for xrechnung when input has none", () => {
    const input = createMinimumInput();
    expect(resolveBusinessProcessUrn(input, Flavor.XRECHNUNG)).toBe(
      "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
    );
  });

  it("returns undefined for factur-x when input has no businessProcessId", () => {
    const input = createMinimumInput();
    expect(resolveBusinessProcessUrn(input, Flavor.FACTUR_X)).toBeUndefined();
  });
});

describe("Profile enum values", () => {
  it("has correct string values", () => {
    expect(Profile.MINIMUM).toBe("MINIMUM");
    expect(Profile.BASIC_WL).toBe("BASIC_WL");
    expect(Profile.BASIC).toBe("BASIC");
    expect(Profile.EN16931).toBe("EN16931");
    expect(Profile.EXTENDED).toBe("EXTENDED");
  });

  it("has exactly 5 members", () => {
    const members = Object.values(Profile);
    expect(members).toHaveLength(5);
  });
});

describe("Flavor enum values", () => {
  it("has correct string values", () => {
    expect(Flavor.FACTUR_X).toBe("factur-x");
    expect(Flavor.ZUGFERD).toBe("zugferd");
    expect(Flavor.XRECHNUNG).toBe("xrechnung");
    expect(Flavor.CHRONO_PRO).toBe("chrono-pro");
  });

  it("has exactly 4 members", () => {
    const members = Object.values(Flavor);
    expect(members).toHaveLength(4);
  });
});

describe("DocumentTypeCode enum values", () => {
  it("COMMERCIAL_INVOICE is 380", () => {
    expect(DocumentTypeCode.COMMERCIAL_INVOICE).toBe("380");
  });

  it("CREDIT_NOTE is 381", () => {
    expect(DocumentTypeCode.CREDIT_NOTE).toBe("381");
  });

  it("CORRECTED_INVOICE is 384", () => {
    expect(DocumentTypeCode.CORRECTED_INVOICE).toBe("384");
  });

  it("SELF_BILLED_INVOICE is 389", () => {
    expect(DocumentTypeCode.SELF_BILLED_INVOICE).toBe("389");
  });

  it("PREPAYMENT_INVOICE is 386", () => {
    expect(DocumentTypeCode.PREPAYMENT_INVOICE).toBe("386");
  });
});

describe("Flavor profile support", () => {
  it("factur-x supports all 5 profiles", () => {
    const config = getFlavorConfig(Flavor.FACTUR_X);
    expect(config.supportedProfiles).toHaveLength(5);
    for (const p of PROFILES) {
      expect(config.supportedProfiles).toContain(p);
    }
  });

  it("zugferd supports all 5 profiles", () => {
    const config = getFlavorConfig(Flavor.ZUGFERD);
    expect(config.supportedProfiles).toHaveLength(5);
  });

  it("xrechnung supports only EN16931", () => {
    const config = getFlavorConfig(Flavor.XRECHNUNG);
    expect(config.supportedProfiles).toHaveLength(1);
    expect(config.supportedProfiles[0]).toBe(Profile.EN16931);
  });

  it("chrono-pro supports 4 profiles (not EXTENDED)", () => {
    const config = getFlavorConfig(Flavor.CHRONO_PRO);
    expect(config.supportedProfiles).toHaveLength(4);
    expect(config.supportedProfiles).not.toContain(Profile.EXTENDED);
  });

  it("throws for chrono-pro + EXTENDED", () => {
    expect(() => validateFlavorProfile(Flavor.CHRONO_PRO, Profile.EXTENDED)).toThrow();
  });

  it("does not throw for all valid factur-x combinations", () => {
    for (const p of PROFILES) {
      expect(() => validateFlavorProfile(Flavor.FACTUR_X, p)).not.toThrow();
    }
  });

  it("does not throw for all valid zugferd combinations", () => {
    for (const p of PROFILES) {
      expect(() => validateFlavorProfile(Flavor.ZUGFERD, p)).not.toThrow();
    }
  });
});
