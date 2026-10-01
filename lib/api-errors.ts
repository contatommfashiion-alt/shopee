import type { ApiErrorCode } from "./types";

/**
 * User-facing copy for every failure mode. Shared by the route handler and the
 * error UI so the browser never has to interpret a raw upstream message.
 *
 * Nothing here can leak the App ID, the Secret or the Authorization header.
 */
export const API_ERROR_MESSAGES: Record<ApiErrorCode, { title: string; description: string }> = {
  MISSING_CONFIG: {
    title: "Credenciais não informadas",
    description:
      "Preencha App ID, Secret e URL da API para buscar as ofertas — ou configure SHOPEE_APP_ID, SHOPEE_SECRET e SHOPEE_API_URL no .env.local do servidor.",
  },
  INVALID_API_URL: {
    title: "URL da API inválida",
    description:
      "A URL da Shopee Affiliate Open API precisa começar com https:// (ou http:// em testes locais). Copie a URL exatamente como aparece no GraphiQL oficial.",
  },
  BLOCKED_API_URL: {
    title: "URL da API não permitida",
    description:
      "Por segurança, este servidor só aceita URLs públicas. Endereços locais ou de rede interna são recusados em produção.",
  },
  WINDOW_TOO_OLD: {
    title: "Período fora do limite da Shopee",
    description:
      "A API de afiliados só devolve conversões dos últimos 3 meses. Escolha um período dentro dessa janela.",
  },
  INVALID_PERIOD: {
    title: "Período inválido",
    description: "As datas enviadas não formam um intervalo válido. Ajuste o período e tente de novo.",
  },
  INVALID_CREDENTIALS: {
    title: "Credenciais inválidas",
    description:
      "A Shopee recusou a autenticação. Confira o App ID e o Secret e verifique se o relógio do computador está correto (a assinatura expira em 10 minutos).",
  },
  TIMEOUT: {
    title: "A Shopee demorou para responder",
    description: "A consulta passou do tempo limite de 10 segundos. Tente novamente em instantes.",
  },
  NETWORK: {
    title: "Sem conexão",
    description: "Não foi possível falar com a Shopee. Verifique sua internet e tente novamente.",
  },
  UPSTREAM_UNAVAILABLE: {
    title: "Shopee indisponível",
    description: "A API de afiliados está fora do ar ou instável neste momento. Tente novamente em alguns minutos.",
  },
  UPSTREAM_ERROR: {
    title: "A Shopee recusou a consulta",
    description: "A API respondeu com um erro ao buscar as ofertas. Tente novamente em instantes.",
  },
  INVALID_RESPONSE: {
    title: "Resposta inesperada",
    description: "A Shopee respondeu em um formato que não reconhecemos. Tente novamente em instantes.",
  },
};

/** Flat message used in the JSON body of `GET /api/offers`. */
export function apiErrorMessage(code: ApiErrorCode): string {
  const entry = API_ERROR_MESSAGES[code];
  return `${entry.title}. ${entry.description}`;
}
