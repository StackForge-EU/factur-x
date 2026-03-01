# Embed Structured Invoices into PDF

![Created by](https://s3.stack-forge.eu/media/badges/createdby.svg)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/node/v/@stackforge-eu/factur-x?logo=node.js)](https://nodejs.org)
![Deno](https://img.shields.io/badge/deno-%3E%3D2.0.0-brightgreen?logo=deno)
![JSR Version](https://img.shields.io/jsr/v/@stackforge-eu/factur-x?logo=jsr)
[![npm version](https://img.shields.io/npm/v/@stackforge-eu/factur-x?logo=npm&color=cb3837)](https://www.npmjs.com/package/@stackforge-eu/factur-x)

**Generate and embed Factur-X, ZUGFeRD, and XRechnung compliant CII XML into PDF/A-3 invoices.**

This TypeScript/Node.js package takes a simple, typed invoice input object and:

1. Validates it against profile requirements
2. Generates UN/CEFACT CII XML (Factur-X 1.08 / ZUGFeRD 2.4)
3. Validates the XML against official XSD schemas (via WASM)
4. Embeds it into a PDF with PDF/A-3b metadata
5. Or outputs standalone XRechnung XML for German B2G use
6. Extracts existing XML from Factur-X/ZUGFeRD PDFs

---

## Features

| Feature                                                | Status |
| ------------------------------------------------------ | ------ |
| Profiles: MINIMUM, BASIC WL, BASIC, EN 16931, EXTENDED | ✅     |
| Flavors: Factur-X, ZUGFeRD, XRechnung, Chrono Pro      | ✅     |
| Profile-aware input validation                         | ✅     |
| CII XML generation from typed input                    | ✅     |
| XSD schema validation (libxml2-wasm)                   | ✅     |
| PDF/A-3b embedding with XMP metadata                   | ✅     |
| Standalone XRechnung CII XML output                    | ✅     |
| Extract XML from existing Factur-X/ZUGFeRD PDF         | ✅     |

---

## Installation

### Node.js

```bash
npm install @stackforge-eu/factur-x
```

### Deno

```typescript
import { embedFacturX, Profile } from "jsr:@stackforge-eu/factur-x";
```

---

## Profiles

| Profile      | Line Items | VAT Breakdown | Payment | Use Case               |
| ------------ | :--------: | :-----------: | :-----: | ---------------------- |
| **MINIMUM**  |     —      |       —       |    —    | Minimal OCR-level data |
| **BASIC WL** |     —      |      ✅       |   ✅    | Document-level B2B     |
| **BASIC**    |     ✅     |      ✅       |   ✅    | Standard commercial    |
| **EN 16931** |     ✅     |      ✅       |   ✅    | Full EU standard       |
| **EXTENDED** |     ✅     |      ✅       |   ✅    | Complex scenarios      |

---

## Flavors

| Flavor              | Region      | Output   | Notes                         |
| ------------------- | ----------- | -------- | ----------------------------- |
| `Flavor.FACTUR_X`   | France / EU | PDF/A-3  | Default, Factur-X 1.08        |
| `Flavor.ZUGFERD`    | Germany     | PDF/A-3  | ZUGFeRD 2.4 (= Factur-X 1.08) |
| `Flavor.XRECHNUNG`  | Germany B2G | XML only | PEPPOL business process       |
| `Flavor.CHRONO_PRO` | Belgium     | PDF/A-3  | Chrono Pro conventions        |

---

## Quick Start

### Embed Factur-X into an existing PDF

```typescript
import { embedFacturX, DocumentTypeCode, UnitCode, VatCategoryCode, Profile, Flavor } from "@stackforge-eu/factur-x";
import { readFile, writeFile } from "fs/promises";

const pdfBuffer = await readFile("invoice.pdf");

const result = await embedFacturX({
  pdf: pdfBuffer,
  input: {
    document: {
      id: "INV-2025-001",
      issueDate: "2025-03-01",
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    },
    seller: {
      name: "StackForge UG (haftungsbeschränkt)",
      address: { line1: "Bergstraße 4", city: "Weihmichl", postalCode: "84107", country: "DE" },
      taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
    },
    buyer: {
      name: "Kite-Engineer by Stefan Merthan",
      address: { line1: "Hauptstraße 6", city: "Weihmichl", postalCode: "84107", country: "DE" },
    },
    lines: [
      {
        id: "1",
        name: "Consulting Service",
        quantity: 10,
        unitCode: UnitCode.HOUR,
        unitPrice: 150,
        vatCategoryCode: VatCategoryCode.STANDARD_RATE,
        vatRatePercent: 19,
      },
    ],
    totals: {
      lineTotal: 1500,
      taxBasisTotal: 1500,
      taxTotal: 285,
      grandTotal: 1785,
      duePayableAmount: 1785,
      currency: "EUR",
    },
    vatBreakdown: [{ categoryCode: VatCategoryCode.STANDARD_RATE, ratePercent: 19, taxableAmount: 1500, taxAmount: 285 }],
    payment: {
      meansCode: "58",
      iban: "DE89370400440532013000",
      dueDate: "2025-03-31",
    },
  },
  profile: Profile.EN16931,
  flavor: Flavor.ZUGFERD,
});

await writeFile("invoice-zugferd.pdf", result.pdf);
```

### Generate XRechnung XML (no PDF)

```typescript
import { toXRechnung, VatCategoryCode } from "@stackforge-eu/factur-x";

const { xml } = toXRechnung({
  document: {
    id: "INV-2025-001",
    issueDate: "2025-03-01",
    buyerReference: "04011000-12345-67", // Leitweg-ID
  },
  seller: {
    name: "StackForge UG (haftungsbeschränkt)",
    address: { line1: "Bergstraße 4", city: "Weihmichl", postalCode: "84107", country: "DE" },
    taxRegistrations: [{ id: "DE123456789" }],
  },
  buyer: {
    name: "Kite-Engineer by Stefan Merthan",
    address: { line1: "Hauptstraße 6", city: "Weihmichl", postalCode: "84107", country: "DE" },
  },
  lines: [
    {
      id: "1",
      name: "Service",
      quantity: 1,
      unitPrice: 1000,
      vatCategoryCode: VatCategoryCode.STANDARD_RATE,
      vatRatePercent: 19,
    },
  ],
  totals: {
    lineTotal: 1000,
    taxBasisTotal: 1000,
    taxTotal: 190,
    grandTotal: 1190,
    duePayableAmount: 1190,
    currency: "EUR",
  },
  vatBreakdown: [{ categoryCode: VatCategoryCode.STANDARD_RATE, ratePercent: 19, taxableAmount: 1000, taxAmount: 190 }],
});

// Upload `xml` to ZRE / OZG-RE / PEPPOL
```

### Extract XML from an existing PDF

```typescript
import { extractXml } from "@stackforge-eu/factur-x";
import { readFile } from "fs/promises";

const pdf = await readFile("invoice-with-xml.pdf");
const { xml, filename, profile } = await extractXml(pdf);

console.log(`Found ${filename} (profile: ${profile})`);
console.log(xml);
```

### Validate Against XSD Schema

```typescript
import { validateXsd, buildXml, Profile } from "@stackforge-eu/factur-x";

const xml = buildXml(invoiceData, Profile.EN16931);
const result = await validateXsd(xml, Profile.EN16931);

if (!result.valid) {
  console.error("XSD errors:", result.errors);
}
```

### Validate Input Without Embedding

```typescript
import { validateInput, Profile } from "@stackforge-eu/factur-x";

const result = validateInput(invoiceData, Profile.EN16931);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}
```

### Build XML Only

```typescript
import { buildXml, Profile, Flavor } from "@stackforge-eu/factur-x";

const xml = buildXml(invoiceData, Profile.BASIC_WL, Flavor.FACTUR_X);
```

---

## API Reference

### `embedFacturX(options): Promise<EmbedResult>`

Embeds Factur-X XML into a PDF with PDF/A-3b metadata. Optionally runs XSD validation with `validateXsd: true`.

### `extractXml(pdf, options?): Promise<ExtractResult>`

Extracts embedded Factur-X / ZUGFeRD XML from an existing PDF. Returns the XML string, filename, and detected profile.

### `toXRechnung(input, options?): XRechnungResult`

Generates standalone XRechnung CII XML.

### `buildXml(input, profile, flavor?): string`

Builds CII XML from input without embedding.

### `validateInput(input, profile): ValidationResult`

Validates input against profile requirements.

### `validateXsd(xml, profile, options?): Promise<XsdValidationResult>`

Validates XML against the official Factur-X XSD schema using libxml2-wasm.

### `getFlavorConfig(flavor): FlavorConfig`

Returns configuration for a flavor.

See the [full type definitions](docs/INPUT_OBJECT_SPECIFICATION.md) for all interfaces.

---

## Development

```bash
npm ci                # Install dependencies
npm run validate      # Type-check with tsc
npm run lint          # Lint with ESLint
npm run test -- --run # Run vitest suite
npm run test:deno     # Run Deno compatibility tests (requires Deno >= 2.0)
npm run build         # Build with tsup (CJS + ESM)
```

---

## License

**EUPL-1.2** — European Union Public Licence, version 1.2

© 2026 - StackForge UG (haftungsbeschränkt)

See [LICENSE](LICENSE) for details.

---

## References

- [Factur-X](https://fnfe-mpe.org/factur-x/) — Official specification
- [ZUGFeRD](https://www.ferd-net.de/standards/zugferd/) — German standard
- [EN 16931](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108926/Compliance+with+eInvoicing+standard) — European semantic standard
- [XRechnung](https://xeinkauf.de/xrechnung/) — German B2G format
