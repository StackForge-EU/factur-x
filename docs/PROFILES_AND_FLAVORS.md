# Profiles and Flavors

> **Purpose:** Clarify profile levels and flavor variations for implementers.

---

## Profiles

Profiles define the **semantic depth** of the invoice XML. Higher profiles require more structured data. Requirements are cumulative — each profile includes all requirements of lower levels.

| Profile  | Line Items | VAT Breakdown | Payment Details | Use Case            |
| -------- | ---------- | ------------- | --------------- | ------------------- |
| MINIMUM  | No         | No            | No              | OCR-level, minimal  |
| BASIC WL | No         | Yes           | Yes             | Document-level B2B  |
| BASIC    | Yes        | Yes           | Yes             | Standard commercial |
| EN 16931 | Yes        | Yes           | Yes             | Full EU standard    |
| EXTENDED | Yes        | Yes           | Yes + extra     | Complex scenarios   |

---

## Flavors

Flavors adapt the output for **specific countries or platforms**:

- **factur-x:** France / EU default (Factur-X 1.08)
- **zugferd:** Germany (ZUGFeRD 2.4 = Factur-X 1.08)
- **xrechnung:** Germany B2G — pure XML, no PDF embedding
- **chrono-pro:** Belgium (Chrono Pro conventions)

---

## Document Type Codes (BT-3)

The invoice type code (`BT-3`) uses the UNTDID 1001 code list. **Not all codes are accepted by all platforms.** Use the `DocumentTypeCode` enum for type-safe values.

### Common Codes

| Code | Name                    | Factur-X | ZUGFeRD | XRechnung | Chorus Pro |
| ---- | ----------------------- | :------: | :-----: | :-------: | :--------: |
| 380  | Commercial invoice      |    ✅    |   ✅    |    ✅     |     ✅     |
| 381  | Credit note             |    ✅    |   ✅    |    ✅     |     ✅     |
| 384  | Corrected invoice       |    ✅    |   ✅    |    ✅     |     ✅     |
| 386  | Prepayment invoice      |    ✅    |   ✅    |     —     |     ✅     |
| 389  | Self-billed invoice     |    ✅    |   ✅    |    ✅     |     ❌     |
| 261  | Self-billed credit note |    ✅    |   ✅    |     —     |     ❌     |
| 751  | Accounting information  |    —     |   ✅    |    ❌     |     ❌     |

### XRechnung-Only Codes

| Code | Name                               |
| ---- | ---------------------------------- |
| 326  | Partial invoice                    |
| 875  | Partial construction invoice       |
| 876  | Partial final construction invoice |
| 877  | Final construction invoice         |

### Notes

- **751** is a Germany-specific code for "Buchungsinformation" (billing information for accounting). It is accepted in ZUGFeRD but **rejected** by Chorus Pro and **not valid** for XRechnung.
- **389** and **261** (self-billed) are **not accepted** by Chorus Pro (France).
- All flavors default to **380** (Commercial invoice) when `typeCode` is not explicitly set.
- When using **384** (Corrected invoice), a reference to the original invoice (`type: "preceding"`) is mandatory.

---

## AFRelationship (PDF Attachment)

The AF relationship of the embedded XML attachment varies by profile:

| Profile            | AFRelationship | Reason                                          |
| ------------------ | -------------- | ----------------------------------------------- |
| MINIMUM / BASIC WL | `Data`         | XML carries structured data only (not complete) |
| BASIC+             | `Alternative`  | XML is a full alternative representation        |

This is handled automatically by `embedFacturX` but can be overridden via the `afRelationship` option.
