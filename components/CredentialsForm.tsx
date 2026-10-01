"use client";

import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { API_ERROR_MESSAGES } from "@/lib/api-errors";
import type { ApiErrorCode, ShopeeCredentials } from "@/lib/types";

interface CredentialsFormProps {
  initial: ShopeeCredentials;
  /** Set when a previous attempt with these credentials failed. */
  errorCode: ApiErrorCode | null;
  submitting: boolean;
  onSubmit: (credentials: ShopeeCredentials, remember: boolean) => void;
  remember: boolean;
}

/**
 * Screen for typing the Shopee Affiliate Open API credentials.
 *
 * The values are sent in the body of `POST /api/offers`; the signature is
 * always computed on the server. They are never put in a URL, and they are not
 * written to the browser's storage unless the user ticks the box.
 */
export default function CredentialsForm({
  initial,
  errorCode,
  submitting,
  onSubmit,
  remember: initialRemember,
}: CredentialsFormProps) {
  const [appId, setAppId] = useState(initial.appId);
  const [secret, setSecret] = useState(initial.secret);
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [remember, setRemember] = useState(initialRemember);
  const [showSecret, setShowSecret] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const serverError = errorCode ? API_ERROR_MESSAGES[errorCode] : null;

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
    onSubmit(trimmed, remember);
  }

  const message = localError ?? (serverError ? `${serverError.title}. ${serverError.description}` : null);

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
        >
          <KeyRound className="h-5 w-5" />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">Conecte sua conta de afiliado</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Informe os dados da sua aplicação na Shopee Affiliate Open API. Eles são enviados ao
            servidor do OfertaZap, usados para assinar a consulta e descartados em seguida.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="cred-app-id" className="block text-sm font-semibold text-slate-800">
            App ID
          </label>
          <input
            id="cred-app-id"
            name="appId"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={appId}
            onChange={(event) => setAppId(event.target.value)}
            placeholder="O Credential / App ID da sua aplicação"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cred-secret" className="block text-sm font-semibold text-slate-800">
            Secret
          </label>

          <div className="relative">
            <input
              id="cred-secret"
              name="secret"
              type={showSecret ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="O Secret privado da aplicação"
              className="w-full rounded-xl border border-slate-200 py-2.5 pr-11 pl-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
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

          <p className="text-xs text-slate-500">
            O Secret funciona como uma senha da sua conta de afiliado. Não compartilhe com ninguém.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cred-api-url" className="block text-sm font-semibold text-slate-800">
            URL da API (GraphQL)
          </label>
          <input
            id="cred-api-url"
            name="apiUrl"
            type="url"
            autoComplete="off"
            spellCheck={false}
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            Use exatamente a URL do endpoint GraphQL oficial onde você testou o{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
              productOfferV2
            </code>
            .
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">
              Lembrar nesta aba, para não digitar de novo.
            </span>{" "}
            Guarda os três valores — incluindo o Secret — no armazenamento desta aba do navegador.
            São apagados quando você fecha a aba. Deixe desmarcado em computador compartilhado.
          </span>
        </label>

        {message ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              BUSCANDO...
            </>
          ) : (
            "BUSCAR OFERTAS"
          )}
        </button>
      </form>

      <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>
          <span className="font-semibold text-slate-700">Jeito mais seguro:</span> preencha{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            SHOPEE_APP_ID
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            SHOPEE_SECRET
          </code>{" "}
          e{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            SHOPEE_API_URL
          </code>{" "}
          no arquivo <code className="font-mono text-[11px]">.env.local</code> e recarregue a página.
          Assim o Secret nunca passa pelo navegador e esta tela não aparece.
        </span>
      </p>
    </section>
  );
}
