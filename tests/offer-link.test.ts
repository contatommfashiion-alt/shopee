import { test } from "node:test";
import assert from "node:assert/strict";
import { getPreferredOfferLink } from "../lib/offer-link.ts";

const OFFER = "https://s.shopee.com.br/abc123";
const PRODUCT = "https://shopee.com.br/product/111/222";

test("prefers offerLink when it is present", () => {
  assert.equal(getPreferredOfferLink({ offerLink: OFFER, productLink: PRODUCT }), OFFER);
});

test("falls back to productLink", () => {
  assert.equal(getPreferredOfferLink({ offerLink: null, productLink: PRODUCT }), PRODUCT);
  assert.equal(getPreferredOfferLink({ offerLink: "", productLink: PRODUCT }), PRODUCT);
  assert.equal(getPreferredOfferLink({ offerLink: "   ", productLink: PRODUCT }), PRODUCT);
});

test("returns null when there is no usable link", () => {
  assert.equal(getPreferredOfferLink({ offerLink: null, productLink: "" }), null);
  assert.equal(getPreferredOfferLink({ offerLink: "  ", productLink: "  " }), null);
  assert.equal(getPreferredOfferLink(null), null);
  assert.equal(getPreferredOfferLink(undefined), null);
});

test("returns the link exactly as the API sent it, only trimmed", () => {
  const withSpaces = `  ${OFFER}  `;

  assert.equal(getPreferredOfferLink({ offerLink: withSpaces, productLink: PRODUCT }), OFFER);
});
