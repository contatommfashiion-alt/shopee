"use client";

import { ArrowUpDown } from "lucide-react";
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
      <p className="text-sm text-slate-600" aria-live="polite">
        <span className="font-semibold text-slate-900">{resultCount}</span>{" "}
        {resultCount === 1 ? "oferta" : "ofertas"}
      </p>

      <div className="flex items-center gap-2">
        <label htmlFor="sort-select" className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <ArrowUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Ordenar por:
        </label>

        <select
          id="sort-select"
          value={value}
          onChange={(event) => onChange(event.target.value as SortOption)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
