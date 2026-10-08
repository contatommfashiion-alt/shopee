import { AlertTriangle, KeyRound, RotateCw } from "lucide-react";
import { API_ERROR_MESSAGES } from "@/lib/api-errors";
import type { ApiErrorCode } from "@/lib/types";

interface ErrorStateProps {
  code: ApiErrorCode;
  onRetry: () => void;
  retrying: boolean;
  /** Only set when the credentials came from the form and can be edited. */
  onEditCredentials?: () => void;
}

/**
 * Friendly failure screen. It renders only the stable error code returned by
 * `/api/offers` — no upstream text, no credentials, nothing from the Secret.
 */
export default function ErrorState({
  code,
  onRetry,
  retrying,
  onEditCredentials,
}: ErrorStateProps) {
  const { title, description } = API_ERROR_MESSAGES[code] ?? API_ERROR_MESSAGES.UPSTREAM_ERROR;

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-sm border border-amber-200 bg-amber-50 px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-sm bg-amber-100 text-amber-700"
      >
        <AlertTriangle className="h-7 w-7" />
      </span>

      <div className="max-w-md space-y-1.5">
        <p className="text-base font-semibold text-amber-900">{title}</p>
        <p className="text-sm leading-relaxed text-amber-800">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 rounded-sm bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 active:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
          {retrying ? "TENTANDO..." : "TENTAR NOVAMENTE"}
        </button>

        {onEditCredentials ? (
          <button
            type="button"
            onClick={onEditCredentials}
            className="inline-flex items-center gap-2 rounded-sm border border-amber-300 bg-white px-5 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            AJUSTAR CREDENCIAIS
          </button>
        ) : null}
      </div>
    </div>
  );
}
