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
 * Mesma família de traço da navegação, no lugar dos emojis — assim a aba
 * inteira lê como um sistema só.
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

/**
 * Atalhos de um toque, como os botões da barra "Ordenar por" da Shopee.
 * Tocar no ativo limpa.
 */
export default function QuickFilters({ active, onChange }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden shrink-0 text-sm text-slate-600 sm:inline">Atalhos</span>

      <div
        role="group"
        aria-label="Filtros rápidos"
        className="flex min-w-0 flex-wrap gap-2"
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
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[13px] whitespace-nowrap sm:px-3 sm:text-sm shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`}
                aria-hidden="true"
              />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
