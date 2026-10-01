import { ShopeeClientError, runGraphQL } from "./shopee";
import { buildConversionReportQuery, normalizeConversions, normalizeReportPageInfo } from "./conversion-report";
import type { ConversionReportParams } from "./conversion-report";
import type { ConversionReportData, ReportPayload } from "./report-types";
import type { ShopeeCredentials } from "./types";

/** SERVER ONLY. Reaproveita a assinatura e o transporte de `lib/shopee.ts`. */

/**
 * Executa a `conversionReport` e devolve as conversões normalizadas.
 *
 * `runGraphQL` já assina com SHA256 e trata timeout, status HTTP e `errors[]` —
 * nenhum código de autenticação é duplicado aqui.
 *
 * `credentials` vem da tela de login; sem ele o servidor usa o próprio
 * ambiente, caminho em que o Secret nunca passa pelo navegador.
 */
export async function fetchConversionReport(
  params: ConversionReportParams,
  credentials?: ShopeeCredentials,
): Promise<ReportPayload> {
  const query = buildConversionReportQuery(params);
  const data = await runGraphQL<ConversionReportData>(query, credentials);

  const report = data.conversionReport;
  if (!report || typeof report !== "object") {
    throw new ShopeeClientError("INVALID_RESPONSE", "A resposta não contém conversionReport.");
  }

  return {
    conversions: normalizeConversions(report.nodes),
    pageInfo: normalizeReportPageInfo(report.pageInfo),
  };
}
