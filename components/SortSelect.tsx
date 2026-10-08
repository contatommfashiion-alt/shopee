"use client";

import { SORT_OPTIONS } from "@/lib/filters";
import type { SortOption } from "@/lib/types";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  /** Number of products currently visible, shown next to the control. */
  resultCount: number;
}

export default function SortSelect({ value, onChange, resultCount }: SortSelectProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <label htmlFor="sort-select" className="shrink-0 text-sm text-slate-600">
          Ordenar por
        </label>

        <select
          id="sort-select"
          value={value}
          onChange={(event) => onChange(event.target.value as SortOption)}
          className="rounded-sm border-0 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-[0_1px_1px_rgba(0,0,0,0.05)] focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-slate-600" aria-live="polite">
        <span className="font-medium text-brand-600">{resultCount}</span>{" "}
        {resultCount === 1 ? "oferta" : "ofertas"}
      </p>
    </div>
  );
}
