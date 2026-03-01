/**
 * Shared test fixtures and helpers for the Factur-X test suite.
 *
 * @module tests/helpers
 */

import { DocumentTypeCode, UnitCode, VatCategoryCode } from "../src/types/input";
import type { FacturXInvoiceInput } from "../src/types/input";

/**
 * Minimal valid invoice input for the MINIMUM profile.
 */
export function createMinimumInput(overrides?: Partial<FacturXInvoiceInput>): FacturXInvoiceInput {
  return {
    document: {
      id: "INV-TEST-001",
      issueDate: "2025-06-01",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    },
    seller: {
      name: "StackForge UG (haftungsbeschränkt)",
      taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
    },
    buyer: {
      name: "Kite-Engineer by Stefan Merthan",
    },
    totals: {
      lineTotal: 0,
      taxBasisTotal: 100,
      taxTotal: 0,
      grandTotal: 100,
      duePayableAmount: 100,
      currency: "EUR",
    },
    ...overrides,
  };
}

/**
 * Valid invoice input for the BASIC_WL profile.
 */
export function createBasicWlInput(overrides?: Partial<FacturXInvoiceInput>): FacturXInvoiceInput {
  return {
    document: {
      id: "INV-TEST-002",
      issueDate: "2025-06-15",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      buyerReference: "PO-2025-100",
    },
    seller: {
      name: "StackForge UG (haftungsbeschränkt)",
      address: {
        line1: "Bergstraße 4",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
      taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
    },
    buyer: {
      name: "Kite-Engineer by Stefan Merthan",
      address: {
        line1: "Hauptstraße 6",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
    },
    totals: {
      lineTotal: 1000,
      taxBasisTotal: 1000,
      taxTotal: 190,
      grandTotal: 1190,
      duePayableAmount: 1190,
      currency: "EUR",
    },
    vatBreakdown: [
      {
        categoryCode: VatCategoryCode.STANDARD_RATE,
        ratePercent: 19,
        taxableAmount: 1000,
        taxAmount: 190,
      },
    ],
    payment: {
      meansCode: "58",
      iban: "DE89370400440532013000",
      dueDate: "2025-07-15",
    },
    ...overrides,
  };
}

/**
 * Valid invoice input for the EN16931 profile with line items.
 */
export function createEn16931Input(overrides?: Partial<FacturXInvoiceInput>): FacturXInvoiceInput {
  return {
    document: {
      id: "INV-TEST-003",
      issueDate: "2025-06-20",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      buyerReference: "PO-2025-200",
    },
    seller: {
      name: "StackForge UG (haftungsbeschränkt)",
      address: {
        line1: "Bergstraße 4",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
      taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
      contact: {
        name: "Tobias Sittenauer",
        phone: "+49 8702 123456",
        email: "info@stack-forge.eu",
      },
      electronicAddress: "info@stack-forge.eu",
    },
    buyer: {
      name: "Kite-Engineer by Stefan Merthan",
      address: {
        line1: "Hauptstraße 6",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
      taxRegistrations: [{ id: "DE987654321", schemeId: "VA" }],
    },
    lines: [
      {
        id: "1",
        name: "Consulting Services",
        quantity: 10,
        unitCode: UnitCode.HOUR,
        unitPrice: 150,
        vatCategoryCode: VatCategoryCode.STANDARD_RATE,
        vatRatePercent: 19,
      },
      {
        id: "2",
        name: "Software License",
        quantity: 1,
        unitCode: UnitCode.UNIT,
        unitPrice: 500,
        vatCategoryCode: VatCategoryCode.STANDARD_RATE,
        vatRatePercent: 19,
      },
    ],
    totals: {
      lineTotal: 2000,
      taxBasisTotal: 2000,
      taxTotal: 380,
      grandTotal: 2380,
      duePayableAmount: 2380,
      currency: "EUR",
    },
    vatBreakdown: [
      {
        categoryCode: VatCategoryCode.STANDARD_RATE,
        ratePercent: 19,
        taxableAmount: 2000,
        taxAmount: 380,
      },
    ],
    payment: {
      meansCode: "58",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      paymentReference: "INV-TEST-003",
      dueDate: "2025-07-20",
    },
    delivery: {
      date: "2025-06-20",
    },
    ...overrides,
  };
}

/**
 * Valid invoice input for the BASIC profile (has line items, no EN16931 extras).
 */
export function createBasicInput(overrides?: Partial<FacturXInvoiceInput>): FacturXInvoiceInput {
  return {
    document: {
      id: "INV-TEST-BASIC",
      issueDate: "2025-06-18",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      buyerReference: "PO-2025-150",
    },
    seller: {
      name: "StackForge UG (haftungsbeschränkt)",
      address: {
        line1: "Bergstraße 4",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
      taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
    },
    buyer: {
      name: "Kite-Engineer by Stefan Merthan",
      address: {
        line1: "Hauptstraße 6",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
    },
    lines: [
      {
        id: "1",
        name: "Widget A",
        quantity: 5,
        unitCode: UnitCode.UNIT,
        unitPrice: 20,
        vatCategoryCode: VatCategoryCode.STANDARD_RATE,
        vatRatePercent: 19,
      },
    ],
    totals: {
      lineTotal: 100,
      taxBasisTotal: 100,
      taxTotal: 19,
      grandTotal: 119,
      duePayableAmount: 119,
      currency: "EUR",
    },
    vatBreakdown: [
      {
        categoryCode: VatCategoryCode.STANDARD_RATE,
        ratePercent: 19,
        taxableAmount: 100,
        taxAmount: 19,
      },
    ],
    payment: {
      meansCode: "58",
      iban: "DE89370400440532013000",
      dueDate: "2025-07-18",
    },
    ...overrides,
  };
}

/**
 * Valid invoice input for the EXTENDED profile (includes name, language, etc.).
 */
export function createExtendedInput(overrides?: Partial<FacturXInvoiceInput>): FacturXInvoiceInput {
  return {
    document: {
      id: "INV-TEST-EXT",
      issueDate: "2025-06-25",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      buyerReference: "PO-2025-300",
      name: "Extended Test Invoice",
      language: "de",
      notes: [{ content: "Extended profile test note" }],
    },
    seller: {
      name: "StackForge UG (haftungsbeschränkt)",
      description: "Open-source software for e-invoicing",
      address: {
        line1: "Bergstraße 4",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
      taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
      contact: {
        name: "Tobias Sittenauer",
        phone: "+49 8702 123456",
        email: "info@stack-forge.eu",
      },
      electronicAddress: "info@stack-forge.eu",
      legalOrganization: {
        id: "HRB 12345",
        tradingName: "StackForge",
      },
    },
    buyer: {
      name: "Kite-Engineer by Stefan Merthan",
      address: {
        line1: "Hauptstraße 6",
        city: "Weihmichl",
        postalCode: "84107",
        country: "DE",
      },
      taxRegistrations: [{ id: "DE987654321", schemeId: "VA" }],
    },
    lines: [
      {
        id: "1",
        name: "Premium Service",
        description: "Full-day consulting engagement",
        quantity: 3,
        unitCode: UnitCode.DAY,
        unitPrice: 800,
        grossUnitPrice: 900,
        vatCategoryCode: VatCategoryCode.STANDARD_RATE,
        vatRatePercent: 19,
        originCountry: "DE",
      },
      {
        id: "2",
        name: "Software Module",
        quantity: 1,
        unitCode: UnitCode.UNIT,
        unitPrice: 2500,
        vatCategoryCode: VatCategoryCode.STANDARD_RATE,
        vatRatePercent: 19,
      },
    ],
    totals: {
      lineTotal: 4900,
      taxBasisTotal: 4900,
      taxTotal: 931,
      grandTotal: 5831,
      duePayableAmount: 5831,
      currency: "EUR",
    },
    vatBreakdown: [
      {
        categoryCode: VatCategoryCode.STANDARD_RATE,
        ratePercent: 19,
        taxableAmount: 4900,
        taxAmount: 931,
      },
    ],
    payment: {
      meansCode: "58",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      paymentReference: "INV-TEST-EXT",
      dueDate: "2025-07-25",
    },
    delivery: {
      date: "2025-06-25",
      partyName: "Delivery Site Berlin",
      location: {
        line1: "Lieferstraße 42",
        city: "Berlin",
        postalCode: "10115",
        country: "DE",
      },
    },
    ...overrides,
  };
}

/**
 * Minimal valid XRechnung input with Leitweg-ID.
 */
export function createXRechnungInput(
  overrides?: Partial<FacturXInvoiceInput>,
): FacturXInvoiceInput {
  return {
    ...createEn16931Input(),
    document: {
      id: "XR-TEST-001",
      issueDate: "2025-06-25",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      buyerReference: "04011000-12345-67",
    },
    ...overrides,
  };
}
