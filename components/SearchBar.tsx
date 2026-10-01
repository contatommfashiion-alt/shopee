"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Local search box.
 *
 * The term is NOT sent to Shopee: `productOfferV2` is called without arguments
 * in this version, so the filtering happens over the returned products.
 *
 * TODO: switch to a server-side `keyword` argument once the official schema is
 * confirmed — only the `onChange` wiring changes.
 */
export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar produto..."
        aria-label="Buscar produto entre as ofertas carregadas"
        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-11 pl-12 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      />

      {value !== "" ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
