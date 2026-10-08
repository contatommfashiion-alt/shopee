"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import AdvancedFilters, { type AdvancedValues } from "./AdvancedFilters";
import EmptyState from "./EmptyState";
import NicheFilter from "./NicheFilter";
import OfferModal from "./OfferModal";
import ProductCard from "./ProductCard";
import QuickFilters from "./QuickFilters";
import SortSelect from "./SortSelect";
import { EMPTY_FILTERS, QUICK_FILTERS, applyFilters, hasActiveFilters } from "@/lib/filters";
import { normalizeKeyword } from "@/lib/shopee-query";
import type { OfferFilters, Product, QuickFilterId, SortOption } from "@/lib/types";

interface OffersSectionProps {
  products: Product[];
  /** O que está digitado na busca do cabeçalho, que fica no `AppShell`. */
  search: string;
  /** A busca já enviada à Shopee; `products` são o resultado dela. */
  keyword: string;
  onSearchChange: (search: string) => void;
  onSearchSubmit: (search: string) => void;
  /** Nicho em uso; `null` traz todos. Vai na consulta à Shopee. */
  niche: number | null;
  onNicheChange: (productCatId: number | null) => void;
  loadingNiche: boolean;
}

/**
 * Filtering, sorting and the offer grid, laid out like a Shopee results page:
 * filters in a left column, a gray sort bar and the grid on the right.
 *
 * The keyword and the niche go to Shopee; everything else runs locally over
 * the products it returned. While the user types a new term, the loaded
 * offers are narrowed locally as a preview. Once that term has been sent, the
 * local text filter steps aside: Shopee's own matching is looser ("airfryer"
 * finds "Air Fryer") and filtering again would hide those results.
 */
export default function OffersSection({
  products,
  search,
  keyword,
  onSearchChange,
  onSearchSubmit,
  niche,
  onNicheChange,
  loadingNiche,
}: OffersSectionProps) {
  const [ownFilters, setFilters] = useState<OfferFilters>(EMPTY_FILTERS);
  const [filtersKey, setFiltersKey] = useState(0);
  const [sort, setSort] = useState<SortOption>("commission");
  const [selected, setSelected] = useState<Product | null>(null);

  const typed = normalizeKeyword(search);
  /** Typed but not sent yet: Enter would ask Shopee for it. */
  const pendingSearch = typed !== keyword ? typed : "";
  const localSearch = typed === keyword ? "" : search;

  const filters = useMemo(() => ({ ...ownFilters, search: localSearch }), [ownFilters, localSearch]);

  const { products: visibleProducts, partialSearch } = useMemo(
    () => applyFilters(products, filters, sort),
    [products, filters, sort],
  );

  const advancedValues: AdvancedValues = useMemo(
    () => ({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minDiscount: filters.minDiscount,
      minRating: filters.minRating,
      minSales: filters.minSales,
      minCommission: filters.minCommission,
    }),
    [filters],
  );

  const handleQuickFilter = useCallback((id: QuickFilterId | null) => {
    setFilters((previous) => ({ ...previous, quick: id }));

    // Each shortcut also switches the visible sorting, so the result reads the
    // way the label promises. The user can still change it afterwards.
    const definition = id === null ? undefined : QUICK_FILTERS.find((entry) => entry.id === id);
    if (definition) setSort(definition.sort);
  }, []);

  const handleApplyAdvanced = useCallback((values: AdvancedValues) => {
    setFilters((previous) => ({ ...previous, ...values }));
  }, []);

  const handleClearAdvanced = useCallback(() => {
    setFilters((previous) => ({
      ...EMPTY_FILTERS,
      search: previous.search,
      quick: previous.quick,
    }));
  }, []);

  /** Clears everything and remounts the advanced panel so its inputs reset too. */
  const handleClearAll = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    onSearchChange("");
    onSearchSubmit("");
    setFiltersKey((key) => key + 1);
  }, [onSearchChange, onSearchSubmit]);

  return (
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-5">
      <aside aria-label="Filtros" className="mb-4 space-y-3 lg:mb-0">
        <h2 className="hidden items-center gap-2 border-b border-slate-200 pb-3 text-sm font-bold text-slate-800 uppercase lg:flex">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtro de busca
        </h2>

        <NicheFilter value={niche} onChange={onNicheChange} loading={loadingNiche} />

        <AdvancedFilters
          key={filtersKey}
          value={advancedValues}
          onApply={handleApplyAdvanced}
          onClear={handleClearAdvanced}
        />
      </aside>

      <section aria-labelledby="offers-title" className="min-w-0 space-y-3">
        <h2
          id="offers-title"
          className="truncate border-b-4 border-brand-500 bg-white px-4 py-3 text-sm font-medium text-brand-600 uppercase"
        >
          {keyword !== "" ? `Resultados para "${keyword}"` : "Ofertas do dia"}
        </h2>

        {pendingSearch !== "" ? (
          <button
            type="button"
            onClick={() => onSearchSubmit(pendingSearch)}
            className="flex w-full items-center gap-2 rounded-sm border border-brand-200 bg-brand-50 px-4 py-2.5 text-left text-sm text-brand-700 transition hover:bg-brand-100"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              Mostrando só o que já carregou. Aperte <strong className="font-medium">Enter</strong>{" "}
              ou toque aqui para buscar <strong className="font-medium">&quot;{pendingSearch}&quot;</strong>{" "}
              na Shopee.
            </span>
          </button>
        ) : null}

        {partialSearch ? (
          <p className="rounded-sm bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            Nenhuma oferta tem todas as palavras. Mostrando as que mais se aproximam.
          </p>
        ) : null}

        <div className="space-y-3 rounded-sm bg-[#ededed] px-4 py-3">
          <QuickFilters active={filters.quick} onChange={handleQuickFilter} />
          <SortSelect value={sort} onChange={setSort} resultCount={visibleProducts.length} />
        </div>

        {visibleProducts.length === 0 ? (
          <EmptyState
            filtered={products.length > 0 && hasActiveFilters(filters)}
            keyword={keyword}
            onClearFilters={handleClearAll}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={product.itemId}
                product={product}
                priority={index < 5}
                onCreateOffer={setSelected}
              />
            ))}
          </div>
        )}
      </section>

      {selected ? <OfferModal product={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
