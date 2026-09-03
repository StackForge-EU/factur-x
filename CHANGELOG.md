# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.4.0] — 2026-09-03

- **Added the item price discount (BT-147).** A new optional `priceDiscount`
  field on `InvoiceLineInput` emits `ram:AppliedTradeAllowanceCharge` inside
  the gross price element, so a line can state the discount that connects the
  gross unit price (BT-148) to the net unit price (BT-146) instead of leaving
  it implied by their difference. Requires `grossUnitPrice` to be set; the
  amount keeps up to four decimals for sub-cent discounts. Omitting the field
  keeps the output byte-for-byte identical (#15).

## [1.3.1] — 2026-09-01

- **Dropped the unused `schema/cii-d22b/` code-list XSDs from the npm and JSR
  packages** (~100 files, ~800 KB). Nothing references them at runtime — the
  per-profile schema directories are self-contained. One of these files also
  has a path longer than 100 characters, which a JSR server-side tar
  regression truncated, breaking the 1.3.0 JSR publish.
- The release workflow now dry-runs `npm pack` and `deno publish` before
  tagging, and publishes to npm only after JSR has succeeded — npm versions
  are effectively immutable, so the unretractable registry ships last.

## [1.3.0] — 2026-09-01

- **Added item price base quantity (BT-149/BT-150).** New optional
  `basisQuantity` and `basisQuantityUnitCode` fields on `InvoiceLineInput`
  emit `ram:BasisQuantity` inside the net (and, when present, gross) price
  element, so a unit price can state the quantity it refers to — e.g.
  `12.50` per 10 m². The unit code defaults to the line's `unitCode`, as
  EN 16931 requires BT-150 to match BT-130. Omitting the field keeps the
  output byte-for-byte identical (#12).
- CI now requires every PR to add a `CHANGELOG.md` entry (or carry the
  `skip-changelog` label), so contributor fixes always reach the release notes.

## [1.2.1] — 2026-08-27

- **Fixed XSD validation on Windows.** Schema `<xsd:import>` resolution built a
  malformed `file://` URL from backslash paths and keyed the schema lookup by
  a percent-encoded href that libxml2 normalises differently. Now uses
  `pathToFileURL()` and matches imported schemas by filename. Windows added
  to the CI matrix (thanks @muratkorkmaztr-cmyk, #6).
- **Embedded `factur-x.xml` now uses the `application/xml` MIME type** instead
  of the deprecated `text/xml` (RFC 7303), which current Factur-X conformance
  checkers flag (thanks @muratkorkmaztr-cmyk, #7).
- Expanded npm `keywords` (e.g. `e-rechnung`, `pdfa`, `chorus-pro`, `un-cefact`,
  spelling variants) so the package is easier to find on npm (#8).

## [1.2.0] — 2026-07-11

- **Updated to Factur-X 1.09 / ZUGFeRD 2.5** (spec dated 2026-06-10). Factur-X
  1.09 keeps the same UN/CEFACT CII **D22B** syntax, namespaces, and profile URNs
  (`urn:factur-x.eu:1p0:*`) as 1.08, so this is a backward-compatible refresh:
  XML produced by previous versions remains valid, and no input/output changes
  are required.
  - Bundled XSD schemas under `schema/` swapped to the official 1.09 set
    (filenames normalized to the repo convention, internal `schemaLocation`
    references rewritten to match). For MINIMUM / BASIC WL / BASIC / EN 16931 the
    XSDs are content-identical to 1.08; the EXTENDED XSD gains only **optional**
    additions (debited-account name, financial adjustment / charges on behalf of
    a third party, an optional `listID` attribute on the allowance/charge reason
    code).
  - Reference `.sch` (Schematron) and `_codedb.xml` files updated to the 1.09
    code lists and CEN validation rules (effective 2026-05-15). These are not
    shipped in the npm package and not used at runtime — this library performs
    XSD validation only.
  - Documentation and code comments updated from "1.08 / 2.4" to "1.09 / 2.5".

- **New optional EXTENDED-profile input fields** for selected Factur-X 1.09
  business terms (all additive, only emitted at `Profile.EXTENDED`):
  - `PaymentInput.debtorAccountName` (BT-216) and `PaymentInput.debtorBic`
    (BT-215) — debited-account name and its payment service provider BIC.
  - `AllowanceChargeInput.exemptionReason` / `exemptionReasonCode`
    (BT-173–176) — VAT exemption reason/code on document-level allowances and
    charges.
  - `FacturXInvoiceInput.financialAdjustments` (BG-34, new
    `FinancialAdjustmentInput` with `reason` BT-180 + `amount` BT-179) —
    charges collected on behalf of a third party.
  - `InvoiceLineInput.manufacturer` (BG-X-94) — line-level product manufacturer
    party (`ram:ManufacturerTradeParty`).
  - Remaining 1.09 EXTENDED terms (e.g. document-level non-VAT tax codes,
    logistic-service-charge exemption reasons) are still not emitted and can be
    added later without breaking changes.

- **Fixed:** `ram:FormattedIssueDateTime` now emits a `qdt:DateTimeString` child
  instead of `udt:DateTimeString`. It is typed as `qdt:FormattedDateTimeType` in
  the CII XSD, so the previous `udt:` prefix failed XSD/Schematron validation for
  every credit note or cancellation invoice referencing a dated preceding
  invoice ([#5](https://github.com/StackForge-EU/factur-x/issues/5)).
- **Fixed:** XSD validation no longer exhausts libxml2's fixed-size input-callback
  table. `validateXsd` now clears the table on each call, so validating many
  documents in one process no longer causes spurious failures once ~15
  validations have run.

## [1.1.0] — 2026-05-27

- **BREAKING:** Every `ram:GlobalID` and the legal-organization `ram:ID` now
  carry the `@schemeID` attribute required by EN 16931. The XSD-canonical CII
  mapping makes the scheme mandatory on `ram:GlobalID` (BT-29-1 / BT-46-1 for
  parties, BT-157-1 for line items) and conditional on
  `ram:SpecifiedLegalOrganization/ram:ID` (BT-30-1 / BT-47-1); without these
  attributes Mustang / KoSIT / veraPDF's Factur-X profile reject the invoice
  even though the embedded CII looked superficially correct. Three input
  fields changed:
  - `TradePartyInput.globalId` is now `IdentifierWithSchemeInput`
    (`{ value: string; schemeID: string }`) instead of a bare `string`
  - `InvoiceLineInput.standardIdentifier` is now `IdentifierWithSchemeInput`
    instead of a bare `string` (sibling fix on top of #4 — the line-item
    `ram:GlobalID` had the same defect as the party one)
  - `LegalOrganizationInput.schemeID?: string` added (optional, mirrors the
    conditional spec rule)
    Migration: `globalId: "4000001000005"` →
    `globalId: { value: "4000001000005", schemeID: "0088" }` (and the analogous
    rewrite for `standardIdentifier`). The new `IdentifierWithSchemeInput` type
    is exported from `src/index.ts`. Regression test added in
    `tests/xsd-validator.test.ts` that drives all three schemed identifiers
    through the EN16931 XSD in one go (thanks @sco-indy, #4).

## [1.0.8] — 2026-05-27

- **PDF trailer was missing the `/ID` entry required by PDF/A-3.** ISO 19005-3
  (and PDF 1.7 §14.4) require the trailer dictionary to carry an `/ID` array of
  two byte strings: the first immutable identifier of the original document,
  the second updated on every modification. `pdf-lib` initializes
  `trailerInfo = {}` and never writes one on save, so veraPDF and the FNFE-MPE
  Factur-X profile rejected every PDF this library produced as non-conformant.
  Added `ensureIdTrailer` in `src/core/embed.ts` which runs after the first
  `pdfDoc.save()` when `addPdfA3Metadata` is on: it computes an MD5 over the
  serialized bytes (per PDF 1.7 §14.4 — uniqueness, not cryptographic strength,
  is what matters), preserves any pre-existing first identifier, and writes the
  pair before re-saving. Regression tests added in `tests/embed.test.ts`
  covering both the no-existing-trailer and existing-trailer paths (thanks
  @sco-indy, #3).

## [1.0.7] — 2026-05-27

- **`fx:ConformanceLevel` in the XMP metadata used the raw `Profile` enum
  identifier instead of the Factur-X / ZUGFeRD spec label.** The XMP packet
  emitted `EN16931` / `BASIC_WL` where the spec requires `EN 16931` /
  `BASIC WL`, so strict ZUGFeRD / Factur-X validators (Mustangproject, the
  FNFE-MPE check tool, veraPDF's Factur-X profile) rejected every PDF this
  library produced even though the embedded CII XML was correct. Added a
  `Profile` → XMP-label mapping and routed `buildXmpMetadata` through it in
  `src/core/embed.ts` (thanks @sco-indy, #2).
- **`flavor: Flavor.XRECHNUNG` still advertised `EN 16931` in the XMP packet.**
  Hybrid XRechnung PDFs carry the EN16931 profile internally but per ZUGFeRD
  2.x §2.4.4 must declare `XRECHNUNG` as the conformance level so the KoSIT /
  ZUGFeRD validators route them through the XRechnung schematron set rather
  than the vanilla Factur-X one. `resolveXmpConformanceLevel` in
  `src/core/embed.ts` now special-cases the XRechnung flavor; the existing
  `toXRechnung` → XML flow is unaffected. Regression test added in
  `tests/embed.test.ts` covering all five profiles and the XRechnung flavor.

## [1.0.6] — 2026-05-23

- **`SpecifiedTradeSettlementPaymentMeans` emitted its child elements in the
  wrong order.** The EN16931 / CII XSD `TradeSettlementPaymentMeansType`
  sequence requires `PayerPartyDebtorFinancialAccount` before
  `PayeePartyCreditorFinancialAccount` and
  `PayeeSpecifiedCreditorFinancialInstitution`, but the builder appended the
  debtor account last. Any invoice combining a SEPA direct debit
  (`payment.meansCode = "59"`) with `payment.debtorIban` plus a payee
  IBAN/BIC failed XSD validation with `Element 'PayerPartyDebtorFinancialAccount':
This element is not expected`. Reordered the three blocks in
  `src/core/xml-builder.ts`; regression test added in
  `tests/xml-builder.test.ts`.

## [1.0.5] — 2026-05-12

- **`ChargeIndicator`'s inner `Indicator` element was emitted in the wrong XML
  namespace.** The XSD requires `udt:Indicator` (UnqualifiedDataType:100) but
  the builder emitted `ram:Indicator` (ReusableAggregateBusinessInformationEntity:100).
  The XSD rejected every invoice carrying a `SpecifiedTradeAllowanceCharge`,
  and the BASIC schematron's `udt:Indicator='true'/'false'` predicates silently
  matched nothing — so every downstream sum over allowances/charges (BR-S-08,
  BR-CO-11, BR-CO-14) computed zero on the allowance/charge side and tripped.
  Affects every caller that uses `allowancesCharges`; previously masked because
  the test suite only exercised allowance presence, never XSD round-trip with
  one. Regression test added in `tests/xsd-validator.test.ts`.

## [1.0.4] — 2026-05-05

### Fixed

- Release workflow `publish-npm` job: bump `node-version` to `24.15.0` (current Node LTS) and roll back the npm upgrade step from `corepack prepare npm@latest --activate` to `npm install -g npm@latest`. The corepack route in v1.0.3 silently broke OIDC trusted publishing against the npm registry (sigstore provenance signing still worked, but the registry `PUT` went out unauthenticated and was rejected with a 404), so v1.0.2 and v1.0.3 never reached `registry.npmjs.org` — `dist-tags.latest` there is still `1.0.1`.

## [1.0.3] — 2026-05-05

### Fixed

- Release workflow: upgrade npm via `corepack prepare npm@latest --activate` instead of `npm install -g npm@latest`, which crashed on the GitHub-hosted Node 22.22.2 toolcache where the bundled npm was missing its own `promise-retry` transitive dependency
- `src/core/embed.ts`: import `console` from `node:console` so the new PDF/A-3 warnings type-check under the project's `lib: ["ES2022"]` tsconfig (no DOM lib)

## [1.0.2] — 2026-05-05

### Added

- `EmbedOptions.rgbIccProfile` and `EmbedOptions.outputIntentIdentifier`: inject a PDF/A-3 `/OutputIntents` entry referencing an sRGB ICC profile when the input PDF lacks one (ISO 19005-3 §6.2.4.3)
- `EmbedOptions.unembeddedFonts` (`"warn"` | `"throw"` | `"ignore"`, default `"warn"`): detect and report fonts whose `FontDescriptor` carries no `FontFile`/`FontFile2`/`FontFile3` stream, including Type 0 descendant fonts and the standard 14 base fonts (ISO 19005-3 §6.2.11.4.1)
- Exported `XRECHNUNG_PROFILE_URN` (`urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0`)
- `validateInput` now accepts an optional `flavor` argument; passing `Flavor.XRECHNUNG` enables BR-DE / PEPPOL-EN16931 rules on top of the profile checks
- Pre-XML business-rule validation: BR-27 (non-negative line unit price), BR-CO-10 / BR-CO-13 / BR-CO-14 / BR-CO-15 / BR-CO-17, BR-62 / FX-SCH-A-000158 (URIID schemeID), BR-FX-EN-04 (delivery date or billing period), and XRechnung-only BR-DE-2, BR-DE-15, BR-DE-19 (IBAN mod-97), PEPPOL-EN16931-R001 / R010 / R020

### Changed

- **BREAKING:** `TradePartyInput.electronicAddress` is now `{ value: string; schemeID: string }` instead of a bare `string`. Required by BR-62 / FX-SCH-A-000158 — the URIID element must carry an EAS `@schemeID` (e.g. `"EM"`, `"0088"`, `"9930"`)
- **BREAKING:** Profile URNs in `PROFILE_URNS` updated to the EN 16931 conformance form accepted by the shipped schematron — `BASIC` → `urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic`, `EN16931` → `urn:cen.eu:en16931:2017`, `EXTENDED` → `urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended` (`MINIMUM` and `BASIC_WL` unchanged)
- XRechnung output now writes the XRechnung CIUS URN as the GuidelineSpecifiedDocumentContextParameter (BR-DE-21) instead of the underlying EN 16931 URN
- Line-total fallback (`quantity × unitPrice`) is rounded to currency precision so values like `0.1 × 3` no longer drift to `0.30000000000000004`
- `detectProfile` in the extractor now tests longer/more-specific URNs before short forms so XRechnung CIUS and conformance URNs are recognised correctly

### Fixed

- Always emit `ram:ActualDeliverySupplyChainEvent` (defaulting to `document.issueDate`) for non-prepayment BASIC+ invoices so the schematron's two-conjunct delivery rule (BR-FX-EN-04 / PEPPOL-EN16931-R008) is satisfied even when only a billing period is supplied
- `toXRechnung` now validates the business-process-enriched input rather than the raw input, so the auto-injected `businessProcessId` no longer trips PEPPOL-EN16931-R001 in strict mode
- `URIUniversalCommunication/URIID` is now emitted with the required `@schemeID` attribute

## [1.0.1] — 2026-03-01

### Added

- CII XML generation from typed TypeScript input objects
- Support for all five Factur-X 1.08 / ZUGFeRD 2.4 profiles: MINIMUM, BASIC WL, BASIC, EN 16931, EXTENDED
- Four country/system flavors: Factur-X, ZUGFeRD, XRechnung, Chrono Pro
- Profile-aware input validation
- XSD schema validation via libxml2-wasm (WebAssembly)
- PDF/A-3b embedding with XMP metadata (pdf-lib)
- Standalone XRechnung CII XML generation with PEPPOL business process URN
- XML extraction from existing Factur-X / ZUGFeRD PDFs
- TypeScript enums: `DocumentTypeCode` (UNTDID 1001), `UnitCode` (UN/ECE Rec 20), `VatCategoryCode` (UNTDID 5305), `Profile`, `Flavor`
- Full JSDoc documentation with EN 16931 BT references
- Comprehensive test suite (232 tests)
- Input guards with descriptive errors (`buildXml`, `fmtAmt`, `formatDate`)
- XML control character stripping in `escapeXml`
- Profile-based AFRelationship (`Data` for MINIMUM/BASIC_WL, `Alternative` for BASIC+)
- Optional `afRelationship` override in `EmbedOptions`
- Deno >= 2.0 support with JSR publishing (`@stackforge-eu/factur-x`)
- Deno compatibility test suite

[Unreleased]: https://github.com/StackForge-EU/factur-x/commits/main
[1.4.0]: https://github.com/StackForge-EU/factur-x/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/StackForge-EU/factur-x/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/StackForge-EU/factur-x/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/StackForge-EU/factur-x/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/StackForge-EU/factur-x/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/StackForge-EU/factur-x/compare/v1.0.8...v1.1.0
[1.0.8]: https://github.com/StackForge-EU/factur-x/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/StackForge-EU/factur-x/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/StackForge-EU/factur-x/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/StackForge-EU/factur-x/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/StackForge-EU/factur-x/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/StackForge-EU/factur-x/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/StackForge-EU/factur-x/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/StackForge-EU/factur-x/compare/v1.0.0...v1.0.1
