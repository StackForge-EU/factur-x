# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
