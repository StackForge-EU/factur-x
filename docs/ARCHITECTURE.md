# Architecture

> **Purpose:** Module layout and data flow for contributors.

---

## Module Layout

```
src/
├── core/           # XML generation, PDF embedding, extraction
│   ├── xml-builder.ts   # CII XML generation from input
│   ├── embed.ts         # PDF/A-3 embedding with XMP metadata
│   ├── extract.ts       # XML extraction from existing PDFs
│   └── xrechnung.ts     # XRechnung standalone XML output
├── flavors/        # Flavor configuration and registry
│   ├── constants.ts     # Profile URNs, type codes, schema paths
│   └── registry.ts      # Flavor configs, resolvers, validation
├── validation/     # Input and schema validation
│   ├── profile-validator.ts  # Profile-aware input validation
│   └── xsd-validator.ts      # XSD schema validation (libxml2-wasm)
├── types/
│   └── input.ts    # TypeScript input interfaces and enums
└── index.ts        # Public API entry point
```

---

## Data Flow

1. **Input:** `FacturXInvoiceInput` (typed object)
2. **Validation:** Profile-aware check of required fields
3. **XML Generation:** Build CII XML from input + profile + flavor
4. **XSD Validation:** Validate XML against profile XSD (optional)
5. **PDF Embedding:** Attach XML to PDF, set AF relationship, add PDF/A-3 XMP metadata
6. **Output:** PDF bytes or (for XRechnung) XML string

---

## Dependencies

- **pdf-lib:** PDF creation, attachment embedding, metadata
- **libxml2-wasm:** XSD schema validation (WebAssembly port of libxml2)

Schema files are bundled in `schema/` (one directory per profile) and loaded at runtime for XSD validation.
