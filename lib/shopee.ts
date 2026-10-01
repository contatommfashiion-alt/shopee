import { normalizePageInfo, normalizeProducts } from "./normalize";
import { createShopeeAuthorization } from "./shopee-auth";
import { readShopeeEnv } from "./env";
import { buildProductOfferQuery } from "./shopee-query";
import type { ProductOfferParams } from "./shopee-query";
import type {
  ApiErrorCode,
  OffersPayload,
  ShopeeCredentials,
  ShopeeGraphQLResponse,
  ShopeeProductOfferData,
} from "./types";

/** SERVER ONLY. This module handles the Secret and must never be imported by a Client Component. */


const REQUEST_TIMEOUT_MS = 10_000;

/** A failure already classified into a code the UI knows how to present. */
export class ShopeeClientError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ShopeeClientError";
    this.code = code;
  }
}

/** Maps an HTTP status from the Shopee endpoint onto an error code. */
function codeForHttpStatus(status: number): ApiErrorCode {
  if (status === 401 || status === 403) return "INVALID_CREDENTIALS";
  if (status === 408 || status === 504) return "TIMEOUT";
  if (status === 429 || status >= 500) return "UPSTREAM_UNAVAILABLE";
  return "UPSTREAM_ERROR";
}

/**
 * Classifies a GraphQL `errors[]` entry.
 *
 * Shopee answers authentication problems with HTTP 200 and an error message, so
 * the message text is the only signal available.
 *
 * TODO: replace this text matching with the official `extensions.code` values
 * once they are confirmed.
 */
function codeForGraphQLErrors(messages: string[]): ApiErrorCode {
  const haystack = messages.join(" ").toLowerCase();

  // Confirmado contra o endpoint: a conversionReport recusa janelas maiores que
  // 3 meses com esta mensagem (erro 11001).
  if (haystack.includes("last 3 months")) return "WINDOW_TOO_OLD";

  const authHints = ["signature", "assinatura", "credential", "unauthor", "auth", "app id", "appid"];

  if (authHints.some((hint) => haystack.includes(hint))) return "INVALID_CREDENTIALS";

  // "Timestamp unit is seconds" é erro nosso, não de credencial: cai no genérico.
  if (haystack.includes("timestamp") && !haystack.includes("unit")) return "INVALID_CREDENTIALS";

  return "UPSTREAM_ERROR";
}

/** Collects the upstream messages for the server log (never for the browser). */
function collectErrorMessages(response: ShopeeGraphQLResponse<unknown>): string[] {
  if (!Array.isArray(response.errors)) return [];

  return response.errors
    .map((entry) => (typeof entry?.message === "string" ? entry.message.trim() : ""))
    .filter((message) => message !== "");
}

/**
 * Credentials for one request: the ones typed on the login screen, or the
 * server environment when none were given.
 *
 * The environment path is preferred: the Secret then never travels through the
 * browser. Either way nothing is persisted and the Secret is never logged.
 */
function resolveCredentials(credentials?: ShopeeCredentials): ShopeeCredentials {
  if (credentials) return credentials;

  const envResult = readShopeeEnv();
  if (!envResult.ok) {
    throw new ShopeeClientError(
      "MISSING_CONFIG",
      `Variáveis de ambiente ausentes: ${envResult.missing.join(", ")}`,
    );
  }

  return envResult.env;
}

/**
 * Signs and runs one GraphQL query against the Shopee endpoint.
 *
 * Shared by every operation (`productOfferV2`, `conversionReport`), so the
 * signing code exists in exactly one place.
 *
 * Throws `ShopeeClientError` — the route handler turns it into a friendly JSON
 * body. Raw upstream text stays on the server.
 */
export async function runGraphQL<TData>(
  query: string,
  credentials?: ShopeeCredentials,
): Promise<TData> {
  const { appId, secret, apiUrl } = resolveCredentials(credentials);

  // Serialize ONCE. The signature is computed over this exact string and the
  // very same string is sent as the body — no second JSON.stringify, no edits.
  const requestBody = { query };
  const payload = JSON.stringify(requestBody);

  const { authorization } = createShopeeAuthorization(appId, secret, payload);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let httpResponse: Response;
  try {
    httpResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: payload,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ShopeeClientError("TIMEOUT", "A requisição à Shopee excedeu 10 segundos.");
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShopeeClientError("TIMEOUT", "A requisição à Shopee excedeu 10 segundos.");
    }
    throw new ShopeeClientError("NETWORK", "Falha de rede ao contatar a Shopee.");
  } finally {
    clearTimeout(timeout);
  }

  if (!httpResponse.ok) {
    throw new ShopeeClientError(
      codeForHttpStatus(httpResponse.status),
      `A Shopee respondeu com HTTP ${httpResponse.status}.`,
    );
  }

  let parsed: ShopeeGraphQLResponse<TData>;
  try {
    parsed = (await httpResponse.json()) as ShopeeGraphQLResponse<TData>;
  } catch {
    throw new ShopeeClientError("INVALID_RESPONSE", "A Shopee não respondeu um JSON válido.");
  }

  const errorMessages = collectErrorMessages(parsed);
  if (errorMessages.length > 0) {
    throw new ShopeeClientError(
      codeForGraphQLErrors(errorMessages),
      `Erro GraphQL da Shopee: ${errorMessages.join(" | ")}`,
    );
  }

  if (!parsed.data || typeof parsed.data !== "object") {
    throw new ShopeeClientError("INVALID_RESPONSE", "A resposta da Shopee não contém dados.");
  }

  return parsed.data;
}

/** Runs the confirmed `productOfferV2` query and returns normalized products. */
export async function fetchProductOffers(
  params: ProductOfferParams = {},
  credentials?: ShopeeCredentials,
): Promise<OffersPayload> {
  const data = await runGraphQL<ShopeeProductOfferData>(
    buildProductOfferQuery(params),
    credentials,
  );

  const offer = data.productOfferV2;
  if (!offer || typeof offer !== "object") {
    throw new ShopeeClientError("INVALID_RESPONSE", "A resposta não contém productOfferV2.");
  }

  return {
    products: normalizeProducts(offer.nodes),
    pageInfo: normalizePageInfo(offer.pageInfo),
  };
}
