# Factur-X / ZUGFeRD Schema Files

> **Source:** Factur-X 1.09 / ZUGFeRD 2.5 official specifications (2026-06-10)  
> **Reorganized from:** the official `XSD_SCHEMATRON` distribution (filenames normalized; internal `schemaLocation` references rewritten to match)

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

- **Factur-X:** 1.09
- **ZUGFeRD:** 2.5
- **CII:** D22B
- **Effective:** 2026-05-15 (code lists & validation rules)

> Factur-X 1.09 keeps the same CII **D22B** syntax, namespaces, and profile URNs
> (`urn:factur-x.eu:1p0:*`) as 1.08, so it is fully backward compatible — XML that
> validates against 1.08 also validates against 1.09. For the MINIMUM, BASIC WL,
> BASIC, and EN 16931 profiles the XSDs are content-identical to 1.08; the EXTENDED
> XSD adds only **optional** elements (debited account name, financial adjustment /
> charges-on-behalf-of-a-third-party, an optional `listID` attribute).
>
> The `.sch` (Schematron) and `_codedb.xml` files carry the updated 1.09 code lists
> and CEN validation rules. They are kept here as reference only — this package
> performs **XSD validation**, not Schematron validation, and ships only `*.xsd`.
> The per-profile `Factur-X_1.08_*.xlsx` workbooks are legacy human-reference
> extracts and are not used at runtime.

---

## References

- [Factur-X official](https://fnfe-mpe.org/factur-x/)
- [Documentation sources](../documentation/README.md) — links to official specification downloads
