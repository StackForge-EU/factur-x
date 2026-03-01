import { describe, it, expect } from "vitest";
import { toXRechnung } from "../src/core/xrechnung";
import { Profile } from "../src/flavors/constants";
import { createXRechnungInput, createEn16931Input } from "./helpers";

describe("toXRechnung", () => {
  it("generates valid CII XML", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.xml).toContain("<?xml");
    expect(result.xml).toContain("CrossIndustryInvoice");
  });

  it("uses EN16931 profile URN", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.xml).toContain("urn:factur-x.eu:1p0:en16931");
  });

  it("injects PEPPOL business process URN by default", () => {
    const input = createXRechnungInput();
    delete input.document.businessProcessId;
    const result = toXRechnung(input);
    expect(result.xml).toContain("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
  });

  it("preserves custom businessProcessId when provided", () => {
    const input = createXRechnungInput({
      document: {
        ...createXRechnungInput().document,
        businessProcessId: "urn:custom:process",
      },
    });
    const result = toXRechnung(input);
    expect(result.xml).toContain("urn:custom:process");
    expect(result.xml).not.toContain("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
  });

  it("includes buyer reference (Leitweg-ID)", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.xml).toContain("04011000-12345-67");
  });

  it("defaults to EN16931 profile", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.xml).toContain("urn:factur-x.eu:1p0:en16931");
  });

  it("returns validation result when validate=true (default)", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.validation).toBeDefined();
    expect(result.validation!.valid).toBe(true);
  });

  it("skips validation when validate=false", () => {
    const result = toXRechnung(createXRechnungInput(), { validate: false });
    expect(result.validation).toBeUndefined();
  });

  it("throws for invalid profile (xrechnung only supports EN16931)", () => {
    expect(() => toXRechnung(createEn16931Input(), { profile: Profile.MINIMUM })).toThrow(
      /not supported.*xrechnung/i,
    );
  });

  it("throws when required fields are missing", () => {
    const input = createXRechnungInput();
    (input as any).seller = undefined;
    expect(() => toXRechnung(input)).toThrow(/validation failed/i);
  });

  it("contains line items", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.xml).toContain("IncludedSupplyChainTradeLineItem");
    expect(result.xml).toContain("Consulting Services");
  });

  it("contains document type code 380", () => {
    const result = toXRechnung(createXRechnungInput());
    expect(result.xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
  });
});
