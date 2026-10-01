import { getDeviceLabel, getOrderStatusLabel } from "./report-formatters.ts";
import type {
  CategoryPerformance,
  DevicePerformance,
  FraudEntry,
  NormalizedConversion,
  NormalizedItem,
  OrderStatusCount,
  ProductPerformance,
  RefundEntry,
  ReportSummary,
  SourcePerformance,
} from "./report-types.ts";

/**
 * Agregações do relatório, sobre as conversões recebidas.
 *
 * O recorte por data NÃO acontece aqui: o período vai na própria consulta
 * (`purchaseTimeStart` / `purchaseTimeEnd`), em `lib/report-period.ts`.
 *
 * ============================================================================
 * REGRA CRÍTICA — NÃO SOMAR COMISSÃO DUAS VEZES
 * ============================================================================
 *
 * A `conversionReport` traz comissão em DOIS níveis:
 *
 *   - CONVERSÃO: totalCommission, netCommission, sellerCommission,
 *                shopeeCommissionCapped
 *   - ITEM:      itemTotalCommission, itemSellerCommission,
 *                itemShopeeCommissionCapped
 *
 * Os valores de item compõem os da conversão. Somar os dois contaria cada
 * comissão duas vezes.
 *
 * Por isso, neste arquivo:
 *
 *   - `summarize()` — os indicadores gerais — usa SOMENTE o nível de CONVERSÃO;
 *   - `groupByProduct()` e `groupByCategory()` — recortes por produto — usam
 *     SOMENTE o nível de ITEM.
 *
 * As duas visões nunca são somadas entre si, e a soma das comissões por produto
 * pode não bater exatamente com a comissão total: são leituras diferentes do
 * mesmo dado, não parcelas de um total.
 */

/** Soma segura: ignora `null` e valores não finitos. Nunca devolve NaN. */
function add(total: number, value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? total + value : total;
}

/** Arredonda para centavos, evitando 0.1 + 0.2 = 0.30000000000000004. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Percorre todos os itens de todas as conversões. */
export function* iterateItems(
  conversions: readonly NormalizedConversion[],
): Generator<{ conversion: NormalizedConversion; orderId: string; item: NormalizedItem }> {
  for (const conversion of conversions) {
    for (const order of conversion.orders) {
      for (const item of order.items) {
        yield { conversion, orderId: order.orderId, item };
      }
    }
  }
}

/**
 * Indicadores gerais.
 *
 * Comissões vêm do nível de CONVERSÃO (ver a nota no topo do arquivo).
 * Quantidade, valor e reembolso vêm do nível de ITEM, que é onde existem.
 */
export function summarize(conversions: readonly NormalizedConversion[]): ReportSummary {
  const orderIds = new Set<string>();

  let items = 0;
  let ordersValue = 0;
  let refunds = 0;

  let totalCommission = 0;
  let netCommission = 0;
  let sellerCommission = 0;
  let shopeeCommissionCapped = 0;
  let mcnManagementFee = 0;

  for (const conversion of conversions) {
    totalCommission = add(totalCommission, conversion.totalCommission);
    netCommission = add(netCommission, conversion.netCommission);
    sellerCommission = add(sellerCommission, conversion.sellerCommission);
    shopeeCommissionCapped = add(shopeeCommissionCapped, conversion.shopeeCommissionCapped);
    mcnManagementFee = add(mcnManagementFee, conversion.mcnManagementFee);

    for (const order of conversion.orders) {
      if (order.orderId !== "") orderIds.add(order.orderId);

      for (const item of order.items) {
        items += item.qty;
        ordersValue = add(ordersValue, item.actualAmount);
        refunds = add(refunds, item.refundAmount);
      }
    }
  }

  return {
    orders: orderIds.size,
    conversions: conversions.length,
    items,
    ordersValue: toCents(ordersValue),
    totalCommission: toCents(totalCommission),
    netCommission: toCents(netCommission),
    sellerCommission: toCents(sellerCommission),
    shopeeCommissionCapped: toCents(shopeeCommissionCapped),
    mcnManagementFee: toCents(mcnManagementFee),
    refunds: toCents(refunds),
  };
}

/**
 * Produtos mais vendidos, agrupados por `itemId`.
 *
 * Comissão vem do nível de ITEM (`itemTotalCommission`).
 */
export function groupByProduct(
  conversions: readonly NormalizedConversion[],
): ProductPerformance[] {
  const byItem = new Map<string, ProductPerformance>();

  for (const { item } of iterateItems(conversions)) {
    if (item.itemId === "") continue;

    const existing = byItem.get(item.itemId);

    if (existing) {
      existing.qty += item.qty;
      existing.amount = add(existing.amount, item.actualAmount);
      existing.commission = add(existing.commission, item.itemTotalCommission);
      // Uma imagem que falte num registro pode existir em outro.
      if (!existing.imageUrl && item.imageUrl) existing.imageUrl = item.imageUrl;
      continue;
    }

    byItem.set(item.itemId, {
      itemId: item.itemId,
      itemName: item.itemName,
      shopName: item.shopName,
      imageUrl: item.imageUrl,
      qty: item.qty,
      amount: add(0, item.actualAmount),
      commission: add(0, item.itemTotalCommission),
    });
  }

  return [...byItem.values()]
    .map((entry) => ({
      ...entry,
      amount: toCents(entry.amount),
      commission: toCents(entry.commission),
    }))
    .sort((a, b) => b.qty - a.qty || b.amount - a.amount);
}

/**
 * Categorias que mais vendem.
 *
 * `level` escolhe entre `globalCategoryLv1Name`, `Lv2` e `Lv3`.
 * Comissão vem do nível de ITEM.
 */
export function groupByCategory(
  conversions: readonly NormalizedConversion[],
  level: 1 | 2 | 3 = 1,
): CategoryPerformance[] {
  const byCategory = new Map<string, CategoryPerformance>();

  for (const { item } of iterateItems(conversions)) {
    const raw = level === 1 ? item.categoryLv1 : level === 2 ? item.categoryLv2 : item.categoryLv3;
    const category = raw && raw.trim() !== "" ? raw.trim() : "Sem categoria";

    const existing = byCategory.get(category);

    if (existing) {
      existing.items += item.qty;
      existing.amount = add(existing.amount, item.actualAmount);
      existing.commission = add(existing.commission, item.itemTotalCommission);
      continue;
    }

    byCategory.set(category, {
      category,
      items: item.qty,
      amount: add(0, item.actualAmount),
      commission: add(0, item.itemTotalCommission),
    });
  }

  return [...byCategory.values()]
    .map((entry) => ({
      ...entry,
      amount: toCents(entry.amount),
      commission: toCents(entry.commission),
    }))
    .sort((a, b) => b.amount - a.amount || b.items - a.items);
}

/** Conversões por dispositivo, com percentual sobre o total. */
export function groupByDevice(
  conversions: readonly NormalizedConversion[],
): DevicePerformance[] {
  const counts = new Map<string, number>();

  for (const conversion of conversions) {
    const device = getDeviceLabel(conversion.device);
    counts.set(device, (counts.get(device) ?? 0) + 1);
  }

  const total = conversions.length;

  return [...counts.entries()]
    .map(([device, count]) => ({
      device,
      count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Pedidos agrupados por `orderStatus`, sem tradução inventada. */
export function groupByOrderStatus(
  conversions: readonly NormalizedConversion[],
): OrderStatusCount[] {
  const counts = new Map<string, number>();
  const seenOrders = new Set<string>();

  for (const conversion of conversions) {
    for (const order of conversion.orders) {
      // Um mesmo pedido pode aparecer em mais de uma conversão.
      if (order.orderId !== "" && seenOrders.has(order.orderId)) continue;
      if (order.orderId !== "") seenOrders.add(order.orderId);

      const status = order.orderStatus?.trim() || "";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([status, count]) => ({ status, label: getOrderStatusLabel(status), count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Origem das conversões.
 *
 * Só agrupa o que existe nos dados (`referrer`, `utmContent`, `channelType`).
 * Nada é classificado como WhatsApp/Instagram/TikTok por dedução.
 */
export function groupBySource(
  conversions: readonly NormalizedConversion[],
): SourcePerformance[] {
  const counts = new Map<string, SourcePerformance>();

  const register = (field: SourcePerformance["field"], value: string | null) => {
    const clean = value?.trim();
    if (!clean) return;

    const key = `${field}:${clean}`;
    const existing = counts.get(key);

    if (existing) existing.count += 1;
    else counts.set(key, { field, value: clean, count: 1 });
  };

  for (const conversion of conversions) {
    register("referrer", conversion.referrer);
    register("utmContent", conversion.utmContent);

    for (const order of conversion.orders) {
      for (const item of order.items) {
        register("channelType", item.channelType);
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/** Itens com reembolso. */
export function listRefunds(conversions: readonly NormalizedConversion[]): RefundEntry[] {
  const entries: RefundEntry[] = [];

  for (const { conversion, orderId, item } of iterateItems(conversions)) {
    if (item.refundAmount > 0) {
      entries.push({ orderId, conversionId: conversion.conversionId, item });
    }
  }

  return entries.sort((a, b) => b.item.refundAmount - a.item.refundAmount);
}

/**
 * Itens com indicação de fraude.
 *
 * Nenhum registro é escondido nem classificado como válido/inválido: só são
 * separados os que a Shopee marcou, para serem exibidos com o status e o motivo
 * exatamente como vieram.
 */
export function listFraudFlags(conversions: readonly NormalizedConversion[]): FraudEntry[] {
  const entries: FraudEntry[] = [];

  for (const { conversion, orderId, item } of iterateItems(conversions)) {
    const hasStatus = !!item.fraudStatus && item.fraudStatus.trim() !== "";
    const hasReason = !!item.fraudReason && item.fraudReason.trim() !== "";

    if (hasStatus || hasReason) {
      entries.push({ orderId, conversionId: conversion.conversionId, item });
    }
  }

  return entries;
}
