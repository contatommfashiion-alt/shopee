import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDiscountRate,
  normalizePageInfo,
  normalizeProduct,
  normalizeProducts,
  toNumber,
} from "../lib/normalize.ts";
import type { ShopeeProductOffer } from "../lib/types.ts";

/** Shape taken from a real `productOfferV2` response (numbers arrive as strings). */
const RAW_OFFER: ShopeeProductOffer = {
  productName: "Air Fryer 5L",
  itemId: 22222222222,
  commissionRate: "0.13",
  commission: "2.3257",
  price: "17.89",
  sales: 14045,
  imageUrl: "https://cf.shopee.com.br/file/abc123",
  shopName: "Loja XYZ",
  productLink: "https://shopee.com.br/product/1/2",
  offerLink: "https://s.shopee.com.br/abc",
  periodStartTime: 1700000000,
  periodEndTime: 1800000000,
  priceMin: "17.89",
  priceMax: "21.90",
  productCatIds: ["100012", 100630],
  ratingStar: "4.6",
  priceDiscountRate: 35,
  shopId: 333,
  shopType: [1, 2],
  sellerCommissionRate: "0.1",
  shopeeCommissionRate: "0.03",
};

test("toNumber parses numbers and numeric strings, rejecting everything else", () => {
  assert.equal(toNumber(17.89), 17.89);
  assert.equal(toNumber("17.89"), 17.89);
  assert.equal(toNumber("  4.6  "), 4.6);
  assert.equal(toNumber(""), null);
  assert.equal(toNumber("   "), null);
  assert.equal(toNumber("abc"), null);
  assert.equal(toNumber(null), null);
  assert.equal(toNumber(undefined), null);
  assert.equal(toNumber(Number.NaN), null);
  assert.equal(toNumber(Number.POSITIVE_INFINITY), null);
  assert.equal(toNumber({}), null);
});

test("normalizeProduct converts the confirmed payload to the app shape", () => {
  const product = normalizeProduct(RAW_OFFER);
  assert.ok(product);

  assert.deepEqual(product, {
    itemId: "22222222222",
    name: "Air Fryer 5L",
    image: "https://cf.shopee.com.br/file/abc123",
    shopName: "Loja XYZ",
    price: 17.89,
    priceMin: 17.89,
    priceMax: 21.9,
    discountRate: 35,
    rating: 4.6,
    sales: 14045,
    commissionRate: 0.13,
    commission: 2.3257,
    sellerCommissionRate: 0.1,
    shopeeCommissionRate: 0.03,
    productLink: "https://shopee.com.br/product/1/2",
    offerLink: "https://s.shopee.com.br/abc",
    categoryIds: [100012, 100630],
  });
});

test("normalizeProduct never lets NaN or undefined through", () => {
  const product = normalizeProduct({
    productName: "  Produto sem dados  ",
    itemId: "999",
    price: "não é número",
    sales: "abc",
    ratingStar: "",
    priceDiscountRate: "oops",
    commissionRate: null,
    commission: undefined,
    imageUrl: "   ",
    shopName: null,
    productLink: "https://shopee.com.br/product/9/9",
    offerLink: null,
    productCatIds: null,
  });

  assert.ok(product);
  assert.equal(product.name, "Produto sem dados");
  assert.equal(product.price, 0);
  assert.equal(product.sales, 0);
  assert.equal(product.rating, null);
  assert.equal(product.discountRate, null);
  assert.equal(product.commissionRate, null);
  assert.equal(product.commission, null);
  assert.equal(product.image, null);
  assert.equal(product.shopName, "Loja não informada");
  assert.deepEqual(product.categoryIds, []);

  for (const value of Object.values(product)) {
    assert.ok(!Number.isNaN(value as number), "no field may be NaN");
    assert.notEqual(value, undefined, "no field may be undefined");
  }
});

test("normalizeProduct derives the commission when the API omits it", () => {
  const product = normalizeProduct({ ...RAW_OFFER, commission: null });

  assert.ok(product);
  // 17.89 * 0.13 = 2.3257
  assert.equal(product.commission, 2.3257);
});

test("normalizeProduct falls back to offerLink when productLink is missing", () => {
  const product = normalizeProduct({ ...RAW_OFFER, productLink: null });

  assert.ok(product);
  assert.equal(product.productLink, "https://s.shopee.com.br/abc");
});

test("normalizeProduct rejects offers the app cannot use", () => {
  assert.equal(normalizeProduct(null), null);
  assert.equal(normalizeProduct(undefined), null);
  assert.equal(normalizeProduct({ ...RAW_OFFER, itemId: null }), null);
  assert.equal(normalizeProduct({ ...RAW_OFFER, productName: "  " }), null);
  assert.equal(normalizeProduct({ ...RAW_OFFER, productLink: null, offerLink: null }), null);
});

test("normalizeProducts drops unusable nodes and tolerates a missing list", () => {
  const products = normalizeProducts([RAW_OFFER, null, { ...RAW_OFFER, itemId: null }]);

  assert.equal(products.length, 1);
  assert.equal(products[0].itemId, "22222222222");
  assert.deepEqual(normalizeProducts(null), []);
  assert.deepEqual(normalizeProducts(undefined), []);
});

test("normalizeDiscountRate applies the documented heuristic", () => {
  assert.equal(normalizeDiscountRate(35), 35);
  assert.equal(normalizeDiscountRate("35"), 35);
  assert.equal(normalizeDiscountRate(0.35), 35);
  assert.equal(normalizeDiscountRate("0.35"), 35);
  // Documented ambiguity: 1 is read as 1%, the conservative choice.
  assert.equal(normalizeDiscountRate(1), 1);
  assert.equal(normalizeDiscountRate(100), 100);
  assert.equal(normalizeDiscountRate(0), null);
  assert.equal(normalizeDiscountRate(-5), null);
  assert.equal(normalizeDiscountRate(101), null);
  assert.equal(normalizeDiscountRate("abc"), null);
  assert.equal(normalizeDiscountRate(null), null);
});

test("normalizePageInfo normalizes and defaults safely", () => {
  assert.deepEqual(normalizePageInfo({ page: "2", limit: "50", hasNextPage: true, scrollId: "xyz" }), {
    page: 2,
    limit: 50,
    hasNextPage: true,
    scrollId: "xyz",
  });

  assert.deepEqual(normalizePageInfo(null), {
    page: 1,
    limit: 0,
    hasNextPage: false,
    scrollId: null,
  });

  assert.deepEqual(normalizePageInfo({ hasNextPage: null, scrollId: "" }), {
    page: 1,
    limit: 0,
    hasNextPage: false,
    scrollId: null,
  });
});
