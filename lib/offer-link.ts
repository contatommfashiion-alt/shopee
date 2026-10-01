import type { Product } from "./types";

/** The two link fields `productOfferV2` returns. */
export type LinkSource = Pick<Product, "offerLink" | "productLink">;

/**
 * Picks the link that goes into the shared message and into "VER NA SHOPEE".
 *
 * Priority:
 *   1. `offerLink`, when present;
 *   2. `productLink` as a fallback.
 *
 * No link is ever rewritten, shortened or decorated with extra parameters —
 * only what the API returned is used.
 *
 * TODO: confirm in the Shopee terms/documentation whether the `offerLink`
 * returned by `productOfferV2` already carries the correct affiliate
 * attribution for the authenticated application. If it does not, this is the
 * single place that must change.
 */
export function getPreferredOfferLink(product: LinkSource | null | undefined): string | null {
  if (!product) return null;

  const offerLink = typeof product.offerLink === "string" ? product.offerLink.trim() : "";
  if (offerLink !== "") return offerLink;

  const productLink = typeof product.productLink === "string" ? product.productLink.trim() : "";
  if (productLink !== "") return productLink;

  return null;
}
