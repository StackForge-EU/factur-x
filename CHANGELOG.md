# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
[1.0.2]: https://github.com/StackForge-EU/factur-x/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/StackForge-EU/factur-x/compare/v1.0.0...v1.0.1
