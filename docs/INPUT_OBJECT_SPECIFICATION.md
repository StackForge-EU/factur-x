# Input Object Specification

> **Purpose:** Define the structured input object for Factur-X invoice generation.  
> **Audience:** Developers integrating this package.  
> **Reference:** EN 16931-1, Factur-X 1.08 technical specifications.

---

## 1. Overview

The package accepts a single typed input object (`FacturXInvoiceInput`) that describes an invoice. The same structure supports all profiles (MINIMUM through EXTENDED); fields not applicable to the chosen profile are silently ignored. Profile-specific validation ensures required fields are present.

All types are exported from the package entry point:

```typescript
import type {
  FacturXInvoiceInput,
  TradePartyInput,
  InvoiceLineInput /* ... */,
} from "@stackforge-eu/factur-x";
```

---

## 2. Root Input Object

```typescript
interface FacturXInvoiceInput {
  document: InvoiceDocumentInput;
  seller: TradePartyInput;
  buyer: TradePartyInput;
  lines?: InvoiceLineInput[];
  allowancesCharges?: AllowanceChargeInput[];
  payment?: PaymentInput;
  delivery?: DeliveryInput;
  totals: InvoiceTotalsInput;
  vatBreakdown?: VatBreakdownInput[];
  references?: DocumentReferenceInput[];
  billingPeriod?: BillingPeriodInput;
  payee?: TradePartyInput;
  sellerTaxRepresentative?: TradePartyInput;
}
```

---

## 3. Key Types

### InvoiceDocumentInput

| Field               | Type               | BT    | MINIMUM | BASIC WL | EN 16931 |
| ------------------- | ------------------ | ----- | :-----: | :------: | :------: |
| `id`                | `string`           | BT-1  |   ✅    |    ✅    |    ✅    |
| `issueDate`         | `string`           | BT-2  |   ✅    |    ✅    |    ✅    |
| `typeCode`          | `DocumentTypeCode` | BT-3  |   ✅    |    ✅    |    ✅    |
| `dueDate`           | `string?`          | BT-9  |         |    ✅    |    ✅    |
| `buyerReference`    | `string?`          | BT-10 |   ✅    |    ✅    |    ✅    |
| `notes`             | `NoteInput[]?`     | BG-1  |         |    ✅    |    ✅    |
| `businessProcessId` | `string?`          | BT-23 |         |          |    ✅    |
| `name`              | `string?`          | —     |         |          |   EXT    |
| `language`          | `string?`          | —     |         |          |   EXT    |

### TradePartyInput

| Field               | Type                      | BT       | MINIMUM | BASIC WL | EN 16931 |
| ------------------- | ------------------------- | -------- | :-----: | :------: | :------: |
| `name`              | `string`                  | BT-27/44 |   ✅    |    ✅    |    ✅    |
| `id`                | `string \| string[]?`     | BT-29/46 |         |    ✅    |    ✅    |
| `globalId`          | `string?`                 | BT-29-1  |         |    ✅    |    ✅    |
| `address`           | `AddressInput?`           | BG-5/8   |         |    ✅    |    ✅    |
| `contact`           | `ContactInput?`           | BG-6/9   |         |          |    ✅    |
| `electronicAddress` | `string?`                 | BT-34/49 |         |    ✅    |    ✅    |
| `taxRegistrations`  | `TaxRegistrationInput[]?` | BT-31/48 |   ✅    |    ✅    |    ✅    |
| `legalOrganization` | `LegalOrganizationInput?` | BT-30/47 |   ✅    |    ✅    |    ✅    |

### InvoiceLineInput

| Field                | Type      | BT     | BASIC | EN 16931 |
| -------------------- | --------- | ------ | :---: | :------: |
| `id`                 | `string`  | BT-126 |  ✅   |    ✅    |
| `name`               | `string`  | BT-153 |  ✅   |    ✅    |
| `quantity`           | `number`  | BT-129 |  ✅   |    ✅    |
| `unitCode`           | `string?` | BT-130 |  ✅   |    ✅    |
| `unitPrice`          | `number`  | BT-146 |  ✅   |    ✅    |
| `grossUnitPrice`     | `number?` | BT-148 |       |    ✅    |
| `lineTotal`          | `number?` | BT-131 |  ✅   |    ✅    |
| `vatCategoryCode`    | `string?` | BT-151 |       |    ✅    |
| `vatRatePercent`     | `number?` | BT-152 |       |    ✅    |
| `description`        | `string?` | BT-154 |       |    ✅    |
| `standardIdentifier` | `string?` | BT-157 |       |    ✅    |
| `sellerAssignedId`   | `string?` | BT-155 |       |    ✅    |
| `buyerAssignedId`    | `string?` | BT-156 |       |    ✅    |

### InvoiceTotalsInput

| Field              | Type      | BT     | MINIMUM | BASIC WL |
| ------------------ | --------- | ------ | :-----: | :------: |
| `lineTotal`        | `number`  | BT-106 |         |    ✅    |
| `taxBasisTotal`    | `number`  | BT-109 |   ✅    |    ✅    |
| `taxTotal`         | `number`  | BT-110 |         |    ✅    |
| `grandTotal`       | `number`  | BT-112 |   ✅    |    ✅    |
| `duePayableAmount` | `number`  | BT-115 |   ✅    |    ✅    |
| `currency`         | `string`  | BT-5   |   ✅    |    ✅    |
| `allowanceTotal`   | `number?` | BT-107 |         |    ✅    |
| `chargeTotal`      | `number?` | BT-108 |         |    ✅    |
| `prepaidAmount`    | `number?` | BT-113 |         |    ✅    |
| `taxCurrency`      | `string?` | BT-6   |         |    ✅    |

### VatBreakdownInput

| Field                 | Type      | BT     | BASIC WL+ |
| --------------------- | --------- | ------ | :-------: |
| `categoryCode`        | `string`  | BT-118 |    ✅     |
| `ratePercent`         | `number`  | BT-119 |    ✅     |
| `taxableAmount`       | `number`  | BT-116 |    ✅     |
| `taxAmount`           | `number`  | BT-117 |    ✅     |
| `exemptionReason`     | `string?` | BT-120 |           |
| `exemptionReasonCode` | `string?` | BT-121 |           |

---

## 4. Document References

```typescript
interface DocumentReferenceInput {
  id: string;
  type?: "order" | "contract" | "despatch" | "preceding" | "seller-order" | "project";
  issueDate?: string;
}
```

Reference type mapping:

- `"order"` → `BuyerOrderReferencedDocument` (BT-13)
- `"contract"` → `ContractReferencedDocument` (BT-12)
- `"despatch"` → `DespatchAdviceReferencedDocument` (BT-16)
- `"preceding"` → `InvoiceReferencedDocument` (BT-25)
- `"seller-order"` → `SellerOrderReferencedDocument` (BT-14, EN16931+)
- `"project"` → `SpecifiedProcuringProject` (BT-11, EN16931+)

---

## 5. Complete Example (EN 16931 ZUGFeRD)

```typescript
import {
  embedFacturX,
  DocumentTypeCode,
  UnitCode,
  Profile,
  Flavor,
  type FacturXInvoiceInput,
} from "@stackforge-eu/factur-x";

const input: FacturXInvoiceInput = {
  document: {
    id: "INV-2025-001",
    issueDate: "2025-03-01",
    typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    buyerReference: "PO-2025-4711",
    notes: [{ content: "Payment within 30 days", subjectCode: "AAK" }],
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
    contact: { name: "Tobias Sittenauer", phone: "+49 8702 123456", email: "info@stack-forge.eu" },
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
      name: "Consulting Service",
      quantity: 10,
      unitCode: UnitCode.HOUR,
      unitPrice: 150,
      vatCategoryCode: "S",
      vatRatePercent: 19,
    },
    {
      id: "2",
      name: "Travel Expenses",
      quantity: 1,
      unitCode: UnitCode.UNIT,
      unitPrice: 250,
      vatCategoryCode: "S",
      vatRatePercent: 19,
    },
  ],
  totals: {
    lineTotal: 1750,
    taxBasisTotal: 1750,
    taxTotal: 332.5,
    grandTotal: 2082.5,
    duePayableAmount: 2082.5,
    currency: "EUR",
  },
  vatBreakdown: [{ categoryCode: "S", ratePercent: 19, taxableAmount: 1750, taxAmount: 332.5 }],
  payment: {
    meansCode: "58",
    iban: "DE89370400440532013000",
    bic: "COBADEFFXXX",
    dueDate: "2025-03-31",
    paymentReference: "INV-2025-001",
  },
  references: [{ id: "PO-2025-4711", type: "order" }],
};

const result = await embedFacturX({
  pdf: existingPdfBytes,
  input,
  profile: Profile.EN16931,
  flavor: Flavor.ZUGFERD,
});
```

---

_See `src/types/input.ts` for the complete TypeScript definitions with JSDoc._
