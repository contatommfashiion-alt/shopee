import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTikTokAndroidUrl,
  buildTikTokSearchUrl,
  buildTikTokSuggestions,
  extractKeywords,
  isAndroid,
} from "../lib/tiktok-search.ts";

test("strips Shopee marketing noise and quantities", () => {
  assert.deepEqual(
    extractKeywords("Kit 3 Camisetas Oversized Algodão Premium Promoção Envio Imediato"),
    ["camisetas", "oversized", "algodão"],
  );
});

test("drops bracketed tags, symbols and stopwords", () => {
  assert.deepEqual(
    extractKeywords("[ENVIO 24H] Fone de Ouvido Bluetooth (Original) 🔥 Sem Fio - Preto"),
    ["fone", "ouvido", "bluetooth", "fio", "preto"],
  );
});

test("keeps model numbers but not leading or quantity numbers", () => {
  assert.deepEqual(extractKeywords("Capinha iPhone 15 Pro Max"), ["capinha", "iphone", "15", "pro", "max"]);
  assert.deepEqual(extractKeywords("Meias 10 Pares Cano Alto"), ["meias", "cano", "alto"]);
  assert.deepEqual(extractKeywords("10pcs Prendedor de Cabelo 2026"), ["prendedor", "cabelo"]);
});

test("removes duplicate words", () => {
  assert.deepEqual(extractKeywords("Tênis Tênis Casual Casual"), ["tênis", "casual"]);
});

test("returns nothing for empty or missing titles", () => {
  assert.deepEqual(extractKeywords(""), []);
  assert.deepEqual(extractKeywords(null), []);
  assert.deepEqual(extractKeywords("Promoção Envio Imediato"), []);
  assert.deepEqual(buildTikTokSuggestions(undefined), []);
});

test("suggests phrases from most to least specific, without repeats", () => {
  assert.deepEqual(buildTikTokSuggestions("Fone de Ouvido Bluetooth Sem Fio Preto"), [
    "fone ouvido bluetooth fio",
    "fone ouvido bluetooth",
    "fone ouvido",
  ]);
  assert.deepEqual(buildTikTokSuggestions("Kit 2 Garrafa Térmica"), ["garrafa térmica"]);
  assert.deepEqual(buildTikTokSuggestions("Luminária"), ["luminária"]);
});

test("builds an encoded TikTok search URL that also works on phones", () => {
  assert.equal(
    buildTikTokSearchUrl("  garrafa   térmica "),
    "https://www.tiktok.com/search?q=garrafa%20t%C3%A9rmica",
  );
  assert.equal(buildTikTokSearchUrl("   "), null);
});

test("on Android, the link names the TikTok app and falls back to the web search", () => {
  assert.equal(
    buildTikTokAndroidUrl("garrafa térmica"),
    "intent://www.tiktok.com/search?q=garrafa%20t%C3%A9rmica#Intent;scheme=https;" +
      "package=com.zhiliaoapp.musically;" +
      "S.browser_fallback_url=https%3A%2F%2Fwww.tiktok.com%2Fsearch%3Fq%3Dgarrafa%2520t%25C3%25A9rmica;end",
  );
  assert.equal(buildTikTokAndroidUrl("  "), null);
});

test("detects Android from the user agent", () => {
  assert.equal(isAndroid("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130 Mobile"), true);
  assert.equal(isAndroid("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari"), false);
  assert.equal(isAndroid("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130"), false);
});
