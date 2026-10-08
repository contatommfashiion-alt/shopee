"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter or the orange button: searches Shopee itself for `value`. */
  onSubmit: (value: string) => void;
}

/**
 * Search box styled like the one in Shopee's orange header.
 *
 * Typing narrows the offers already on screen right away; Enter or the orange
 * button asks Shopee (`productOfferV2(keyword:)`) for up to 50 new offers.
 * Clearing with the X also drops the Shopee search.
 */
export default function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
      className="flex w-full items-center rounded-sm bg-white p-[3px] shadow-sm"
    >
      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar ofertas na Shopee"
          aria-label="Buscar ofertas na Shopee"
          enterKeyHint="search"
          className="w-full bg-transparent py-2 pr-9 pl-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />

        {value !== "" ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onSubmit("");
            }}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        aria-label="Buscar"
        className="flex h-9 shrink-0 items-center justify-center rounded-sm bg-brand-600 px-5 text-white transition hover:bg-brand-700"
      >
        <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </form>
  );
}
