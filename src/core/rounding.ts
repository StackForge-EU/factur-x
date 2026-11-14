/**
 * Currency rounding shared by the XML builder and the input validator.
 *
 * @module core/rounding
 */

/**
 * Converts an amount to integer cents, rounding half away from zero
 * (commercial rounding, which is what EN 16931 and the schematron expect).
 *
 * `Math.round(n * 100)` alone is not enough: `76.475 * 100` is
 * `7647.499999999999` in binary floating point and would round down.
 * `toPrecision(15)` drops that noise before rounding, as a double only
 * carries 15 reliable significant digits.
 */
export function toCents(n: number): number {
  const cents = Math.round(Number((Math.abs(n) * 100).toPrecision(15)));
  return n < 0 ? -cents : cents;
}

/** Rounds an amount to two decimals, half away from zero. See {@link toCents}. */
export function roundHalfUp(n: number): number {
  return toCents(n) / 100;
}

/**
 * Derives the invoice line net amount (BT-131) for lines that omit
 * `lineTotal`: invoiced quantity (BT-129) × net unit price (BT-146), divided
 * by the price base quantity (BT-149) when the price covers more than one
 * unit. Rounded per line, as the amount is written to the XML with two
 * decimals and BR-CO-10 sums those written amounts.
 */
export function deriveLineNet(line: {
  quantity: number;
  unitPrice: number;
  basisQuantity?: number;
}): number {
  return roundHalfUp((line.quantity * line.unitPrice) / (line.basisQuantity ?? 1));
}
