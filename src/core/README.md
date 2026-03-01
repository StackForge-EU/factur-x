# Core Module

Core logic for Factur-X embedding and XML generation.

## Responsibilities

- **XML generation:** Build UN/CEFACT CII XML from `FacturXInvoiceInput`
- **PDF embedding:** Attach XML as `/EmbeddedFiles` to PDF
- **PDF/A-3 upgrade:** Ensure output conforms to PDF/A-3

## Pipeline

1. Validate input against profile requirements
2. Generate XML via profile-specific builder
3. Validate XML against XSD
4. Load PDF, attach XML, set PDF/A-3 metadata
5. Return PDF buffer

## References

- [Factur-X specification](https://fnfe-mpe.org/factur-x/)
- [PDF/A-3](https://www.pdfa.org/pdfa-3/)
