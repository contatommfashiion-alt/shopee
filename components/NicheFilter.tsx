"use client";

import { Layers, Loader2 } from "lucide-react";
import { NICHES } from "@/lib/categories";

interface NicheFilterProps {
  /** `null` = todos os nichos. */
  value: number | null;
  onChange: (productCatId: number | null) => void;
  loading: boolean;
}

/**
 * Filtro de nicho.
 *
 * Diferente da busca e dos filtros avançados, este **vai na consulta**
 * (`productOfferV2(productCatId:)`), então trocar o nicho busca ofertas novas na
 * Shopee em vez de recortar as já carregadas.
 *
 * Os ids vêm de `lib/categories.ts`, verificados contra o endpoint.
 */
export default function NicheFilter({ value, onChange, loading }: NicheFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <label
        htmlFor="niche-select"
        className="inline-flex shrink-0 items-center gap-1.5 pl-1 text-sm font-semibold text-slate-800"
      >
        <Layers className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Nicho
      </label>

      <select
        id="niche-select"
        value={value ?? ""}
        disabled={loading}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60"
      >
        <option value="">Todos os nichos</option>
        {NICHES.map((niche) => (
          <option key={niche.id} value={niche.id}>
            {niche.label}
          </option>
        ))}
      </select>

      {loading ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Buscando...
        </span>
      ) : null}
    </div>
  );
}
