/**
 * Profile-based validation for Factur-X invoice input.
 *
 * Validates that a {@link FacturXInvoiceInput} contains all required fields
 * for a given profile level (MINIMUM → EXTENDED).
 *
 * @module validation/profile-validator
 */

import { Profile } from "../flavors/constants";
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
 * @param input - Invoice input to validate
 * @param profile - Target profile (MINIMUM, BASIC_WL, BASIC, EN16931, or EXTENDED)
 * @returns Validation result with valid flag and any errors
 */
export function validateInput(input: FacturXInvoiceInput, profile: Profile): ValidationResult {
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

  return {
    valid: errors.length === 0,
    errors,
  };
}
