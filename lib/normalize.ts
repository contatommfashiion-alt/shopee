import type {
  PageInfo,
  Product,
  ShopeePageInfo,
  ShopeeProductOffer,
} from "./types";

/**
 * Parses a value that Shopee may send as a number OR as a string
 * (confirmed: `price: "17.89"`, `commissionRate: "0.13"`).
 *
 * Returns `null` for anything that is not a finite number, so `NaN` can never
 * reach the browser.
 */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/** Same as `toNumber`, but falls back to `fallback` instead of `null`. */
export function toNumberOr(value: unknown, fallback: number): number {
  return toNumber(value) ?? fallback;
}

/** Trims a string field and turns empty values into `null`. */
export function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** A fraction such as `commissionRate`, clamped to the sane 0-1 range. */
function toRate(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null || parsed < 0) return null;
  return parsed > 1 ? 1 : parsed;
}

/**
 * Normalizes `priceDiscountRate` to a percentage in the 0-100 range.
 *
 * A introspecção do schema confirmou o tipo: `priceDiscountRate: Int!`. Sendo
 * inteiro, `35` significa 35% — não existe a forma fracionária `0.35`. A
 * conversão de fração continua aqui só como defesa: se o campo chegar como
 * string decimal em algum caso, vira percentual em vez de sumir.
 *
 *   - `value >= 1`     -> já é percentual: `35` -> 35%
 *   - `0 < value < 1`  -> fração defensiva:  `"0.35"` -> 35%
 *   - `value <= 0`, inválido ou `> 100` -> `null` (nenhum selo é exibido)
 */
export function normalizeDiscountRate(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null || parsed <= 0) return null;

  const percent = parsed < 1 ? parsed * 100 : parsed;
  if (percent > 100) return null;

  return Math.round(percent * 100) / 100;
}

/** A rating is only meaningful inside 0-5. */
function normalizeRating(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null || parsed <= 0 || parsed > 5) return null;
  return Math.round(parsed * 100) / 100;
}

/** `productCatIds` -> plain numbers, dropping anything unparseable. */
function normalizeCategoryIds(value: ShopeeProductOffer["productCatIds"]): number[] {
  if (!Array.isArray(value)) return [];

  const ids: number[] = [];
  for (const raw of value) {
    const parsed = toNumber(raw);
    if (parsed !== null) ids.push(parsed);
  }

  return ids;
}

/**
 * Converts one raw offer into a `Product`.
 *
 * Returns `null` when the offer cannot be used by the app, i.e. it is missing an
 * id, a name or any shareable link — those are the three things every message
 * template needs.
 */
export function normalizeProduct(raw: ShopeeProductOffer | null | undefined): Product | null {
  if (!raw || typeof raw !== "object") return null;

  const itemIdNumber = toNumber(raw.itemId);
  const itemId = itemIdNumber !== null ? itemIdNumber.toString() : toText(raw.itemId);
  const name = toText(raw.productName);
  const productLink = toText(raw.productLink);
  const offerLink = toText(raw.offerLink);

  if (!itemId || !name || (!productLink && !offerLink)) return null;

  const price = toNumberOr(raw.price, 0);
  const commissionRate = toRate(raw.commissionRate);

  // Shopee already sends `commission` in BRL (confirmed: price 17.89 and
  // commissionRate 0.13 came back as commission "2.3257"). When it is absent we
  // derive it from price x rate so the card still shows an estimate.
  const reportedCommission = toNumber(raw.commission);
  const commission =
    reportedCommission !== null
      ? reportedCommission
      : commissionRate !== null
        ? Math.round(price * commissionRate * 10000) / 10000
        : null;

  return {
    itemId,
    name,
    image: toText(raw.imageUrl),
    shopName: toText(raw.shopName) ?? "Loja não informada",
    price,
    priceMin: toNumber(raw.priceMin),
    priceMax: toNumber(raw.priceMax),
    discountRate: normalizeDiscountRate(raw.priceDiscountRate),
    rating: normalizeRating(raw.ratingStar),
    sales: Math.max(0, Math.round(toNumberOr(raw.sales, 0))),
    commissionRate,
    commission,
    sellerCommissionRate: toRate(raw.sellerCommissionRate),
    shopeeCommissionRate: toRate(raw.shopeeCommissionRate),
    // At least one of the two is present (guarded above).
    productLink: productLink ?? (offerLink as string),
    offerLink,
    categoryIds: normalizeCategoryIds(raw.productCatIds),
  };
}

/** Normalizes a list of raw offers, dropping the unusable ones. */
export function normalizeProducts(
  nodes: readonly (ShopeeProductOffer | null)[] | null | undefined,
): Product[] {
  if (!Array.isArray(nodes)) return [];

  const products: Product[] = [];
  for (const node of nodes) {
    const product = normalizeProduct(node);
    if (product) products.push(product);
  }

  return products;
}

/** Normalizes `pageInfo`, with safe defaults for a first page. */
export function normalizePageInfo(raw: ShopeePageInfo | null | undefined): PageInfo {
  return {
    page: Math.max(1, Math.round(toNumberOr(raw?.page, 1))),
    limit: Math.max(0, Math.round(toNumberOr(raw?.limit, 0))),
    hasNextPage: raw?.hasNextPage === true,
    scrollId: toText(raw?.scrollId),
  };
}
