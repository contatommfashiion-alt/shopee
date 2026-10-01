import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/api-errors";
import { parseCredentials } from "@/lib/credentials";
import { ShopeeClientError, fetchProductOffers } from "@/lib/shopee";
import type {
  ApiErrorCode,
  OffersErrorPayload,
  OffersPayload,
  ShopeeCredentials,
} from "@/lib/types";

/**
 * /api/offers
 *
 * browser -> this handler -> Shopee Affiliate Open API -> normalization -> JSON
 *
 * GET  uses the credentials configured on the server (`.env.local` / Vercel).
 *      Preferred path: the Secret never travels through the browser.
 *
 * POST accepts credentials in the JSON body, for the credentials screen. They
 *      are used to sign that single request and then discarded — never written
 *      to disk, never logged, never echoed back. The body (not the query
 *      string) carries them so the Secret cannot end up in an access log.
 *
 * Nothing is persisted and nothing is cached in either case.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** HTTP status for each failure mode. */
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

/** Shared tail of both handlers. */
async function respondWithOffers(
  credentials?: ShopeeCredentials,
): Promise<NextResponse<OffersPayload | OffersErrorPayload>> {
  try {
    const payload = await fetchProductOffers(credentials);

    return NextResponse.json(payload, { headers: NO_STORE });
  } catch (error) {
    const code: ApiErrorCode = error instanceof ShopeeClientError ? error.code : "UPSTREAM_ERROR";

    // The reason stays in the server log. It is built from the upstream message
    // and the env var NAMES only — it can never contain the Secret.
    console.error(
      "[api/offers] falha ao consultar productOfferV2:",
      code,
      error instanceof Error ? error.message : error,
    );

    return errorResponse(code);
  }
}

/** Offers using the server-side credentials. */
export async function GET(): Promise<NextResponse<OffersPayload | OffersErrorPayload>> {
  return respondWithOffers();
}

/** Offers using the credentials typed into the credentials screen. */
export async function POST(
  request: Request,
): Promise<NextResponse<OffersPayload | OffersErrorPayload>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("MISSING_CONFIG");
  }

  const parsed = parseCredentials(body, process.env.NODE_ENV === "production");

  if (!parsed.ok) {
    if (parsed.reason === "invalidUrl") return errorResponse("INVALID_API_URL");
    if (parsed.reason === "blockedUrl") return errorResponse("BLOCKED_API_URL");
    return errorResponse("MISSING_CONFIG");
  }

  return respondWithOffers(parsed.credentials);
}
