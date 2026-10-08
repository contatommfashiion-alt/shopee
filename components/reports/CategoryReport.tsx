"use client";

import { Trophy } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { CategoryPerformance } from "@/lib/report-types";

interface CategoryReportProps {
  categories: CategoryPerformance[];
  level: 1 | 2 | 3;
  onLevelChange: (level: 1 | 2 | 3) => void;
}

/**
 * Categorias que mais vendem.
 *
 * Começa em `globalCategoryLv1Name`; os níveis 2 e 3 ficam disponíveis no
 * seletor. Comissão do nível de ITEM.
 */
export default function CategoryReport({ categories, level, onLevelChange }: CategoryReportProps) {
  if (categories.length === 0) return null;

  return (
    <section className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Categorias que mais vendem
        </h3>

        <div className="flex items-center gap-2">
          <label htmlFor="categoria-nivel" className="text-xs text-slate-500">
            Nível
          </label>
          <select
            id="categoria-nivel"
            value={level}
            onChange={(event) => onLevelChange(Number(event.target.value) as 1 | 2 | 3)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {categories.slice(0, 10).map((entry) => (
          <li key={entry.category} className="flex items-center justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900" title={entry.category}>
                {entry.category}
              </p>
              <p className="text-xs text-slate-500">
                {entry.items} {entry.items === 1 ? "item" : "itens"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-slate-900">{formatBRL(entry.amount)}</p>
              <p className="text-xs font-semibold text-brand-700">{formatBRL(entry.commission)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
