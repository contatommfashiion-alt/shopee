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
    label: "🔥 Ofertas",
    match: (product) => product.discountRate !== null && product.discountRate > 0,
    sort: "discount",
  },
  {
    id: "rating",
    label: "⭐ Bem avaliados",
    match: (product) => product.rating !== null && product.rating >= 4.5,
    sort: "rating",
  },
  {
    id: "sales",
    label: "🛒 Mais vendidos",
    match: (product) => product.sales > 0,
    sort: "sales",
  },
  {
    id: "commission",
    label: "💰 Maior comissão",
    match: (product) => product.commissionRate !== null && product.commissionRate > 0,
    sort: "commission",
  },
  {
    id: "price20",
    label: "💸 Até R$20",
    match: (product) => product.price > 0 && product.price <= 20,
    sort: "priceAsc",
  },
  {
    id: "price50",
    label: "💸 Até R$50",
    match: (product) => product.price > 0 && product.price <= 50,
    sort: "priceAsc",
  },
  {
    id: "price100",
    label: "💸 Até R$100",
    match: (product) => product.price > 0 && product.price <= 100,
    sort: "priceAsc",
  },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "commission", label: "Maior comissão" },
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

/** Matches the query against product name and shop name. */
function matchesSearch(product: Product, search: string): boolean {
  const query = foldText(search);
  if (query === "") return true;

  const terms = query.split(/\s+/).filter((term) => term !== "");
  const haystack = `${foldText(product.name)} ${foldText(product.shopName)}`;

  return terms.every((term) => haystack.includes(term));
}

export function filterProducts(products: readonly Product[], filters: OfferFilters): Product[] {
  const quick = filters.quick ? QUICK_FILTERS.find((entry) => entry.id === filters.quick) : undefined;

  return products.filter((product) => {
    if (!matchesSearch(product, filters.search)) return false;
    if (quick && !quick.match(product)) return false;

    if (filters.minPrice !== null && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && product.price > filters.maxPrice) return false;

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
}

/** Sorts a copy of the list; missing values always sink to the bottom. */
export function sortProducts(products: readonly Product[], sort: SortOption): Product[] {
  const sorted = [...products];

  const descending = (value: number | null) => (value === null ? Number.NEGATIVE_INFINITY : value);
  const ascending = (value: number | null) => (value === null ? Number.POSITIVE_INFINITY : value);

  switch (sort) {
    case "commission":
      return sorted.sort((a, b) => descending(b.commission) - descending(a.commission));
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
): Product[] {
  return sortProducts(filterProducts(products, filters), sort);
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
