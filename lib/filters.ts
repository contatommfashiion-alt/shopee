import type { OfferFilters, Product, QuickFilterId, SortOption } from "./types";

/**
 * Local search / filtering / sorting.
 *
 * Everything here runs on the products already returned by `GET /api/offers`,
 * because `productOfferV2` is called without arguments in this version.
 *
 * TODO: when the official arguments of `productOfferV2` are confirmed, move
 * these predicates to the server and keep this module only as a fallback.
 */

export const EMPTY_FILTERS: OfferFilters = {
  search: "",
  quick: null,
  minPrice: null,
  maxPrice: null,
  minDiscount: null,
  minRating: null,
  minSales: null,
  minCommission: null,
};

/**
 * Os rótulos não têm emoji: o ícone fica a cargo de `QuickFilters.tsx`, com os
 * mesmos ícones de traço usados na navegação. Assim este módulo segue puro,
 * sem depender de componentes.
 */
export interface QuickFilterDefinition {
  id: QuickFilterId;
  label: string;
  /** Extra predicate applied on top of the advanced filters. */
  match: (product: Product) => boolean;
  /** Sorting the shortcut switches to, so the result reads as expected. */
  sort: SortOption;
}

export const QUICK_FILTERS: QuickFilterDefinition[] = [
  {
    id: "offers",
    label: "Ofertas",
    match: (product) => product.discountRate !== null && product.discountRate > 0,
    sort: "discount",
  },
  {
    id: "rating",
    label: "Bem avaliados",
    match: (product) => product.rating !== null && product.rating >= 4.5,
    sort: "rating",
  },
  {
    id: "sales",
    label: "Mais vendidos",
    match: (product) => product.sales > 0,
    sort: "sales",
  },
  {
    id: "commission",
    label: "Maior comissão",
    match: (product) => product.commissionRate !== null && product.commissionRate > 0,
    sort: "commission",
  },
  {
    id: "price20",
    label: "Até R$ 20",
    match: (product) => product.price > 0 && product.price <= 20,
    sort: "priceAsc",
  },
  {
    id: "price50",
    label: "Até R$ 50",
    match: (product) => product.price > 0 && product.price <= 50,
    sort: "priceAsc",
  },
  {
    id: "price100",
    label: "Até R$ 100",
    match: (product) => product.price > 0 && product.price <= 100,
    sort: "priceAsc",
  },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "commission", label: "Maior comissão (R$)" },
  { value: "commissionRate", label: "Maior comissão (%)" },
  { value: "discount", label: "Maior desconto" },
  { value: "sales", label: "Mais vendidos" },
  { value: "rating", label: "Melhor avaliação" },
  { value: "priceAsc", label: "Menor preço" },
  { value: "priceDesc", label: "Maior preço" },
];

/** Lowercases and strips accents so "cafe" matches "Café". */
function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Portuguese plural endings (accents already folded) and their singular.
 * Lets "camisetas" find "camiseta", "botoes" find "botão", "jornais" find
 * "jornal". The singular query already finds plurals, since it is a substring.
 */
const PLURAL_ENDINGS: [RegExp, string][] = [
  [/oes$/, "ao"],
  [/aes$/, "ao"],
  [/ais$/, "al"],
  [/eis$/, "el"],
  [/ns$/, "m"],
  [/es$/, ""],
  [/s$/, ""],
];

/** The term itself plus its possible singular forms. */
function termVariants(term: string): string[] {
  const variants = [term];
  if (term.length <= 3) return variants;

  for (const [ending, singular] of PLURAL_ENDINGS) {
    if (ending.test(term)) variants.push(term.replace(ending, singular));
  }

  return variants;
}

function searchTerms(search: string): string[][] {
  return foldText(search)
    .split(/\s+/)
    .filter((term) => term !== "")
    .map(termVariants);
}

/** How many search terms appear in the product name or shop name. */
function searchScore(product: Product, terms: string[][]): number {
  const haystack = `${foldText(product.name)} ${foldText(product.shopName)}`;

  return terms.filter((variants) => variants.some((variant) => haystack.includes(variant))).length;
}

/**
 * Products that contain every search term. When none does, falls back to the
 * ones sharing the most terms, so "tênis azul" still shows tênis instead of an
 * empty grid. `partial` tells the screen it is showing that fallback.
 */
function searchProducts(products: Product[], search: string): { products: Product[]; partial: boolean } {
  const terms = searchTerms(search);
  if (terms.length === 0) return { products, partial: false };

  const scored = products.map((product) => ({ product, score: searchScore(product, terms) }));
  const best = scored.reduce((max, entry) => Math.max(max, entry.score), 0);

  if (best === 0) return { products: [], partial: false };

  return {
    products: scored.filter((entry) => entry.score === best).map((entry) => entry.product),
    partial: best < terms.length,
  };
}

export interface FilterResult {
  products: Product[];
  /** `true` when no product had every search word and the closest ones are shown. */
  partialSearch: boolean;
}

export function filterProducts(products: readonly Product[], filters: OfferFilters): FilterResult {
  const quick = filters.quick ? QUICK_FILTERS.find((entry) => entry.id === filters.quick) : undefined;

  // A min above the max is a typo, not a request for nothing: swap them.
  let { minPrice, maxPrice } = filters;
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const matching = products.filter((product) => {
    if (quick && !quick.match(product)) return false;

    if (minPrice !== null && product.price < minPrice) return false;
    if (maxPrice !== null && product.price > maxPrice) return false;

    if (filters.minDiscount !== null) {
      if (product.discountRate === null || product.discountRate < filters.minDiscount) return false;
    }

    if (filters.minRating !== null) {
      if (product.rating === null || product.rating < filters.minRating) return false;
    }

    if (filters.minSales !== null && product.sales < filters.minSales) return false;

    if (filters.minCommission !== null) {
      // The form asks for a percentage; `commissionRate` is a fraction.
      const commissionPercent = product.commissionRate === null ? null : product.commissionRate * 100;
      if (commissionPercent === null || commissionPercent < filters.minCommission) return false;
    }

    return true;
  });

  const searched = searchProducts(matching, filters.search);

  return { products: searched.products, partialSearch: searched.partial };
}

/** Sorts a copy of the list; missing values always sink to the bottom. */
export function sortProducts(products: readonly Product[], sort: SortOption): Product[] {
  const sorted = [...products];

  const descending = (value: number | null) => (value === null ? Number.NEGATIVE_INFINITY : value);
  const ascending = (value: number | null) => (value === null ? Number.POSITIVE_INFINITY : value);

  switch (sort) {
    case "commission":
      return sorted.sort((a, b) => descending(b.commission) - descending(a.commission));
    case "commissionRate":
      return sorted.sort((a, b) => descending(b.commissionRate) - descending(a.commissionRate));
    case "discount":
      return sorted.sort((a, b) => descending(b.discountRate) - descending(a.discountRate));
    case "sales":
      return sorted.sort((a, b) => b.sales - a.sales);
    case "rating":
      return sorted.sort((a, b) => descending(b.rating) - descending(a.rating));
    case "priceAsc":
      return sorted.sort((a, b) => ascending(a.price) - ascending(b.price));
    case "priceDesc":
      return sorted.sort((a, b) => descending(b.price) - descending(a.price));
    default:
      return sorted;
  }
}

export function applyFilters(
  products: readonly Product[],
  filters: OfferFilters,
  sort: SortOption,
): FilterResult {
  const filtered = filterProducts(products, filters);

  return { ...filtered, products: sortProducts(filtered.products, sort) };
}

/** True when any filter is narrowing the list (drives the empty state copy). */
export function hasActiveFilters(filters: OfferFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.quick !== null ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.minDiscount !== null ||
    filters.minRating !== null ||
    filters.minSales !== null ||
    filters.minCommission !== null
  );
}
