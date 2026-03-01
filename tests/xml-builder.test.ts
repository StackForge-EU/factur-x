import { describe, it, expect } from "vitest";
import { buildXml, escapeXml } from "../src/core/xml-builder";
import { Profile, Flavor } from "../src/flavors/constants";
import { DocumentTypeCode, UnitCode } from "../src/types/input";
import {
  createMinimumInput,
  createBasicWlInput,
  createBasicInput,
  createEn16931Input,
  createExtendedInput,
} from "./helpers";

describe("escapeXml", () => {
  it("escapes ampersand", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  it("escapes less than", () => {
    expect(escapeXml("a < b")).toBe("a &lt; b");
  });

  it("escapes greater than", () => {
    expect(escapeXml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quote", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quote", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });
});

describe("MINIMUM profile", () => {
  const input = createMinimumInput();
  const xml = buildXml(input, Profile.MINIMUM);

  it("returns valid XML starting with xml declaration", () => {
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).toContain('encoding="UTF-8"');
  });

  it("contains CrossIndustryInvoice root", () => {
    expect(xml).toContain("<rsm:CrossIndustryInvoice");
    expect(xml).toContain("</rsm:CrossIndustryInvoice>");
  });

  it("contains correct profile URN for minimum", () => {
    expect(xml).toContain("urn:factur-x.eu:1p0:minimum");
  });

  it("contains document ID, issue date, type code", () => {
    expect(xml).toContain("INV-TEST-001");
    expect(xml).toContain("20250601");
    expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
  });

  it("contains seller and buyer names", () => {
    expect(xml).toContain("StackForge UG (haftungsbeschränkt)");
    expect(xml).toContain("Kite-Engineer by Stefan Merthan");
  });

  it("contains monetary totals", () => {
    expect(xml).toContain("TaxBasisTotalAmount");
    expect(xml).toContain("GrandTotalAmount");
    expect(xml).toContain("DuePayableAmount");
    expect(xml).toContain("100.00");
  });

  it("does not contain line items", () => {
    expect(xml).not.toContain("IncludedSupplyChainTradeLineItem");
  });
});

describe("BASIC_WL profile", () => {
  const input = createBasicWlInput({
    document: {
      id: "INV-BWL-001",
      issueDate: "2025-06-15",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      notes: [
        { content: "Payment within 30 days" },
        { content: "Regulatory note", subjectCode: "REG" },
      ],
    },
  });
  const xml = buildXml(input, Profile.BASIC_WL);

  it("contains basicwl profile URN", () => {
    expect(xml).toContain("urn:factur-x.eu:1p0:basicwl");
  });

  it("contains VAT breakdown", () => {
    expect(xml).toContain("ApplicableTradeTax");
    expect(xml).toContain("CategoryCode");
    expect(xml).toContain("S");
  });

  it("contains payment means", () => {
    expect(xml).toContain("SpecifiedTradeSettlementPaymentMeans");
    expect(xml).toContain("<ram:TypeCode>58</ram:TypeCode>");
    expect(xml).toContain("DE89370400440532013000");
  });

  it("contains notes when provided", () => {
    expect(xml).toContain("Payment within 30 days");
    expect(xml).toContain("Regulatory note");
  });

  it("does not contain line items", () => {
    expect(xml).not.toContain("IncludedSupplyChainTradeLineItem");
  });
});

describe("EN16931 profile", () => {
  const input = createEn16931Input();
  const xml = buildXml(input, Profile.EN16931);

  it("contains en16931 profile URN", () => {
    expect(xml).toContain("urn:factur-x.eu:1p0:en16931");
  });

  it("contains line items with IDs, names, quantities, prices", () => {
    expect(xml).toContain("IncludedSupplyChainTradeLineItem");
    expect(xml).toContain("<ram:LineID>1</ram:LineID>");
    expect(xml).toContain("<ram:LineID>2</ram:LineID>");
    expect(xml).toContain("Consulting Services");
    expect(xml).toContain("Software License");
    expect(xml).toContain("<ram:BilledQuantity");
    expect(xml).toContain("150.00");
    expect(xml).toContain("500.00");
  });

  it("contains VAT category codes on lines", () => {
    expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
  });

  it("contains buyer and seller addresses", () => {
    expect(xml).toContain("Bergstraße 4");
    expect(xml).toContain("Hauptstraße 6");
  });

  it("contains contact information", () => {
    expect(xml).toContain("Tobias Sittenauer");
    expect(xml).toContain("+49 8702 123456");
    expect(xml).toContain("info@stack-forge.eu");
  });

  it("contains delivery date", () => {
    expect(xml).toContain("ActualDeliverySupplyChainEvent");
    expect(xml).toContain("20250620");
  });

  it("contains payment BIC", () => {
    expect(xml).toContain("BICID");
    expect(xml).toContain("COBADEFFXXX");
  });
});

describe("Flavor differences", () => {
  it("uses default type code 380 for factur-x", () => {
    const input = createMinimumInput({
      document: {
        id: "INV-001",
        issueDate: "2025-01-01",
      },
    });
    const xml = buildXml(input, Profile.MINIMUM, Flavor.FACTUR_X);
    expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
  });

  it("uses default type code 380 for zugferd", () => {
    const input = createMinimumInput({
      document: {
        id: "INV-001",
        issueDate: "2025-01-01",
      },
    });
    const xml = buildXml(input, Profile.MINIMUM, Flavor.ZUGFERD);
    expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
  });

  it("uses custom typeCode from input overriding flavor default", () => {
    const input = createMinimumInput({
      document: {
        id: "CN-001",
        issueDate: "2025-01-01",
        typeCode: DocumentTypeCode.CREDIT_NOTE,
      },
    });
    const xml = buildXml(input, Profile.MINIMUM, Flavor.FACTUR_X);
    expect(xml).toContain("<ram:TypeCode>381</ram:TypeCode>");
  });
});

describe("BASIC profile", () => {
  const input = createBasicInput();
  const xml = buildXml(input, Profile.BASIC);

  it("contains basic profile URN", () => {
    expect(xml).toContain("urn:factur-x.eu:1p0:basic");
  });

  it("contains line items", () => {
    expect(xml).toContain("IncludedSupplyChainTradeLineItem");
    expect(xml).toContain("<ram:LineID>1</ram:LineID>");
    expect(xml).toContain("Widget A");
  });

  it("contains VAT breakdown", () => {
    expect(xml).toContain("ApplicableTradeTax");
    expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
  });

  it("contains monetary summation", () => {
    expect(xml).toContain("LineTotalAmount");
    expect(xml).toContain("TaxBasisTotalAmount");
    expect(xml).toContain("GrandTotalAmount");
  });

  it("does not contain EN16931+ elements like seller description", () => {
    const inp = createBasicInput({
      seller: {
        ...createBasicInput().seller,
        description: "This should be ignored",
        contact: { name: "Hidden Contact", email: "hidden@test.de" },
      },
    });
    const x = buildXml(inp, Profile.BASIC);
    expect(x).not.toContain("This should be ignored");
    expect(x).not.toContain("Hidden Contact");
  });
});

describe("EXTENDED profile", () => {
  const input = createExtendedInput();
  const xml = buildXml(input, Profile.EXTENDED);

  it("contains extended profile URN", () => {
    expect(xml).toContain("urn:factur-x.eu:1p0:extended");
  });

  it("contains document name (EXTENDED-only)", () => {
    expect(xml).toContain("<ram:Name>Extended Test Invoice</ram:Name>");
  });

  it("contains document language (EXTENDED-only)", () => {
    expect(xml).toContain("<ram:LanguageID>de</ram:LanguageID>");
  });

  it("contains seller description (EN16931+)", () => {
    expect(xml).toContain("Open-source software for e-invoicing");
  });

  it("contains seller legal organization", () => {
    expect(xml).toContain("SpecifiedLegalOrganization");
    expect(xml).toContain("HRB 12345");
    expect(xml).toContain("StackForge");
  });

  it("contains delivery party and location", () => {
    expect(xml).toContain("ShipToTradeParty");
    expect(xml).toContain("Delivery Site Berlin");
    expect(xml).toContain("Lieferstraße 42");
  });

  it("contains gross unit price", () => {
    expect(xml).toContain("GrossPriceProductTradePrice");
    expect(xml).toContain("900.00");
  });

  it("contains line origin country", () => {
    expect(xml).toContain("OriginTradeCountry");
  });

  it("contains line description", () => {
    expect(xml).toContain("Full-day consulting engagement");
  });

  it("contains line items with correct quantities", () => {
    expect(xml).toContain("IncludedSupplyChainTradeLineItem");
    expect(xml).toContain("Premium Service");
    expect(xml).toContain("Software Module");
  });
});

describe("Edge cases", () => {
  it("escapes XML special characters in seller name", () => {
    const input = createMinimumInput({
      seller: {
        name: "Smith & Sons <test>",
      },
    });
    const xml = buildXml(input, Profile.MINIMUM);
    expect(xml).toContain("Smith &amp; Sons");
    expect(xml).toContain("&lt;test&gt;");
  });

  it("handles multiple line items", () => {
    const input = createEn16931Input({
      lines: [
        {
          id: "1",
          name: "Item A",
          quantity: 2,
          unitPrice: 50,
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
        {
          id: "2",
          name: "Item B",
          quantity: 3,
          unitPrice: 100,
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
        {
          id: "3",
          name: "Item C",
          quantity: 1,
          unitPrice: 200,
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
      ],
      totals: {
        lineTotal: 600,
        taxBasisTotal: 600,
        taxTotal: 114,
        grandTotal: 714,
        duePayableAmount: 714,
        currency: "EUR",
      },
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("<ram:LineID>1</ram:LineID>");
    expect(xml).toContain("<ram:LineID>2</ram:LineID>");
    expect(xml).toContain("<ram:LineID>3</ram:LineID>");
    expect(xml).toContain("Item A");
    expect(xml).toContain("Item B");
    expect(xml).toContain("Item C");
  });

  it("includes allowances and charges at document level", () => {
    const input = createBasicWlInput({
      allowancesCharges: [
        { isCharge: false, amount: 50, reason: "Early payment discount" },
        { isCharge: true, amount: 10, reason: "Shipping fee" },
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
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("SpecifiedTradeAllowanceCharge");
    expect(xml).toContain("Early payment discount");
    expect(xml).toContain("Shipping fee");
  });

  it("includes document references for order and preceding invoice", () => {
    const input = createBasicWlInput({
      references: [
        { id: "PO-2025-500", type: "order" },
        { id: "INV-PREV-001", type: "preceding", issueDate: "2025-05-01" },
      ],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("BuyerOrderReferencedDocument");
    expect(xml).toContain("PO-2025-500");
    expect(xml).toContain("InvoiceReferencedDocument");
    expect(xml).toContain("INV-PREV-001");
  });

  it("includes billing period", () => {
    const input = createBasicWlInput({
      billingPeriod: {
        startDate: "2025-06-01",
        endDate: "2025-06-30",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("BillingSpecifiedPeriod");
    expect(xml).toContain("StartDateTime");
    expect(xml).toContain("EndDateTime");
    expect(xml).toContain("20250601");
    expect(xml).toContain("20250630");
  });
});

describe("Reference types", () => {
  it("handles despatch reference type", () => {
    const input = createBasicWlInput({
      references: [{ id: "DA-2025-001", type: "despatch" }],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("DespatchAdviceReferencedDocument");
    expect(xml).toContain("DA-2025-001");
  });

  it("handles despatch reference with issueDate", () => {
    const input = createBasicWlInput({
      references: [{ id: "DA-2025-002", type: "despatch", issueDate: "2025-05-20" }],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("DespatchAdviceReferencedDocument");
    expect(xml).toContain("DA-2025-002");
    expect(xml).toContain("20250520");
  });

  it("handles contract reference type", () => {
    const input = createBasicWlInput({
      references: [{ id: "CT-2025-010", type: "contract" }],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("ContractReferencedDocument");
    expect(xml).toContain("CT-2025-010");
  });

  it("handles seller-order reference type at EN16931", () => {
    const input = createEn16931Input({
      references: [{ id: "SO-2025-005", type: "seller-order" }],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("SellerOrderReferencedDocument");
    expect(xml).toContain("SO-2025-005");
  });

  it("omits seller-order reference below EN16931", () => {
    const input = createBasicWlInput({
      references: [{ id: "SO-2025-005", type: "seller-order" }],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).not.toContain("SellerOrderReferencedDocument");
  });

  it("handles project reference type at EN16931", () => {
    const input = createEn16931Input({
      references: [{ id: "PRJ-42", type: "project" }],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("SpecifiedProcuringProject");
    expect(xml).toContain("PRJ-42");
  });

  it("defaults reference type to order", () => {
    const input = createBasicWlInput({
      references: [{ id: "REF-NO-TYPE" }],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("BuyerOrderReferencedDocument");
    expect(xml).toContain("REF-NO-TYPE");
  });

  it("handles multiple reference types together", () => {
    const input = createEn16931Input({
      references: [
        { id: "PO-001", type: "order" },
        { id: "CT-002", type: "contract" },
        { id: "DA-003", type: "despatch" },
        { id: "INV-004", type: "preceding" },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("BuyerOrderReferencedDocument");
    expect(xml).toContain("ContractReferencedDocument");
    expect(xml).toContain("DespatchAdviceReferencedDocument");
    expect(xml).toContain("InvoiceReferencedDocument");
  });
});

describe("Untested XML elements", () => {
  it("includes sellerTaxRepresentative at BASIC_WL+", () => {
    const input = createBasicWlInput({
      sellerTaxRepresentative: {
        name: "Tax Rep GmbH",
        address: {
          line1: "Steuerweg 1",
          city: "Berlin",
          postalCode: "10115",
          country: "DE",
        },
        taxRegistrations: [{ id: "DE999888777", schemeId: "VA" }],
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("SellerTaxRepresentativeTradeParty");
    expect(xml).toContain("Tax Rep GmbH");
    expect(xml).toContain("DE999888777");
  });

  it("includes payee party at BASIC_WL+", () => {
    const input = createBasicWlInput({
      payee: {
        name: "Payee Corp",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("PayeeTradeParty");
    expect(xml).toContain("Payee Corp");
  });

  it("includes creditorReference in settlement", () => {
    const input = createBasicWlInput({
      payment: {
        ...createBasicWlInput().payment!,
        creditorReference: "CRED-REF-001",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("CreditorReferenceID");
    expect(xml).toContain("CRED-REF-001");
  });

  it("includes payment mandate ID (direct debit)", () => {
    const input = createBasicWlInput({
      payment: {
        ...createBasicWlInput().payment!,
        mandateId: "MANDATE-001",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("DirectDebitMandateID");
    expect(xml).toContain("MANDATE-001");
  });

  it("includes debtor IBAN", () => {
    const input = createBasicWlInput({
      payment: {
        ...createBasicWlInput().payment!,
        debtorIban: "DE44500105175407324931",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("PayerPartyDebtorFinancialAccount");
    expect(xml).toContain("DE44500105175407324931");
  });

  it("includes payment account name at EN16931+", () => {
    const input = createEn16931Input({
      payment: {
        ...createEn16931Input().payment!,
        accountName: "My Business Account",
      },
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("AccountName");
    expect(xml).toContain("My Business Account");
  });

  it("includes payment terms description", () => {
    const input = createBasicWlInput({
      payment: {
        ...createBasicWlInput().payment!,
        termsDescription: "Net 30 days",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("SpecifiedTradePaymentTerms");
    expect(xml).toContain("Net 30 days");
  });

  it("includes tax currency code", () => {
    const input = createBasicWlInput({
      totals: {
        ...createBasicWlInput().totals,
        taxCurrency: "USD",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("TaxCurrencyCode");
    expect(xml).toContain("USD");
  });

  it("includes prepaid amount", () => {
    const input = createBasicWlInput({
      totals: {
        ...createBasicWlInput().totals,
        prepaidAmount: 200,
        duePayableAmount: 990,
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("TotalPrepaidAmount");
    expect(xml).toContain("200.00");
  });

  it("includes VAT exemption reason and code", () => {
    const input = createBasicWlInput({
      vatBreakdown: [
        {
          categoryCode: "E",
          ratePercent: 0,
          taxableAmount: 1000,
          taxAmount: 0,
          exemptionReason: "Exempt per directive 2006/112/EC",
          exemptionReasonCode: "VATEX-EU-132",
        },
      ],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("ExemptionReason");
    expect(xml).toContain("Exempt per directive 2006/112/EC");
    expect(xml).toContain("ExemptionReasonCode");
    expect(xml).toContain("VATEX-EU-132");
  });

  it("includes address line2, line3, subdivision", () => {
    const input = createBasicWlInput({
      seller: {
        ...createBasicWlInput().seller,
        address: {
          line1: "Main Building",
          line2: "Floor 5",
          line3: "Room 501",
          city: "Berlin",
          postalCode: "10115",
          country: "DE",
          subdivision: "Berlin",
        },
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("LineTwo");
    expect(xml).toContain("Floor 5");
    expect(xml).toContain("LineThree");
    expect(xml).toContain("Room 501");
    expect(xml).toContain("CountrySubDivisionName");
    expect(xml).toContain("Berlin");
  });

  it("includes line note", () => {
    const input = createEn16931Input({
      lines: [
        {
          ...createEn16931Input().lines![0],
          note: "Special handling required",
        },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("IncludedNote");
    expect(xml).toContain("Special handling required");
  });

  it("includes line sellerAssignedId and buyerAssignedId", () => {
    const input = createEn16931Input({
      lines: [
        {
          ...createEn16931Input().lines![0],
          sellerAssignedId: "SEL-001",
          buyerAssignedId: "BUY-001",
        },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("SellerAssignedID");
    expect(xml).toContain("SEL-001");
    expect(xml).toContain("BuyerAssignedID");
    expect(xml).toContain("BUY-001");
  });

  it("includes line buyerOrderLineId at EN16931", () => {
    const input = createEn16931Input({
      lines: [
        {
          ...createEn16931Input().lines![0],
          buyerOrderLineId: "LINE-REF-1",
        },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("BuyerOrderReferencedDocument");
    expect(xml).toContain("LINE-REF-1");
  });

  it("includes note subjectCode", () => {
    const input = createBasicWlInput({
      document: {
        ...createBasicWlInput().document,
        notes: [{ content: "Tax note", subjectCode: "AAK" }],
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("<ram:SubjectCode>AAK</ram:SubjectCode>");
  });

  it("includes electronic address (URIUniversalCommunication)", () => {
    const input = createEn16931Input();
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("URIUniversalCommunication");
    expect(xml).toContain("info@stack-forge.eu");
  });

  it("includes global ID on seller", () => {
    const input = createMinimumInput({
      seller: {
        ...createMinimumInput().seller,
        globalId: "4000001000005",
      },
    });
    const xml = buildXml(input, Profile.MINIMUM);
    expect(xml).toContain("<ram:GlobalID>4000001000005</ram:GlobalID>");
  });

  it("includes multiple seller IDs", () => {
    const input = createMinimumInput({
      seller: {
        ...createMinimumInput().seller,
        id: ["ID-A", "ID-B"],
      },
    });
    const xml = buildXml(input, Profile.MINIMUM);
    expect(xml).toContain("<ram:ID>ID-A</ram:ID>");
    expect(xml).toContain("<ram:ID>ID-B</ram:ID>");
  });

  it("includes despatchAdviceReference via delivery input", () => {
    const input = createBasicWlInput({
      delivery: {
        date: "2025-06-15",
        despatchAdviceReference: "DESP-001",
      },
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("DespatchAdviceReferencedDocument");
    expect(xml).toContain("DESP-001");
  });

  it("includes allowance/charge with percent, base amount, reason code, and VAT", () => {
    const input = createBasicWlInput({
      allowancesCharges: [
        {
          isCharge: false,
          amount: 50,
          percent: 5,
          baseAmount: 1000,
          reason: "Volume discount",
          reasonCode: "95",
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
      ],
    });
    const xml = buildXml(input, Profile.BASIC_WL);
    expect(xml).toContain("CalculationPercent");
    expect(xml).toContain("BasisAmount");
    expect(xml).toContain("ReasonCode");
    expect(xml).toContain("95");
    expect(xml).toContain("CategoryTradeTax");
  });

  it("uses custom unitCode on line items", () => {
    const input = createEn16931Input({
      lines: [
        {
          id: "1",
          name: "Consulting",
          quantity: 8,
          unitCode: UnitCode.HOUR,
          unitPrice: 120,
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain(`unitCode="${UnitCode.HOUR}"`);
  });

  it("computes lineTotal from quantity * unitPrice when lineTotal not set", () => {
    const input = createEn16931Input({
      lines: [
        {
          id: "1",
          name: "Auto calc",
          quantity: 3,
          unitPrice: 100,
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("<ram:LineTotalAmount>300.00</ram:LineTotalAmount>");
  });

  it("uses explicit lineTotal when provided", () => {
    const input = createEn16931Input({
      lines: [
        {
          id: "1",
          name: "Explicit total",
          quantity: 3,
          unitPrice: 100,
          lineTotal: 280,
          vatCategoryCode: "S",
          vatRatePercent: 19,
        },
      ],
    });
    const xml = buildXml(input, Profile.EN16931);
    expect(xml).toContain("<ram:LineTotalAmount>280.00</ram:LineTotalAmount>");
  });

  it("includes businessProcessId when provided", () => {
    const input = createMinimumInput({
      document: {
        ...createMinimumInput().document,
        businessProcessId: "urn:custom:business:1.0",
      },
    });
    const xml = buildXml(input, Profile.MINIMUM);
    expect(xml).toContain("BusinessProcessSpecifiedDocumentContextParameter");
    expect(xml).toContain("urn:custom:business:1.0");
  });
});

describe("Input guards", () => {
  it("throws when input is null/undefined", () => {
    expect(() => buildXml(null as any, Profile.MINIMUM)).toThrow('buildXml: "input" is required.');
    expect(() => buildXml(undefined as any, Profile.MINIMUM)).toThrow(
      'buildXml: "input" is required.',
    );
  });

  it("throws when profile is missing", () => {
    expect(() => buildXml(createMinimumInput(), null as any)).toThrow(
      'buildXml: "profile" is required',
    );
  });

  it("throws when document is missing", () => {
    const input = { ...createMinimumInput(), document: undefined as any };
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow(
      'buildXml: "input.document" is required',
    );
  });

  it("throws when seller is missing", () => {
    const input = { ...createMinimumInput(), seller: undefined as any };
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow('buildXml: "input.seller" is required');
  });

  it("throws when buyer is missing", () => {
    const input = { ...createMinimumInput(), buyer: undefined as any };
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow('buildXml: "input.buyer" is required');
  });

  it("throws when totals is missing", () => {
    const input = { ...createMinimumInput(), totals: undefined as any };
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow('buildXml: "input.totals" is required');
  });
});

describe("fmtAmt guard", () => {
  it("throws on NaN amount in totals", () => {
    const input = createMinimumInput({
      totals: {
        ...createMinimumInput().totals,
        taxBasisTotal: NaN,
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow("Invalid amount value: NaN");
  });

  it("throws on Infinity amount in totals", () => {
    const input = createMinimumInput({
      totals: {
        ...createMinimumInput().totals,
        grandTotal: Infinity,
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow("Invalid amount value: Infinity");
  });

  it("throws on negative Infinity", () => {
    const input = createMinimumInput({
      totals: {
        ...createMinimumInput().totals,
        duePayableAmount: -Infinity,
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow("Invalid amount value");
  });
});

describe("Date format validation", () => {
  it("throws on invalid date format in issueDate", () => {
    const input = createMinimumInput({
      document: {
        ...createMinimumInput().document,
        issueDate: "01/06/2025",
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow(
      'Invalid date format "01/06/2025": expected YYYY-MM-DD',
    );
  });

  it("throws on incomplete date", () => {
    const input = createMinimumInput({
      document: {
        ...createMinimumInput().document,
        issueDate: "2025-06",
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow("Invalid date format");
  });

  it("throws on date with time component", () => {
    const input = createMinimumInput({
      document: {
        ...createMinimumInput().document,
        issueDate: "2025-06-01T12:00:00",
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).toThrow("Invalid date format");
  });

  it("accepts valid YYYY-MM-DD date", () => {
    const input = createMinimumInput({
      document: {
        ...createMinimumInput().document,
        issueDate: "2025-12-31",
      },
    });
    expect(() => buildXml(input, Profile.MINIMUM)).not.toThrow();
  });
});

describe("escapeXml control characters", () => {
  it("strips null byte", () => {
    expect(escapeXml("hello\x00world")).toBe("helloworld");
  });

  it("strips bell character", () => {
    expect(escapeXml("alert\x07!")).toBe("alert!");
  });

  it("strips vertical tab and form feed", () => {
    expect(escapeXml("a\x0Bb\x0Cc")).toBe("abc");
  });

  it("preserves tab, newline, and carriage return", () => {
    expect(escapeXml("a\tb\nc\rd")).toBe("a\tb\nc\rd");
  });

  it("strips and escapes in same pass", () => {
    expect(escapeXml("\x01A & B\x02")).toBe("A &amp; B");
  });
});
