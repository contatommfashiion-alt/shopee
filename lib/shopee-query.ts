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
  /** Busca por palavra-chave feita pela própria Shopee. Vazio = sem busca. */
  keyword?: string | null;
}

/** Teto confirmado contra o endpoint. */
export const PRODUCT_OFFER_MAX_LIMIT = 50;

/** Buscas maiores que isso são cortadas; nenhum título útil precisa de mais. */
export const KEYWORD_MAX_LENGTH = 100;

/** Espaços colapsados, aparado e cortado no tamanho máximo. `""` = sem busca. */
export function normalizeKeyword(keyword: unknown): string {
  if (typeof keyword !== "string") return "";

  return keyword.replace(/\s+/g, " ").trim().slice(0, KEYWORD_MAX_LENGTH).trim();
}

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
 * `productCatId`, `isAMSOffer` e `isKeySeller`. São usados `limit`,
 * `productCatId` e `keyword`.
 *
 * Os valores vão como literais inline, pelo mesmo motivo da `conversionReport`:
 * por variável GraphQL o endpoint responde `wrong type`. Números entram
 * truncados; a `keyword` entra por `JSON.stringify`, que produz uma string
 * GraphQL válida com aspas, barras e caracteres de controle escapados — o
 * texto digitado nunca vira sintaxe da query.
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

  const keyword = normalizeKeyword(params.keyword);
  if (keyword !== "") args.push(`keyword: ${JSON.stringify(keyword)}`);

  return `{
  productOfferV2(${args.join(", ")}) {${SELECTION}}
}`;
}
