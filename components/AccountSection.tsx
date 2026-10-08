"use client";

import { KeyRound, LogOut, RefreshCw, ServerCog } from "lucide-react";

interface AccountSectionProps {
  /** `null` when the credentials come from the server environment. */
  appId: string | null;
  /** Name typed at login; local and cosmetic only. */
  displayName: string;
  apiHost: string;
  /** `true` when the credentials are kept in this tab's storage. */
  remembered: boolean;
  offerCount: number | null;
  onSwitchAccount: () => void;
  onLogout: () => void;
  onReload: () => void;
  reloading: boolean;
}

/**
 * Connection panel.
 *
 * There is no user account to manage: this shows which affiliate application is
 * signing the requests and lets the user swap it or disconnect.
 */
export default function AccountSection({
  appId,
  displayName,
  apiHost,
  remembered,
  offerCount,
  onSwitchAccount,
  onLogout,
  onReload,
  reloading,
}: AccountSectionProps) {
  const fromServer = appId === null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <section className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700"
          >
            {fromServer ? <ServerCog className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </span>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Conexão</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {fromServer
                ? "Usando as credenciais configuradas no servidor."
                : "Usando as credenciais informadas no login."}
            </p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">Nome</dt>
            <dd className="truncate text-sm font-semibold text-slate-900">
              {displayName.trim() === "" ? (
                <span className="font-normal text-slate-400">não informado</span>
              ) : (
                displayName
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">App ID</dt>
            <dd className="truncate text-sm font-semibold text-slate-900">
              {fromServer ? "definido no servidor" : appId}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">Secret</dt>
            <dd className="text-sm font-semibold text-slate-900">••••••••</dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">Endpoint</dt>
            <dd className="truncate text-sm font-semibold text-slate-900" title={apiHost}>
              {apiHost}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">Ofertas carregadas</dt>
            <dd className="text-sm font-semibold text-slate-900">{offerCount ?? "—"}</dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">Guardado neste navegador</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {fromServer ? "não se aplica" : remembered ? "sim, até você sair" : "não"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={reloading}
            className="inline-flex items-center gap-2 rounded-sm bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} aria-hidden="true" />
            {reloading ? "ATUALIZANDO..." : "ATUALIZAR OFERTAS"}
          </button>

          <button
            type="button"
            onClick={onSwitchAccount}
            className="inline-flex items-center gap-2 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            TROCAR DE CONTA
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-sm border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            SAIR
          </button>
        </div>
      </section>
    </div>
  );
}
