/**
 * Types for OfertaZap.
 *
 * The `Shopee*` types describe the RAW shape returned by the Shopee Affiliate
 * Open API (GraphQL). The `Product` / `PageInfo` types describe the NORMALIZED
 * shape this app sends to the browser.
 *
 * Only the fields confirmed on the real `productOfferV2` query are declared.
 * No invented arguments, endpoints or fields.
 */

/**
 * The Shopee API delivers numeric fields either as numbers or as strings.
 * Confirmed real examples:
 *   price: "17.89"   commissionRate: "0.13"   commission: "2.3257"
 *   ratingStar: "4.6"   sellerCommissionRate: "0.1"   shopeeCommissionRate: "0.03"
 */
export type ShopeeNumeric = number | string | null | undefined;

/** One node of `productOfferV2.nodes`. */
export interface ShopeeProductOffer {
  productName?: string | null;
  itemId?: ShopeeNumeric;
  commissionRate?: ShopeeNumeric;
  commission?: ShopeeNumeric;
  price?: ShopeeNumeric;
  sales?: ShopeeNumeric;
  imageUrl?: string | null;
  shopName?: string | null;
  productLink?: string | null;
  offerLink?: string | null;
  periodStartTime?: ShopeeNumeric;
  periodEndTime?: ShopeeNumeric;
  priceMin?: ShopeeNumeric;
  priceMax?: ShopeeNumeric;
  productCatIds?: readonly ShopeeNumeric[] | null;
  ratingStar?: ShopeeNumeric;
  priceDiscountRate?: ShopeeNumeric;
  shopId?: ShopeeNumeric;
  /**
   * `shopType` is part of the confirmed selection set, but its exact runtime
   * shape is not documented in the material we have (it is read back as a list
   * of codes). It is therefore typed loosely and NOT used by the UI.
   *
   * TODO: confirm the meaning of each `shopType` code before surfacing it
   * (e.g. as a "Loja Oficial" / "Shopee Mall" badge).
   */
  shopType?: readonly ShopeeNumeric[] | ShopeeNumeric;
  sellerCommissionRate?: ShopeeNumeric;
  shopeeCommissionRate?: ShopeeNumeric;
}

/** `productOfferV2.pageInfo`. */
export interface ShopeePageInfo {
  page?: ShopeeNumeric;
  limit?: ShopeeNumeric;
  hasNextPage?: boolean | null;
  scrollId?: string | null;
}

/** `productOfferV2`. */
export interface ShopeeProductOfferResponse {
  nodes?: readonly ShopeeProductOffer[] | null;
  pageInfo?: ShopeePageInfo | null;
}

/** `data` payload of the confirmed query. */
export interface ShopeeProductOfferData {
  productOfferV2?: ShopeeProductOfferResponse | null;
}

export interface ShopeeGraphQLError {
  message?: string | null;
  extensions?: { code?: number | string | null } | null;
}

/** Envelope of any GraphQL response. */
export interface ShopeeGraphQLResponse<TData> {
  data?: TData | null;
  errors?: readonly ShopeeGraphQLError[] | null;
}

/** Normalized product sent to the browser. Never contains `NaN`. */
export interface Product {
  itemId: string;
  name: string;
  image: string | null;
  shopName: string;
  /** In BRL. */
  price: number;
  priceMin: number | null;
  priceMax: number | null;
  /** Percentage in the 0-100 range. See `normalizeDiscountRate`. */
  discountRate: number | null;
  /** Stars, 0-5. */
  rating: number | null;
  sales: number;
  /** Fraction, e.g. 0.13 means 13%. */
  commissionRate: number | null;
  /** Estimated commission in BRL. */
  commission: number | null;
  sellerCommissionRate: number | null;
  shopeeCommissionRate: number | null;
  productLink: string;
  offerLink: string | null;
  categoryIds: number[];
}

/** Normalized `pageInfo`. */
export interface PageInfo {
  page: number;
  limit: number;
  hasNextPage: boolean;
  scrollId: string | null;
}

/** Success body of `GET /api/offers`. */
export interface OffersPayload {
  products: Product[];
  pageInfo: PageInfo;
}

/**
 * The three values needed to sign a Shopee request.
 *
 * They come either from the server environment (preferred: the Secret never
 * leaves the server) or from the credentials screen, in which case they are
 * used for that single request and discarded.
 */
export interface ShopeeCredentials {
  appId: string;
  secret: string;
  apiUrl: string;
}

/** Stable error codes shared by the route handler and the UI. */
export type ApiErrorCode =
  | "MISSING_CONFIG"
  | "INVALID_API_URL"
  | "BLOCKED_API_URL"
  | "INVALID_CREDENTIALS"
  | "TIMEOUT"
  | "NETWORK"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

/** Error body of `GET /api/offers`. Never carries secrets or raw upstream text. */
export interface OffersErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export type QuickFilterId =
  | "offers"
  | "rating"
  | "sales"
  | "commission"
  | "price20"
  | "price50"
  | "price100";

export type SortOption =
  | "commission"
  | "discount"
  | "sales"
  | "rating"
  | "priceAsc"
  | "priceDesc";

/** Everything the local (client-side) filtering needs. */
export interface OfferFilters {
  /** Free text matched locally against product name and shop name. */
  search: string;
  quick: QuickFilterId | null;
  minPrice: number | null;
  maxPrice: number | null;
  /** Percentage, 0-100. */
  minDiscount: number | null;
  /** Stars, 0-5. */
  minRating: number | null;
  minSales: number | null;
  /** Percentage, 0-100. */
  minCommission: number | null;
}

export type MessageTemplateId = "direto" | "urgencia" | "simples";

/** A ready-to-share WhatsApp message model. */
export interface MessageTemplate {
  id: MessageTemplateId;
  label: string;
  description: string;
  build: (product: Product) => string;
}
