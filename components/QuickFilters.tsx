"use client";

import { QUICK_FILTERS } from "@/lib/filters";
import type { QuickFilterId } from "@/lib/types";

interface QuickFiltersProps {
  active: QuickFilterId | null;
  onChange: (id: QuickFilterId | null) => void;
}

/** One-tap shortcuts. Tapping the active one clears it. */
export default function QuickFilters({ active, onChange }: QuickFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filtros rápidos"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {QUICK_FILTERS.map((filter) => {
        const isActive = active === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(isActive ? null : filter.id)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition ${
              isActive
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
