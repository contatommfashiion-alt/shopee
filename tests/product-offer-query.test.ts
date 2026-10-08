import { test } from "node:test";
import assert from "node:assert/strict";
import {
  KEYWORD_MAX_LENGTH,
  PRODUCT_OFFER_MAX_LIMIT,
  buildProductOfferQuery,
  normalizeKeyword,
} from "../lib/shopee-query.ts";

test("com busca, manda keyword como string GraphQL", () => {
  const query = buildProductOfferQuery({ keyword: "  tênis   masculino ", productCatId: 100630 });

  assert.ok(query.includes('keyword: "tênis masculino"'));
  assert.ok(query.includes("productCatId: 100630"), "a busca convive com o nicho");
});

test("sem busca, ou busca em branco, não manda keyword", () => {
  for (const keyword of [undefined, null, "", "   "]) {
    assert.ok(!buildProductOfferQuery({ keyword }).includes("keyword:"), `deveria ignorar: ${String(keyword)}`);
  }
});

test("aspas e barras da busca são escapadas, sem quebrar a query", () => {
  const query = buildProductOfferQuery({ keyword: 'x") { __schema { types { name } } } #\\' });

  assert.ok(query.includes('keyword: "x\\") { __schema { types { name } } } #\\\\"'));
  // A string termina onde deveria: logo depois vem o fechamento dos argumentos.
  assert.ok(query.includes('#\\\\") {'));
});

test("normalizeKeyword colapsa espaços e corta no tamanho máximo", () => {
  assert.equal(normalizeKeyword("  a \n b  "), "a b");
  assert.equal(normalizeKeyword(42), "");
  assert.equal(normalizeKeyword("x".repeat(500)).length, KEYWORD_MAX_LENGTH);
});

test("o limite máximo é o confirmado contra o endpoint", () => {
  // Pedir acima disso devolve:
  // "Exceeded the maximum number of page limit, the maximum limit is 50".
  assert.equal(PRODUCT_OFFER_MAX_LIMIT, 50);
});

test("sem nicho, a consulta não manda productCatId", () => {
  const query = buildProductOfferQuery();

  assert.ok(query.includes("productOfferV2("));
  assert.ok(query.includes("limit: 50"));
  // `productCatId:` é o ARGUMENTO; `productCatIds` é um campo da seleção e
  // continua sendo pedido sempre.
  assert.ok(!query.includes("productCatId:"), "nenhum filtro de categoria");
  assert.ok(query.includes("productCatIds"), "o campo continua na seleção");
});

test("com nicho, manda productCatId", () => {
  const query = buildProductOfferQuery({ productCatId: 100630, limit: 20 });

  assert.ok(query.includes("productCatId: 100630"));
  assert.ok(query.includes("limit: 20"));
});

test("null e valores inválidos viram 'sem nicho'", () => {
  for (const productCatId of [null, undefined, Number.NaN]) {
    const query = buildProductOfferQuery({ productCatId });
    assert.ok(!query.includes("productCatId:"), `deveria ignorar: ${String(productCatId)}`);
  }
});

test("o limite é preso entre 1 e o máximo", () => {
  assert.ok(buildProductOfferQuery({ limit: 999 }).includes("limit: 50"));
  assert.ok(buildProductOfferQuery({ limit: 0 }).includes("limit: 1"));
  assert.ok(buildProductOfferQuery({ limit: -5 }).includes("limit: 1"));
  assert.ok(buildProductOfferQuery({ limit: 20.9 }).includes("limit: 20"), "trunca decimais");
});

test("os valores vão como literais inline, sem variável GraphQL", () => {
  // Por variável o endpoint responde "wrong type" — confirmado na sondagem.
  const query = buildProductOfferQuery({ productCatId: 100630 });

  assert.ok(!query.includes("$"), "nenhuma variável");
});

test("a seleção de campos continua completa", () => {
  const query = buildProductOfferQuery({ productCatId: 100630 });

  for (const field of [
    "productName",
    "itemId",
    "commissionRate",
    "commission",
    "price",
    "sales",
    "imageUrl",
    "shopName",
    "productLink",
    "offerLink",
    "priceDiscountRate",
    "ratingStar",
    "productCatIds",
    "hasNextPage",
  ]) {
    assert.ok(query.includes(field), `faltou o campo ${field}`);
  }
});
