/**
 * Factur-X Input Object Types
 *
 * These types define the structured input for invoice generation across
 * all supported profiles (MINIMUM → EXTENDED) and flavors (factur-x,
 * zugferd, xrechnung, chrono-pro).
 *
 * Fields are annotated with their EN 16931 Business Term (BT) mapping
 * and the minimum profile level at which they become relevant.
 *
 * @module types/input
 * @see docs/INPUT_OBJECT_SPECIFICATION.md
 * @see https://fnfe-mpe.org/factur-x/
 * @license EUPL-1.2
 */

// ---------------------------------------------------------------------------
// Code types
// ---------------------------------------------------------------------------

/**
 * Invoice type codes per UNTDID 1001 — Document name code (BT-3).
 *
 * The full code list from the Factur-X / EN 16931 specification.
 * Common codes for most implementations:
 *
 * | Code | Meaning                       | Chorus Pro |
 * |------|-------------------------------|------------|
 * | 380  | Commercial invoice            | ✅          |
 * | 381  | Credit note                   | ✅          |
 * | 384  | Corrected invoice             | ✅          |
 * | 386  | Prepayment invoice            | ✅          |
 * | 389  | Self-billed invoice           | ❌          |
 * | 261  | Self-billed credit note       | ❌          |
 * | 751  | Invoice info for accounting   | ❌ (DE only)|
 *
 * Code `751` is required in Germany to meet regulatory requirements.
 * Codes `261`, `389`, `471`, `500`, `501`, `527` are **not accepted**
 * by Chorus Pro (France).
 *
 * @see EN 16931 BT-3
 * @see UNTDID 1001
 */
export enum DocumentTypeCode {
  /** Request for payment */
  REQUEST_FOR_PAYMENT = "71",
  /** Debit note related to goods or services */
  DEBIT_NOTE_GOODS_SERVICES = "80",
  /** Credit note related to goods or services */
  CREDIT_NOTE_GOODS_SERVICES = "81",
  /** Metered services invoice */
  METERED_SERVICES_INVOICE = "82",
  /** Credit note related to financial adjustments */
  CREDIT_NOTE_FINANCIAL_ADJUSTMENTS = "83",
  /** Debit note related to financial adjustments */
  DEBIT_NOTE_FINANCIAL_ADJUSTMENTS = "84",
  /** Tax notification */
  TAX_NOTIFICATION = "102",
  /** Invoicing data sheet */
  INVOICING_DATA_SHEET = "130",
  /** Direct payment valuation */
  DIRECT_PAYMENT_VALUATION = "202",
  /** Provisional payment valuation */
  PROVISIONAL_PAYMENT_VALUATION = "203",
  /** Payment valuation */
  PAYMENT_VALUATION = "204",
  /** Interim application for payment */
  INTERIM_APPLICATION_FOR_PAYMENT = "211",
  /** Final payment request based on completion of work */
  FINAL_PAYMENT_REQUEST = "218",
  /** Payment request for completed units */
  PAYMENT_REQUEST_COMPLETED_UNITS = "219",
  /** Self-billed credit note (not accepted by Chorus Pro) */
  SELF_BILLED_CREDIT_NOTE = "261",
  /** Consolidated credit note — goods and services */
  CONSOLIDATED_CREDIT_NOTE = "262",
  /** Price variation invoice */
  PRICE_VARIATION_INVOICE = "295",
  /** Credit note for price variation */
  CREDIT_NOTE_PRICE_VARIATION = "296",
  /** Delcredere credit note */
  DELCREDERE_CREDIT_NOTE = "308",
  /** Proforma invoice */
  PROFORMA_INVOICE = "325",
  /** Partial invoice */
  PARTIAL_INVOICE = "326",
  /** Commercial invoice which includes a packing list */
  COMMERCIAL_INVOICE_PACKING_LIST = "331",
  /** Commercial invoice */
  COMMERCIAL_INVOICE = "380",
  /** Credit note */
  CREDIT_NOTE = "381",
  /** Commission note */
  COMMISSION_NOTE = "382",
  /** Debit note */
  DEBIT_NOTE = "383",
  /** Corrected invoice */
  CORRECTED_INVOICE = "384",
  /** Consolidated invoice */
  CONSOLIDATED_INVOICE = "385",
  /** Prepayment invoice */
  PREPAYMENT_INVOICE = "386",
  /** Hire invoice */
  HIRE_INVOICE = "387",
  /** Tax invoice */
  TAX_INVOICE = "388",
  /** Self-billed invoice (not accepted by Chorus Pro) */
  SELF_BILLED_INVOICE = "389",
  /** Delcredere invoice */
  DELCREDERE_INVOICE = "390",
  /** Factored invoice */
  FACTORED_INVOICE = "393",
  /** Lease invoice */
  LEASE_INVOICE = "394",
  /** Consignment invoice */
  CONSIGNMENT_INVOICE = "395",
  /** Factored credit note */
  FACTORED_CREDIT_NOTE = "396",
  /** Optical Character Reading (OCR) payment credit note */
  OCR_PAYMENT_CREDIT_NOTE = "420",
  /** Debit advice */
  DEBIT_ADVICE = "456",
  /** Reversal of debit */
  REVERSAL_OF_DEBIT = "457",
  /** Reversal of credit */
  REVERSAL_OF_CREDIT = "458",
  /** Self-billed corrective invoice (not accepted by Chorus Pro) */
  SELF_BILLED_CORRECTIVE_INVOICE = "471",
  /** Factored corrective invoice */
  FACTORED_CORRECTIVE_INVOICE = "472",
  /** Self-billed factored corrective invoice */
  SELF_BILLED_FACTORED_CORRECTIVE_INVOICE = "473",
  /** Self-billed prepayment invoice (not accepted by Chorus Pro) */
  SELF_BILLED_PREPAYMENT_INVOICE = "500",
  /** Self-billed factored invoice (not accepted by Chorus Pro) */
  SELF_BILLED_FACTORED_INVOICE = "501",
  /** Self-billed factored credit note */
  SELF_BILLED_FACTORED_CREDIT_NOTE = "502",
  /** Prepayment credit note */
  PREPAYMENT_CREDIT_NOTE = "503",
  /** Self-billed debit note (not accepted by Chorus Pro) */
  SELF_BILLED_DEBIT_NOTE = "527",
  /** Forwarder's credit note */
  FORWARDERS_CREDIT_NOTE = "532",
  /** Forwarder's invoice discrepancy report */
  FORWARDERS_INVOICE_DISCREPANCY_REPORT = "553",
  /** Insurer's invoice */
  INSURERS_INVOICE = "575",
  /** Forwarder's invoice */
  FORWARDERS_INVOICE = "623",
  /** Port charges documents */
  PORT_CHARGES_DOCUMENTS = "633",
  /**
   * Invoice information for accounting purposes.
   * Required in Germany for regulatory requirements.
   * **Not accepted** by Chorus Pro.
   */
  INVOICE_INFO_ACCOUNTING = "751",
  /** Freight invoice */
  FREIGHT_INVOICE = "780",
  /** Claim notification */
  CLAIM_NOTIFICATION = "817",
  /** Consular invoice */
  CONSULAR_INVOICE = "870",
  /** Partial construction invoice */
  PARTIAL_CONSTRUCTION_INVOICE = "875",
  /** Partial final construction invoice */
  PARTIAL_FINAL_CONSTRUCTION_INVOICE = "876",
  /** Final construction invoice */
  FINAL_CONSTRUCTION_INVOICE = "877",
}

// ---------------------------------------------------------------------------
// Unit of measure codes
// ---------------------------------------------------------------------------

/**
 * Common unit of measure codes per UN/ECE Recommendation 20 (BT-130).
 *
 * Only codes typically found on invoices are active. Less common codes
 * (imperial, scientific, niche packaging) are commented out but can be
 * uncommented if needed. Any valid Rec 20 string is accepted by the
 * `unitCode` field — use this enum for readability and autocompletion.
 *
 * @see EN 16931 BT-130
 * @see https://unece.org/trade/uncefact/cl-recommendations
 */
export enum UnitCode {
  // ── Count / quantity ────────────────────────────────────────────────

  /** One (unit / piece) — most common default */
  UNIT = "C62",
  /** Each */
  EACH = "EA",
  /** Piece */
  PIECE = "H87",
  /** Number of articles */
  NUMBER_OF_ARTICLES = "NAR",
  /** Pair */
  PAIR = "PR",
  /** Set */
  SET = "SET",
  /** Dozen */
  DOZEN = "DZN",
  /** Lot */
  LOT = "LOT",
  /** Hundred */
  HUNDRED = "CEN",
  /** Thousand */
  THOUSAND = "MIL",
  // /** Number of pairs */
  // NUMBER_OF_PAIRS = 'NPR',

  // ── Time ────────────────────────────────────────────────────────────

  /** Minute */
  MINUTE = "MIN",
  /** Hour */
  HOUR = "HUR",
  /** Day */
  DAY = "DAY",
  /** Week */
  WEEK = "WEE",
  /** Month */
  MONTH = "MON",
  /** Year */
  YEAR = "ANN",
  // /** Second */
  // SECOND = 'SEC',

  // ── Weight / mass ──────────────────────────────────────────────────

  /** Gram */
  GRAM = "GRM",
  /** Kilogram */
  KILOGRAM = "KGM",
  /** Tonne (metric ton, 1000 kg) */
  TONNE = "TNE",
  // /** Milligram */
  // MILLIGRAM = 'MGM',
  // /** Pound (imperial) */
  // POUND = 'LBR',
  // /** Ounce (imperial) */
  // OUNCE = 'ONZ',

  // ── Length / distance ──────────────────────────────────────────────

  /** Millimetre */
  MILLIMETRE = "MMT",
  /** Centimetre */
  CENTIMETRE = "CMT",
  /** Metre */
  METRE = "MTR",
  /** Kilometre */
  KILOMETRE = "KMT",
  // /** Inch (imperial) */
  // INCH = 'INH',
  // /** Foot (imperial) */
  // FOOT = 'FOT',

  // ── Area ───────────────────────────────────────────────────────────

  /** Square metre */
  SQUARE_METRE = "MTK",
  // /** Square centimetre */
  // SQUARE_CENTIMETRE = 'CMK',
  // /** Square kilometre */
  // SQUARE_KILOMETRE = 'KMK',
  // /** Hectare */
  // HECTARE = 'HAR',

  // ── Volume ─────────────────────────────────────────────────────────

  /** Millilitre */
  MILLILITRE = "MLT",
  /** Litre */
  LITRE = "LTR",
  /** Cubic metre */
  CUBIC_METRE = "MTQ",
  // /** Centilitre */
  // CENTILITRE = 'CLT',
  // /** Cubic centimetre */
  // CUBIC_CENTIMETRE = 'CMQ',
  // /** US gallon (imperial) */
  // US_GALLON = 'GLL',

  // ── Energy ─────────────────────────────────────────────────────────

  /** Kilowatt hour */
  KILOWATT_HOUR = "KWH",
  /** Megawatt hour */
  MEGAWATT_HOUR = "MWH",
  // /** Kilowatt (power rate — uncommon on invoices) */
  // KILOWATT = 'KWT',

  // ── Packaging ──────────────────────────────────────────────────────

  /** Package */
  PACKAGE = "XPK",
  /** Pallet */
  PALLET = "XPX",
  /** Box */
  BOX = "XBX",
  /** Carton */
  CARTON = "XCT",
  // /** Bag */
  // BAG = 'XBG',
  // /** Barrel */
  // BARREL = 'XBA',
  // /** Container */
  // CONTAINER = 'XCN',

  // ── Data / information ──────────────────────────────────────────────

  /** Byte (8 bits) */
  BYTE = "AD",
  /** Kilobyte (10³ bytes) */
  KILOBYTE = "2P",
  /** Megabyte (10⁶ bytes) */
  MEGABYTE = "4L",
  /** Gigabyte (10⁹ bytes) */
  GIGABYTE = "E34",
  /** Terabyte (10¹² bytes) */
  TERABYTE = "E35",
  /** Petabyte (10¹⁵ bytes) */
  PETABYTE = "E36",
  /** Byte per second */
  BYTE_PER_SECOND = "P93",
  /** Kilobyte per second */
  KILOBYTE_PER_SECOND = "P94",
  // /** Kibibyte (2¹⁰ bytes) */
  // KIBIBYTE = 'E64',
  // /** Mebibyte (2²⁰ bytes) */
  // MEBIBYTE = 'E63',
  // /** Gibibyte (2³⁰ bytes) */
  // GIBIBYTE = 'E62',
  // /** Tebibyte (2⁴⁰ bytes) */
  // TEBIBYTE = 'E61',
  // /** Pebibyte (2⁵⁰ bytes) */
  // PEBIBYTE = 'E60',
  // /** Exbibyte (2⁶⁰ bytes) */
  // EXBIBYTE = 'E59',

  // ── Miscellaneous ──────────────────────────────────────────────────

  /** Lump sum */
  LUMP_SUM = "LS",
  /** Percent */
  PERCENT = "P1",
  /** Sheet */
  SHEET = "ST",
  /** Roll */
  ROLL = "RO",
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

/**
 * Note attached to the invoice document.
 *
 * @see EN 16931 BG-1
 * @since BASIC_WL
 */
export interface NoteInput {
  /** Free-text content of the note */
  content: string;

  /**
   * Subject code qualifying the note (e.g. `"AAK"` = discount terms,
   * `"REG"` = regulatory information). Optional.
   */
  subjectCode?: string;
}

/**
 * Invoice document metadata.
 *
 * @see EN 16931 BT-1 (id), BT-2 (issueDate), BT-3 (typeCode)
 */
export interface InvoiceDocumentInput {
  /**
   * Invoice number — mandatory for all profiles.
   * @see EN 16931 BT-1
   */
  id: string;

  /**
   * Issue date — mandatory, format `YYYY-MM-DD`.
   * @see EN 16931 BT-2
   */
  issueDate: string;

  /**
   * Document type code (BT-3).
   * Use the {@link DocumentTypeCode} enum for type-safe values.
   * @default {@link DocumentTypeCode.COMMERCIAL_INVOICE} (`'380'`)
   * @see EN 16931 BT-3
   */
  typeCode?: DocumentTypeCode;

  /**
   * Due date — optional at document level (often set via {@link PaymentInput.dueDate}).
   * @see EN 16931 BT-9
   */
  dueDate?: string;

  /**
   * Document name / title — optional.
   * @since EXTENDED
   */
  name?: string;

  /**
   * Language code (ISO 639-1, e.g. `"en"`, `"de"`, `"fr"`).
   * @since EXTENDED
   */
  language?: string;

  /**
   * Buyer reference — often the purchase order or Leitweg-ID (XRechnung).
   * @see EN 16931 BT-10
   * @since MINIMUM
   */
  buyerReference?: string;

  /**
   * Notes attached to the invoice.
   * @see EN 16931 BG-1
   * @since BASIC_WL
   */
  notes?: NoteInput[];

  /**
   * Business process identifier (e.g. PEPPOL `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0`).
   * @see EN 16931 BT-23
   */
  businessProcessId?: string;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

/**
 * Postal address.
 *
 * @see EN 16931 BT-35–BT-39 (Seller), BT-50–BT-54 (Buyer)
 */
export interface AddressInput {
  /** Street and number (BT-35 / BT-50) */
  line1: string;

  /** Additional address line (BT-36 / BT-51) */
  line2?: string;

  /** Third address line */
  line3?: string;

  /** City (BT-37 / BT-52) — mandatory when address present */
  city: string;

  /** Postal code (BT-38 / BT-53) */
  postalCode: string;

  /**
   * Country code (ISO 3166-1 alpha-2, e.g. `"DE"`, `"FR"`).
   * @see EN 16931 BT-40 / BT-55
   */
  country: string;

  /** Country subdivision (e.g. state/province) */
  subdivision?: string;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/**
 * Contact information.
 *
 * @see EN 16931 BG-6 (Seller contact), BG-9 (Buyer contact)
 * @since EN16931
 */
export interface ContactInput {
  /** Contact person name (BT-41 / BT-56) */
  name?: string;

  /** Department name */
  department?: string;

  /** Phone number (BT-42 / BT-57) */
  phone?: string;

  /** Email address (BT-43 / BT-58) */
  email?: string;
}

// ---------------------------------------------------------------------------
// Trade Party
// ---------------------------------------------------------------------------

/**
 * Tax registration entry (VAT ID or local tax number).
 *
 * The `schemeId` distinguishes `"VA"` (VAT) from `"FC"` (fiscal/tax number).
 * @since MINIMUM (VAT only)
 */
export interface TaxRegistrationInput {
  /** Tax registration ID (e.g. `"DE123456789"`) */
  id: string;

  /**
   * Scheme: `"VA"` for VAT, `"FC"` for fiscal/tax number.
   * @default `"VA"`
   */
  schemeId?: "VA" | "FC";
}

/**
 * Legal organization details.
 *
 * @see EN 16931 BT-30 (Seller legal registration), BT-47 (Buyer)
 * @since MINIMUM
 */
export interface LegalOrganizationInput {
  /** Registration identifier */
  id?: string;

  /** Trading business name */
  tradingName?: string;
}

/**
 * Trade party (seller, buyer, payee, etc.).
 *
 * @see EN 16931 BG-4 (Seller), BG-7 (Buyer)
 */
export interface TradePartyInput {
  /**
   * Party name — mandatory for all profiles.
   * @see EN 16931 BT-27 (Seller), BT-44 (Buyer)
   */
  name: string;

  /**
   * Party identifiers (can have multiples, e.g. GLN).
   * @see EN 16931 BT-29 / BT-46
   */
  id?: string | string[];

  /**
   * Global identifier with scheme (e.g. GLN `"0088:1234567890123"`).
   * @see EN 16931 BT-29-1 / BT-46-1
   */
  globalId?: string;

  /** Postal address — mandatory for BASIC_WL and above */
  address?: AddressInput;

  /**
   * Contact information.
   * @since EN16931
   */
  contact?: ContactInput;

  /**
   * Electronic address (e.g. email or URI for e-delivery).
   * @see EN 16931 BT-34 / BT-49
   */
  electronicAddress?: string;

  /**
   * Tax registrations (VAT ID, fiscal number).
   * @see EN 16931 BT-31 / BT-48
   */
  taxRegistrations?: TaxRegistrationInput[];

  /**
   * Legal organization info.
   * @see EN 16931 BT-30 / BT-47
   */
  legalOrganization?: LegalOrganizationInput;

  /**
   * Description of the party.
   * @since EN16931
   */
  description?: string;
}

// ---------------------------------------------------------------------------
// Invoice Line
// ---------------------------------------------------------------------------

/**
 * Invoice line item.
 * Required for BASIC, EN 16931, EXTENDED profiles.
 *
 * @see EN 16931 BG-25
 */
export interface InvoiceLineInput {
  /**
   * Line ID — mandatory.
   * @see EN 16931 BT-126
   */
  id: string;

  /**
   * Item name/description — mandatory.
   * @see EN 16931 BT-153
   */
  name: string;

  /**
   * Quantity — mandatory.
   * @see EN 16931 BT-129
   */
  quantity: number;

  /**
   * Unit of measure (UN/CEFACT Rec 20).
   * Use the {@link UnitCode} enum for common codes, or pass any
   * valid Rec 20 string for codes not in the enum.
   *
   * @default {@link UnitCode.UNIT} (`'C62'`) when omitted
   * @see EN 16931 BT-130
   *
   * @example
   * ```ts
   * unitCode: UnitCode.HOUR     // 'HUR'
   * unitCode: UnitCode.KILOGRAM // 'KGM'
   * unitCode: 'XYZ'             // any Rec 20 code
   * ```
   */
  unitCode?: UnitCode | (string & Record<never, never>);

  /**
   * Net unit price — mandatory for line-level.
   * @see EN 16931 BT-146
   */
  unitPrice: number;

  /**
   * Gross unit price (before allowances).
   * @see EN 16931 BT-148
   */
  grossUnitPrice?: number;

  /**
   * Line total (net) — can be derived from `quantity * unitPrice`.
   * @see EN 16931 BT-131
   */
  lineTotal?: number;

  /**
   * VAT category code (e.g. `"S"`, `"Z"`, `"E"`, `"G"`).
   * @see EN 16931 BT-151
   */
  vatCategoryCode?: string;

  /**
   * VAT rate in percent (e.g. `19`, `7`, `0`).
   * @see EN 16931 BT-152
   */
  vatRatePercent?: number;

  /**
   * Item description (longer than name).
   * @see EN 16931 BT-154
   */
  description?: string;

  /**
   * Item standard identifier (e.g. GTIN/EAN).
   * @see EN 16931 BT-157
   */
  standardIdentifier?: string;

  /**
   * Seller-assigned item identifier.
   * @see EN 16931 BT-155
   */
  sellerAssignedId?: string;

  /**
   * Buyer-assigned item identifier.
   * @see EN 16931 BT-156
   */
  buyerAssignedId?: string;

  /**
   * Item classification code (e.g. CPV, UNSPC).
   * @see EN 16931 BT-158
   */
  classification?: string;

  /**
   * Country of origin (ISO 3166-1 alpha-2).
   * @see EN 16931 BT-159
   * @since EN16931
   */
  originCountry?: string;

  /**
   * Line note.
   * @since BASIC
   */
  note?: string;

  /**
   * Buyer order line reference.
   * @since EN16931
   */
  buyerOrderLineId?: string;
}

// ---------------------------------------------------------------------------
// Allowances & Charges
// ---------------------------------------------------------------------------

/**
 * Allowance or charge at header or line level.
 *
 * @see EN 16931 BG-20 (document level allowances), BG-21 (charges)
 * @since BASIC_WL
 */
export interface AllowanceChargeInput {
  /**
   * `true` = charge, `false` = allowance.
   * @see EN 16931 BT-98 / BT-107
   */
  isCharge: boolean;

  /**
   * Amount.
   * @see EN 16931 BT-99 / BT-92
   */
  amount: number;

  /**
   * Reason code (UNCL 5189 for allowances, UNCL 7161 for charges).
   * @see EN 16931 BT-98 / BT-105
   */
  reasonCode?: string;

  /** Reason text */
  reason?: string;

  /** Base amount (for percentage calculation) */
  baseAmount?: number;

  /** Percentage */
  percent?: number;

  /** VAT category code for this allowance/charge */
  vatCategoryCode?: string;

  /** VAT rate for this allowance/charge */
  vatRatePercent?: number;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

/**
 * Payment information.
 *
 * @see EN 16931 BG-16
 * @since BASIC_WL
 */
export interface PaymentInput {
  /**
   * Payment means code (UNCL 4461, e.g. `"30"` = credit transfer,
   * `"58"` = SEPA credit transfer, `"59"` = SEPA direct debit).
   * @see EN 16931 BT-81
   */
  meansCode?: string;

  /**
   * Payment due date.
   * @see EN 16931 BT-9
   */
  dueDate?: string;

  /**
   * Payment reference / remittance information.
   * @see EN 16931 BT-83
   */
  paymentReference?: string;

  /**
   * Creditor reference (for SEPA direct debit).
   * @see EN 16931 BT-90
   */
  creditorReference?: string;

  /**
   * IBAN of the payee.
   * @see EN 16931 BT-84
   */
  iban?: string;

  /**
   * Proprietary account ID (non-IBAN).
   */
  accountId?: string;

  /**
   * Account name.
   * @see EN 16931 BT-85
   * @since EN16931
   */
  accountName?: string;

  /**
   * BIC/SWIFT code.
   * @see EN 16931 BT-86
   * @since EN16931
   */
  bic?: string;

  /**
   * SEPA direct debit mandate ID.
   * @see EN 16931 BT-89
   */
  mandateId?: string;

  /**
   * Debtor IBAN (for direct debit).
   * @see EN 16931 BT-91
   */
  debtorIban?: string;

  /**
   * Payment terms description (free text).
   * @see EN 16931 BT-20
   */
  termsDescription?: string;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * Delivery information.
 *
 * @see EN 16931 BG-13
 * @since BASIC_WL
 */
export interface DeliveryInput {
  /**
   * Actual delivery date.
   * @see EN 16931 BT-72
   */
  date?: string;

  /**
   * Ship-to address.
   * @see EN 16931 BG-15
   */
  location?: AddressInput;

  /**
   * Ship-to party name.
   * @see EN 16931 BT-70
   */
  partyName?: string;

  /**
   * Despatch advice reference.
   * @see EN 16931 BT-16
   */
  despatchAdviceReference?: string;
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

/**
 * Invoice monetary totals — mandatory for all profiles.
 *
 * @see EN 16931 BG-22
 */
export interface InvoiceTotalsInput {
  /**
   * Sum of all line totals (net).
   * @see EN 16931 BT-106
   */
  lineTotal: number;

  /**
   * Sum of allowances at document level.
   * @see EN 16931 BT-107
   */
  allowanceTotal?: number;

  /**
   * Sum of charges at document level.
   * @see EN 16931 BT-108
   */
  chargeTotal?: number;

  /**
   * Tax-exclusive amount (net total).
   * @see EN 16931 BT-109
   */
  taxBasisTotal: number;

  /**
   * Total VAT amount.
   * @see EN 16931 BT-110
   */
  taxTotal: number;

  /**
   * Grand total including VAT.
   * @see EN 16931 BT-112
   */
  grandTotal: number;

  /**
   * Prepaid amount.
   * @see EN 16931 BT-113
   */
  prepaidAmount?: number;

  /**
   * Due payable amount.
   * @see EN 16931 BT-115
   */
  duePayableAmount: number;

  /**
   * Invoice currency code (ISO 4217, e.g. `"EUR"`).
   * @see EN 16931 BT-5
   */
  currency: string;

  /**
   * Tax currency code (if different from invoice currency).
   * @see EN 16931 BT-6
   */
  taxCurrency?: string;
}

// ---------------------------------------------------------------------------
// VAT Breakdown
// ---------------------------------------------------------------------------

/**
 * VAT/tax breakdown entry — required for BASIC_WL and above.
 *
 * @see EN 16931 BG-23
 */
export interface VatBreakdownInput {
  /**
   * VAT category code (`"S"` = standard, `"Z"` = zero, `"E"` = exempt,
   * `"G"` = free export, `"K"` = intra-community, `"AE"` = reverse charge, etc.).
   * @see EN 16931 BT-118
   */
  categoryCode: string;

  /**
   * VAT rate in percent.
   * @see EN 16931 BT-119
   */
  ratePercent: number;

  /**
   * Taxable amount (basis).
   * @see EN 16931 BT-116
   */
  taxableAmount: number;

  /**
   * Tax amount.
   * @see EN 16931 BT-117
   */
  taxAmount: number;

  /**
   * Exemption reason text.
   * @see EN 16931 BT-120
   */
  exemptionReason?: string;

  /**
   * Exemption reason code.
   * @see EN 16931 BT-121
   */
  exemptionReasonCode?: string;
}

// ---------------------------------------------------------------------------
// Document References
// ---------------------------------------------------------------------------

/**
 * Document reference (contract, order, preceding invoice, etc.).
 *
 * @see EN 16931 BT-12–BT-25
 * @since MINIMUM (buyerOrderReference), BASIC_WL (others)
 */
export interface DocumentReferenceInput {
  /**
   * Reference ID.
   * @see EN 16931 BT-13 (order), BT-12 (contract), BT-25 (preceding invoice)
   */
  id: string;

  /**
   * Reference type: determines where this reference is placed in XML.
   * - `"order"` → BuyerOrderReferencedDocument
   * - `"contract"` → ContractReferencedDocument
   * - `"despatch"` → DespatchAdviceReferencedDocument
   * - `"preceding"` → InvoiceReferencedDocument
   * - `"seller-order"` → SellerOrderReferencedDocument (EN16931+)
   * - `"project"` → SpecifiedProcuringProject (EN16931+)
   *
   * @default `"order"`
   */
  type?: "order" | "contract" | "despatch" | "preceding" | "seller-order" | "project";

  /** Issue date of the referenced document */
  issueDate?: string;
}

// ---------------------------------------------------------------------------
// Billing Period
// ---------------------------------------------------------------------------

/**
 * Billing/invoicing period.
 *
 * @see EN 16931 BG-14
 * @since BASIC_WL
 */
export interface BillingPeriodInput {
  /** Period start date (YYYY-MM-DD) */
  startDate?: string;

  /** Period end date (YYYY-MM-DD) */
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Root Input Object
// ---------------------------------------------------------------------------

/**
 * Root input for Factur-X invoice generation.
 *
 * Use this object with {@link embedFacturX} or {@link toXRechnung}.
 * The same structure supports all profiles; fields not applicable
 * to the chosen profile are silently ignored.
 *
 * @example
 * ```ts
 * const input: FacturXInvoiceInput = {
 *   document: { id: 'INV-001', issueDate: '2025-03-01', typeCode: DocumentTypeCode.COMMERCIAL_INVOICE },
 *   seller: { name: 'StackForge UG (haftungsbeschränkt)', address: { line1: 'Bergstraße 4', city: 'Weihmichl', postalCode: '84107', country: 'DE' } },
 *   buyer: { name: 'Kite-Engineer by Stefan Merthan', address: { line1: 'Hauptstraße 6', city: 'Weihmichl', postalCode: '84107', country: 'DE' } },
 *   totals: { lineTotal: 100, taxBasisTotal: 100, taxTotal: 19, grandTotal: 119, duePayableAmount: 119, currency: 'EUR' },
 *   vatBreakdown: [{ categoryCode: 'S', ratePercent: 19, taxableAmount: 100, taxAmount: 19 }],
 * };
 * ```
 *
 * @see docs/INPUT_OBJECT_SPECIFICATION.md
 */
export interface FacturXInvoiceInput {
  /** Document metadata — mandatory */
  document: InvoiceDocumentInput;

  /** Seller (supplier) party — mandatory */
  seller: TradePartyInput;

  /** Buyer party — mandatory */
  buyer: TradePartyInput;

  /**
   * Invoice lines — required for BASIC, EN 16931, EXTENDED.
   * @see EN 16931 BG-25
   */
  lines?: InvoiceLineInput[];

  /**
   * Document-level allowances and charges.
   * @see EN 16931 BG-20, BG-21
   * @since BASIC_WL
   */
  allowancesCharges?: AllowanceChargeInput[];

  /**
   * Payment information.
   * @see EN 16931 BG-16
   * @since BASIC_WL
   */
  payment?: PaymentInput;

  /**
   * Delivery information.
   * @see EN 16931 BG-13
   * @since BASIC_WL
   */
  delivery?: DeliveryInput;

  /** Monetary totals — mandatory */
  totals: InvoiceTotalsInput;

  /**
   * VAT breakdown — required for BASIC_WL and above.
   * @see EN 16931 BG-23
   */
  vatBreakdown?: VatBreakdownInput[];

  /**
   * Document references (order, contract, preceding invoice, etc.).
   * @see EN 16931 BG-3
   */
  references?: DocumentReferenceInput[];

  /**
   * Billing/invoicing period.
   * @see EN 16931 BG-14
   * @since BASIC_WL
   */
  billingPeriod?: BillingPeriodInput;

  /**
   * Payee (if different from seller).
   * @see EN 16931 BG-10
   * @since BASIC_WL
   */
  payee?: TradePartyInput;

  /**
   * Seller's tax representative.
   * @see EN 16931 BG-11
   * @since BASIC_WL
   */
  sellerTaxRepresentative?: TradePartyInput;
}
