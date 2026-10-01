import { test } from "node:test";
import assert from "node:assert/strict";
import { PRODUCT_OFFER_MAX_LIMIT, buildProductOfferQuery } from "../lib/shopee-query.ts";

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
