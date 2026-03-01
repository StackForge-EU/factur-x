# Factur-X / ZUGFeRD Schema Files

> **Source:** Factur-X 1.08 / ZUGFeRD 2.4 official specifications  
> **Reorganized from:** ZF24_EN/Schema

---

## Directory Layout

| Directory   | Profile  | Main XSD                            | Use Case                        |
| ----------- | -------- | ----------------------------------- | ------------------------------- |
| `minimum/`  | MINIMUM  | `FACTUR-X_MINIMUM.xsd`              | OCR-level, minimal data         |
| `basic-wl/` | BASIC WL | `FACTUR-X_BASIC-WL.xsd`             | Document-level, no line items   |
| `basic/`    | BASIC    | `FACTUR-X_BASIC.xsd`                | With line items                 |
| `en16931/`  | EN 16931 | `FACTUR-X_EN16931.xsd`              | Full European semantic standard |
| `extended/` | EXTENDED | `FACTUR-X_EXTENDED.xsd`             | EN 16931 + extended data        |
| `cii-d22b/` | Base     | `CrossIndustryInvoice_100pD22B.xsd` | UN/CEFACT CII D22B (shared)     |

---

## Validation

The package validates generated XML **against the profile-specific XSD** before embedding. Each profile folder contains a self-contained schema (no cross-folder imports for profile validation).

---

## Version

- **Factur-X:** 1.08
- **ZUGFeRD:** 2.4
- **CII:** D22B
- **Effective:** 2026-01-15

---

## References

- [Factur-X official](https://fnfe-mpe.org/factur-x/)
- [Documentation sources](../documentation/README.md) — links to official specification downloads
