import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMessage, buildWhatsAppShareUrl } from "../lib/message.ts";
import type { Product } from "../lib/types.ts";

const FULL: Product = {
  itemId: "22222222222",
  name: "Air Fryer 5L",
  image: "https://cf.shopee.com.br/file/abc",
  shopName: "Loja XYZ",
  price: 249.9,
  priceMin: 249.9,
  priceMax: 299.9,
  discountRate: 35,
  rating: 4.9,
  sales: 8400,
  commissionRate: 0.13,
  commission: 32.487,
  sellerCommissionRate: 0.1,
  shopeeCommissionRate: 0.03,
  productLink: "https://shopee.com.br/product/1/2",
  offerLink: "https://s.shopee.com.br/abc",
  categoryIds: [],
};

test("the 'direto' template renders every confirmed field", () => {
  assert.equal(
    buildMessage(FULL, "direto"),
    [
      "🔥 OFERTA SHOPEE!",
      "",
      "Air Fryer 5L",
      "",
      "💰 Por R$ 249,90",
      "",
      "⭐ 4,9",
      "🛒 8,4 mil vendidos",
      "",
      "🛍️ Confira:",
      "https://s.shopee.com.br/abc",
      "",
      "⚠️ Preço e disponibilidade podem mudar.",
    ].join("\n"),
  );
});

test("the 'urgencia' template renders every confirmed field", () => {
  assert.equal(
    buildMessage(FULL, "urgencia"),
    [
      "🚨 OLHA ESSA OFERTA!",
      "",
      "Air Fryer 5L",
      "",
      "🔥 Por apenas R$ 249,90",
      "",
      "⭐ 4,9",
      "🛒 8,4 mil vendidos",
      "",
      "Confira enquanto estiver disponível 👇",
      "",
      "https://s.shopee.com.br/abc",
    ].join("\n"),
  );
});

test("the 'simples' template stays short", () => {
  assert.equal(
    buildMessage(FULL, "simples"),
    [
      "🛍️ Air Fryer 5L",
      "",
      "🔥 R$ 249,90",
      "",
      "Confira na Shopee 👇",
      "https://s.shopee.com.br/abc",
    ].join("\n"),
  );
});

test("lines without data are hidden, with no blank gap left behind", () => {
  const message = buildMessage({ ...FULL, rating: null, sales: 0 }, "direto");

  assert.ok(!message.includes("⭐"), "no rating line");
  assert.ok(!message.includes("🛒"), "no sales line");
  assert.ok(!message.includes("\n\n\n"), "no doubled blank line");
  assert.equal(
    message,
    [
      "🔥 OFERTA SHOPEE!",
      "",
      "Air Fryer 5L",
      "",
      "💰 Por R$ 249,90",
      "",
      "🛍️ Confira:",
      "https://s.shopee.com.br/abc",
      "",
      "⚠️ Preço e disponibilidade podem mudar.",
    ].join("\n"),
  );
});

test("a zero price hides the price line instead of showing R$ 0,00", () => {
  const message = buildMessage({ ...FULL, price: 0 }, "simples");

  assert.ok(!message.includes("R$"), "no price line");
  assert.ok(message.includes("Air Fryer 5L"));
});

test("the message uses the preferred link (offerLink first)", () => {
  assert.ok(buildMessage(FULL, "simples").includes("https://s.shopee.com.br/abc"));
  assert.ok(
    buildMessage({ ...FULL, offerLink: null }, "simples").includes(
      "https://shopee.com.br/product/1/2",
    ),
  );
});

test("the WhatsApp URL only pre-fills the text, encoded", () => {
  const url = buildWhatsAppShareUrl("Oferta & cia\nR$ 10,00 #1");

  assert.equal(url, "https://api.whatsapp.com/send?text=Oferta%20%26%20cia%0AR%24%2010%2C00%20%231");
  assert.ok(url.startsWith("https://api.whatsapp.com/send?text="), "no phone number, no automatic send");
});

test("emoji go out as their UTF-8 bytes, not through wa.me (which turns them into �)", () => {
  const url = buildWhatsAppShareUrl("🔥 ⭐ ⚠️");

  assert.ok(!url.includes("wa.me"));
  assert.ok(url.endsWith("%F0%9F%94%A5%20%E2%AD%90%20%E2%9A%A0%EF%B8%8F"));
});
