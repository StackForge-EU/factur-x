import { describe, it, expect } from "vitest";
import { validateInput } from "../src/validation/profile-validator";
import { Profile, Flavor } from "../src/flavors/constants";
import {
  createMinimumInput,
  createBasicWlInput,
  createBasicInput,
  createEn16931Input,
  createExtendedInput,
  createXRechnungInput,
} from "./helpers";

describe("MINIMUM profile validation", () => {
  it("Valid minimum input passes", () => {
    const input = createMinimumInput();
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("Missing document.id fails", () => {
    const input = createMinimumInput({
      document: { ...createMinimumInput().document!, id: "" },
    });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "document.id",
        message: "Document ID is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing document.issueDate fails", () => {
    const input = createMinimumInput({
      document: { ...createMinimumInput().document!, issueDate: "" },
    });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "document.issueDate",
        message: "Document issue date is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing seller fails", () => {
    const input = createMinimumInput({ seller: undefined as any });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "seller",
        message: "Seller is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing seller.name fails", () => {
    const input = createMinimumInput({
      seller: { ...createMinimumInput().seller!, name: "" },
    });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "seller.name",
        message: "Seller name is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing buyer fails", () => {
    const input = createMinimumInput({ buyer: undefined as any });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "buyer",
        message: "Buyer is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing buyer.name fails", () => {
    const input = createMinimumInput({
      buyer: { ...createMinimumInput().buyer!, name: "" },
    });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "buyer.name",
        message: "Buyer name is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing totals fails", () => {
    const input = createMinimumInput({ totals: undefined as any });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals",
        message: "Totals are required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing totals.taxBasisTotal fails", () => {
    const input = createMinimumInput();
    const totals = { ...input.totals };
    delete (totals as any).taxBasisTotal;
    const result = validateInput({ ...input, totals }, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals.taxBasisTotal",
        message: "Tax basis total is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing totals.grandTotal fails", () => {
    const input = createMinimumInput();
    const totals = { ...input.totals };
    delete (totals as any).grandTotal;
    const result = validateInput({ ...input, totals }, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals.grandTotal",
        message: "Grand total is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing totals.duePayableAmount fails", () => {
    const input = createMinimumInput();
    const totals = { ...input.totals };
    delete (totals as any).duePayableAmount;
    const result = validateInput({ ...input, totals }, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals.duePayableAmount",
        message: "Due payable amount is required",
        profile: Profile.MINIMUM,
      }),
    );
  });

  it("Missing totals.currency fails", () => {
    const input = createMinimumInput({
      totals: { ...createMinimumInput().totals!, currency: "" },
    });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals.currency",
        message: "Currency is required",
        profile: Profile.MINIMUM,
      }),
    );
  });
});

describe("BASIC_WL profile validation", () => {
  it("Valid BASIC_WL input passes", () => {
    const input = createBasicWlInput();
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("Missing seller.address fails", () => {
    const input = createBasicWlInput({
      seller: { ...createBasicWlInput().seller!, address: undefined },
    });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "seller.address",
        message: "Seller address is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Missing seller.address.country fails", () => {
    const input = createBasicWlInput({
      seller: {
        ...createBasicWlInput().seller!,
        address: { ...createBasicWlInput().seller!.address!, country: "" },
      },
    });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "seller.address.country",
        message: "Seller address country is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Missing buyer.address fails", () => {
    const input = createBasicWlInput({
      buyer: { ...createBasicWlInput().buyer!, address: undefined },
    });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "buyer.address",
        message: "Buyer address is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Missing buyer.address.country fails", () => {
    const input = createBasicWlInput({
      buyer: {
        ...createBasicWlInput().buyer!,
        address: { ...createBasicWlInput().buyer!.address!, country: "" },
      },
    });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "buyer.address.country",
        message: "Buyer address country is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Missing vatBreakdown fails", () => {
    const input = createBasicWlInput({ vatBreakdown: undefined });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "vatBreakdown",
        message: "VAT breakdown with at least one entry is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Empty vatBreakdown array fails", () => {
    const input = createBasicWlInput({ vatBreakdown: [] });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "vatBreakdown",
        message: "VAT breakdown with at least one entry is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("VAT breakdown entry missing categoryCode fails", () => {
    const input = createBasicWlInput({
      vatBreakdown: [
        {
          categoryCode: "",
          ratePercent: 19,
          taxableAmount: 1000,
          taxAmount: 190,
        } as any,
      ],
    });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "vatBreakdown[0].categoryCode",
        message: "VAT breakdown entry categoryCode is required",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("VAT breakdown entry missing ratePercent fails", () => {
    const input = createBasicWlInput({
      vatBreakdown: [
        {
          categoryCode: "S",
          ratePercent: undefined,
          taxableAmount: 1000,
          taxAmount: 190,
        } as any,
      ],
    });
    const result = validateInput(input, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "vatBreakdown[0].ratePercent",
        message: "VAT breakdown entry ratePercent is required",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Missing totals.lineTotal fails", () => {
    const input = createBasicWlInput();
    const totals = { ...input.totals };
    delete (totals as any).lineTotal;
    const result = validateInput({ ...input, totals }, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals.lineTotal",
        message: "Line total is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("Missing totals.taxTotal fails", () => {
    const input = createBasicWlInput();
    const totals = { ...input.totals };
    delete (totals as any).taxTotal;
    const result = validateInput({ ...input, totals }, Profile.BASIC_WL);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "totals.taxTotal",
        message: "Tax total is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });
});

describe("BASIC profile validation", () => {
  it("Valid input (with lines) passes for BASIC", () => {
    const input = createEn16931Input();
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("Missing lines fails", () => {
    const input = createBasicWlInput({ lines: undefined });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines",
        message: "At least one invoice line is required for BASIC",
        profile: Profile.BASIC,
      }),
    );
  });

  it("Empty lines array fails", () => {
    const input = createBasicWlInput({ lines: [] });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines",
        message: "At least one invoice line is required for BASIC",
        profile: Profile.BASIC,
      }),
    );
  });

  it("Line missing id fails", () => {
    const input = createEn16931Input({
      lines: [{ ...createEn16931Input().lines![0], id: "" }],
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines[0].id",
        message: "Line ID is required",
        profile: Profile.BASIC,
      }),
    );
  });

  it("Line missing name fails", () => {
    const input = createEn16931Input({
      lines: [{ ...createEn16931Input().lines![0], name: "" }],
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines[0].name",
        message: "Line name is required",
        profile: Profile.BASIC,
      }),
    );
  });

  it("Line missing quantity fails", () => {
    const input = createEn16931Input({
      lines: [{ ...createEn16931Input().lines![0], quantity: undefined as any }],
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines[0].quantity",
        message: "Line quantity is required",
        profile: Profile.BASIC,
      }),
    );
  });

  it("Line missing unitPrice fails", () => {
    const input = createEn16931Input({
      lines: [{ ...createEn16931Input().lines![0], unitPrice: undefined as any }],
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines[0].unitPrice",
        message: "Line unit price is required",
        profile: Profile.BASIC,
      }),
    );
  });
});

describe("EN16931 profile validation", () => {
  it("Valid EN16931 input passes", () => {
    const input = createEn16931Input();
    const result = validateInput(input, Profile.EN16931);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("Line missing vatCategoryCode fails", () => {
    const input = createEn16931Input({
      lines: [{ ...createEn16931Input().lines![0], vatCategoryCode: "" }],
    });
    const result = validateInput(input, Profile.EN16931);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines[0].vatCategoryCode",
        message: "Line VAT category code is required for EN16931",
        profile: Profile.EN16931,
      }),
    );
  });

  it("Line missing vatRatePercent fails", () => {
    const input = createEn16931Input({
      lines: [{ ...createEn16931Input().lines![0], vatRatePercent: undefined }],
    });
    const result = validateInput(input, Profile.EN16931);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines[0].vatRatePercent",
        message: "Line VAT rate percent is required for EN16931",
        profile: Profile.EN16931,
      }),
    );
  });
});

describe("Cumulative validation", () => {
  it("EN16931 validation catches missing seller.address (a BASIC_WL requirement)", () => {
    const input = createEn16931Input({
      seller: { ...createEn16931Input().seller!, address: undefined },
    });
    const result = validateInput(input, Profile.EN16931);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "seller.address",
        message: "Seller address is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });

  it("BASIC validation catches missing vatBreakdown (a BASIC_WL requirement)", () => {
    const input = createBasicWlInput({ vatBreakdown: undefined });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "vatBreakdown",
        message: "VAT breakdown with at least one entry is required for BASIC_WL",
        profile: Profile.BASIC_WL,
      }),
    );
  });
});

describe("EXTENDED profile validation", () => {
  it("Valid EXTENDED input passes", () => {
    const input = createExtendedInput();
    const result = validateInput(input, Profile.EXTENDED);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("EXTENDED validation catches all lower-level requirements cumulatively", () => {
    const input = createExtendedInput({
      seller: {
        ...createExtendedInput().seller,
        address: undefined,
      },
      vatBreakdown: undefined,
    });
    const result = validateInput(input, Profile.EXTENDED);
    expect(result.valid).toBe(false);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain("seller.address");
    expect(fields).toContain("vatBreakdown");
  });

  it("Missing line items fails for EXTENDED (requires BASIC)", () => {
    const input = createExtendedInput({ lines: [] });
    const result = validateInput(input, Profile.EXTENDED);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "lines",
        profile: Profile.BASIC,
      }),
    );
  });
});

describe("Multiple errors", () => {
  it("An input missing multiple fields returns all errors at once", () => {
    const input = createMinimumInput({
      document: { ...createMinimumInput().document!, id: "" },
      seller: undefined as any,
      buyer: { ...createMinimumInput().buyer!, name: "" },
    });
    const result = validateInput(input, Profile.MINIMUM);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain("document.id");
    expect(fields).toContain("seller");
    expect(fields).toContain("buyer.name");
  });

  it("Errors include the correct profile level", () => {
    const input = createEn16931Input({
      seller: { ...createEn16931Input().seller!, address: undefined },
      lines: [{ ...createEn16931Input().lines![0], vatCategoryCode: "" }],
    });
    const result = validateInput(input, Profile.EN16931);
    expect(result.valid).toBe(false);
    const basicWlError = result.errors.find((e) => e.field === "seller.address");
    expect(basicWlError).toBeDefined();
    expect(basicWlError!.profile).toBe(Profile.BASIC_WL);
    const en16931Error = result.errors.find((e) => e.field === "lines[0].vatCategoryCode");
    expect(en16931Error).toBeDefined();
    expect(en16931Error!.profile).toBe(Profile.EN16931);
  });
});

describe("BR-27 negative line price", () => {
  it("rejects a line with negative unitPrice for BASIC", () => {
    const base = createBasicInput();
    const input = createBasicInput({
      lines: [{ ...base.lines![0], unitPrice: -10 }],
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("lines[0].unitPrice");
  });

  it("accepts zero unitPrice", () => {
    const base = createBasicInput();
    const input = createBasicInput({
      lines: [{ ...base.lines![0], unitPrice: 0 }],
      totals: {
        ...base.totals!,
        lineTotal: 0,
        taxBasisTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        duePayableAmount: 0,
      },
      vatBreakdown: [{ ...base.vatBreakdown![0], taxableAmount: 0, taxAmount: 0 }],
    });
    const result = validateInput(input, Profile.BASIC);
    const negPriceErrors = result.errors.filter((e) => e.field.endsWith(".unitPrice"));
    expect(negPriceErrors).toHaveLength(0);
  });
});

describe("BR-CO-15 totals consistency", () => {
  it("rejects grandTotal that does not equal taxBasisTotal + taxTotal", () => {
    const input = createBasicInput({
      totals: {
        ...createBasicInput().totals!,
        taxBasisTotal: 100,
        taxTotal: 19,
        grandTotal: 100, // wrong: missing VAT
        duePayableAmount: 100,
      },
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("totals.grandTotal");
  });

  it("accepts grandTotal that matches", () => {
    const input = createBasicInput();
    const result = validateInput(input, Profile.BASIC);
    const totalErrors = result.errors.filter((e) => e.field === "totals.grandTotal");
    expect(totalErrors).toHaveLength(0);
  });
});

describe("BR-CO-10 sum of line nets equals lineTotal", () => {
  it("rejects when totals.lineTotal disagrees with Σ line.lineTotal", () => {
    const base = createBasicInput();
    const input = createBasicInput({
      lines: [{ ...base.lines![0], unitPrice: 20, quantity: 5, lineTotal: 100 }],
      totals: { ...base.totals!, lineTotal: 999 },
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("totals.lineTotal");
  });
});

describe("BR-CO-13 taxBasisTotal composition", () => {
  it("rejects when taxBasisTotal != lineTotal - allowance + charge", () => {
    const input = createBasicInput({
      totals: {
        ...createBasicInput().totals!,
        lineTotal: 100,
        allowanceTotal: 10,
        taxBasisTotal: 100, // wrong: should be 90
        taxTotal: 17.1,
        grandTotal: 107.1,
        duePayableAmount: 107.1,
      },
      vatBreakdown: [{ categoryCode: "S", ratePercent: 19, taxableAmount: 90, taxAmount: 17.1 }],
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("totals.taxBasisTotal");
  });
});

describe("BR-CO-14 tax total = sum of vat breakdown amounts", () => {
  it("rejects when totals.taxTotal disagrees with Σ vatBreakdown.taxAmount", () => {
    const input = createBasicInput({
      totals: { ...createBasicInput().totals!, taxTotal: 99 },
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("totals.taxTotal");
  });
});

describe("BR-CO-17 vat amount = round(basis × rate / 100)", () => {
  it("rejects a vatBreakdown where taxAmount != basis × rate / 100", () => {
    const input = createBasicInput({
      vatBreakdown: [
        { categoryCode: "S", ratePercent: 19, taxableAmount: 100, taxAmount: 0 }, // wrong: should be 19
      ],
      totals: {
        ...createBasicInput().totals!,
        taxTotal: 0,
        grandTotal: 100,
        duePayableAmount: 100,
      },
    });
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("vatBreakdown[0].taxAmount");
  });
});

describe("BR-FX-EN-04 delivery date / billing period", () => {
  it("rejects BASIC invoice with no delivery date and no billing period", () => {
    const input = createBasicInput();
    delete input.delivery;
    delete input.billingPeriod;
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("delivery.date");
  });

  it("accepts BASIC invoice with billingPeriod set", () => {
    const input = createBasicInput();
    delete input.delivery;
    input.billingPeriod = { startDate: "2025-06-01", endDate: "2025-06-30" };
    const result = validateInput(input, Profile.BASIC);
    const deliveryErrors = result.errors.filter((e) => e.field === "delivery.date");
    expect(deliveryErrors).toHaveLength(0);
  });

  it("does not require delivery date for prepayment invoices (type 386)", () => {
    const input = createBasicInput({
      document: { ...createBasicInput().document!, typeCode: "386" as any },
    });
    delete input.delivery;
    delete input.billingPeriod;
    const result = validateInput(input, Profile.BASIC);
    const deliveryErrors = result.errors.filter((e) => e.field === "delivery.date");
    expect(deliveryErrors).toHaveLength(0);
  });
});

describe("XRechnung BR-DE / PEPPOL rules", () => {
  it("a fully populated XRechnung input passes", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    expect(result.valid).toBe(true);
  });

  it("BR-DE-15: rejects when buyerReference is missing", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    delete input.document.buyerReference;
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("document.buyerReference");
  });

  it("BR-DE-2: rejects when seller contact is missing", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    input.seller!.contact = undefined;
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("seller.contact");
  });

  it("PEPPOL-EN16931-R020: rejects when seller electronic address is missing", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    input.seller!.electronicAddress = undefined;
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("seller.electronicAddress");
  });

  it("PEPPOL-EN16931-R010: rejects when buyer electronic address is missing", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    input.buyer!.electronicAddress = undefined;
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("buyer.electronicAddress");
  });

  it("BR-62: rejects seller electronic address without schemeID (Factur-X BASIC)", () => {
    const input = createBasicInput();
    input.seller!.electronicAddress = { value: "info@stack-forge.eu", schemeID: "" };
    const result = validateInput(input, Profile.BASIC);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("seller.electronicAddress.schemeID");
  });

  it("BR-DE-19: rejects an invalid IBAN when meansCode is 58", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    input.payment = { meansCode: "58", iban: "DE00000000000000000000" };
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.field)).toContain("payment.iban");
  });

  it("BR-DE-19: accepts a valid IBAN when meansCode is 58", () => {
    const input = createXRechnungInput();
    input.document.businessProcessId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
    input.payment = { meansCode: "58", iban: "DE89 3704 0044 0532 0130 00" };
    const result = validateInput(input, Profile.EN16931, Flavor.XRECHNUNG);
    const ibanErrors = result.errors.filter((e) => e.field === "payment.iban");
    expect(ibanErrors).toHaveLength(0);
  });

  it("XRechnung rules do not apply to non-XRechnung flavors", () => {
    const input = createBasicInput();
    delete input.document.buyerReference;
    const result = validateInput(input, Profile.BASIC); // no flavor
    const buyerRefErrors = result.errors.filter((e) => e.field === "document.buyerReference");
    expect(buyerRefErrors).toHaveLength(0);
  });
});
