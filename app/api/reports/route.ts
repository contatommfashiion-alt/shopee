import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/api-errors";
import { parseCredentials } from "@/lib/credentials";
import { ShopeeClientError } from "@/lib/shopee";
import { fetchConversionReport } from "@/lib/reports";
import { API_MAX_LIMIT, DEFAULT_PAGE_LIMIT } from "@/lib/report-period";
import type { ReportPayload } from "@/lib/report-types";
import type { ApiErrorCode, OffersErrorPayload, ShopeeCredentials } from "@/lib/types";

/**
 * /api/reports
 *
 * navegador -> este handler -> conversionReport na Shopee -> normalização -> JSON
 *
 * Parâmetros (query string no GET, corpo no POST):
 *   from      Unix em SEGUNDOS, início do período
 *   to        Unix em SEGUNDOS, fim do período
 *   limit     opcional, teto de 500 aplicado pela Shopee
 *   scrollId  opcional, cursor da página seguinte
 *
 * GET  usa as credenciais do servidor (`.env.local` / Vercel).
 * POST aceita as credenciais da tela de login no corpo — por isso elas nunca
 *      vão na query string, que acabaria em log de acesso.
 *
 * A autenticação SHA256 é a mesma de `/api/offers`, reaproveitada de
 * `lib/shopee.ts`. Nada é persistido.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "MISSING_CONFIG":
    case "INVALID_API_URL":
    case "BLOCKED_API_URL":
    case "INVALID_PERIOD":
    case "WINDOW_TOO_OLD":
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

interface ReportRequest {
  purchaseTimeStart: number;
  purchaseTimeEnd: number;
  limit: number;
  scrollId: string | null;
}

/** Lê e valida o período. Recusa qualquer coisa que não seja um intervalo real. */
function readReportRequest(source: Record<string, unknown>): ReportRequest | null {
  const from = Number(source.from);
  const to = Number(source.to);

  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  if (from <= 0 || to <= 0 || from > to) return null;

  const rawLimit = Number(source.limit);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.trunc(rawLimit), API_MAX_LIMIT)
      : DEFAULT_PAGE_LIMIT;

  const scrollId = typeof source.scrollId === "string" && source.scrollId !== "" ? source.scrollId : null;

  return {
    purchaseTimeStart: Math.trunc(from),
    purchaseTimeEnd: Math.trunc(to),
    limit,
    scrollId,
  };
}

async function respondWithReport(
  request: ReportRequest,
  credentials?: ShopeeCredentials,
): Promise<NextResponse<ReportPayload | OffersErrorPayload>> {
  try {
    const payload = await fetchConversionReport(request, credentials);

    return NextResponse.json(payload, { headers: NO_STORE });
  } catch (error) {
    const code: ApiErrorCode = error instanceof ShopeeClientError ? error.code : "UPSTREAM_ERROR";

    // Só o código e a mensagem classificada vão para o log: nunca o Secret, o
    // header Authorization nem a resposta financeira completa.
    console.error(
      "[api/reports] falha ao consultar conversionReport:",
      code,
      error instanceof Error ? error.message : error,
    );

    return errorResponse(code);
  }
}

/** Relatório usando as credenciais do servidor. */
export async function GET(
  request: Request,
): Promise<NextResponse<ReportPayload | OffersErrorPayload>> {
  const params = new URL(request.url).searchParams;

  const parsed = readReportRequest({
    from: params.get("from"),
    to: params.get("to"),
    limit: params.get("limit"),
    scrollId: params.get("scrollId"),
  });

  if (!parsed) return errorResponse("INVALID_PERIOD");

  return respondWithReport(parsed);
}

/** Relatório usando as credenciais informadas no login. */
export async function POST(
  request: Request,
): Promise<NextResponse<ReportPayload | OffersErrorPayload>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("MISSING_CONFIG");
  }

  const source = (body ?? {}) as Record<string, unknown>;

  const parsedCredentials = parseCredentials(source, process.env.NODE_ENV === "production");

  if (!parsedCredentials.ok) {
    if (parsedCredentials.reason === "invalidUrl") return errorResponse("INVALID_API_URL");
    if (parsedCredentials.reason === "blockedUrl") return errorResponse("BLOCKED_API_URL");
    return errorResponse("MISSING_CONFIG");
  }

  const parsed = readReportRequest(source);
  if (!parsed) return errorResponse("INVALID_PERIOD");

  return respondWithReport(parsed, parsedCredentials.credentials);
}
