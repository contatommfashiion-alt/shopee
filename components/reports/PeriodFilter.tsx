"use client";

import { Info } from "lucide-react";
import { formatDate } from "@/lib/report-formatters";
import {
  API_MAX_WINDOW_DAYS,
  PERIOD_OPTIONS,
  earliestDateInputValue,
  todayDateInputValue,
} from "@/lib/report-period";
import type { ResolvedWindow } from "@/lib/report-period";
import type { CustomRange, PeriodId } from "@/lib/report-types";

interface PeriodFilterProps {
  period: PeriodId;
  custom: CustomRange;
  onPeriodChange: (period: PeriodId) => void;
  onCustomChange: (range: CustomRange) => void;
  /** O período que de fato foi enviado à Shopee. */
  window: ResolvedWindow;
  /** Conversões recebidas para esse período. */
  loaded: number;
  busy: boolean;
}

/**
 * Filtro de período.
 *
 * Diferente da versão anterior, este filtro **vai na consulta**
 * (`purchaseTimeStart` / `purchaseTimeEnd`), então trocar o período refaz a
 * busca. O rodapé mostra o intervalo realmente consultado e avisa quando ele
 * foi recortado pelo limite de 3 meses da Shopee.
 */
export default function PeriodFilter({
  period,
  custom,
  onPeriodChange,
  onCustomChange,
  window: resolved,
  loaded,
  busy,
}: PeriodFilterProps) {
  const today = new Date();
  const minDate = earliestDateInputValue(today);
  const maxDate = todayDateInputValue(today);

  return (
    <section className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm">
      <div role="group" aria-label="Período" className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const isActive = period === option.id;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              disabled={busy}
              onClick={() => onPeriodChange(option.id)}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                isActive
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {period === "personalizado" ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="periodo-de" className="text-xs font-medium text-slate-600">
              De
            </label>
            <input
              id="periodo-de"
              type="date"
              min={minDate}
              max={maxDate}
              value={custom.from}
              onChange={(event) => onCustomChange({ ...custom, from: event.target.value })}
              className="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="periodo-ate" className="text-xs font-medium text-slate-600">
              Até
            </label>
            <input
              id="periodo-ate"
              type="date"
              min={minDate}
              max={maxDate}
              value={custom.to}
              onChange={(event) => onCustomChange({ ...custom, to: event.target.value })}
              className="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />

        <div className="space-y-1">
          <p>
            Consultando de{" "}
            <strong className="font-semibold text-slate-700">{formatDate(resolved.from)}</strong> a{" "}
            <strong className="font-semibold text-slate-700">{formatDate(resolved.to)}</strong> —{" "}
            <strong className="font-semibold text-slate-700">{loaded}</strong>{" "}
            {loaded === 1 ? "conversão" : "conversões"}.
          </p>

          {resolved.clampedStart ? (
            <p className="text-amber-700">
              O início foi ajustado: a Shopee só devolve conversões dos últimos{" "}
              {API_MAX_WINDOW_DAYS} dias.
            </p>
          ) : null}

          {resolved.incompleteCustom ? (
            <p>Preencha as duas datas para limitar o período. Por ora, mostrando o máximo.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
