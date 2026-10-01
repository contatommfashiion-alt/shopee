"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import AccountSection from "./AccountSection";
import AppShell, { type Section } from "./AppShell";
import ErrorState from "./ErrorState";
import LoginScreen from "./LoginScreen";
import OffersSection from "./OffersSection";
import ReportsSection from "./reports/ReportsSection";
import SkeletonGrid from "./SkeletonGrid";
import { callApi } from "@/lib/api-client";
import {
  describeApiHost,
  isSignedOut,
  readStoredSession,
  setSignedOut,
  writeStoredSession,
} from "@/lib/session";
import type { StoredSession } from "@/lib/session";
import type { ApiErrorCode, OffersPayload, Product, ShopeeCredentials } from "@/lib/types";

/**
 * Who is connected.
 *
 * There is no account system: either the server has its own credentials, or the
 * user typed a set on the login screen.
 */
type Session = { source: "server" } | { source: "form"; credentials: ShopeeCredentials };

type Outcome = { kind: "ready"; products: Product[] } | { kind: "failed"; code: ApiErrorCode };

type View =
  | { status: "booting" }
  | { status: "login"; errorCode: ApiErrorCode | null }
  | { status: "loading" }
  | { status: "ready"; products: Product[] }
  | { status: "error"; code: ApiErrorCode };

const EMPTY_CREDENTIALS: ShopeeCredentials = { appId: "", secret: "", apiUrl: "" };

/** Failures the user fixes by editing the login form, so they go back to it. */
const FIXABLE_BY_LOGIN = new Set<ApiErrorCode>([
  "MISSING_CONFIG",
  "INVALID_API_URL",
  "BLOCKED_API_URL",
  "INVALID_CREDENTIALS",
]);

/**
 * Loads the offers and resolves to an outcome.
 *
 * Pure with respect to React: it holds no state and never calls `setState`.
 */
async function loadOffers(
  credentials: ShopeeCredentials | null,
  productCatId: number | null = null,
): Promise<Outcome> {
  const result = await callApi<OffersPayload>("/api/offers", credentials, { productCatId });

  if (!result.ok) return { kind: "failed", code: result.code };

  return {
    kind: "ready",
    products: Array.isArray(result.data?.products) ? result.data.products : [],
  };
}

interface BootResult {
  outcome: Outcome;
  session: Session | null;
  serverAvailable: boolean;
  stored: StoredSession | null;
}

/**
 * Primeira carga.
 *
 * A sessão guardada tem prioridade: foi a conta que a pessoa escolheu, e manter
 * é o que faz recarregar a página não desconectar. Só depois dela vem o
 * ambiente do servidor — caminho em que o Secret nunca chega ao navegador.
 *
 * Quem clicou em Sair cai direto no login: sem isso, com `.env.local`
 * configurado, recarregar reconectaria sozinho e o botão pareceria quebrado.
 */
async function boot(): Promise<BootResult> {
  const stored = readStoredSession();

  if (stored) {
    const fromStorage = await loadOffers(stored.credentials);
    const keepSession = fromStorage.kind === "ready" || !FIXABLE_BY_LOGIN.has(fromStorage.code);

    return {
      outcome: fromStorage,
      session: keepSession ? { source: "form", credentials: stored.credentials } : null,
      // Ainda não sabemos se o servidor tem credenciais; só interessa no logout.
      serverAvailable: false,
      stored,
    };
  }

  if (isSignedOut()) {
    return {
      outcome: { kind: "failed", code: "MISSING_CONFIG" },
      session: null,
      // O botão "usar as do servidor" continua disponível no login.
      serverAvailable: true,
      stored: null,
    };
  }

  const fromServer = await loadOffers(null);

  if (fromServer.kind === "ready" || fromServer.code !== "MISSING_CONFIG") {
    return {
      outcome: fromServer,
      session: { source: "server" },
      serverAvailable: true,
      stored: null,
    };
  }

  return { outcome: fromServer, session: null, serverAvailable: false, stored: null };
}

/** Maps a load outcome onto what the screen shows. */
function viewFor(outcome: Outcome, session: Session | null): View {
  if (outcome.kind === "ready") return { status: "ready", products: outcome.products };

  if (session === null) {
    // On the very first run there is nothing to report: the server simply has
    // no credentials, which is exactly what the login screen is asking for.
    const isFirstRun = outcome.code === "MISSING_CONFIG";
    return { status: "login", errorCode: isFirstRun ? null : outcome.code };
  }

  return { status: "error", code: outcome.code };
}

/**
 * Root of the application.
 *
 * Owns the session and the offer loading; the sections below are presentational.
 * The browser only ever talks to `/api/offers` — the signature is always
 * computed on the server and nothing is persisted there.
 */
export default function LaranjinhaApp() {
  const [view, setView] = useState<View>({ status: "booting" });
  const [session, setSession] = useState<Session | null>(null);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [draft, setDraft] = useState<ShopeeCredentials>(EMPTY_CREDENTIALS);
  /**
   * Cosmetic, local label for the sidebar. The confirmed `productOfferV2` query
   * exposes no account name, so the user supplies one at login.
   *
   * TODO: if an official operation that returns the affiliate account profile
   * is confirmed, fetch the real name server-side and use this only as an
   * override.
   */
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<Section>("ofertas");
  /** Nicho em uso. Vai na consulta, então trocar busca ofertas novas. */
  const [niche, setNiche] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void boot().then((result) => {
      if (cancelled) return;

      setServerAvailable(result.serverAvailable);
      setSession(result.session);

      if (result.stored) {
        setDraft(result.stored.credentials);
        setDisplayName(result.stored.displayName);
      }

      setView(viewFor(result.outcome, result.session));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const runLoad = useCallback(
    (credentials: ShopeeCredentials | null, nextSession: Session, productCatId: number | null) => {
      setBusy(true);

      void loadOffers(credentials, productCatId).then((outcome) => {
        setBusy(false);

        const keep = outcome.kind === "ready" || !FIXABLE_BY_LOGIN.has(outcome.code);
        const resolved = keep ? nextSession : null;

        setSession(resolved);
        setView(viewFor(outcome, resolved));
      });
    },
    [],
  );

  const handleLogin = useCallback(
    (credentials: ShopeeCredentials, nextDisplayName: string) => {
      setDraft(credentials);
      setDisplayName(nextDisplayName);
      // Sempre guarda: é o que faz recarregar a página não desconectar.
      writeStoredSession({ credentials, displayName: nextDisplayName });
      setSection("ofertas");

      runLoad(credentials, { source: "form", credentials }, niche);
    },
    [runLoad, niche],
  );

  const handleUseServerCredentials = useCallback(
    (nextDisplayName: string) => {
      setDisplayName(nextDisplayName);
      setSignedOut(false);
      setSection("ofertas");
      runLoad(null, { source: "server" }, niche);
    },
    [runLoad, niche],
  );

  const handleReload = useCallback(() => {
    if (!session) return;

    setView({ status: "loading" });
    runLoad(session.source === "form" ? session.credentials : null, session, niche);
  }, [session, runLoad, niche]);

  /** Trocar o nicho refaz a busca na Shopee, não filtra o que já veio. */
  const handleNicheChange = useCallback(
    (nextNiche: number | null) => {
      setNiche(nextNiche);
      if (!session) return;

      runLoad(session.source === "form" ? session.credentials : null, session, nextNiche);
    },
    [session, runLoad],
  );

  /** Keeps the fields filled in, for fixing a typo or swapping one value. */
  const handleSwitchAccount = useCallback(() => {
    setView({ status: "login", errorCode: null });
    setSession(null);
  }, []);

  /** Forgets everything in this browser and returns to the login screen. */
  const handleLogout = useCallback(() => {
    writeStoredSession(null);
    setSignedOut(true);
    setDraft(EMPTY_CREDENTIALS);
    setDisplayName("");
    setSession(null);
    setSection("ofertas");
    setView({ status: "login", errorCode: null });
  }, []);

  if (view.status === "booting") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 animate-pulse items-center justify-center rounded-2xl bg-brand-600 text-white"
        >
          <Coins className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <p className="text-sm font-medium text-slate-500" role="status">
          Carregando a Laranjinha...
        </p>
      </div>
    );
  }

  if (view.status === "login") {
    return (
      <LoginScreen
        initial={draft}
        initialDisplayName={displayName}
        errorCode={view.errorCode}
        submitting={busy}
        serverAvailable={serverAvailable}
        onSubmit={handleLogin}
        onUseServerCredentials={handleUseServerCredentials}
      />
    );
  }

  const appId = session?.source === "form" ? session.credentials.appId : null;
  const apiHost =
    session?.source === "form" ? describeApiHost(session.credentials.apiUrl) : "configurado no servidor";
  const offerCount = view.status === "ready" ? view.products.length : null;

  return (
    <AppShell
      section={section}
      onSelectSection={setSection}
      appId={appId}
      displayName={displayName}
      offerCount={offerCount}
      onLogout={handleLogout}
    >
      {section === "relatorios" ? (
        <ReportsSection credentials={session?.source === "form" ? session.credentials : null} />
      ) : section === "conta" ? (
        <AccountSection
          appId={appId}
          displayName={displayName}
          apiHost={apiHost}
          remembered={session?.source === "form"}
          offerCount={offerCount}
          onSwitchAccount={handleSwitchAccount}
          onLogout={handleLogout}
          onReload={handleReload}
          reloading={busy}
        />
      ) : view.status === "loading" ? (
        <SkeletonGrid />
      ) : view.status === "error" ? (
        <ErrorState
          code={view.code}
          onRetry={handleReload}
          retrying={busy}
          onEditCredentials={handleSwitchAccount}
        />
      ) : (
        <OffersSection
          products={view.products}
          niche={niche}
          onNicheChange={handleNicheChange}
          loadingNiche={busy}
        />
      )}
    </AppShell>
  );
}
