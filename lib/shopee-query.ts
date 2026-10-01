/**
 * A query `productOfferV2`.
 *
 * Fica separada de `lib/shopee.ts` (que faz a chamada HTTP) para ser pura: sem
 * credenciais, sem rede, testável isoladamente.
 */

export interface ProductOfferParams {
  /** Nicho (categoria de nível 1). `null` traz tudo. Ver `lib/categories.ts`. */
  productCatId?: number | null;
  /** A Shopee recusa acima de 50: `Exceeded the maximum number of page limit`. */
  limit?: number;
}

/** Teto confirmado contra o endpoint. */
export const PRODUCT_OFFER_MAX_LIMIT = 50;

/** O conjunto de campos confirmado, usado em toda consulta de ofertas. */
const SELECTION = `
    nodes {
      productName
      itemId
      commissionRate
      commission
      price
      sales
      imageUrl
      shopName
      productLink
      offerLink
      periodStartTime
      periodEndTime
      priceMin
      priceMax
      productCatIds
      ratingStar
      priceDiscountRate
      shopId
      shopType
      sellerCommissionRate
      shopeeCommissionRate
    }
    pageInfo {
      page
      limit
      hasNextPage
      scrollId
    }
`;

/**
 * Monta a query `productOfferV2`.
 *
 * A introspecção do schema confirmou os argumentos aceitos: `listType`,
 * `matchId`, `keyword`, `sortType`, `page`, `limit`, `itemId`, `shopId`,
 * `productCatId`, `isAMSOffer` e `isKeySeller`. Só `productCatId` e `limit`
 * são usados por enquanto.
 *
 * Os valores vão como literais inline, pelo mesmo motivo da `conversionReport`:
 * por variável GraphQL o endpoint responde `wrong type`. Só entram inteiros
 * truncados, então não há como injetar sintaxe na query.
 */
export function buildProductOfferQuery(params: ProductOfferParams = {}): string {
  const limit = Math.min(
    Math.max(1, Math.trunc(params.limit ?? PRODUCT_OFFER_MAX_LIMIT)),
    PRODUCT_OFFER_MAX_LIMIT,
  );

  const args = [`limit: ${limit}`];

  if (typeof params.productCatId === "number" && Number.isFinite(params.productCatId)) {
    args.push(`productCatId: ${Math.trunc(params.productCatId)}`);
  }

  return `{
  productOfferV2(${args.join(", ")}) {${SELECTION}}
}`;
}
