import { toNumber, toNumberOr, toText } from "./normalize.ts";
import { toUnixSeconds } from "./report-formatters.ts";
import type {
  Conversion,
  ConversionItem,
  ConversionOrder,
  ConversionPageInfo,
  NormalizedConversion,
  NormalizedItem,
  NormalizedOrder,
  NormalizedPageInfo,
} from "./report-types.ts";

/**
 * A query `conversionReport` e a normalização da sua resposta.
 *
 * Fica separado de `lib/reports.ts` (que faz a chamada HTTP) para que esta
 * parte seja pura: sem credenciais, sem rede, testável isoladamente.
 */

export interface ConversionReportParams {
  /** Unix em SEGUNDOS. Confirmado contra o endpoint. */
  purchaseTimeStart: number;
  purchaseTimeEnd: number;
  /** A Shopee limita silenciosamente a 500. */
  limit: number;
  /** Cursor da página seguinte, vindo de `pageInfo.scrollId`. */
  scrollId?: string | null;
}

/**
 * Monta a query `conversionReport`.
 *
 * Os sete argumentos `ALL` são os confirmados no Shopee Affiliate Open API
 * Explorer. Os de período e paginação foram confirmados por introspecção:
 * `purchaseTimeStart`, `purchaseTimeEnd`, `limit` e `scrollId` (não existe
 * `page` — a paginação é por cursor).
 *
 * Os valores vão como **literais inline**, não como variáveis GraphQL: passados
 * por variável, o endpoint responde `wrong type` ou `got null for non-null`.
 * Como só entram números inteiros validados e uma string serializada com
 * `JSON.stringify`, não há como injetar sintaxe na query.
 */
export function buildConversionReportQuery(params: ConversionReportParams): string {
  const args = [
    "conversionStatus: ALL",
    "categoryType: ALL",
    "orderStatus: ALL",
    "buyerType: ALL",
    "productType: ALL",
    "fraudStatus: ALL",
    "device: ALL",
    `purchaseTimeStart: ${Math.trunc(params.purchaseTimeStart)}`,
    `purchaseTimeEnd: ${Math.trunc(params.purchaseTimeEnd)}`,
    `limit: ${Math.trunc(params.limit)}`,
  ];

  // Primeira página não manda cursor.
  if (typeof params.scrollId === "string" && params.scrollId !== "") {
    args.push(`scrollId: ${JSON.stringify(params.scrollId)}`);
  }

  return `{
  conversionReport(
    ${args.join(",\n    ")}
  ) {${SELECTION}}
}`;
}

/** O conjunto de campos confirmado, usado em todas as páginas. */
const SELECTION = `
    nodes {
      clickTime
      purchaseTime
      conversionId
      shopeeCommissionCapped
      sellerCommission
      totalCommission
      netCommission
      mcnManagementFeeRate
      mcnManagementFee
      mcnContractId
      linkedMcnName
      buyerType
      utmContent
      device
      productType
      referrer
      orders {
        orderId
        shopType
        orderStatus
        items {
          shopId
          shopName
          completeTime
          promotionId
          modelId
          itemId
          itemName
          itemPrice
          displayItemStatus
          actualAmount
          refundAmount
          qty
          imageUrl
          itemTotalCommission
          itemSellerCommission
          itemSellerCommissionRate
          itemShopeeCommissionCapped
          itemShopeeCommissionRate
          itemNotes
          globalCategoryLv1Name
          globalCategoryLv2Name
          globalCategoryLv3Name
          fraudStatus
          fraudReason
          attributionType
          channelType
          campaignPartnerName
          campaignType
        }
      }
    }

    pageInfo {
      page
      limit
      hasNextPage
      scrollId
    }
`;

/** Id numérico ou texto vira string, sem virar "null". */
function toId(value: unknown): string {
  const asNumber = toNumber(value);
  if (asNumber !== null) return asNumber.toString();
  return toText(value) ?? "";
}

export function normalizeItem(raw: ConversionItem | null | undefined): NormalizedItem | null {
  if (!raw || typeof raw !== "object") return null;

  return {
    itemId: toId(raw.itemId),
    itemName: toText(raw.itemName) ?? "Produto sem nome",
    shopId: toText(toId(raw.shopId)),
    shopName: toText(raw.shopName) ?? "Loja não informada",
    imageUrl: toText(raw.imageUrl),
    itemPrice: toNumber(raw.itemPrice),
    actualAmount: toNumber(raw.actualAmount),
    refundAmount: Math.max(0, toNumberOr(raw.refundAmount, 0)),
    qty: Math.max(0, Math.round(toNumberOr(raw.qty, 0))),
    itemTotalCommission: toNumber(raw.itemTotalCommission),
    itemSellerCommission: toNumber(raw.itemSellerCommission),
    itemShopeeCommissionCapped: toNumber(raw.itemShopeeCommissionCapped),
    itemSellerCommissionRate: toNumber(raw.itemSellerCommissionRate),
    itemShopeeCommissionRate: toNumber(raw.itemShopeeCommissionRate),
    displayItemStatus: toText(raw.displayItemStatus),
    itemNotes: toText(raw.itemNotes),
    completeTime: toUnixSeconds(raw.completeTime),
    categoryLv1: toText(raw.globalCategoryLv1Name),
    categoryLv2: toText(raw.globalCategoryLv2Name),
    categoryLv3: toText(raw.globalCategoryLv3Name),
    fraudStatus: toText(raw.fraudStatus),
    fraudReason: toText(raw.fraudReason),
    attributionType: toText(raw.attributionType),
    channelType: toText(raw.channelType),
    campaignPartnerName: toText(raw.campaignPartnerName),
    campaignType: toText(raw.campaignType),
  };
}

export function normalizeOrder(raw: ConversionOrder | null | undefined): NormalizedOrder | null {
  if (!raw || typeof raw !== "object") return null;

  const items: NormalizedItem[] = [];
  if (Array.isArray(raw.items)) {
    for (const item of raw.items) {
      const normalized = normalizeItem(item);
      if (normalized) items.push(normalized);
    }
  }

  return {
    orderId: toId(raw.orderId),
    orderStatus: toText(raw.orderStatus),
    items,
  };
}

export function normalizeConversion(
  raw: Conversion | null | undefined,
): NormalizedConversion | null {
  if (!raw || typeof raw !== "object") return null;

  const orders: NormalizedOrder[] = [];
  if (Array.isArray(raw.orders)) {
    for (const order of raw.orders) {
      const normalized = normalizeOrder(order);
      if (normalized) orders.push(normalized);
    }
  }

  return {
    conversionId: toId(raw.conversionId),
    purchaseTime: toUnixSeconds(raw.purchaseTime),
    clickTime: toUnixSeconds(raw.clickTime),
    totalCommission: toNumber(raw.totalCommission),
    netCommission: toNumber(raw.netCommission),
    sellerCommission: toNumber(raw.sellerCommission),
    shopeeCommissionCapped: toNumber(raw.shopeeCommissionCapped),
    mcnManagementFee: toNumber(raw.mcnManagementFee),
    mcnManagementFeeRate: toNumber(raw.mcnManagementFeeRate),
    mcnContractId: toText(toId(raw.mcnContractId)),
    linkedMcnName: toText(raw.linkedMcnName),
    buyerType: toText(raw.buyerType),
    device: toText(raw.device),
    productType: toText(raw.productType),
    referrer: toText(raw.referrer),
    utmContent: toText(raw.utmContent),
    orders,
  };
}

export function normalizeConversions(
  nodes: readonly (Conversion | null)[] | null | undefined,
): NormalizedConversion[] {
  if (!Array.isArray(nodes)) return [];

  const conversions: NormalizedConversion[] = [];
  for (const node of nodes) {
    const normalized = normalizeConversion(node);
    if (normalized) conversions.push(normalized);
  }

  return conversions;
}

export function normalizeReportPageInfo(
  raw: ConversionPageInfo | null | undefined,
): NormalizedPageInfo {
  return {
    page: Math.max(1, Math.round(toNumberOr(raw?.page, 1))),
    limit: Math.max(0, Math.round(toNumberOr(raw?.limit, 0))),
    hasNextPage: raw?.hasNextPage === true,
    scrollId: toText(raw?.scrollId),
  };
}
