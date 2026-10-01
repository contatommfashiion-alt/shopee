import type { ApiErrorCode, OffersErrorPayload, ShopeeCredentials } from "./types.ts";

/**
 * Chamadas às rotas internas, a partir do navegador.
 *
 * Com credenciais, manda tudo num POST no corpo — nunca em query string, que
 * iria parar em log de acesso. Sem credenciais, faz GET com os parâmetros na
 * URL e o servidor usa o próprio ambiente, caminho em que o Secret nunca passa
 * pelo navegador.
 */

export type ApiResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; code: ApiErrorCode };

/** Lê o código de erro do corpo sem confiar no formato. */
function readErrorCode(body: unknown): ApiErrorCode {
  const error = (body as OffersErrorPayload | null)?.error;
  return typeof error?.code === "string" ? (error.code as ApiErrorCode) : "UPSTREAM_ERROR";
}

/** Monta a query string, descartando o que não tem valor. */
function toSearchParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query === "" ? "" : `?${query}`;
}

/**
 * `params` são os parâmetros da rota (nicho, período, paginação). As
 * credenciais são acrescentadas aqui, não pelo chamador.
 */
export async function callApi<TData>(
  path: string,
  credentials: ShopeeCredentials | null,
  params: Record<string, unknown> = {},
): Promise<ApiResult<TData>> {
  try {
    const response = credentials
      ? await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...credentials, ...params }),
          cache: "no-store",
        })
      : await fetch(`${path}${toSearchParams(params)}`, { cache: "no-store" });

    const parsed: unknown = await response.json().catch(() => null);

    if (!response.ok) return { ok: false, code: readErrorCode(parsed) };

    return { ok: true, data: parsed as TData };
  } catch {
    // A requisição nem chegou ao nosso servidor (offline, DNS, abortada...).
    return { ok: false, code: "NETWORK" };
  }
}
