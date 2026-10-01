"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import AdvancedFilters, { type AdvancedValues } from "./AdvancedFilters";
import CredentialsForm from "./CredentialsForm";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import OfferModal from "./OfferModal";
import ProductCard from "./ProductCard";
import QuickFilters from "./QuickFilters";
import SearchBar from "./SearchBar";
import SkeletonGrid from "./SkeletonGrid";
import SortSelect from "./SortSelect";
import { EMPTY_FILTERS, QUICK_FILTERS, applyFilters, hasActiveFilters } from "@/lib/filters";
import type {
  ApiErrorCode,
  OfferFilters,
  OffersErrorPayload,
  OffersPayload,
  Product,
  QuickFilterId,
  ShopeeCredentials,
  SortOption,
} from "@/lib/types";

type View =
  | { status: "loading" }
  | { status: "needsCredentials"; errorCode: ApiErrorCode | null }
  | { status: "ready"; products: Product[] }
  | { status: "error"; code: ApiErrorCode };

type Outcome = { kind: "ready"; products: Product[] } | { kind: "failed"; code: ApiErrorCode };

const EMPTY_CREDENTIALS: ShopeeCredentials = { appId: "", secret: "", apiUrl: "" };

/** Failures the user can fix by editing the form, so they go back to it. */
const FIXABLE_BY_FORM = new Set<ApiErrorCode>([
  "MISSING_CONFIG",
  "INVALID_API_URL",
  "BLOCKED_API_URL",
  "INVALID_CREDENTIALS",
]);

/**
 * Key for the opt-in "remember in this tab" box.
 *
 * `sessionStorage` (not `localStorage`) on purpose: the values disappear when
 * the tab is closed. Nothing is stored unless the user ticks the box.
 */
const STORAGE_KEY = "ofertazap:credentials";

function readStoredCredentials(): ShopeeCredentials | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ShopeeCredentials> | null;
    const appId = typeof parsed?.appId === "string" ? parsed.appId : "";
    const secret = typeof parsed?.secret === "string" ? parsed.secret : "";
    const apiUrl = typeof parsed?.apiUrl === "string" ? parsed.apiUrl : "";

    if (appId === "" || secret === "" || apiUrl === "") return null;

    return { appId, secret, apiUrl };
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
}

function writeStoredCredentials(credentials: ShopeeCredentials | null): void {
  try {
    if (credentials) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Nothing to do: the app works without storage, the user retypes.
  }
}

/** Narrows the error body of `/api/offers` without trusting its shape. */
function readErrorCode(body: unknown): ApiErrorCode {
  const error = (body as OffersErrorPayload | null)?.error;
  return typeof error?.code === "string" ? (error.code as ApiErrorCode) : "UPSTREAM_ERROR";
}

/**
 * Calls the internal endpoint and resolves to an outcome.
 *
 * With credentials it POSTs them in the body (never in the query string, which
 * would end up in access logs). Without them it GETs, and the server uses its
 * own environment — the path where the Secret never touches the browser.
 *
 * Pure with respect to React: it holds no state and never calls `setState`.
 */
async function loadOffers(credentials: ShopeeCredentials | null): Promise<Outcome> {
  try {
    const response = credentials
      ? await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          cache: "no-store",
        })
      : await fetch("/api/offers", { cache: "no-store" });

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) return { kind: "failed", code: readErrorCode(body) };

    const payload = body as OffersPayload | null;
    return {
      kind: "ready",
      products: Array.isArray(payload?.products) ? payload.products : [],
    };
  } catch {
    // The request never reached our own server (offline, aborted, DNS...).
    return { kind: "failed", code: "NETWORK" };
  }
}

/**
 * Owns the offer list and all local interaction.
 *
 * The browser only ever talks to `/api/offers`. The signature is always
 * computed on the server, and no credential is persisted server-side.
 */
export default function OfferExplorer() {
  const [view, setView] = useState<View>({ status: "loading" });
  const [credentials, setCredentials] = useState<ShopeeCredentials | null>(null);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  const [filters, setFilters] = useState<OfferFilters>(EMPTY_FILTERS);
  const [filtersKey, setFiltersKey] = useState(0);
  const [sort, setSort] = useState<SortOption>("commission");
  const [selected, setSelected] = useState<Product | null>(null);

  const applyOutcome = useCallback((outcome: Outcome, used: ShopeeCredentials | null) => {
    setBusy(false);

    if (outcome.kind === "ready") {
      setView({ status: "ready", products: outcome.products });
      return;
    }

    if (FIXABLE_BY_FORM.has(outcome.code)) {
      // On the very first load there is nothing to report yet: the server
      // simply has no credentials, which is what the screen is asking for.
      const isFirstRun = outcome.code === "MISSING_CONFIG" && used === null;
      setView({ status: "needsCredentials", errorCode: isFirstRun ? null : outcome.code });
      return;
    }

    setView({ status: "error", code: outcome.code });
  }, []);

  // First attempt: credentials remembered in this tab, otherwise the server's.
  useEffect(() => {
    let cancelled = false;
    const stored = readStoredCredentials();

    void loadOffers(stored).then((outcome) => {
      if (cancelled) return;
      if (stored) {
        setCredentials(stored);
        setRemember(true);
      }
      applyOutcome(outcome, stored);
    });

    return () => {
      cancelled = true;
    };
  }, [applyOutcome]);

  const handleCredentialsSubmit = useCallback(
    (next: ShopeeCredentials, nextRemember: boolean) => {
      setBusy(true);
      setCredentials(next);
      setRemember(nextRemember);
      writeStoredCredentials(nextRemember ? next : null);

      void loadOffers(next).then((outcome) => applyOutcome(outcome, next));
    },
    [applyOutcome],
  );

  const handleRetry = useCallback(() => {
    setBusy(true);
    setView({ status: "loading" });

    void loadOffers(credentials).then((outcome) => applyOutcome(outcome, credentials));
  }, [credentials, applyOutcome]);

  const handleEditCredentials = useCallback(() => {
    setView({ status: "needsCredentials", errorCode: null });
  }, []);

  const products = useMemo(
    () => (view.status === "ready" ? view.products : []),
    [view],
  );

  const visibleProducts = useMemo(
    () => applyFilters(products, filters, sort),
    [products, filters, sort],
  );

  const advancedValues: AdvancedValues = useMemo(
    () => ({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minDiscount: filters.minDiscount,
      minRating: filters.minRating,
      minSales: filters.minSales,
      minCommission: filters.minCommission,
    }),
    [filters],
  );

  const handleQuickFilter = useCallback((id: QuickFilterId | null) => {
    setFilters((previous) => ({ ...previous, quick: id }));

    // Each shortcut also switches the visible sorting, so the result reads the
    // way the label promises. The user can still change it afterwards.
    const definition = id === null ? undefined : QUICK_FILTERS.find((entry) => entry.id === id);
    if (definition) setSort(definition.sort);
  }, []);

  const handleApplyAdvanced = useCallback((values: AdvancedValues) => {
    setFilters((previous) => ({ ...previous, ...values }));
  }, []);

  const handleClearAdvanced = useCallback(() => {
    setFilters((previous) => ({
      ...EMPTY_FILTERS,
      search: previous.search,
      quick: previous.quick,
    }));
  }, []);

  /** Clears everything and remounts the advanced panel so its inputs reset too. */
  const handleClearAll = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setFiltersKey((key) => key + 1);
  }, []);

  // The credentials screen replaces the whole explorer: with no offers loaded,
  // a search box and filters would have nothing to act on.
  if (view.status === "needsCredentials") {
    return (
      <CredentialsForm
        initial={credentials ?? EMPTY_CREDENTIALS}
        errorCode={view.errorCode}
        submitting={busy}
        remember={remember}
        onSubmit={handleCredentialsSubmit}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar
        value={filters.search}
        onChange={(search) => setFilters((previous) => ({ ...previous, search }))}
      />

      <QuickFilters active={filters.quick} onChange={handleQuickFilter} />

      <AdvancedFilters
        key={filtersKey}
        value={advancedValues}
        onApply={handleApplyAdvanced}
        onClear={handleClearAdvanced}
      />

      {view.status === "error" ? (
        <ErrorState
          code={view.code}
          onRetry={handleRetry}
          retrying={busy}
          onEditCredentials={credentials ? handleEditCredentials : undefined}
        />
      ) : null}

      {view.status === "loading" ? <SkeletonGrid /> : null}

      {view.status === "ready" ? (
        <>
          <SortSelect value={sort} onChange={setSort} resultCount={visibleProducts.length} />

          {visibleProducts.length === 0 ? (
            <EmptyState
              filtered={products.length > 0 && hasActiveFilters(filters)}
              onClearFilters={handleClearAll}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.itemId}
                  product={product}
                  priority={index < 4}
                  onCreateOffer={setSelected}
                />
              ))}
            </div>
          )}

          {credentials ? (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleEditCredentials}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                Trocar credenciais
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {selected ? <OfferModal product={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
