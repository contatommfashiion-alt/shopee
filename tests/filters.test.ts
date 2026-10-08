import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FILTERS, applyFilters } from "../lib/filters.ts";
import type { OfferFilters, Product, SortOption } from "../lib/types.ts";

function product(overrides: Partial<Product> & Pick<Product, "itemId" | "name">): Product {
  return {
    image: null,
    shopName: "Loja",
    price: 10,
    priceMin: null,
    priceMax: null,
    discountRate: null,
    rating: null,
    sales: 0,
    commissionRate: null,
    commission: null,
    sellerCommissionRate: null,
    shopeeCommissionRate: null,
    productLink: "",
    offerLink: null,
    categoryIds: [],
    ...overrides,
  };
}

const PRODUCTS = [
  product({ itemId: "tenis", name: "Tênis Casual Masculino", shopName: "Loja A", price: 89.9, commissionRate: 0.1, commission: 8.99 }),
  product({ itemId: "camiseta", name: "Camiseta Oversized Algodão", shopName: "Moda B", price: 19.9, commissionRate: 0.3, commission: 5.97 }),
  product({ itemId: "botao", name: "Botão de Pressão Metal", price: 45 }),
];

function ids(filters: Partial<OfferFilters>, sort: SortOption = "commission"): string[] {
  return applyFilters(PRODUCTS, { ...EMPTY_FILTERS, ...filters }, sort).products.map((entry) => entry.itemId);
}

test("busca ignora acentos e maiúsculas", () => {
  assert.deepEqual(ids({ search: "TENIS" }), ["tenis"]);
  assert.deepEqual(ids({ search: "algodao" }), ["camiseta"]);
});

test("plural encontra singular", () => {
  assert.deepEqual(ids({ search: "camisetas" }), ["camiseta"]);
  assert.deepEqual(ids({ search: "botões" }), ["botao"]);
});

test("busca também olha o nome da loja", () => {
  assert.deepEqual(ids({ search: "moda" }), ["camiseta"]);
});

test("sem ninguém com todas as palavras, mostra os mais próximos e avisa", () => {
  const result = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, search: "tênis azul" }, "commission");

  assert.deepEqual(result.products.map((entry) => entry.itemId), ["tenis"]);
  assert.equal(result.partialSearch, true);
});

test("com todas as palavras, não é parcial", () => {
  const result = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, search: "tênis masculino" }, "commission");

  assert.deepEqual(result.products.map((entry) => entry.itemId), ["tenis"]);
  assert.equal(result.partialSearch, false);
});

test("nenhuma palavra em comum não mostra nada", () => {
  const result = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, search: "geladeira" }, "commission");

  assert.deepEqual(result.products, []);
  assert.equal(result.partialSearch, false);
});

test("preço mínimo acima do máximo é tratado como invertido", () => {
  assert.deepEqual(ids({ minPrice: 50, maxPrice: 20 }, "priceAsc"), ids({ minPrice: 20, maxPrice: 50 }, "priceAsc"));
  assert.deepEqual(ids({ minPrice: 50, maxPrice: 20 }), ["botao"]);
});

test("comissão em R$ e em % ordenam diferente", () => {
  assert.deepEqual(ids({}, "commission"), ["tenis", "camiseta", "botao"]);
  assert.deepEqual(ids({}, "commissionRate"), ["camiseta", "tenis", "botao"]);
});
