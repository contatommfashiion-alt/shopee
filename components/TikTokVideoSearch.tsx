"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { buildTikTokSearchUrl, buildTikTokSuggestions } from "@/lib/tiktok-search";

interface TikTokVideoSearchProps {
  productName: string;
}

/**
 * Suggests TikTok searches built from the Shopee title. Each one only opens
 * TikTok's own search page in a new tab — no TikTok API is called.
 *
 * Remount it (via `key`) when the product changes so the editable query
 * restarts from the new title.
 */
export default function TikTokVideoSearch({ productName }: TikTokVideoSearchProps) {
  const suggestions = useMemo(() => buildTikTokSuggestions(productName), [productName]);
  const [query, setQuery] = useState(() => suggestions[0] ?? "");

  const queryUrl = buildTikTokSearchUrl(query);

  return (
    <section className="mt-5" aria-labelledby="tiktok-search-title">
      <h3 id="tiktok-search-title" className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        Vídeos no TikTok
      </h3>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">
        Veja vídeos de produtos parecidos. Abre a busca do TikTok numa nova aba.
      </p>

      {suggestions.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => {
            const url = buildTikTokSearchUrl(suggestion);
            if (!url) return null;

            return (
              <li key={suggestion}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  {suggestion}
                  <ExternalLink className="h-3 w-3 text-slate-400" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}

      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (queryUrl) window.open(queryUrl, "_blank", "noopener,noreferrer");
        }}
      >
        <label htmlFor="tiktok-query" className="sr-only">
          Palavras-chave para buscar no TikTok
        </label>
        <input
          id="tiktok-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite palavras-chave"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!queryUrl}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          BUSCAR
        </button>
      </form>
    </section>
  );
}
