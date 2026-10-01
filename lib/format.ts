/**
 * pt-BR formatters.
 *
 * These are implemented by hand instead of with `Intl.NumberFormat` on purpose:
 * the output is byte-for-byte deterministic (no locale data, no non-breaking
 * spaces), which matters because the same strings are pasted into WhatsApp
 * messages and asserted in tests.
 */

/** `17.89` -> `"R$ 17,89"`, `1234.5` -> `"R$ 1.234,50"`. */
export function formatBRL(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  const negative = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const integerPart = Math.floor(cents / 100).toString();
  const decimalPart = (cents % 100).toString().padStart(2, "0");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${negative ? "-" : ""}R$ ${grouped},${decimalPart}`;
}

/** `14045` -> `"14 mil"`, `8400` -> `"8,4 mil"`, `999` -> `"999"`. */
export function formatSales(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "0";
  if (value < 1000) return Math.round(value).toString();
  // The 999_500 cut-off avoids "1000 mil": anything that would round up to a
  // million is rendered in millions instead.
  if (value < 999_500) return `${compact(value / 1000)} mil`;
  return `${compact(value / 1_000_000)} mi`;
}

/** Keeps one decimal below 10 and rounds to an integer from 10 up. */
function compact(value: number): string {
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toString().replace(".", ",");
}

/**
 * Formats a FRACTION as a percentage: `0.13` -> `"13%"`, `0.1` -> `"10%"`.
 * Use this for `commissionRate` / `sellerCommissionRate` / `shopeeCommissionRate`,
 * which Shopee returns as fractions. For discounts use `formatDiscount`.
 */
export function formatPercentage(fraction: number | null | undefined): string {
  if (typeof fraction !== "number" || !Number.isFinite(fraction)) return "—";

  const percent = Math.round(fraction * 1000) / 10;
  const text = Number.isInteger(percent) ? percent.toString() : percent.toString().replace(".", ",");

  return `${text}%`;
}

/**
 * Formats an already-normalized PERCENTAGE (0-100): `35` -> `"35%"`.
 * Feed it the output of `normalizeDiscountRate`, never the raw API field.
 */
export function formatDiscount(percent: number | null | undefined): string {
  if (typeof percent !== "number" || !Number.isFinite(percent)) return "—";

  const rounded = Math.round(percent * 10) / 10;
  const text = Number.isInteger(rounded) ? rounded.toString() : rounded.toString().replace(".", ",");

  return `${text}%`;
}

/** `4.6` -> `"4,6"`, `5` -> `"5,0"`. */
export function formatRating(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return (Math.round(value * 10) / 10).toFixed(1).replace(".", ",");
}
