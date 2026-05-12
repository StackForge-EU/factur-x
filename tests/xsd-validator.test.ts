import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { validateXsd } from "../src/validation/xsd-validator";
import { buildXml } from "../src/core/xml-builder";
import { Profile } from "../src/flavors/constants";
import {
  createMinimumInput,
  createBasicWlInput,
  createBasicInput,
  createEn16931Input,
  createExtendedInput,
} from "./helpers";

const schemaBasePath = path.resolve(__dirname, "..");

describe("validateXsd", () => {
  it("validates valid MINIMUM XML", async () => {
    const xml = buildXml(createMinimumInput(), Profile.MINIMUM);
    const result = await validateXsd(xml, Profile.MINIMUM, { schemaBasePath });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates valid BASIC_WL XML", async () => {
    const xml = buildXml(createBasicWlInput(), Profile.BASIC_WL);
    const result = await validateXsd(xml, Profile.BASIC_WL, { schemaBasePath });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates BASIC_WL with document-level allowances + charges (udt:Indicator namespace)", async () => {
    // Regression: the XSD requires `udt:Indicator` inside ChargeIndicator.
    // Emitting `ram:Indicator` is silently accepted by some readers but
    // rejected here, and silently zeroes out every schematron sum over
    // allowances/charges downstream (BR-S-08, BR-CO-11, BR-CO-14).
    const xml = buildXml(
      createBasicWlInput({
        allowancesCharges: [
          { isCharge: false, amount: 50, reason: "Coupon", vatCategoryCode: "S", vatRatePercent: 19 },
          { isCharge: true, amount: 10, reason: "Shipping", vatCategoryCode: "S", vatRatePercent: 19 },
        ],
        totals: {
          lineTotal: 1000,
          allowanceTotal: 50,
          chargeTotal: 10,
          taxBasisTotal: 960,
          taxTotal: 182.4,
          grandTotal: 1142.4,
          duePayableAmount: 1142.4,
          currency: "EUR",
        },
      }),
      Profile.BASIC_WL,
    );
    const result = await validateXsd(xml, Profile.BASIC_WL, { schemaBasePath });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates valid EN16931 XML", async () => {
    const xml = buildXml(createEn16931Input(), Profile.EN16931);
    const result = await validateXsd(xml, Profile.EN16931, { schemaBasePath });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid XML", async () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><invalid>not a CII document</invalid>';
    const result = await validateXsd(xml, Profile.MINIMUM, { schemaBasePath });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects XML with wrong root element", async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rsm:WrongRoot xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">' +
      "</rsm:WrongRoot>";
    const result = await validateXsd(xml, Profile.MINIMUM, { schemaBasePath });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error details with messages", async () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><broken/>';
    const result = await validateXsd(xml, Profile.EN16931, { schemaBasePath });
    expect(result.valid).toBe(false);
    for (const err of result.errors) {
      expect(err.message).toBeTruthy();
    }
  });

  it("validates valid BASIC XML", async () => {
    const xml = buildXml(createBasicInput(), Profile.BASIC);
    const result = await validateXsd(xml, Profile.BASIC, { schemaBasePath });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates valid EXTENDED XML", async () => {
    const xml = buildXml(createExtendedInput(), Profile.EXTENDED);
    const result = await validateXsd(xml, Profile.EXTENDED, { schemaBasePath });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("MINIMUM XML is invalid against EN16931 schema", async () => {
    const xml = buildXml(createMinimumInput(), Profile.MINIMUM);
    const result = await validateXsd(xml, Profile.EN16931, { schemaBasePath });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("throws when schema file is missing", async () => {
    await expect(
      validateXsd("<xml/>", Profile.EN16931, { schemaBasePath: "/nonexistent/path" }),
    ).rejects.toThrow(/not found/i);
  });
});
