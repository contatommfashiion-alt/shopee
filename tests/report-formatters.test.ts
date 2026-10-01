import { test } from "node:test";
import assert from "node:assert/strict";
import {
  endOfLocalDay,
  formatDate,
  formatDateTime,
  formatQuantity,
  formatRate,
  getDeviceLabel,
  getOrderStatusLabel,
  parseDateInput,
  startOfLocalDay,
  toUnixSeconds,
} from "../lib/report-formatters.ts";

function localUnix(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return Math.floor(new Date(year, month - 1, day, hour, minute, 0, 0).getTime() / 1000);
}

test("toUnixSeconds detecta segundos, milissegundos, string e ISO", () => {
  assert.equal(toUnixSeconds(1727654400), 1727654400);
  assert.equal(toUnixSeconds("1727654400"), 1727654400);
  assert.equal(toUnixSeconds(1727654400000), 1727654400, "ms viram segundos");
  assert.equal(toUnixSeconds("1727654400000"), 1727654400);
  assert.equal(toUnixSeconds("2024-09-30T00:00:00Z"), 1727654400);
});

test("toUnixSeconds recusa o que não é data, sem chutar", () => {
  assert.equal(toUnixSeconds(null), null);
  assert.equal(toUnixSeconds(undefined), null);
  assert.equal(toUnixSeconds(""), null);
  assert.equal(toUnixSeconds("   "), null);
  assert.equal(toUnixSeconds("ontem"), null);
  assert.equal(toUnixSeconds(0), null);
  assert.equal(toUnixSeconds(-1), null);
  assert.equal(toUnixSeconds(Number.NaN), null);
  assert.equal(toUnixSeconds({}), null);
});

test("formatDateTime e formatDate usam o formato brasileiro", () => {
  assert.equal(formatDateTime(localUnix(2025, 9, 30, 9, 5)), "30/09/2025 09:05");
  assert.equal(formatDate(localUnix(2025, 1, 1)), "01/01/2025");
  assert.equal(formatDateTime(null), "—");
  assert.equal(formatDate(Number.NaN), "—");
});

test("getOrderStatusLabel preserva o valor da Shopee, só deixa legível", () => {
  // Sem tradução inventada: nenhum enum vira "Concluído" por adivinhação.
  assert.equal(getOrderStatusLabel("COMPLETED"), "Completed");
  assert.equal(getOrderStatusLabel("PENDING_PAYMENT"), "Pending payment");
  assert.equal(getOrderStatusLabel("ALGO_QUE_NAO_CONHECEMOS"), "Algo que nao conhecemos");
  assert.equal(getOrderStatusLabel(null), "Sem status");
  assert.equal(getOrderStatusLabel("  "), "Sem status");
});

test("getDeviceLabel segue a mesma regra", () => {
  assert.equal(getDeviceLabel("MOBILE"), "Mobile");
  assert.equal(getDeviceLabel("DESKTOP_WEB"), "Desktop web");
  assert.equal(getDeviceLabel(null), "Não informado");
});

test("formatRate transforma fração em percentual", () => {
  assert.equal(formatRate(0.1), "10%");
  assert.equal(formatRate(0.135), "13,5%");
  assert.equal(formatRate(0), "0%");
  assert.equal(formatRate(null), "—");
  assert.equal(formatRate(Number.NaN), "—");
});

test("formatQuantity respeita o singular", () => {
  assert.equal(formatQuantity(1), "1 unidade");
  assert.equal(formatQuantity(17), "17 unidades");
  assert.equal(formatQuantity(0), "0 unidades");
  assert.equal(formatQuantity(Number.NaN), "0 un");
});

test("startOfLocalDay e endOfLocalDay cobrem o dia inteiro", () => {
  const reference = new Date(2025, 8, 30, 15, 30, 0);
  const start = startOfLocalDay(reference);

  assert.equal(start, localUnix(2025, 9, 30, 0, 0));
  assert.equal(endOfLocalDay(reference), start + 86399);
});

test("parseDateInput aceita YYYY-MM-DD e recusa data impossível", () => {
  assert.equal(parseDateInput("2025-09-30"), localUnix(2025, 9, 30, 0, 0));
  assert.equal(parseDateInput("2025-02-31"), null, "31 de fevereiro não existe");
  assert.equal(parseDateInput("2025-13-01"), null);
  assert.equal(parseDateInput("30/09/2025"), null);
  assert.equal(parseDateInput(""), null);
});
