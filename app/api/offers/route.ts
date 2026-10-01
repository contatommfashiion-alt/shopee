import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/api-errors";
import { parseCredentials } from "@/lib/credentials";
import { ShopeeClientError, fetchProductOffers } from "@/lib/shopee";
import { PRODUCT_OFFER_MAX_LIMIT } from "@/lib/shopee-query";
import type { ProductOfferParams } from "@/lib/shopee-query";
import type {
  ApiErrorCode,
  OffersErrorPayload,
  OffersPayload,
  ShopeeCredentials,
} from "@/lib/types";

/**
 * /api/offers
 *
 * navegador -> este handler -> Shopee Affiliate Open API -> normalização -> JSON
 *
 * Parâmetros (query string no GET, corpo no POST):
 *   productCatId  opcional, nicho (categoria de nível 1) — ver `lib/categories.ts`
 *   limit         opcional, teto de 50 aplicado pela Shopee
 *
 * GET  usa as credenciais configuradas no servidor (`.env.local` / Vercel).
 *      Caminho preferido: o Secret nunca passa pelo navegador.
 * POST aceita as credenciais no corpo, para a tela de login. Elas assinam uma
 *      requisição e são descartadas — nunca gravadas, logadas ou devolvidas. O
 *      corpo (não a query string) as carrega para não irem parar em log.
 *
 * Nada é persistido e nada é cacheado.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "MISSING_CONFIG":
    case "INVALID_API_URL":
    case "BLOCKED_API_URL":
      return 400;
    case "INVALID_CREDENTIALS":
      return 502;
    case "TIMEOUT":
      return 504;
    case "NETWORK":
    case "UPSTREAM_UNAVAILABLE":
      return 503;
    default:
      return 502;
  }
}

function errorResponse(code: ApiErrorCode): NextResponse<OffersErrorPayload> {
  return NextResponse.json(
    { error: { code, message: apiErrorMessage(code) } },
    { status: statusForCode(code), headers: NO_STORE },
  );
}

/** Lê o nicho e o limite. Valores inválidos viram "sem filtro", não erro. */
function readOfferParams(source: Record<string, unknown>): ProductOfferParams {
  const rawCat = Number(source.productCatId);
  const productCatId = Number.isFinite(rawCat) && rawCat > 0 ? Math.trunc(rawCat) : null;

  const rawLimit = Number(source.limit);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.trunc(rawLimit), PRODUCT_OFFER_MAX_LIMIT)
      : PRODUCT_OFFER_MAX_LIMIT;

  return { productCatId, limit };
}

async function respondWithOffers(
  params: ProductOfferParams,
  credentials?: ShopeeCredentials,
): Promise<NextResponse<OffersPayload | OffersErrorPayload>> {
  try {
    const payload = await fetchProductOffers(params, credentials);

    return NextResponse.json(payload, { headers: NO_STORE });
  } catch (error) {
    const code: ApiErrorCode = error instanceof ShopeeClientError ? error.code : "UPSTREAM_ERROR";

    // A razão detalhada fica no log do servidor. O navegador recebe só o
    // código estável e o texto amigável.
    console.error(
      "[api/offers] falha ao consultar productOfferV2:",
      code,
      error instanceof Error ? error.message : error,
    );

    return errorResponse(code);
  }
}

/** Ofertas usando as credenciais do servidor. */
export async function GET(
  request: Request,
): Promise<NextResponse<OffersPayload | OffersErrorPayload>> {
  const search = new URL(request.url).searchParams;

  return respondWithOffers(
    readOfferParams({
      productCatId: search.get("productCatId"),
      limit: search.get("limit"),
    }),
  );
}

/** Ofertas usando as credenciais informadas no login. */
export async function POST(
  request: Request,
): Promise<NextResponse<OffersPayload | OffersErrorPayload>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("MISSING_CONFIG");
  }

  const source = (body ?? {}) as Record<string, unknown>;

  const parsed = parseCredentials(source, process.env.NODE_ENV === "production");

  if (!parsed.ok) {
    if (parsed.reason === "invalidUrl") return errorResponse("INVALID_API_URL");
    if (parsed.reason === "blockedUrl") return errorResponse("BLOCKED_API_URL");
    return errorResponse("MISSING_CONFIG");
  }

  return respondWithOffers(readOfferParams(source), parsed.credentials);
}
