import { normalizePageInfo, normalizeProducts } from "./normalize";
import { createShopeeAuthorization } from "./shopee-auth";
import { readShopeeEnv } from "./env";
import type {
  ApiErrorCode,
  OffersPayload,
  ShopeeCredentials,
  ShopeeGraphQLResponse,
  ShopeeProductOfferData,
} from "./types";

/** SERVER ONLY. This module handles the Secret and must never be imported by a Client Component. */

/**
 * The exact query confirmed to work on Shopee's official GraphiQL.
 *
 * No arguments are passed: `productOfferV2` is called bare, as confirmed.
 *
 * TODO: once the official schema for `productOfferV2` arguments is confirmed
 * (keyword / category / sort / page / limit), add them here and move search,
 * sorting and pagination from the browser to the server. The UI already funnels
 * everything through `GET /api/offers`, so only this file and the route handler
 * change.
 */
export const PRODUCT_OFFER_QUERY = `{
  productOfferV2 {
    nodes {
      productName
      itemId
      commissionRate
      commission
      price
      sales
      imageUrl
      shopName
      productLink
      offerLink
      periodStartTime
      periodEndTime
      priceMin
      priceMax
      productCatIds
      ratingStar
      priceDiscountRate
      shopId
      shopType
      sellerCommissionRate
      shopeeCommissionRate
    }
    pageInfo {
      page
      limit
      hasNextPage
      scrollId
    }
  }
}`;

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
  const authHints = ["signature", "assinatura", "credential", "unauthor", "auth", "app id", "appid", "timestamp"];

  if (authHints.some((hint) => haystack.includes(hint))) return "INVALID_CREDENTIALS";

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
 * Runs the confirmed `productOfferV2` query and returns normalized products.
 *
 * `credentials` comes from the credentials screen, for one request only. When
 * it is omitted the server environment is used, which is the preferred path:
 * the Secret then never travels through the browser.
 *
 * Either way nothing is persisted and the Secret is never logged.
 *
 * Throws `ShopeeClientError` — the route handler turns it into a friendly JSON
 * body. Raw upstream text stays on the server.
 */
export async function fetchProductOffers(credentials?: ShopeeCredentials): Promise<OffersPayload> {
  let resolved: ShopeeCredentials;

  if (credentials) {
    resolved = credentials;
  } else {
    const envResult = readShopeeEnv();
    if (!envResult.ok) {
      throw new ShopeeClientError(
        "MISSING_CONFIG",
        `Variáveis de ambiente ausentes: ${envResult.missing.join(", ")}`,
      );
    }
    resolved = envResult.env;
  }

  const { appId, secret, apiUrl } = resolved;

  // Serialize ONCE. The signature is computed over this exact string and the
  // very same string is sent as the body — no second JSON.stringify, no edits.
  const requestBody = { query: PRODUCT_OFFER_QUERY };
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

  let parsed: ShopeeGraphQLResponse<ShopeeProductOfferData>;
  try {
    parsed = (await httpResponse.json()) as ShopeeGraphQLResponse<ShopeeProductOfferData>;
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

  const offer = parsed.data?.productOfferV2;
  if (!offer || typeof offer !== "object") {
    throw new ShopeeClientError("INVALID_RESPONSE", "A resposta não contém productOfferV2.");
  }

  return {
    products: normalizeProducts(offer.nodes),
    pageInfo: normalizePageInfo(offer.pageInfo),
  };
}
