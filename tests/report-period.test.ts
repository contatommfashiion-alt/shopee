import { test } from "node:test";
import assert from "node:assert/strict";
import {
  API_MAX_LIMIT,
  API_MAX_WINDOW_DAYS,
  earliestDateInputValue,
  earliestQueryableTime,
  requestedWindow,
  resolveWindow,
  todayDateInputValue,
} from "../lib/report-period.ts";
import { parseDateInput } from "../lib/report-formatters.ts";

const DAY = 86400;
const EMPTY = { from: "", to: "" };

/** 01/10/2026 às 12:00 locais — mesma referência em todos os testes. */
const REF = new Date(2026, 9, 1, 12, 0, 0, 0);
const REF_UNIX = Math.floor(REF.getTime() / 1000);

const startOfDay = (y: number, m: number, d: number) =>
  Math.floor(new Date(y, m - 1, d, 0, 0, 0, 0).getTime() / 1000);

test("os limites da API são os confirmados contra o endpoint", () => {
  // 91 dias atrás funciona e 93 devolve "can only query data for the last 3
  // months"; 90 é a margem segura. `limit` acima de 500 é cortado pela Shopee.
  assert.equal(API_MAX_WINDOW_DAYS, 90);
  assert.equal(API_MAX_LIMIT, 500);
});

test("earliestQueryableTime fica 90 dias atrás", () => {
  assert.equal(earliestQueryableTime(REF), REF_UNIX - 90 * DAY);
});

test("requestedWindow calcula os períodos fixos", () => {
  const hoje = requestedWindow("hoje", REF, EMPTY, parseDateInput);
  assert.equal(hoje?.from, startOfDay(2026, 10, 1));

  assert.equal(requestedWindow("7dias", REF, EMPTY, parseDateInput)?.from, startOfDay(2026, 10, 1) - 6 * DAY);
  assert.equal(requestedWindow("30dias", REF, EMPTY, parseDateInput)?.from, startOfDay(2026, 10, 1) - 29 * DAY);
  assert.equal(requestedWindow("90dias", REF, EMPTY, parseDateInput)?.from, startOfDay(2026, 10, 1) - 89 * DAY);
});

test("requestedWindow devolve null para personalizado incompleto", () => {
  assert.equal(requestedWindow("personalizado", REF, EMPTY, parseDateInput), null);
  assert.equal(
    requestedWindow("personalizado", REF, { from: "2026-09-01", to: "" }, parseDateInput),
    null,
  );
});

test("requestedWindow cobre o dia inteiro do fim e corrige datas invertidas", () => {
  const normal = requestedWindow(
    "personalizado",
    REF,
    { from: "2026-09-01", to: "2026-09-10" },
    parseDateInput,
  );

  assert.equal(normal?.from, startOfDay(2026, 9, 1));
  assert.equal(normal?.to, startOfDay(2026, 9, 10) + DAY - 1, "inclui o dia 10 inteiro");

  const invertido = requestedWindow(
    "personalizado",
    REF,
    { from: "2026-09-10", to: "2026-09-01" },
    parseDateInput,
  );

  assert.deepEqual(invertido, normal, "datas trocadas são corrigidas, não ignoradas");
});

test("resolveWindow recorta o início pelo limite de 3 meses", () => {
  // O caso real: a pessoa pediu abril de 2026 em outubro de 2026.
  const abril = resolveWindow(
    "personalizado",
    REF,
    { from: "2026-04-01", to: "2026-04-30" },
    parseDateInput,
  );

  assert.equal(abril.outsideApiWindow, true, "abril está inteiro fora da janela");
  assert.equal(abril.from, earliestQueryableTime(REF), "cai para o máximo permitido");
  assert.ok(abril.to <= REF_UNIX);
});

test("resolveWindow sinaliza quando só o início foi ajustado", () => {
  // Começa fora da janela, mas termina dentro.
  const parcial = resolveWindow(
    "personalizado",
    REF,
    { from: "2026-05-01", to: "2026-09-30" },
    parseDateInput,
  );

  assert.equal(parcial.outsideApiWindow, false);
  assert.equal(parcial.clampedStart, true);
  assert.equal(parcial.from, earliestQueryableTime(REF));
});

test("resolveWindow não mexe num período já dentro da janela", () => {
  const dentro = resolveWindow(
    "personalizado",
    REF,
    { from: "2026-09-20", to: "2026-09-30" },
    parseDateInput,
  );

  assert.equal(dentro.clampedStart, false);
  assert.equal(dentro.outsideApiWindow, false);
  assert.equal(dentro.from, startOfDay(2026, 9, 20));
});

test("resolveWindow nunca envia um fim no futuro", () => {
  const hoje = resolveWindow("hoje", REF, EMPTY, parseDateInput);

  assert.ok(hoje.to <= REF_UNIX, "o fim do dia de hoje é cortado no instante atual");
});

test("resolveWindow usa o máximo quando o personalizado está incompleto", () => {
  const incompleto = resolveWindow("personalizado", REF, { from: "2026-09-01", to: "" }, parseDateInput);

  assert.equal(incompleto.incompleteCustom, true);
  assert.equal(incompleto.from, earliestQueryableTime(REF));
  assert.equal(incompleto.outsideApiWindow, false);
});

test("resolveWindow sempre devolve um intervalo válido", () => {
  for (const period of ["hoje", "7dias", "30dias", "90dias", "personalizado"] as const) {
    const window = resolveWindow(period, REF, EMPTY, parseDateInput);

    assert.ok(Number.isFinite(window.from), `${period}: from finito`);
    assert.ok(Number.isFinite(window.to), `${period}: to finito`);
    assert.ok(window.from <= window.to, `${period}: from <= to`);
    assert.ok(window.from >= earliestQueryableTime(REF), `${period}: dentro da janela da API`);
  }
});

test("os limites dos inputs de data respeitam a janela da API", () => {
  assert.equal(todayDateInputValue(REF), "2026-10-01");

  const earliest = new Date(earliestQueryableTime(REF) * 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");

  assert.equal(
    earliestDateInputValue(REF),
    `${earliest.getFullYear()}-${pad(earliest.getMonth() + 1)}-${pad(earliest.getDate())}`,
  );
});
