/**
 * Format a monetary amount for display, e.g. "1,200 د.ج".
 *
 * The platform's only currency is the Algerian dinar (DZD). We format the
 * number with Intl.NumberFormat (grouping only, Latin digits to match
 * formatDate) and append the literal Arabic label ourselves, because
 * `Intl.NumberFormat(..., { style: "currency", currency: "DZD" })` renders
 * inconsistently ("DZD" vs "د.ج") depending on locale/ICU data.
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("ar-u-nu-latn", {
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} د.ج`;
}
