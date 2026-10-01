/**
 * Formatadores e conversões do relatório.
 *
 * As datas da Shopee (`clickTime`, `purchaseTime`, `completeTime`) não têm
 * unidade documentada, então `toUnixSeconds` detecta a forma pelo valor em vez
 * de assumir uma.
 */

/**
 * Converte para Unix em SEGUNDOS, detectando a forma recebida:
 *   - número em segundos  (1727654400)
 *   - número em milissegundos (1727654400000)
 *   - string numérica, em qualquer das duas formas
 *   - string ISO ("2024-09-30T00:00:00Z")
 *
 * O corte em 10^10 separa segundos de milissegundos: 10^10 segundos cai no ano
 * 2286, então qualquer valor acima disso só pode estar em milissegundos.
 *
 * Devolve `null` para o que não for data — nunca uma data inventada.
 */
export function toUnixSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) return null;
    return value > 10_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;

    if (/^\d+$/.test(trimmed)) return toUnixSeconds(Number(trimmed));

    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }

  return null;
}

/** `1727654400` -> `"30/09/2024 00:00"`. */
export function formatDateTime(unixSeconds: number | null): string {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return "—";

  const date = new Date(unixSeconds * 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** `1727654400` -> `"30/09/2024"`. */
export function formatDate(unixSeconds: number | null): string {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return "—";

  const date = new Date(unixSeconds * 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Rótulo de um `orderStatus`.
 *
 * Os enums oficiais da Shopee para este campo não foram documentados aqui, e
 * traduzir por conta própria arriscaria rotular um pedido errado. Então o valor
 * é mostrado como veio, só com a formatação deixada legível
 * (`PENDING_PAYMENT` -> `Pending payment`).
 *
 * TODO: confirmar os valores oficiais de `orderStatus` e preencher
 * `KNOWN_ORDER_STATUS` com a tradução correta.
 */
const KNOWN_ORDER_STATUS: Record<string, string> = {};

export function getOrderStatusLabel(status: string | null | undefined): string {
  if (typeof status !== "string" || status.trim() === "") return "Sem status";

  const raw = status.trim();
  const known = KNOWN_ORDER_STATUS[raw.toUpperCase()];
  if (known) return known;

  // Mantém o valor da Shopee, apenas legível.
  const spaced = raw.replace(/[_-]+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Rótulo de um `device`. Mesma regra: sem tradução inventada.
 *
 * TODO: confirmar os valores oficiais de `device`.
 */
export function getDeviceLabel(device: string | null | undefined): string {
  if (typeof device !== "string" || device.trim() === "") return "Não informado";

  const raw = device.trim();
  const spaced = raw.replace(/[_-]+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `0.1` -> `"10%"`. Para taxas que a Shopee manda como fração. */
export function formatRate(fraction: number | null | undefined): string {
  if (typeof fraction !== "number" || !Number.isFinite(fraction)) return "—";

  const percent = Math.round(fraction * 1000) / 10;
  const text = Number.isInteger(percent) ? percent.toString() : percent.toString().replace(".", ",");

  return `${text}%`;
}

/** `17` -> `"17 un"`, respeitando o singular. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0 un";
  const rounded = Math.round(value);
  return `${rounded} ${rounded === 1 ? "unidade" : "unidades"}`;
}

/** Início do dia local, em Unix de segundos. */
export function startOfLocalDay(reference: Date): number {
  return Math.floor(
    new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate(),
      0,
      0,
      0,
      0,
    ).getTime() / 1000,
  );
}

/** Fim do dia local (23:59:59), em Unix de segundos. */
export function endOfLocalDay(reference: Date): number {
  return startOfLocalDay(reference) + 86399;
}

/** `"2025-09-30"` -> Unix do início daquele dia local. `null` se inválida. */
export function parseDateInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Rejeita datas que "transbordaram" (ex.: 31/02).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return Math.floor(date.getTime() / 1000);
}
