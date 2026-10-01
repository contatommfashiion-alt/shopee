import { endOfLocalDay, startOfLocalDay } from "./report-formatters.ts";
import type { CustomRange, PeriodId } from "./report-types.ts";

/**
 * Período do relatório e os limites reais da `conversionReport`.
 *
 * Todos os números abaixo foram confirmados contra o endpoint da Shopee, não
 * deduzidos:
 *
 *   - `purchaseTimeStart` / `purchaseTimeEnd` são **Unix em SEGUNDOS**. Enviar
 *     milissegundos devolve `Params Error : Timestamp unit is seconds`.
 *   - A janela máxima é de **3 meses para trás**. 91 dias atrás funciona, 93
 *     devolve `Params Error : can only query data for the last 3 months`.
 *     Usamos 90 como margem segura.
 *   - `limit` é **silenciosamente limitado a 500**: pedir 1000 devolve
 *     `pageInfo.limit = 500`.
 *   - Os valores precisam ir como **literais inline** na query. Passados como
 *     variável GraphQL, o endpoint responde `wrong type` ou
 *     `got null for non-null`.
 */

/** Dias para trás que a Shopee aceita. Confirmado: 91 passa, 93 não. */
export const API_MAX_WINDOW_DAYS = 90;

/** Teto de `limit` aplicado pela Shopee, mesmo pedindo mais. */
export const API_MAX_LIMIT = 500;

/** Quanto pedimos por página. Abaixo do teto, para a resposta não ficar enorme. */
export const DEFAULT_PAGE_LIMIT = 200;

const DAY = 86400;

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "7 dias" },
  { id: "30dias", label: "30 dias" },
  { id: "90dias", label: "3 meses" },
  { id: "personalizado", label: "Personalizado" },
];

export interface TimeWindow {
  /** Unix em segundos. */
  from: number;
  to: number;
}

export interface ResolvedWindow extends TimeWindow {
  /** O início pedido foi puxado para frente pelo limite de 3 meses. */
  clampedStart: boolean;
  /** O período pedido está inteiro fora do que a Shopee permite consultar. */
  outsideApiWindow: boolean;
  /** O personalizado está incompleto, então caiu no máximo permitido. */
  incompleteCustom: boolean;
}

/** O instante mais antigo que a Shopee aceita consultar. */
export function earliestQueryableTime(reference: Date): number {
  return Math.floor(reference.getTime() / 1000) - API_MAX_WINDOW_DAYS * DAY;
}

/** O período que a pessoa pediu, antes de qualquer limite. */
export function requestedWindow(
  period: PeriodId,
  reference: Date,
  custom: CustomRange,
  parse: (value: string) => number | null,
): TimeWindow | null {
  const endToday = endOfLocalDay(reference);
  const startToday = startOfLocalDay(reference);

  if (period === "hoje") return { from: startToday, to: endToday };
  if (period === "7dias") return { from: startToday - 6 * DAY, to: endToday };
  if (period === "30dias") return { from: startToday - 29 * DAY, to: endToday };
  if (period === "90dias") return { from: startToday - (API_MAX_WINDOW_DAYS - 1) * DAY, to: endToday };

  const from = parse(custom.from);
  const to = parse(custom.to);

  // Personalizado incompleto: quem decide é `resolveWindow`.
  if (from === null || to === null) return null;

  // Datas invertidas são corrigidas em vez de devolver vazio.
  return from <= to ? { from, to: to + DAY - 1 } : { from: to, to: from + DAY - 1 };
}

/**
 * O período que de fato será enviado à Shopee.
 *
 * Recorta o pedido para dentro da janela permitida e sinaliza o que mudou, para
 * a tela poder explicar — em vez de devolver uma lista vazia sem motivo.
 */
export function resolveWindow(
  period: PeriodId,
  reference: Date,
  custom: CustomRange,
  parse: (value: string) => number | null,
): ResolvedWindow {
  const earliest = earliestQueryableTime(reference);
  const now = Math.floor(reference.getTime() / 1000);

  const requested = requestedWindow(period, reference, custom, parse);

  if (requested === null) {
    // Personalizado sem as duas datas: mostra o máximo permitido.
    return {
      from: earliest,
      to: now,
      clampedStart: false,
      outsideApiWindow: false,
      incompleteCustom: true,
    };
  }

  // O período inteiro é anterior ao que a Shopee aceita.
  if (requested.to < earliest) {
    return {
      from: earliest,
      to: now,
      clampedStart: false,
      outsideApiWindow: true,
      incompleteCustom: false,
    };
  }

  return {
    from: Math.max(requested.from, earliest),
    to: Math.min(requested.to, now),
    clampedStart: requested.from < earliest,
    outsideApiWindow: false,
    incompleteCustom: false,
  };
}

/** `YYYY-MM-DD` do dia mais antigo consultável, para o `min` do input de data. */
export function earliestDateInputValue(reference: Date): string {
  const date = new Date(earliestQueryableTime(reference) * 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` de hoje, para o `max` do input de data. */
export function todayDateInputValue(reference: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}-${pad(reference.getDate())}`;
}
