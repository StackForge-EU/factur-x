/**
 * XRechnung Generation
 *
 * Generates standalone CII XML for German B2G (XRechnung) use.
 * XRechnung is a pure-XML format (no PDF embedding) that conforms
 * to EN 16931 with additional PEPPOL/German government requirements.
 *
 * @module core/xrechnung
 * @license EUPL-1.2
 */

import type { FacturXInvoiceInput } from "../types/input";
import { Profile, Flavor } from "../flavors/constants";
import { buildXml } from "./xml-builder";
import { validateInput, type ValidationResult } from "../validation/profile-validator";
import { resolveBusinessProcessUrn, validateFlavorProfile } from "../flavors/registry";

/**
 * Options for XRechnung generation.
 */
export interface XRechnungOptions {
  /**
   * Profile level (default: {@link Profile.EN16931}).
   * XRechnung only supports EN16931.
   */
  profile?: Profile;

  /**
   * Validate input before generating XML (default: `true`).
   */
  validate?: boolean;
}

/**
 * Result of XRechnung generation.
 */
export interface XRechnungResult {
  /** The generated CII XML string */
  xml: string;

  /** Validation result (if validation was performed) */
  validation?: ValidationResult;
}

/**
 * Generates XRechnung-compliant CII XML from structured invoice input.
 *
 * XRechnung is a German B2G invoice format. It is a pure-XML format
 * (no PDF embedding) that uses the EN 16931 profile with a PEPPOL
 * business process identifier.
 *
 * The output can be uploaded directly to German government portals
 * (e.g. via PEPPOL or ZRE/OZG-RE).
 *
 * @param input   - Structured invoice data
 * @param options - Generation options (profile, validation)
 * @returns The XRechnung CII XML and optional validation result
 *
 * @throws Error if input validation fails (when `validate` is `true`)
 * @throws Error if the profile is not supported for XRechnung
 *
 * @example
 * ```ts
 * const result = toXRechnung({
 *   document: { id: 'INV-001', issueDate: '2025-03-01', buyerReference: '04011000-12345-67' },
 *   seller: { name: 'StackForge UG (haftungsbeschränkt)', address: { line1: 'Bergstraße 4', city: 'Weihmichl', postalCode: '84107', country: 'DE' } },
 *   buyer: { name: 'Kite-Engineer by Stefan Merthan', address: { line1: 'Hauptstraße 6', city: 'Weihmichl', postalCode: '84107', country: 'DE' } },
 *   lines: [{ id: '1', name: 'Service', quantity: 1, unitPrice: 100, vatCategoryCode: 'S', vatRatePercent: 19 }],
 *   totals: { lineTotal: 100, taxBasisTotal: 100, taxTotal: 19, grandTotal: 119, duePayableAmount: 119, currency: 'EUR' },
 *   vatBreakdown: [{ categoryCode: 'S', ratePercent: 19, taxableAmount: 100, taxAmount: 19 }],
 * });
 * console.log(result.xml);
 * ```
 */
export function toXRechnung(
  input: FacturXInvoiceInput,
  options?: XRechnungOptions,
): XRechnungResult {
  const profile = options?.profile ?? Profile.EN16931;
  const validate = options?.validate ?? true;

  validateFlavorProfile(Flavor.XRECHNUNG, profile);

  let validation: ValidationResult | undefined;
  if (validate) {
    validation = validateInput(input, profile);
    if (!validation.valid) {
      throw new Error(
        `Input validation failed for XRechnung (profile "${profile}"):\n` +
          validation.errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n"),
      );
    }
  }

  const enrichedInput: FacturXInvoiceInput = {
    ...input,
    document: {
      ...input.document,
      businessProcessId: resolveBusinessProcessUrn(input, Flavor.XRECHNUNG),
    },
  };

  const xml = buildXml(enrichedInput, profile, Flavor.XRECHNUNG);

  return {
    xml,
    ...(validation ? { validation } : {}),
  };
}
