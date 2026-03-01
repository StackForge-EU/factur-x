# Validation Module

Two levels of validation are available:

## 1. Profile Input Validation (`profile-validator.ts`)

Checks that a `FacturXInvoiceInput` contains all required fields for the chosen profile (MINIMUM → EXTENDED). Requirements are cumulative: each profile includes all requirements from lower profiles.

```ts
import { validateInput, Profile } from "@stackforge-eu/factur-x";

const result = validateInput(invoiceData, Profile.EN16931);
if (!result.valid) {
  console.error(result.errors);
}
```

## 2. XSD Schema Validation (`xsd-validator.ts`)

Validates generated CII XML against the official Factur-X XSD schemas using [libxml2-wasm](https://github.com/jameslan/libxml2-wasm) — a WebAssembly port of libxml2 with full XSD support.

- No native binaries required (pure WASM)
- Handles XSD imports between schema files via `XmlBufferInputProvider`
- Async API (dynamic import for CJS compatibility)

```ts
import { validateXsd, buildXml, Profile } from "@stackforge-eu/factur-x";

const xml = buildXml(invoiceData, Profile.EN16931);
const result = await validateXsd(xml, Profile.EN16931);
if (!result.valid) {
  console.error(result.errors);
}
```

XSD validation can also be enabled during embedding:

```ts
import { embedFacturX, Profile } from "@stackforge-eu/factur-x";

const result = await embedFacturX({
  pdf: pdfBytes,
  input: invoiceData,
  profile: Profile.EN16931,
  validateXsd: true,
});
```
