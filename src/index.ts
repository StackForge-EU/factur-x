/**
 * Factur-X — Embed Structured Invoices into PDF
 *
 * Generate Factur-X, ZUGFeRD, and XRechnung compliant invoice XML
 * from a typed input object, validate it against XSD schemas, and
 * embed it into PDF/A-3 documents — or output standalone XRechnung XML.
 * Also extracts existing XML from Factur-X/ZUGFeRD PDFs.
 *
 * @packageDocumentation
 * @license EUPL-1.2
 *
 * @example
 * ```ts
 * import { embedFacturX, toXRechnung, extractXml } from '@stackforge-eu/factur-x';
 *
 * // Embed Factur-X XML into an existing PDF
 * const result = await embedFacturX({
 *   pdf: existingPdfBytes,
 *   input: invoiceData,
 *   profile: Profile.EN16931,
 *   flavor: Flavor.ZUGFERD,
 * });
 *
 * // Generate XRechnung XML (no PDF)
 * const { xml } = toXRechnung(invoiceData);
 *
 * // Extract XML from an existing PDF
 * const { xml: extracted, profile } = await extractXml(pdfBytes);
 * ```
 */

// ── Input types ──────────────────────────────────────────────────────────

export { DocumentTypeCode, UnitCode } from "./types/input";

export type {
  FacturXInvoiceInput,
  InvoiceDocumentInput,
  TradePartyInput,
  InvoiceLineInput,
  InvoiceTotalsInput,
  VatBreakdownInput,
  AddressInput,
  ContactInput,
  AllowanceChargeInput,
  PaymentInput,
  DeliveryInput,
  DocumentReferenceInput,
  NoteInput,
  TaxRegistrationInput,
  LegalOrganizationInput,
  BillingPeriodInput,
} from "./types/input";

// ── Profile & Flavor constants ───────────────────────────────────────────

export {
  Profile,
  Flavor,
  PROFILE_URNS,
  FLAVOR_DEFAULT_TYPE_CODES,
  PROFILE_SCHEMA_DIRS,
  PROFILE_MAIN_XSD,
} from "./flavors/constants";

// ── Flavor registry ──────────────────────────────────────────────────────

export type { FlavorConfig } from "./flavors/registry";

export {
  FLAVOR_CONFIGS,
  getFlavorConfig,
  validateFlavorProfile,
  resolveTypeCode,
  resolveBusinessProcessUrn,
} from "./flavors/registry";

// ── XML builder ──────────────────────────────────────────────────────────

export { buildXml, escapeXml } from "./core/xml-builder";

// ── Profile validation ──────────────────────────────────────────────────

export type { ValidationError, ValidationResult } from "./validation/profile-validator";

export { validateInput } from "./validation/profile-validator";

// ── XSD schema validation ───────────────────────────────────────────────

export type {
  XsdValidationError,
  XsdValidationResult,
  XsdValidateOptions,
} from "./validation/xsd-validator";

export { validateXsd } from "./validation/xsd-validator";

// ── PDF embedding ────────────────────────────────────────────────────────

export type { EmbedOptions, EmbedResult } from "./core/embed";

export { embedFacturX } from "./core/embed";

// ── XML extraction ──────────────────────────────────────────────────────

export type { ExtractResult, ExtractOptions } from "./core/extract";

export { extractXml } from "./core/extract";

// ── XRechnung ────────────────────────────────────────────────────────────

export type { XRechnungOptions, XRechnungResult } from "./core/xrechnung";

export { toXRechnung } from "./core/xrechnung";
