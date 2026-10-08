"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { OfferFilters } from "@/lib/types";

/** The six numeric fields of the advanced panel. */
export type AdvancedValues = Pick<
  OfferFilters,
  "minPrice" | "maxPrice" | "minDiscount" | "minRating" | "minSales" | "minCommission"
>;

interface AdvancedFiltersProps {
  /**
   * Applied values. Used for the initial draft and the "active" counter.
   *
   * When the filters are cleared from somewhere else (the empty state has its
   * own button), the parent remounts this component through a `key`, which is
   * React's own way of resetting local state without a syncing effect.
   */
  value: AdvancedValues;
  onApply: (values: AdvancedValues) => void;
  onClear: () => void;
}

type DraftState = Record<keyof AdvancedValues, string>;

const FIELDS: {
  key: keyof AdvancedValues;
  label: string;
  placeholder: string;
  step: string;
  max?: string;
}[] = [
  { key: "minPrice", label: "Preço mínimo (R$)", placeholder: "0", step: "0.01" },
  { key: "maxPrice", label: "Preço máximo (R$)", placeholder: "Sem limite", step: "0.01" },
  { key: "minDiscount", label: "Desconto mínimo (%)", placeholder: "0", step: "1", max: "100" },
  { key: "minRating", label: "Avaliação mínima (0-5)", placeholder: "0", step: "0.1", max: "5" },
  { key: "minSales", label: "Vendas mínimas", placeholder: "0", step: "1" },
  { key: "minCommission", label: "Comissão mínima (%)", placeholder: "0", step: "0.5", max: "100" },
];

const EMPTY_DRAFT: DraftState = {
  minPrice: "",
  maxPrice: "",
  minDiscount: "",
  minRating: "",
  minSales: "",
  minCommission: "",
};

function toDraft(values: AdvancedValues): DraftState {
  return {
    minPrice: values.minPrice === null ? "" : String(values.minPrice),
    maxPrice: values.maxPrice === null ? "" : String(values.maxPrice),
    minDiscount: values.minDiscount === null ? "" : String(values.minDiscount),
    minRating: values.minRating === null ? "" : String(values.minRating),
    minSales: values.minSales === null ? "" : String(values.minSales),
    minCommission: values.minCommission === null ? "" : String(values.minCommission),
  };
}

/** Empty, negative or unparseable input means "no limit". */
function parseField(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parsed;
}

export default function AdvancedFilters({ value, onApply, onClear }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => toDraft(value));

  const activeCount = Object.values(value).filter((entry) => entry !== null).length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Min above max is a typo: swap them here too, so the fields show what applies.
    let minPrice = parseField(draft.minPrice);
    let maxPrice = parseField(draft.maxPrice);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
      setDraft((previous) => ({ ...previous, minPrice: previous.maxPrice, maxPrice: previous.minPrice }));
    }

    onApply({
      minPrice,
      maxPrice,
      minDiscount: parseField(draft.minDiscount),
      minRating: parseField(draft.minRating),
      minSales: parseField(draft.minSales),
      minCommission: parseField(draft.minCommission),
    });
  }

  function handleClear() {
    setDraft(EMPTY_DRAFT);
    onClear();
  }

  return (
    <div className="rounded-sm bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls="advanced-filters-panel"
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
          <SlidersHorizontal className="h-4 w-4 text-brand-500" aria-hidden="true" />
          Filtros avançados
          {activeCount > 0 ? (
            <span className="rounded-sm bg-brand-600 px-1.5 py-px text-[11px] font-medium text-white">
              {activeCount}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div id="advanced-filters-panel" hidden={!open}>
        <form onSubmit={handleSubmit} className="border-t border-slate-100 p-3">
          {/* One column in the narrow left sidebar from `lg` up. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label htmlFor={`filter-${field.key}`} className="text-xs font-medium text-slate-600">
                  {field.label}
                </label>
                <input
                  id={`filter-${field.key}`}
                  name={field.key}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={field.max}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={draft[field.key]}
                  onChange={(event) =>
                    setDraft((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                  className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2 lg:flex-col">
            <button
              type="submit"
              className="flex-1 rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 active:bg-brand-800"
            >
              APLICAR
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="rounded-sm border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              LIMPAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
