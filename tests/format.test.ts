import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatBRL,
  formatDiscount,
  formatPercentage,
  formatRating,
  formatSales,
} from "../lib/format.ts";

test("formatBRL renders pt-BR currency", () => {
  assert.equal(formatBRL(17.89), "R$ 17,89");
  assert.equal(formatBRL(249.9), "R$ 249,90");
  assert.equal(formatBRL(5), "R$ 5,00");
  assert.equal(formatBRL(0), "R$ 0,00");
  assert.equal(formatBRL(1234.5), "R$ 1.234,50");
  assert.equal(formatBRL(1234567.891), "R$ 1.234.567,89");
  assert.equal(formatBRL(2.3257), "R$ 2,33");
  assert.equal(formatBRL(-10.5), "-R$ 10,50");
});

test("formatBRL never renders NaN", () => {
  assert.equal(formatBRL(null), "—");
  assert.equal(formatBRL(undefined), "—");
  assert.equal(formatBRL(Number.NaN), "—");
  assert.equal(formatBRL(Number.POSITIVE_INFINITY), "—");
});

test("formatPercentage turns a fraction into a percentage", () => {
  assert.equal(formatPercentage(0.13), "13%");
  assert.equal(formatPercentage(0.1), "10%");
  assert.equal(formatPercentage(0.03), "3%");
  assert.equal(formatPercentage(0.135), "13,5%");
  assert.equal(formatPercentage(1), "100%");
  assert.equal(formatPercentage(0), "0%");
  assert.equal(formatPercentage(null), "—");
  assert.equal(formatPercentage(Number.NaN), "—");
});

test("formatDiscount renders an already-normalized percentage", () => {
  assert.equal(formatDiscount(35), "35%");
  assert.equal(formatDiscount(7.5), "7,5%");
  assert.equal(formatDiscount(100), "100%");
  assert.equal(formatDiscount(null), "—");
});

test("formatSales abbreviates in pt-BR", () => {
  assert.equal(formatSales(0), "0");
  assert.equal(formatSales(999), "999");
  assert.equal(formatSales(1000), "1 mil");
  assert.equal(formatSales(8400), "8,4 mil");
  assert.equal(formatSales(14045), "14 mil");
  assert.equal(formatSales(99_900), "100 mil");
  assert.equal(formatSales(999_999), "1 mi");
  assert.equal(formatSales(1_200_000), "1,2 mi");
  assert.equal(formatSales(null), "0");
  assert.equal(formatSales(Number.NaN), "0");
});

test("formatRating uses one decimal with a comma", () => {
  assert.equal(formatRating(4.6), "4,6");
  assert.equal(formatRating(5), "5,0");
  assert.equal(formatRating(4.95), "5,0");
  assert.equal(formatRating(null), "—");
});
