"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import {
  buildTikTokAndroidUrl,
  buildTikTokSearchUrl,
  buildTikTokSuggestions,
  isAndroid,
} from "@/lib/tiktok-search";

interface TikTokVideoSearchProps {
  productName: string;
}

/**
 * Suggests TikTok searches built from the Shopee title. Each one only opens
 * TikTok's own search — no TikTok API is called.
 *
 * On Android the search is handed to the TikTok app (web search as fallback).
 * Elsewhere it is a normal link, which the phone may open in the app on its
 * own. Either way the words are copied, so they can be pasted into TikTok's
 * search if the app opens without them.
 *
 * Remount it (via `key`) when the product changes so the editable query
 * restarts from the new title.
 */
export default function TikTokVideoSearch({ productName }: TikTokVideoSearchProps) {
  const suggestions = useMemo(() => buildTikTokSuggestions(productName), [productName]);
  const [query, setQuery] = useState(() => suggestions[0] ?? "");
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  // The modal only ever renders in the browser, so `navigator` is there.
  const [android] = useState(() => typeof navigator !== "undefined" && isAndroid(navigator.userAgent));

  const queryUrl = buildTikTokSearchUrl(query);

  /** Opens the search, preferring the app. Returns false when it handled the navigation itself. */
  function openSearch(term: string): boolean {
    const trimmed = term.trim().replace(/\s+/g, " ");
    if (trimmed === "") return true;

    void navigator.clipboard
      ?.writeText(trimmed)
      .then(() => setCopiedQuery(trimmed))
      .catch(() => undefined);

    if (android) {
      const appUrl = buildTikTokAndroidUrl(trimmed);
      if (appUrl) {
        // Same tab on purpose: Chrome hands `intent://` to the app and the page stays put.
        window.location.assign(appUrl);
        return false;
      }
    }

    return true;
  }

  return (
    <section className="mt-5" aria-labelledby="tiktok-search-title">
      <h3 id="tiktok-search-title" className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        Vídeos no TikTok
      </h3>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">
        Veja vídeos de produtos parecidos na busca do TikTok.
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
                  onClick={(event) => {
                    if (!openSearch(suggestion)) event.preventDefault();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
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
          if (queryUrl && openSearch(query)) window.open(queryUrl, "_blank", "noopener,noreferrer");
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
          className="min-w-0 flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!queryUrl}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-slate-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          BUSCAR
        </button>
      </form>

      <p aria-live="polite" className="mt-1.5 min-h-4 text-[11px] leading-snug text-slate-500">
        {copiedQuery
          ? `"${copiedQuery}" copiado. Se o TikTok abrir sem a busca, cole na lupa dele.`
          : null}
      </p>
    </section>
  );
}
