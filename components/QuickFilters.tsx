"use client";

import { Flame, ShoppingCart, Star, Tag, Wallet, type LucideIcon } from "lucide-react";
import { QUICK_FILTERS } from "@/lib/filters";
import type { QuickFilterId } from "@/lib/types";

interface QuickFiltersProps {
  active: QuickFilterId | null;
  onChange: (id: QuickFilterId | null) => void;
}

/**
 * Ícones dos atalhos.
 *
 * Mesma família de traço da navegação lateral, no lugar dos emojis — assim a
 * aba inteira lê como um sistema só.
 */
const ICONS: Record<QuickFilterId, LucideIcon> = {
  offers: Flame,
  rating: Star,
  sales: ShoppingCart,
  commission: Wallet,
  price20: Tag,
  price50: Tag,
  price100: Tag,
};

/** Atalhos de um toque. Tocar no ativo limpa. */
export default function QuickFilters({ active, onChange }: QuickFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filtros rápidos"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {QUICK_FILTERS.map((filter) => {
        const isActive = active === filter.id;
        const Icon = ICONS[filter.id];

        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(isActive ? null : filter.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition ${
              isActive
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`}
              aria-hidden="true"
            />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
