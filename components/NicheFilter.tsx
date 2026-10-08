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
    <div className="rounded-sm bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="niche-select"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800"
        >
          <Layers className="h-4 w-4 text-brand-500" aria-hidden="true" />
          Nicho
        </label>

        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Buscando...
          </span>
        ) : null}
      </div>

      <select
        id="niche-select"
        value={value ?? ""}
        disabled={loading}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="mt-2 w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none disabled:opacity-60"
      >
        <option value="">Todos os nichos</option>
        {NICHES.map((niche) => (
          <option key={niche.id} value={niche.id}>
            {niche.label}
          </option>
        ))}
      </select>
    </div>
  );
}
