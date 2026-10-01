import type { ShopeeNumeric } from "./types.ts";

/**
 * Tipos da operação `conversionReport` da Shopee Affiliate Open API.
 *
 * Os tipos `Conversion*` descrevem a resposta CRUA; os `Normalized*` descrevem
 * o que o endpoint interno devolve ao navegador, com números já convertidos.
 *
 * Só constam os campos da query confirmada no Shopee Affiliate Open API
 * Explorer. Nada foi inventado.
 */

// ============================================================================
// Resposta crua
// ============================================================================

export interface ConversionItem {
  shopId?: ShopeeNumeric;
  shopName?: string | null;
  completeTime?: ShopeeNumeric;
  promotionId?: ShopeeNumeric;
  modelId?: ShopeeNumeric;
  itemId?: ShopeeNumeric;
  itemName?: string | null;
  itemPrice?: ShopeeNumeric;
  displayItemStatus?: string | null;
  actualAmount?: ShopeeNumeric;
  refundAmount?: ShopeeNumeric;
  qty?: ShopeeNumeric;
  imageUrl?: string | null;
  itemTotalCommission?: ShopeeNumeric;
  itemSellerCommission?: ShopeeNumeric;
  itemSellerCommissionRate?: ShopeeNumeric;
  itemShopeeCommissionCapped?: ShopeeNumeric;
  itemShopeeCommissionRate?: ShopeeNumeric;
  itemNotes?: string | null;
  globalCategoryLv1Name?: string | null;
  globalCategoryLv2Name?: string | null;
  globalCategoryLv3Name?: string | null;
  fraudStatus?: string | null;
  fraudReason?: string | null;
  attributionType?: string | null;
  channelType?: string | null;
  campaignPartnerName?: string | null;
  campaignType?: string | null;
}

export interface ConversionOrder {
  orderId?: ShopeeNumeric;
  shopType?: readonly ShopeeNumeric[] | ShopeeNumeric;
  orderStatus?: string | null;
  items?: readonly ConversionItem[] | null;
}

export interface Conversion {
  clickTime?: ShopeeNumeric;
  purchaseTime?: ShopeeNumeric;
  conversionId?: ShopeeNumeric;
  shopeeCommissionCapped?: ShopeeNumeric;
  sellerCommission?: ShopeeNumeric;
  totalCommission?: ShopeeNumeric;
  netCommission?: ShopeeNumeric;
  mcnManagementFeeRate?: ShopeeNumeric;
  mcnManagementFee?: ShopeeNumeric;
  mcnContractId?: ShopeeNumeric;
  linkedMcnName?: string | null;
  buyerType?: string | null;
  utmContent?: string | null;
  device?: string | null;
  productType?: string | null;
  referrer?: string | null;
  orders?: readonly ConversionOrder[] | null;
}

export interface ConversionPageInfo {
  page?: ShopeeNumeric;
  limit?: ShopeeNumeric;
  hasNextPage?: boolean | null;
  scrollId?: string | null;
}

export interface ConversionReportResponse {
  nodes?: readonly Conversion[] | null;
  pageInfo?: ConversionPageInfo | null;
}

export interface ConversionReportData {
  conversionReport?: ConversionReportResponse | null;
}

// ============================================================================
// Resposta normalizada (o que chega ao navegador). Nunca contém NaN.
// ============================================================================

export interface NormalizedItem {
  itemId: string;
  itemName: string;
  shopId: string | null;
  shopName: string;
  imageUrl: string | null;
  /** Preço unitário informado. */
  itemPrice: number | null;
  /** Valor efetivo do item — base do "valor dos pedidos". */
  actualAmount: number | null;
  refundAmount: number;
  qty: number;
  /** Comissão NO NÍVEL DO ITEM. Ver a nota sobre dupla contagem em report-aggregations.ts. */
  itemTotalCommission: number | null;
  itemSellerCommission: number | null;
  itemShopeeCommissionCapped: number | null;
  itemSellerCommissionRate: number | null;
  itemShopeeCommissionRate: number | null;
  displayItemStatus: string | null;
  itemNotes: string | null;
  completeTime: number | null;
  categoryLv1: string | null;
  categoryLv2: string | null;
  categoryLv3: string | null;
  fraudStatus: string | null;
  fraudReason: string | null;
  attributionType: string | null;
  channelType: string | null;
  campaignPartnerName: string | null;
  campaignType: string | null;
}

export interface NormalizedOrder {
  orderId: string;
  orderStatus: string | null;
  items: NormalizedItem[];
}

export interface NormalizedConversion {
  conversionId: string;
  /** Unix em segundos, ou `null` quando a Shopee não informar. */
  purchaseTime: number | null;
  clickTime: number | null;
  /** Comissões NO NÍVEL DA CONVERSÃO — base dos indicadores gerais. */
  totalCommission: number | null;
  netCommission: number | null;
  sellerCommission: number | null;
  shopeeCommissionCapped: number | null;
  mcnManagementFee: number | null;
  mcnManagementFeeRate: number | null;
  mcnContractId: string | null;
  linkedMcnName: string | null;
  buyerType: string | null;
  device: string | null;
  productType: string | null;
  referrer: string | null;
  utmContent: string | null;
  orders: NormalizedOrder[];
}

export interface NormalizedPageInfo {
  page: number;
  limit: number;
  hasNextPage: boolean;
  scrollId: string | null;
}

/** Corpo de sucesso de `/api/reports`. */
export interface ReportPayload {
  conversions: NormalizedConversion[];
  pageInfo: NormalizedPageInfo;
}

// ============================================================================
// Agregações calculadas sobre os registros carregados
// ============================================================================

export interface ReportSummary {
  /** Pedidos distintos (`orderId`). */
  orders: number;
  /** Conversões no período. */
  conversions: number;
  /** Somatório de `qty`. */
  items: number;
  /** Somatório de `actualAmount` dos itens. */
  ordersValue: number;
  /** Nível de CONVERSÃO. */
  totalCommission: number;
  netCommission: number;
  sellerCommission: number;
  shopeeCommissionCapped: number;
  mcnManagementFee: number;
  /** Somatório de `refundAmount` dos itens. */
  refunds: number;
}

export interface ProductPerformance {
  itemId: string;
  itemName: string;
  shopName: string;
  imageUrl: string | null;
  qty: number;
  amount: number;
  /** Nível de ITEM. */
  commission: number;
}

export interface CategoryPerformance {
  category: string;
  items: number;
  amount: number;
  commission: number;
}

export interface DevicePerformance {
  device: string;
  count: number;
  /** 0-100. */
  percentage: number;
}

export interface OrderStatusCount {
  status: string;
  label: string;
  count: number;
}

export interface SourcePerformance {
  /** De qual campo veio: `referrer`, `utmContent` ou `channelType`. */
  field: "referrer" | "utmContent" | "channelType";
  value: string;
  count: number;
}

export interface RefundEntry {
  orderId: string;
  conversionId: string;
  item: NormalizedItem;
}

export interface FraudEntry {
  orderId: string;
  conversionId: string;
  item: NormalizedItem;
}

/**
 * O período vai na consulta (`purchaseTimeStart` / `purchaseTimeEnd`), então
 * trocar aqui refaz a busca no servidor. `90dias` é o máximo que a Shopee
 * aceita — ver `lib/report-period.ts`.
 */
export type PeriodId = "hoje" | "7dias" | "30dias" | "90dias" | "personalizado";

export interface CustomRange {
  /** `YYYY-MM-DD` do input de data, ou `""`. */
  from: string;
  to: string;
}
