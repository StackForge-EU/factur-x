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

/**
 * Profile URNs (GuidelineSpecifiedDocumentContextParameter / BT-24).
 *
 * BASIC, EN16931, and EXTENDED use the EN 16931 conformance prefix because
 * those profiles are CIUS / extension claims against the European norm. The
 * exact strings are the only values accepted by the schematron shipped under
 * `schema/{basic,en16931,extended}/` (the codedb cl id="1" enumeration).
 */
export const PROFILE_URNS: Record<Profile, string> = {
  MINIMUM: "urn:factur-x.eu:1p0:minimum",
  BASIC_WL: "urn:factur-x.eu:1p0:basicwl",
  BASIC: "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic",
  EN16931: "urn:cen.eu:en16931:2017",
  EXTENDED: "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended",
};

/**
 * XRechnung CIUS URN (BR-DE-21). Used as the profile URN when emitting
 * XRechnung instead of pure Factur-X / ZUGFeRD.
 */
export const XRECHNUNG_PROFILE_URN =
  "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";

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
