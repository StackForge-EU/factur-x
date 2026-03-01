/**
 * Flavor configuration registry.
 *
 * Provides flavor-specific settings (profiles, type codes, filenames, etc.)
 * and validation/resolution utilities for invoice generation.
 *
 * @module flavors/registry
 */

import { Profile, Flavor } from "./constants";
import { DocumentTypeCode } from "../types/input";
import type { FacturXInvoiceInput } from "../types/input";

/** Configuration for a specific flavor */
export interface FlavorConfig {
  /** Display name */
  name: string;
  /** Supported profiles for this flavor */
  supportedProfiles: Profile[];
  /** Default document type code */
  defaultTypeCode: DocumentTypeCode;
  /** Business process URN (optional, e.g. PEPPOL for XRechnung) */
  businessProcessUrn?: string;
  /** XML attachment filename in the PDF */
  attachmentFilename: string;
  /** Whether this flavor embeds into PDF (false for xrechnung = XML only) */
  embedInPdf: boolean;
  /** Additional constraints or requirements description */
  description: string;
}

const ALL_PROFILES: Profile[] = [
  Profile.MINIMUM,
  Profile.BASIC_WL,
  Profile.BASIC,
  Profile.EN16931,
  Profile.EXTENDED,
];

const CHRONO_PRO_PROFILES: Profile[] = [
  Profile.MINIMUM,
  Profile.BASIC_WL,
  Profile.BASIC,
  Profile.EN16931,
];

/** Flavor configuration registry */
export const FLAVOR_CONFIGS: Record<Flavor, FlavorConfig> = {
  [Flavor.FACTUR_X]: {
    name: "Factur-X",
    supportedProfiles: ALL_PROFILES,
    defaultTypeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    attachmentFilename: "factur-x.xml",
    embedInPdf: true,
    description: "French/German hybrid invoice format based on EN 16931.",
  },
  [Flavor.ZUGFERD]: {
    name: "ZUGFeRD",
    supportedProfiles: ALL_PROFILES,
    defaultTypeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    attachmentFilename: "factur-x.xml",
    embedInPdf: true,
    description: "German electronic invoice format. ZUGFeRD 2.4 uses factur-x.xml.",
  },
  [Flavor.XRECHNUNG]: {
    name: "XRechnung",
    supportedProfiles: [Profile.EN16931],
    defaultTypeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    businessProcessUrn: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
    attachmentFilename: "xrechnung.xml",
    embedInPdf: false,
    description: "German government invoice format. XML only, no PDF embedding.",
  },
  [Flavor.CHRONO_PRO]: {
    name: "Chrono Pro",
    supportedProfiles: CHRONO_PRO_PROFILES,
    defaultTypeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
    attachmentFilename: "factur-x.xml",
    embedInPdf: true,
    description: "Belgian e-invoicing solution using Factur-X subset.",
  },
};

/**
 * Returns the configuration for a given flavor.
 * @param flavor - The flavor to look up
 * @returns The flavor configuration
 */
export function getFlavorConfig(flavor: Flavor): FlavorConfig {
  return FLAVOR_CONFIGS[flavor];
}

/**
 * Validates that the given profile is supported for the flavor.
 * @param flavor - The flavor to validate against
 * @param profile - The profile to validate
 * @throws Error if the profile is not supported for the flavor
 */
export function validateFlavorProfile(flavor: Flavor, profile: Profile): void {
  const config = FLAVOR_CONFIGS[flavor];
  if (!config.supportedProfiles.includes(profile)) {
    throw new Error(
      `Profile "${profile}" is not supported for flavor "${flavor}". Supported: ${config.supportedProfiles.join(", ")}.`,
    );
  }
}

/**
 * Resolves the document type code from input or flavor default.
 * @param input - The invoice input
 * @param flavor - The target flavor
 * @returns The resolved type code (input's typeCode or flavor default)
 */
export function resolveTypeCode(input: FacturXInvoiceInput, flavor: Flavor): string {
  const inputTypeCode = input.document?.typeCode;
  if (inputTypeCode) {
    return inputTypeCode;
  }
  return FLAVOR_CONFIGS[flavor].defaultTypeCode;
}

/**
 * Resolves the business process URN from input or flavor default.
 * @param input - The invoice input
 * @param flavor - The target flavor
 * @returns The business process URN if set on input or flavor, otherwise undefined
 */
export function resolveBusinessProcessUrn(
  input: FacturXInvoiceInput,
  flavor: Flavor,
): string | undefined {
  const inputBusinessProcessId = input.document?.businessProcessId;
  if (inputBusinessProcessId) {
    return inputBusinessProcessId;
  }
  return FLAVOR_CONFIGS[flavor].businessProcessUrn;
}
