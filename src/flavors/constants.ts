/**
 * Flavor and Profile Constants
 *
 * Defines URNs, default document type codes, and standard sets
 * for different country/system implementations.
 *
 * @module flavors/constants
 */

/** Factur-X / ZUGFeRD profile levels */
export enum Profile {
  MINIMUM = "MINIMUM",
  BASIC_WL = "BASIC_WL",
  BASIC = "BASIC",
  EN16931 = "EN16931",
  EXTENDED = "EXTENDED",
}

/** Country/system flavor */
export enum Flavor {
  FACTUR_X = "factur-x",
  ZUGFERD = "zugferd",
  XRECHNUNG = "xrechnung",
  CHRONO_PRO = "chrono-pro",
}

/** Profile URNs (GuidelineSpecifiedDocumentContextParameter) */
export const PROFILE_URNS: Record<Profile, string> = {
  MINIMUM: "urn:factur-x.eu:1p0:minimum",
  BASIC_WL: "urn:factur-x.eu:1p0:basicwl",
  BASIC: "urn:factur-x.eu:1p0:basic",
  EN16931: "urn:factur-x.eu:1p0:en16931",
  EXTENDED: "urn:factur-x.eu:1p0:extended",
};

import { DocumentTypeCode } from "../types/input";

/**
 * Default document type code per flavor.
 * All flavors default to {@link DocumentTypeCode.COMMERCIAL_INVOICE} (`380`).
 */
export const FLAVOR_DEFAULT_TYPE_CODES: Record<Flavor, DocumentTypeCode> = {
  [Flavor.FACTUR_X]: DocumentTypeCode.COMMERCIAL_INVOICE,
  [Flavor.ZUGFERD]: DocumentTypeCode.COMMERCIAL_INVOICE,
  [Flavor.XRECHNUNG]: DocumentTypeCode.COMMERCIAL_INVOICE,
  [Flavor.CHRONO_PRO]: DocumentTypeCode.COMMERCIAL_INVOICE,
};

/**
 * Schema directory names per profile (relative to schema/)
 */
export const PROFILE_SCHEMA_DIRS: Record<Profile, string> = {
  MINIMUM: "minimum",
  BASIC_WL: "basic-wl",
  BASIC: "basic",
  EN16931: "en16931",
  EXTENDED: "extended",
};

/**
 * Main XSD filename per profile
 */
export const PROFILE_MAIN_XSD: Record<Profile, string> = {
  MINIMUM: "FACTUR-X_MINIMUM.xsd",
  BASIC_WL: "FACTUR-X_BASIC-WL.xsd",
  BASIC: "FACTUR-X_BASIC.xsd",
  EN16931: "FACTUR-X_EN16931.xsd",
  EXTENDED: "FACTUR-X_EXTENDED.xsd",
};
