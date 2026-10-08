"use client";

import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, LogIn, ServerCog, ShieldCheck, ShoppingCart } from "lucide-react";
import { API_ERROR_MESSAGES } from "@/lib/api-errors";
import type { ApiErrorCode, ShopeeCredentials } from "@/lib/types";

interface LoginScreenProps {
  initial: ShopeeCredentials;
  initialDisplayName: string;
  /** Set when a previous attempt failed and the user has to fix something. */
  errorCode: ApiErrorCode | null;
  submitting: boolean;
  /** `true` when the server has its own credentials, offering a one-click entry. */
  serverAvailable: boolean;
  onSubmit: (credentials: ShopeeCredentials, displayName: string) => void;
  onUseServerCredentials: (displayName: string) => void;
}

/**
 * Entry screen.
 *
 * There is no user account: the Shopee affiliate application IS the identity.
 * The values typed here are sent in the body of `POST /api/offers`, used to
 * sign the request on the server, and discarded.
 */
export default function LoginScreen({
  initial,
  initialDisplayName,
  errorCode,
  submitting,
  serverAvailable,
  onSubmit,
  onUseServerCredentials,
}: LoginScreenProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [appId, setAppId] = useState(initial.appId);
  const [secret, setSecret] = useState(initial.secret);
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [showSecret, setShowSecret] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const serverError = errorCode ? API_ERROR_MESSAGES[errorCode] : null;
  const message = localError ?? (serverError ? `${serverError.title}. ${serverError.description}` : null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed: ShopeeCredentials = {
      appId: appId.trim(),
      secret: secret.trim(),
      apiUrl: apiUrl.trim(),
    };

    const missing: string[] = [];
    if (trimmed.appId === "") missing.push("App ID");
    if (trimmed.secret === "") missing.push("Secret");
    if (trimmed.apiUrl === "") missing.push("URL da API");

    if (missing.length > 0) {
      setLocalError(`Preencha: ${missing.join(", ")}.`);
      return;
    }

    if (!/^https?:\/\/.+/i.test(trimmed.apiUrl)) {
      setLocalError("A URL da API precisa começar com https:// (ou http:// em testes locais).");
      return;
    }

    setLocalError(null);
    onSubmit(trimmed, displayName.trim());
  }

  return (
    <div className="page-glow flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2.5">
            <ShoppingCart className="h-10 w-10 text-white" strokeWidth={2} aria-hidden="true" />
            <h1 className="text-3xl font-medium tracking-tight text-white">Laranjinha</h1>
          </div>
          <p className="mt-2 text-sm text-white/90">Encontre. Compartilhe. Ganhe.</p>
        </div>

        <section className="rounded-sm bg-white p-5 shadow-[0_3px_10px_rgba(0,0,0,0.14)] sm:p-7">
          <h2 className="text-xl font-normal text-slate-900">Entrar</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Conecte sua aplicação da Shopee Affiliate Open API. Não há cadastro: estes três dados
            são a sua identificação.
          </p>

          {serverAvailable ? (
            <button
              type="button"
              onClick={() => onUseServerCredentials(displayName.trim())}
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ServerCog className="h-4 w-4" aria-hidden="true" />
              USAR AS CREDENCIAIS DO SERVIDOR
            </button>
          ) : null}

          {serverAvailable ? (
            <p className="mt-4 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              ou informe outra conta
              <span className="h-px flex-1 bg-slate-200" />
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-name" className="block text-sm font-semibold text-slate-800">
                Nome <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="login-name"
                name="displayName"
                type="text"
                autoComplete="off"
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Seu nome ou o nome da sua loja"
                className="w-full rounded-sm border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
              <p className="text-xs text-slate-500">
                Aparece no topo da página no lugar do App ID. Fica só neste navegador e não é enviado
                à Shopee.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-app-id" className="block text-sm font-semibold text-slate-800">
                App ID
              </label>
              <input
                id="login-app-id"
                name="appId"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={appId}
                onChange={(event) => setAppId(event.target.value)}
                placeholder="O Credential / App ID da sua aplicação"
                className="w-full rounded-sm border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-secret" className="block text-sm font-semibold text-slate-800">
                Secret
              </label>

              <div className="relative">
                <input
                  id="login-secret"
                  name="secret"
                  type={showSecret ? "text" : "password"}
                  autoComplete="off"
                  spellCheck={false}
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  placeholder="O Secret privado da aplicação"
                  className="w-full rounded-sm border border-slate-200 py-2.5 pr-11 pl-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowSecret((previous) => !previous)}
                  aria-label={showSecret ? "Ocultar Secret" : "Mostrar Secret"}
                  className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-api-url" className="block text-sm font-semibold text-slate-800">
                URL da API (GraphQL)
              </label>
              <input
                id="login-api-url"
                name="apiUrl"
                type="url"
                autoComplete="off"
                spellCheck={false}
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-sm border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
              <p className="text-xs text-slate-500">
                A mesma URL do GraphiQL oficial onde você testou o{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                  productOfferV2
                </code>
                .
              </p>
            </div>

            <p className="rounded-sm bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">Você continua conectado</span> até
              clicar em <strong className="font-semibold">Sair</strong> ou{" "}
              <strong className="font-semibold">Trocar de conta</strong> — recarregar a página não
              desconecta. Para isso, os três valores ficam guardados neste navegador. Em computador
              compartilhado, use Sair ao terminar.
            </p>

            {message ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-sm bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ENTRANDO...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  ENTRAR
                </>
              )}
            </button>
          </form>
        </section>

        <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            O Secret funciona como uma senha da sua conta de afiliado. Ele é usado para assinar a
            consulta no servidor e descartado — nada é gravado. Mais seguro ainda: preencher{" "}
            <code className="font-mono text-[11px]">.env.local</code> no servidor, e aí esta tela
            nem aparece.
          </span>
        </p>
      </div>
    </div>
  );
}
