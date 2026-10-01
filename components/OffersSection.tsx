"use client";

import { useCallback, useMemo, useState } from "react";
import AdvancedFilters, { type AdvancedValues } from "./AdvancedFilters";
import EmptyState from "./EmptyState";
import NicheFilter from "./NicheFilter";
import OfferModal from "./OfferModal";
import ProductCard from "./ProductCard";
import QuickFilters from "./QuickFilters";
import SearchBar from "./SearchBar";
import SortSelect from "./SortSelect";
import { EMPTY_FILTERS, QUICK_FILTERS, applyFilters, hasActiveFilters } from "@/lib/filters";
import type { OfferFilters, Product, QuickFilterId, SortOption } from "@/lib/types";

interface OffersSectionProps {
  products: Product[];
  /** Nicho em uso; `null` traz todos. Vai na consulta à Shopee. */
  niche: number | null;
  onNicheChange: (productCatId: number | null) => void;
  loadingNiche: boolean;
}

/**
 * Search, filtering, sorting and the offer grid.
 *
 * All of it runs locally over the products already returned by `/api/offers`,
 * because `productOfferV2` is called without arguments in this version.
 */
export default function OffersSection({
  products,
  niche,
  onNicheChange,
  loadingNiche,
}: OffersSectionProps) {
  const [filters, setFilters] = useState<OfferFilters>(EMPTY_FILTERS);
  const [filtersKey, setFiltersKey] = useState(0);
  const [sort, setSort] = useState<SortOption>("commission");
  const [selected, setSelected] = useState<Product | null>(null);

  const visibleProducts = useMemo(
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
    setFiltersKey((key) => key + 1);
  }, []);

  return (
    <div className="space-y-4">
      <SearchBar
        value={filters.search}
        onChange={(search) => setFilters((previous) => ({ ...previous, search }))}
      />

      <NicheFilter value={niche} onChange={onNicheChange} loading={loadingNiche} />

      <QuickFilters active={filters.quick} onChange={handleQuickFilter} />

      <AdvancedFilters
        key={filtersKey}
        value={advancedValues}
        onApply={handleApplyAdvanced}
        onClear={handleClearAdvanced}
      />

      <SortSelect value={sort} onChange={setSort} resultCount={visibleProducts.length} />

      {visibleProducts.length === 0 ? (
        <EmptyState
          filtered={products.length > 0 && hasActiveFilters(filters)}
          onClearFilters={handleClearAll}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={product.itemId}
              product={product}
              priority={index < 4}
              onCreateOffer={setSelected}
            />
          ))}
        </div>
      )}

      {selected ? <OfferModal product={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
