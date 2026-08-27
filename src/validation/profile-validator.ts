/**
 * Profile-based validation for Factur-X invoice input.
 *
 * Validates that a {@link FacturXInvoiceInput} contains all required fields
 * for a given profile level (MINIMUM → EXTENDED).
 *
 * @module validation/profile-validator
 */

import { Profile, Flavor } from "../flavors/constants";
import type { FacturXInvoiceInput } from "../types/input";

/** Profile order for cumulative requirement checks */
const PROFILE_LEVEL: Record<Profile, number> = {
  MINIMUM: 0,
  BASIC_WL: 1,
  BASIC: 2,
  EN16931: 3,
  EXTENDED: 4,
};

/**
 * Describes a single validation error (missing or invalid required field).
 */
export interface ValidationError {
  /** Dot-path to the field (e.g. `"seller.address.country"`) */
  field: string;
  /** Human-readable error message */
  message: string;
  /** The profile level that requires this field */
  profile: Profile;
}

/**
 * Result of validating input against a profile.
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;
  /** List of validation errors, empty when valid */
  errors: ValidationError[];
}

/**
 * Adds a validation error to the list.
 *
 * @param errors - Array to append to
 * @param field - Dot-path to the field
 * @param message - Human-readable error message
 * @param profile - Profile that requires this field
 */
function addError(
  errors: ValidationError[],
  field: string,
  message: string,
  profile: Profile,
): void {
  errors.push({ field, message, profile });
}

/**
 * Validates that the input contains all required fields for the given profile.
 * Requirements are cumulative: each profile includes all requirements of lower levels.
 *
 * @param input   - Invoice input to validate
 * @param profile - Target profile (MINIMUM, BASIC_WL, BASIC, EN16931, or EXTENDED)
 * @param flavor  - Optional flavor; when {@link Flavor.XRECHNUNG}, additional
 *                  BR-DE / PEPPOL-EN16931 rules are applied on top of the profile rules.
 * @returns Validation result with valid flag and any errors
 */
export function validateInput(
  input: FacturXInvoiceInput,
  profile: Profile,
  flavor?: Flavor,
): ValidationResult {
  const errors: ValidationError[] = [];
  const level = PROFILE_LEVEL[profile];

  const req = (minProfile: Profile) => level >= PROFILE_LEVEL[minProfile];

  if (!input.document) {
    addError(errors, "document", "Document is required", Profile.MINIMUM);
  } else {
    if (req(Profile.MINIMUM)) {
      if (!input.document.id) {
        addError(errors, "document.id", "Document ID is required", Profile.MINIMUM);
      }
      if (!input.document.issueDate) {
        addError(errors, "document.issueDate", "Document issue date is required", Profile.MINIMUM);
      }
    }
  }

  if (!input.seller) {
    addError(errors, "seller", "Seller is required", Profile.MINIMUM);
  } else {
    if (req(Profile.MINIMUM) && !input.seller.name) {
      addError(errors, "seller.name", "Seller name is required", Profile.MINIMUM);
    }
    if (req(Profile.BASIC_WL)) {
      if (!input.seller.address) {
        addError(
          errors,
          "seller.address",
          "Seller address is required for BASIC_WL",
          Profile.BASIC_WL,
        );
      } else if (!input.seller.address.country) {
        addError(
          errors,
          "seller.address.country",
          "Seller address country is required for BASIC_WL",
          Profile.BASIC_WL,
        );
      }
    }
  }

  if (!input.buyer) {
    addError(errors, "buyer", "Buyer is required", Profile.MINIMUM);
  } else {
    if (req(Profile.MINIMUM) && !input.buyer.name) {
      addError(errors, "buyer.name", "Buyer name is required", Profile.MINIMUM);
    }
    if (req(Profile.BASIC_WL)) {
      if (!input.buyer.address) {
        addError(
          errors,
          "buyer.address",
          "Buyer address is required for BASIC_WL",
          Profile.BASIC_WL,
        );
      } else if (!input.buyer.address.country) {
        addError(
          errors,
          "buyer.address.country",
          "Buyer address country is required for BASIC_WL",
          Profile.BASIC_WL,
        );
      }
    }
  }

  if (!input.totals) {
    addError(errors, "totals", "Totals are required", Profile.MINIMUM);
  } else {
    if (req(Profile.MINIMUM)) {
      if (input.totals.taxBasisTotal == null) {
        addError(errors, "totals.taxBasisTotal", "Tax basis total is required", Profile.MINIMUM);
      }
      if (input.totals.grandTotal == null) {
        addError(errors, "totals.grandTotal", "Grand total is required", Profile.MINIMUM);
      }
      if (input.totals.duePayableAmount == null) {
        addError(
          errors,
          "totals.duePayableAmount",
          "Due payable amount is required",
          Profile.MINIMUM,
        );
      }
      if (!input.totals.currency) {
        addError(errors, "totals.currency", "Currency is required", Profile.MINIMUM);
      }
    }
    if (req(Profile.BASIC_WL)) {
      if (input.totals.lineTotal == null) {
        addError(
          errors,
          "totals.lineTotal",
          "Line total is required for BASIC_WL",
          Profile.BASIC_WL,
        );
      }
      if (input.totals.taxTotal == null) {
        addError(errors, "totals.taxTotal", "Tax total is required for BASIC_WL", Profile.BASIC_WL);
      }
    }
  }

  if (req(Profile.BASIC_WL)) {
    const vat = input.vatBreakdown;
    if (!vat || vat.length === 0) {
      addError(
        errors,
        "vatBreakdown",
        "VAT breakdown with at least one entry is required for BASIC_WL",
        Profile.BASIC_WL,
      );
    } else {
      vat.forEach((entry, i) => {
        if (!entry.categoryCode) {
          addError(
            errors,
            `vatBreakdown[${i}].categoryCode`,
            "VAT breakdown entry categoryCode is required",
            Profile.BASIC_WL,
          );
        }
        if (entry.ratePercent == null) {
          addError(
            errors,
            `vatBreakdown[${i}].ratePercent`,
            "VAT breakdown entry ratePercent is required",
            Profile.BASIC_WL,
          );
        }
        if (entry.taxableAmount == null) {
          addError(
            errors,
            `vatBreakdown[${i}].taxableAmount`,
            "VAT breakdown entry taxableAmount is required",
            Profile.BASIC_WL,
          );
        }
        if (entry.taxAmount == null) {
          addError(
            errors,
            `vatBreakdown[${i}].taxAmount`,
            "VAT breakdown entry taxAmount is required",
            Profile.BASIC_WL,
          );
        }
      });
    }
  }

  if (req(Profile.BASIC)) {
    const lines = input.lines;
    if (!lines || lines.length === 0) {
      addError(errors, "lines", "At least one invoice line is required for BASIC", Profile.BASIC);
    } else {
      lines.forEach((line, i) => {
        if (!line.id) {
          addError(errors, `lines[${i}].id`, "Line ID is required", Profile.BASIC);
        }
        if (!line.name) {
          addError(errors, `lines[${i}].name`, "Line name is required", Profile.BASIC);
        }
        if (line.quantity == null) {
          addError(errors, `lines[${i}].quantity`, "Line quantity is required", Profile.BASIC);
        }
        if (line.unitPrice == null) {
          addError(errors, `lines[${i}].unitPrice`, "Line unit price is required", Profile.BASIC);
        }
      });
    }
  }

  if (req(Profile.EN16931) && input.lines && input.lines.length > 0) {
    input.lines.forEach((line, i) => {
      if (line.vatCategoryCode == null || line.vatCategoryCode === "") {
        addError(
          errors,
          `lines[${i}].vatCategoryCode`,
          "Line VAT category code is required for EN16931",
          Profile.EN16931,
        );
      }
      if (line.vatRatePercent == null) {
        addError(
          errors,
          `lines[${i}].vatRatePercent`,
          "Line VAT rate percent is required for EN16931",
          Profile.EN16931,
        );
      }
    });
  }

  // BR-62 / FX-SCH-A-000158: URIID@schemeID is mandatory whenever a party
  // exposes a URIUniversalCommunication. Applies to all profiles BASIC+ for
  // pure Factur-X — not just XRechnung. Catch missing schemeID here so the
  // caller fails fast instead of producing a non-conformant XML.
  if (req(Profile.BASIC_WL)) {
    for (const role of ["seller", "buyer"] as const) {
      const ea = input[role]?.electronicAddress;
      if (ea && !ea.schemeID) {
        addError(
          errors,
          `${role}.electronicAddress.schemeID`,
          `${role.charAt(0).toUpperCase() + role.slice(1)} electronic address must include schemeID (BR-62 / FX-SCH-A-000158).`,
          Profile.BASIC_WL,
        );
      }
    }
  }

  // BR-27: Item net price (BT-146) shall NOT be negative. The Factur-X
  // schematron rejects negative `NetPriceProductTradePrice/ChargeAmount`.
  // Discounts must be expressed via allowancesCharges, not negative prices.
  if (req(Profile.BASIC) && input.lines) {
    input.lines.forEach((line, i) => {
      if (typeof line.unitPrice === "number" && line.unitPrice < 0) {
        addError(
          errors,
          `lines[${i}].unitPrice`,
          "Line unit price must not be negative (BR-27). Use allowancesCharges for discounts.",
          Profile.BASIC,
        );
      }
    });
  }

  // BR-CO-15: Invoice total amount with VAT (BT-112) = Invoice total amount
  // without VAT (BT-109) + Invoice total VAT amount (BT-110).
  if (req(Profile.BASIC_WL) && input.totals) {
    const t = input.totals;
    if (t.taxBasisTotal != null && t.taxTotal != null && t.grandTotal != null) {
      const expected = round2(t.taxBasisTotal + t.taxTotal);
      if (Math.abs(round2(t.grandTotal) - expected) > 0.01) {
        addError(
          errors,
          "totals.grandTotal",
          `Grand total ${t.grandTotal} does not equal taxBasisTotal + taxTotal (${expected}) (BR-CO-15).`,
          Profile.BASIC_WL,
        );
      }
    }
  }

  // BR-CO-13: Invoice total amount without VAT (BT-109) = Σ Invoice line net
  // amounts (BT-106) - Σ document level allowances (BT-107) + Σ document
  // level charges (BT-108). The original report tripped this via a
  // negative-line-as-discount that polluted the line total.
  if (req(Profile.BASIC_WL) && input.totals) {
    const t = input.totals;
    if (t.lineTotal != null && t.taxBasisTotal != null) {
      const allowance = t.allowanceTotal ?? 0;
      const charge = t.chargeTotal ?? 0;
      const expected = round2(t.lineTotal - allowance + charge);
      if (Math.abs(round2(t.taxBasisTotal) - expected) > 0.01) {
        addError(
          errors,
          "totals.taxBasisTotal",
          `taxBasisTotal ${t.taxBasisTotal} does not equal lineTotal - allowanceTotal + chargeTotal (${expected}) (BR-CO-13).`,
          Profile.BASIC_WL,
        );
      }
    }
  }

  // BR-CO-10: Sum of Invoice line net amount (BT-106) = Σ Invoice line net
  // amount (BT-131). Falls back to quantity × unitPrice when line.lineTotal
  // is omitted, mirroring the XML builder's behaviour.
  if (req(Profile.BASIC) && input.totals && input.lines) {
    const sumLineNets = input.lines.reduce((sum, l) => {
      const lineNet =
        l.lineTotal ??
        (typeof l.quantity === "number" && typeof l.unitPrice === "number"
          ? l.quantity * l.unitPrice
          : 0);
      return sum + lineNet;
    }, 0);
    if (input.totals.lineTotal != null) {
      if (Math.abs(round2(input.totals.lineTotal) - round2(sumLineNets)) > 0.01) {
        addError(
          errors,
          "totals.lineTotal",
          `lineTotal ${input.totals.lineTotal} does not equal Σ line nets (${round2(sumLineNets)}) (BR-CO-10).`,
          Profile.BASIC,
        );
      }
    }
  }

  // BR-CO-14: Σ vatBreakdown[i].taxAmount = totals.taxTotal (BT-110).
  if (req(Profile.BASIC_WL) && input.totals?.taxTotal != null && input.vatBreakdown) {
    const sumVat = input.vatBreakdown.reduce((s, v) => s + (v.taxAmount ?? 0), 0);
    if (Math.abs(round2(input.totals.taxTotal) - round2(sumVat)) > 0.01) {
      addError(
        errors,
        "totals.taxTotal",
        `taxTotal ${input.totals.taxTotal} does not equal Σ vatBreakdown.taxAmount (${round2(sumVat)}) (BR-CO-14).`,
        Profile.BASIC_WL,
      );
    }
  }

  // BR-CO-17 / BR-S-09: Per VAT breakdown entry, the VAT amount must equal
  // the rounded product of the basis and the rate. Catches the inconsistency
  // that produced the "1.00 vs 1.19" warning in the failing Pastely invoice.
  if (req(Profile.BASIC_WL) && input.vatBreakdown) {
    input.vatBreakdown.forEach((vb, i) => {
      if (vb.taxableAmount != null && vb.taxAmount != null && vb.ratePercent != null) {
        const expected = round2((vb.taxableAmount * vb.ratePercent) / 100);
        if (Math.abs(round2(vb.taxAmount) - expected) > 0.01) {
          addError(
            errors,
            `vatBreakdown[${i}].taxAmount`,
            `taxAmount ${vb.taxAmount} does not equal round(taxableAmount × ratePercent / 100) = ${expected} (BR-CO-17).`,
            Profile.BASIC_WL,
          );
        }
      }
    });
  }

  // BR-FX-EN-04: A non-down-payment invoice must carry a delivery date or
  // a billing period. Surface this so the caller gets a clear signal rather
  // than relying on the XML builder's issueDate fallback.
  if (req(Profile.BASIC) && input.document) {
    const isPrepayment = input.document.typeCode === "386";
    if (!isPrepayment) {
      const hasDeliveryDate = !!input.delivery?.date;
      const hasBillingPeriod = !!input.billingPeriod;
      if (!hasDeliveryDate && !hasBillingPeriod) {
        addError(
          errors,
          "delivery.date",
          "Provide delivery.date or billingPeriod (BR-FX-EN-04).",
          Profile.BASIC,
        );
      }
    }
  }

  // XRechnung-specific (BR-DE / PEPPOL-EN16931). Only applied when the
  // caller asks to emit XRechnung, since pure Factur-X does not require these.
  if (flavor === Flavor.XRECHNUNG) {
    // BR-DE-15: BuyerReference (BT-10) is mandatory.
    if (!input.document?.buyerReference) {
      addError(
        errors,
        "document.buyerReference",
        "BuyerReference (BT-10) is required for XRechnung (BR-DE-15).",
        Profile.EN16931,
      );
    }

    // PEPPOL-EN16931-R001: business process must be provided. xrechnung.ts
    // injects a default, but if a caller bypasses it we still want to flag it.
    if (!input.document?.businessProcessId) {
      addError(
        errors,
        "document.businessProcessId",
        "Business process (BT-23) is required for XRechnung (PEPPOL-EN16931-R001).",
        Profile.EN16931,
      );
    }

    // BR-DE-2: Seller contact group (BG-6) must be provided.
    if (
      !input.seller?.contact ||
      (!input.seller.contact.name && !input.seller.contact.email && !input.seller.contact.phone)
    ) {
      addError(
        errors,
        "seller.contact",
        "Seller contact (BG-6) with name, email or phone is required for XRechnung (BR-DE-2).",
        Profile.EN16931,
      );
    }

    // PEPPOL-EN16931-R020 / R010: buyer & seller electronic address.
    // BR-62 / FX-SCH-A-000158: URIID must carry a non-empty @schemeID.
    if (!input.seller?.electronicAddress?.value || !input.seller.electronicAddress.schemeID) {
      addError(
        errors,
        "seller.electronicAddress",
        "Seller electronic address (BT-34) with non-empty schemeID is required for XRechnung (PEPPOL-EN16931-R020 / BR-62).",
        Profile.EN16931,
      );
    }
    if (!input.buyer?.electronicAddress?.value || !input.buyer.electronicAddress.schemeID) {
      addError(
        errors,
        "buyer.electronicAddress",
        "Buyer electronic address (BT-49) with non-empty schemeID is required for XRechnung (PEPPOL-EN16931-R010 / BR-62).",
        Profile.EN16931,
      );
    }

    // BR-DE-19: when payment means is SEPA credit transfer (code 58), the
    // payment account identifier must be a syntactically valid IBAN.
    if (input.payment?.meansCode === "58" && input.payment.iban) {
      if (!isValidIban(input.payment.iban)) {
        addError(
          errors,
          "payment.iban",
          "IBAN is not syntactically valid (BR-DE-19).",
          Profile.EN16931,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Round to 2 decimal places (currency precision). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Validates an IBAN syntactically per ISO 13616 (mod-97 = 1 with the
 * country and check digits moved to the end). Whitespace is stripped.
 */
function isValidIban(iban: string): boolean {
  const normalized = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(normalized)) return false;
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  // Convert letters to numbers (A=10..Z=35).
  let expanded = "";
  for (const ch of rearranged) {
    expanded += /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
  }
  // Mod-97 in chunks to avoid BigInt.
  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    const chunk = remainder.toString() + expanded.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  return remainder === 1;
}
