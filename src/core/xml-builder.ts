import { UnitCode } from "../types/input";
import type {
  FacturXInvoiceInput,
  TradePartyInput,
  AddressInput,
  ContactInput,
  InvoiceLineInput,
  AllowanceChargeInput,
  VatBreakdownInput,
  InvoiceTotalsInput,
} from "../types/input";

import { Profile, Flavor, PROFILE_URNS } from "../flavors/constants";

import { resolveTypeCode } from "../flavors/registry";

// ---------------------------------------------------------------------------
// Profile level comparison
// ---------------------------------------------------------------------------

const PROFILE_LEVEL: Record<Profile, number> = {
  MINIMUM: 0,
  BASIC_WL: 1,
  BASIC: 2,
  EN16931: 3,
  EXTENDED: 4,
};

function atLeast(current: Profile, minimum: Profile): boolean {
  return PROFILE_LEVEL[current] >= PROFILE_LEVEL[minimum];
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Escapes the five XML-reserved characters (`&`, `<`, `>`, `"`, `'`) and
 * strips control characters that are illegal in XML 1.0 (U+0000–U+0008,
 * U+000B–U+000C, U+000E–U+001F) so that arbitrary text can be safely
 * embedded in an XML document.
 */
export function escapeXml(value: string): string {
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  );
}

function formatDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`Invalid date format "${isoDate}": expected YYYY-MM-DD (e.g. "2025-03-15").`);
  }
  return isoDate.replace(/-/g, "");
}

function fmtAmt(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid amount value: ${n}. Expected a finite number.`);
  }
  return n.toFixed(2);
}

function tag(name: string, content: string, attrs?: Record<string, string>): string {
  const a = attrs
    ? Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join("")
    : "";
  return `<${name}${a}>${content}</${name}>`;
}

function dateEl(wrapper: string, isoDate: string): string {
  return tag(wrapper, tag("udt:DateTimeString", formatDate(isoDate), { format: "102" }));
}

// ---------------------------------------------------------------------------
// Trade party sub-elements
// ---------------------------------------------------------------------------

function buildAddress(addr: AddressInput): string {
  let x = "";
  if (addr.postalCode) x += tag("ram:PostcodeCode", escapeXml(addr.postalCode));
  x += tag("ram:LineOne", escapeXml(addr.line1));
  if (addr.line2) x += tag("ram:LineTwo", escapeXml(addr.line2));
  if (addr.line3) x += tag("ram:LineThree", escapeXml(addr.line3));
  x += tag("ram:CityName", escapeXml(addr.city));
  x += tag("ram:CountryID", escapeXml(addr.country));
  if (addr.subdivision) x += tag("ram:CountrySubDivisionName", escapeXml(addr.subdivision));
  return tag("ram:PostalTradeAddress", x);
}

function buildContact(c: ContactInput): string {
  let x = "";
  if (c.name) x += tag("ram:PersonName", escapeXml(c.name));
  if (c.department) x += tag("ram:DepartmentName", escapeXml(c.department));
  if (c.phone)
    x += tag("ram:TelephoneUniversalCommunication", tag("ram:CompleteNumber", escapeXml(c.phone)));
  if (c.email) x += tag("ram:EmailURIUniversalCommunication", tag("ram:URIID", escapeXml(c.email)));
  return tag("ram:DefinedTradeContact", x);
}

function buildParty(p: TradePartyInput, profile: Profile): string {
  let x = "";

  if (p.id) {
    const ids = Array.isArray(p.id) ? p.id : [p.id];
    for (const id of ids) x += tag("ram:ID", escapeXml(id));
  }
  if (p.globalId) x += tag("ram:GlobalID", escapeXml(p.globalId));

  x += tag("ram:Name", escapeXml(p.name));

  if (p.description && atLeast(profile, Profile.EN16931))
    x += tag("ram:Description", escapeXml(p.description));

  if (p.legalOrganization) {
    let lo = "";
    if (p.legalOrganization.id) lo += tag("ram:ID", escapeXml(p.legalOrganization.id));
    if (p.legalOrganization.tradingName)
      lo += tag("ram:TradingBusinessName", escapeXml(p.legalOrganization.tradingName));
    x += tag("ram:SpecifiedLegalOrganization", lo);
  }

  if (p.contact && atLeast(profile, Profile.EN16931)) x += buildContact(p.contact);
  if (p.address && atLeast(profile, Profile.BASIC_WL)) x += buildAddress(p.address);

  if (p.electronicAddress)
    x += tag("ram:URIUniversalCommunication", tag("ram:URIID", escapeXml(p.electronicAddress)));

  if (p.taxRegistrations) {
    for (const tr of p.taxRegistrations) {
      x += tag(
        "ram:SpecifiedTaxRegistration",
        tag("ram:ID", escapeXml(tr.id), { schemeID: tr.schemeId ?? "VA" }),
      );
    }
  }

  return x;
}

// ---------------------------------------------------------------------------
// Line items (BASIC+)
// ---------------------------------------------------------------------------

function buildLineItem(line: InvoiceLineInput, profile: Profile): string {
  let doc = tag("ram:LineID", escapeXml(line.id));
  if (line.note) doc += tag("ram:IncludedNote", tag("ram:Content", escapeXml(line.note)));

  let prod = "";
  if (line.standardIdentifier) prod += tag("ram:GlobalID", escapeXml(line.standardIdentifier));
  if (line.sellerAssignedId) prod += tag("ram:SellerAssignedID", escapeXml(line.sellerAssignedId));
  if (line.buyerAssignedId) prod += tag("ram:BuyerAssignedID", escapeXml(line.buyerAssignedId));
  prod += tag("ram:Name", escapeXml(line.name));
  if (line.description) prod += tag("ram:Description", escapeXml(line.description));
  if (line.originCountry && atLeast(profile, Profile.EN16931))
    prod += tag("ram:OriginTradeCountry", tag("ram:ID", escapeXml(line.originCountry)));

  let agree = "";
  if (line.buyerOrderLineId && atLeast(profile, Profile.EN16931))
    agree += tag(
      "ram:BuyerOrderReferencedDocument",
      tag("ram:LineID", escapeXml(line.buyerOrderLineId)),
    );
  if (line.grossUnitPrice !== undefined)
    agree += tag(
      "ram:GrossPriceProductTradePrice",
      tag("ram:ChargeAmount", fmtAmt(line.grossUnitPrice)),
    );
  agree += tag("ram:NetPriceProductTradePrice", tag("ram:ChargeAmount", fmtAmt(line.unitPrice)));

  const unitCode = line.unitCode ?? UnitCode.UNIT;
  const delivery = tag("ram:BilledQuantity", line.quantity.toString(), {
    unitCode,
  });

  let settle = "";
  if (line.vatCategoryCode || line.vatRatePercent !== undefined) {
    let tx = tag("ram:TypeCode", "VAT");
    if (line.vatCategoryCode) tx += tag("ram:CategoryCode", escapeXml(line.vatCategoryCode));
    if (line.vatRatePercent !== undefined)
      tx += tag("ram:RateApplicablePercent", line.vatRatePercent.toString());
    settle += tag("ram:ApplicableTradeTax", tx);
  }
  const lineTotal = line.lineTotal ?? line.quantity * line.unitPrice;
  settle += tag(
    "ram:SpecifiedTradeSettlementLineMonetarySummation",
    tag("ram:LineTotalAmount", fmtAmt(lineTotal)),
  );

  return tag(
    "ram:IncludedSupplyChainTradeLineItem",
    tag("ram:AssociatedDocumentLineDocument", doc) +
      tag("ram:SpecifiedTradeProduct", prod) +
      tag("ram:SpecifiedLineTradeAgreement", agree) +
      tag("ram:SpecifiedLineTradeDelivery", delivery) +
      tag("ram:SpecifiedLineTradeSettlement", settle),
  );
}

// ---------------------------------------------------------------------------
// Document-level allowances / charges (BASIC_WL+)
// ---------------------------------------------------------------------------

function buildAllowanceCharge(ac: AllowanceChargeInput): string {
  let x = tag("ram:ChargeIndicator", tag("ram:Indicator", ac.isCharge ? "true" : "false"));
  if (ac.percent !== undefined) x += tag("ram:CalculationPercent", ac.percent.toString());
  if (ac.baseAmount !== undefined) x += tag("ram:BasisAmount", fmtAmt(ac.baseAmount));
  x += tag("ram:ActualAmount", fmtAmt(ac.amount));
  if (ac.reasonCode) x += tag("ram:ReasonCode", escapeXml(ac.reasonCode));
  if (ac.reason) x += tag("ram:Reason", escapeXml(ac.reason));
  if (ac.vatCategoryCode || ac.vatRatePercent !== undefined) {
    let tx = tag("ram:TypeCode", "VAT");
    if (ac.vatCategoryCode) tx += tag("ram:CategoryCode", escapeXml(ac.vatCategoryCode));
    if (ac.vatRatePercent !== undefined)
      tx += tag("ram:RateApplicablePercent", ac.vatRatePercent.toString());
    x += tag("ram:CategoryTradeTax", tx);
  }
  return tag("ram:SpecifiedTradeAllowanceCharge", x);
}

// ---------------------------------------------------------------------------
// VAT breakdown (BASIC_WL+)
// ---------------------------------------------------------------------------

function buildVatBreakdown(vb: VatBreakdownInput): string {
  let x = tag("ram:CalculatedAmount", fmtAmt(vb.taxAmount));
  x += tag("ram:TypeCode", "VAT");
  if (vb.exemptionReason) x += tag("ram:ExemptionReason", escapeXml(vb.exemptionReason));
  x += tag("ram:BasisAmount", fmtAmt(vb.taxableAmount));
  x += tag("ram:CategoryCode", escapeXml(vb.categoryCode));
  if (vb.exemptionReasonCode)
    x += tag("ram:ExemptionReasonCode", escapeXml(vb.exemptionReasonCode));
  x += tag("ram:RateApplicablePercent", vb.ratePercent.toString());
  return tag("ram:ApplicableTradeTax", x);
}

// ---------------------------------------------------------------------------
// Monetary summation
// ---------------------------------------------------------------------------

function buildMonetarySummation(t: InvoiceTotalsInput, profile: Profile): string {
  let x = "";

  if (atLeast(profile, Profile.BASIC_WL)) {
    x += tag("ram:LineTotalAmount", fmtAmt(t.lineTotal));
    if (t.chargeTotal !== undefined) x += tag("ram:ChargeTotalAmount", fmtAmt(t.chargeTotal));
    if (t.allowanceTotal !== undefined)
      x += tag("ram:AllowanceTotalAmount", fmtAmt(t.allowanceTotal));
  }

  x += tag("ram:TaxBasisTotalAmount", fmtAmt(t.taxBasisTotal));
  x += tag("ram:TaxTotalAmount", fmtAmt(t.taxTotal), {
    currencyID: t.currency,
  });
  x += tag("ram:GrandTotalAmount", fmtAmt(t.grandTotal));

  if (atLeast(profile, Profile.BASIC_WL) && t.prepaidAmount !== undefined)
    x += tag("ram:TotalPrepaidAmount", fmtAmt(t.prepaidAmount));

  x += tag("ram:DuePayableAmount", fmtAmt(t.duePayableAmount));

  return tag("ram:SpecifiedTradeSettlementHeaderMonetarySummation", x);
}

// ---------------------------------------------------------------------------
// Exported builder
// ---------------------------------------------------------------------------

/**
 * Builds a UN/CEFACT CrossIndustryInvoice XML string from structured input.
 *
 * The output conforms to the Factur-X 1.08 / ZUGFeRD 2.4 CII schema at the
 * requested {@link Profile} level. Elements that do not belong to the chosen
 * profile are silently omitted.
 *
 * @param input   - Structured invoice data (see {@link FacturXInvoiceInput}).
 * @param profile - Target Factur-X profile (`MINIMUM` … `EXTENDED`).
 * @param flavor  - Optional flavor; defaults to {@link Flavor.FACTUR_X}. Affects the
 *                  fallback document type code when `input.document.typeCode`
 *                  is not set.
 * @returns A complete XML document string (UTF-8 declaration, no BOM).
 */
export function buildXml(input: FacturXInvoiceInput, profile: Profile, flavor?: Flavor): string {
  if (!input) {
    throw new Error('buildXml: "input" is required.');
  }
  if (!profile) {
    throw new Error('buildXml: "profile" is required (e.g. Profile.EN16931).');
  }
  if (!input.document) {
    throw new Error('buildXml: "input.document" is required (id, issueDate, etc.).');
  }
  if (!input.seller) {
    throw new Error('buildXml: "input.seller" is required (seller name and details).');
  }
  if (!input.buyer) {
    throw new Error('buildXml: "input.buyer" is required (buyer name and details).');
  }
  if (!input.totals) {
    throw new Error('buildXml: "input.totals" is required (monetary totals).');
  }

  const { document: doc, seller, buyer, totals, payment } = input;
  const fl = flavor ?? Flavor.FACTUR_X;
  const typeCode = resolveTypeCode(input, fl);

  // ── ExchangedDocumentContext ──────────────────────────────────────────
  let ctx = "";
  if (doc.businessProcessId)
    ctx += tag(
      "ram:BusinessProcessSpecifiedDocumentContextParameter",
      tag("ram:ID", escapeXml(doc.businessProcessId)),
    );
  ctx += tag(
    "ram:GuidelineSpecifiedDocumentContextParameter",
    tag("ram:ID", PROFILE_URNS[profile]),
  );

  // ── ExchangedDocument ────────────────────────────────────────────────
  let edoc = tag("ram:ID", escapeXml(doc.id));
  if (doc.name && atLeast(profile, Profile.EXTENDED)) edoc += tag("ram:Name", escapeXml(doc.name));
  edoc += tag("ram:TypeCode", typeCode);
  edoc += dateEl("ram:IssueDateTime", doc.issueDate);
  if (doc.language && atLeast(profile, Profile.EXTENDED))
    edoc += tag("ram:LanguageID", escapeXml(doc.language));
  if (doc.notes && atLeast(profile, Profile.BASIC_WL)) {
    for (const note of doc.notes) {
      let n = tag("ram:Content", escapeXml(note.content));
      if (note.subjectCode) n += tag("ram:SubjectCode", escapeXml(note.subjectCode));
      edoc += tag("ram:IncludedNote", n);
    }
  }

  // ── SupplyChainTradeTransaction ──────────────────────────────────────
  let tx = "";

  // Line items before header (BASIC+)
  if (atLeast(profile, Profile.BASIC) && input.lines) {
    for (const line of input.lines) tx += buildLineItem(line, profile);
  }

  // ── ApplicableHeaderTradeAgreement ───────────────────────────────────
  let agree = "";
  if (doc.buyerReference) agree += tag("ram:BuyerReference", escapeXml(doc.buyerReference));
  agree += tag("ram:SellerTradeParty", buildParty(seller, profile));
  agree += tag("ram:BuyerTradeParty", buildParty(buyer, profile));

  if (input.sellerTaxRepresentative && atLeast(profile, Profile.BASIC_WL))
    agree += tag(
      "ram:SellerTaxRepresentativeTradeParty",
      buildParty(input.sellerTaxRepresentative, profile),
    );

  if (input.references && atLeast(profile, Profile.BASIC_WL)) {
    for (const ref of input.references) {
      const refType = ref.type ?? "order";
      if (refType === "preceding" || refType === "despatch") continue;

      const inner =
        tag("ram:IssuerAssignedID", escapeXml(ref.id)) +
        (ref.issueDate ? dateEl("ram:FormattedIssueDateTime", ref.issueDate) : "");

      switch (refType) {
        case "order":
          agree += tag("ram:BuyerOrderReferencedDocument", inner);
          break;
        case "contract":
          agree += tag("ram:ContractReferencedDocument", inner);
          break;
        case "seller-order":
          if (atLeast(profile, Profile.EN16931))
            agree += tag("ram:SellerOrderReferencedDocument", inner);
          break;
        case "project":
          if (atLeast(profile, Profile.EN16931))
            agree += tag("ram:SpecifiedProcuringProject", tag("ram:ID", escapeXml(ref.id)));
          break;
      }
    }
  }

  tx += tag("ram:ApplicableHeaderTradeAgreement", agree);

  // ── ApplicableHeaderTradeDelivery ────────────────────────────────────
  let del = "";
  if (input.delivery && atLeast(profile, Profile.BASIC_WL)) {
    if (input.delivery.partyName || input.delivery.location) {
      let sp = "";
      if (input.delivery.partyName) sp += tag("ram:Name", escapeXml(input.delivery.partyName));
      if (input.delivery.location) sp += buildAddress(input.delivery.location);
      del += tag("ram:ShipToTradeParty", sp);
    }
    if (input.delivery.date)
      del += tag(
        "ram:ActualDeliverySupplyChainEvent",
        dateEl("ram:OccurrenceDateTime", input.delivery.date),
      );
    if (input.delivery.despatchAdviceReference)
      del += tag(
        "ram:DespatchAdviceReferencedDocument",
        tag("ram:IssuerAssignedID", escapeXml(input.delivery.despatchAdviceReference)),
      );
  }

  if (input.references && atLeast(profile, Profile.BASIC_WL)) {
    for (const ref of input.references) {
      if (ref.type === "despatch") {
        let inner = tag("ram:IssuerAssignedID", escapeXml(ref.id));
        if (ref.issueDate) inner += dateEl("ram:FormattedIssueDateTime", ref.issueDate);
        del += tag("ram:DespatchAdviceReferencedDocument", inner);
      }
    }
  }

  tx += tag("ram:ApplicableHeaderTradeDelivery", del);

  // ── ApplicableHeaderTradeSettlement ──────────────────────────────────
  let sett = "";

  if (payment?.creditorReference && atLeast(profile, Profile.BASIC_WL))
    sett += tag("ram:CreditorReferenceID", escapeXml(payment.creditorReference));
  if (payment?.paymentReference && atLeast(profile, Profile.BASIC_WL))
    sett += tag("ram:PaymentReference", escapeXml(payment.paymentReference));

  if (totals.taxCurrency) sett += tag("ram:TaxCurrencyCode", escapeXml(totals.taxCurrency));
  sett += tag("ram:InvoiceCurrencyCode", escapeXml(totals.currency));

  if (input.payee && atLeast(profile, Profile.BASIC_WL))
    sett += tag("ram:PayeeTradeParty", buildParty(input.payee, profile));

  // Payment means
  if (payment?.meansCode && atLeast(profile, Profile.BASIC_WL)) {
    let pm = tag("ram:TypeCode", escapeXml(payment.meansCode));

    if (payment.iban || payment.accountId || payment.accountName) {
      let acct = "";
      if (payment.iban) acct += tag("ram:IBANID", escapeXml(payment.iban));
      if (payment.accountId) acct += tag("ram:ProprietaryID", escapeXml(payment.accountId));
      if (payment.accountName && atLeast(profile, Profile.EN16931))
        acct += tag("ram:AccountName", escapeXml(payment.accountName));
      pm += tag("ram:PayeePartyCreditorFinancialAccount", acct);
    }

    if (payment.bic && atLeast(profile, Profile.EN16931))
      pm += tag(
        "ram:PayeeSpecifiedCreditorFinancialInstitution",
        tag("ram:BICID", escapeXml(payment.bic)),
      );

    if (payment.debtorIban)
      pm += tag(
        "ram:PayerPartyDebtorFinancialAccount",
        tag("ram:IBANID", escapeXml(payment.debtorIban)),
      );

    sett += tag("ram:SpecifiedTradeSettlementPaymentMeans", pm);
  }

  // VAT breakdown
  if (input.vatBreakdown && atLeast(profile, Profile.BASIC_WL))
    for (const vb of input.vatBreakdown) sett += buildVatBreakdown(vb);

  // Billing period
  if (input.billingPeriod && atLeast(profile, Profile.BASIC_WL)) {
    let bp = "";
    if (input.billingPeriod.startDate)
      bp += dateEl("ram:StartDateTime", input.billingPeriod.startDate);
    if (input.billingPeriod.endDate) bp += dateEl("ram:EndDateTime", input.billingPeriod.endDate);
    sett += tag("ram:BillingSpecifiedPeriod", bp);
  }

  // Allowances / charges
  if (input.allowancesCharges && atLeast(profile, Profile.BASIC_WL))
    for (const ac of input.allowancesCharges) sett += buildAllowanceCharge(ac);

  // Payment terms (due date, mandate, description)
  const dueDate = payment?.dueDate ?? doc.dueDate;
  if (
    atLeast(profile, Profile.BASIC_WL) &&
    (payment?.termsDescription || dueDate || payment?.mandateId)
  ) {
    let pt = "";
    if (payment?.termsDescription)
      pt += tag("ram:Description", escapeXml(payment.termsDescription));
    if (dueDate) pt += dateEl("ram:DueDateDateTime", dueDate);
    if (payment?.mandateId) pt += tag("ram:DirectDebitMandateID", escapeXml(payment.mandateId));
    sett += tag("ram:SpecifiedTradePaymentTerms", pt);
  }

  // Monetary summation
  sett += buildMonetarySummation(totals, profile);

  // Preceding invoice references
  if (input.references && atLeast(profile, Profile.BASIC_WL)) {
    for (const ref of input.references) {
      if (ref.type === "preceding") {
        let inner = tag("ram:IssuerAssignedID", escapeXml(ref.id));
        if (ref.issueDate) inner += dateEl("ram:FormattedIssueDateTime", ref.issueDate);
        sett += tag("ram:InvoiceReferencedDocument", inner);
      }
    }
  }

  tx += tag("ram:ApplicableHeaderTradeSettlement", sett);

  // ── Root assembly ────────────────────────────────────────────────────
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    "<rsm:CrossIndustryInvoice" +
    ' xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"' +
    ' xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"' +
    ' xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"' +
    ' xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"' +
    ">" +
    tag("rsm:ExchangedDocumentContext", ctx) +
    tag("rsm:ExchangedDocument", edoc) +
    tag("rsm:SupplyChainTradeTransaction", tx) +
    "</rsm:CrossIndustryInvoice>"
  );
}
