import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupByCategory,
  groupByDevice,
  groupByOrderStatus,
  groupByProduct,
  groupBySource,
  listFraudFlags,
  listRefunds,
  summarize,
} from "../lib/report-aggregations.ts";
import type { NormalizedConversion, NormalizedItem } from "../lib/report-types.ts";

function localUnix(year: number, month: number, day: number, hour = 12): number {
  return Math.floor(new Date(year, month - 1, day, hour, 0, 0, 0).getTime() / 1000);
}

function item(partial: Partial<NormalizedItem>): NormalizedItem {
  return {
    itemId: "1",
    itemName: "Produto",
    shopId: null,
    shopName: "Loja",
    imageUrl: null,
    itemPrice: null,
    actualAmount: null,
    refundAmount: 0,
    qty: 1,
    itemTotalCommission: null,
    itemSellerCommission: null,
    itemShopeeCommissionCapped: null,
    itemSellerCommissionRate: null,
    itemShopeeCommissionRate: null,
    displayItemStatus: null,
    itemNotes: null,
    completeTime: null,
    categoryLv1: null,
    categoryLv2: null,
    categoryLv3: null,
    fraudStatus: null,
    fraudReason: null,
    attributionType: null,
    channelType: null,
    campaignPartnerName: null,
    campaignType: null,
    ...partial,
  };
}

function conversion(partial: Partial<NormalizedConversion>): NormalizedConversion {
  return {
    conversionId: "c1",
    purchaseTime: null,
    clickTime: null,
    totalCommission: null,
    netCommission: null,
    sellerCommission: null,
    shopeeCommissionCapped: null,
    mcnManagementFee: null,
    mcnManagementFeeRate: null,
    mcnContractId: null,
    linkedMcnName: null,
    buyerType: null,
    device: null,
    productType: null,
    referrer: null,
    utmContent: null,
    orders: [],
    ...partial,
  };
}

/** Cenário: 1 conversão, 1 pedido, 2 itens. Comissão nos DOIS níveis. */
const SAMPLE: NormalizedConversion[] = [
  conversion({
    conversionId: "c1",
    purchaseTime: localUnix(2025, 9, 30),
    totalCommission: 32.49,
    netCommission: 29.24,
    sellerCommission: 24.99,
    shopeeCommissionCapped: 7.5,
    mcnManagementFee: 3.25,
    mcnManagementFeeRate: 0.1,
    device: "MOBILE",
    referrer: "https://exemplo/post",
    orders: [
      {
        orderId: "o1",
        orderStatus: "COMPLETED",
        items: [
          item({
            itemId: "i1",
            itemName: "Air Fryer 5L",
            qty: 2,
            actualAmount: 249.9,
            itemTotalCommission: 24.99,
            categoryLv1: "Casa",
            channelType: "SOCIAL",
          }),
          item({
            itemId: "i2",
            itemName: "Cabo USB-C",
            qty: 1,
            actualAmount: 17.89,
            itemTotalCommission: 7.5,
            refundAmount: 5,
            categoryLv1: "Eletrônicos",
          }),
        ],
      },
    ],
  }),
];

test("summarize conta pedidos, itens, valor e reembolso dos ITENS", () => {
  const summary = summarize(SAMPLE);

  assert.equal(summary.orders, 1);
  assert.equal(summary.conversions, 1);
  assert.equal(summary.items, 3, "soma de qty: 2 + 1");
  assert.equal(summary.ordersValue, 267.79, "soma de actualAmount");
  assert.equal(summary.refunds, 5);
});

test("summarize usa SOMENTE a comissão de CONVERSÃO, sem dupla contagem", () => {
  const summary = summarize(SAMPLE);

  // Nível de conversão: 32.49. Nível de item: 24.99 + 7.50 = 32.49.
  // Somar os dois daria 64.98 — é exatamente isso que não pode acontecer.
  assert.equal(summary.totalCommission, 32.49);
  assert.notEqual(summary.totalCommission, 64.98, "comissão não pode ser contada duas vezes");

  assert.equal(summary.netCommission, 29.24);
  assert.equal(summary.sellerCommission, 24.99);
  assert.equal(summary.shopeeCommissionCapped, 7.5);
  assert.equal(summary.mcnManagementFee, 3.25);
});

test("summarize soma várias conversões sem erro de ponto flutuante", () => {
  const summary = summarize([
    conversion({ totalCommission: 0.1, netCommission: 0.1 }),
    conversion({ conversionId: "c2", totalCommission: 0.2, netCommission: 0.2 }),
  ]);

  assert.equal(summary.totalCommission, 0.3);
  assert.equal(summary.netCommission, 0.3);
});

test("summarize ignora nulos e nunca devolve NaN", () => {
  const summary = summarize([conversion({ totalCommission: null, netCommission: null })]);

  for (const value of Object.values(summary)) {
    assert.ok(!Number.isNaN(value), "nenhum indicador pode ser NaN");
  }
  assert.equal(summary.totalCommission, 0);
});

test("summarize conta cada pedido uma vez, mesmo em conversões diferentes", () => {
  const repeated = [
    conversion({ conversionId: "c1", orders: [{ orderId: "o1", orderStatus: null, items: [] }] }),
    conversion({ conversionId: "c2", orders: [{ orderId: "o1", orderStatus: null, items: [] }] }),
  ];

  assert.equal(summarize(repeated).orders, 1);
  assert.equal(summarize(repeated).conversions, 2);
});

test("groupByProduct agrupa por itemId e usa a comissão de ITEM", () => {
  const products = groupByProduct(SAMPLE);

  assert.equal(products.length, 2);
  assert.equal(products[0].itemId, "i1", "ordenado por quantidade");
  assert.equal(products[0].qty, 2);
  assert.equal(products[0].amount, 249.9);
  assert.equal(products[0].commission, 24.99, "itemTotalCommission, não totalCommission");
});

test("groupByProduct soma o mesmo itemId vindo de pedidos diferentes", () => {
  const products = groupByProduct([
    ...SAMPLE,
    conversion({
      conversionId: "c2",
      orders: [
        {
          orderId: "o2",
          orderStatus: null,
          items: [item({ itemId: "i1", qty: 3, actualAmount: 100, itemTotalCommission: 10 })],
        },
      ],
    }),
  ]);

  const airFryer = products.find((entry) => entry.itemId === "i1");

  assert.ok(airFryer);
  assert.equal(airFryer.qty, 5);
  assert.equal(airFryer.amount, 349.9);
  assert.equal(airFryer.commission, 34.99);
});

test("groupByCategory agrupa por nível e usa a comissão de ITEM", () => {
  const categories = groupByCategory(SAMPLE, 1);

  assert.equal(categories.length, 2);
  assert.equal(categories[0].category, "Casa", "ordenado por valor");
  assert.equal(categories[0].items, 2);
  assert.equal(categories[0].amount, 249.9);
  assert.equal(categories[0].commission, 24.99);
});

test("groupByCategory usa 'Sem categoria' quando o campo não vem", () => {
  const categories = groupByCategory(
    [conversion({ orders: [{ orderId: "o", orderStatus: null, items: [item({})] }] })],
    1,
  );

  assert.equal(categories[0].category, "Sem categoria");
});

test("a soma das comissões por produto não é somada aos indicadores gerais", () => {
  // As duas visões existem lado a lado; o teste fixa que são leituras
  // independentes do mesmo dado, nunca parcelas somáveis.
  const summary = summarize(SAMPLE);
  const porProduto = groupByProduct(SAMPLE).reduce((sum, entry) => sum + entry.commission, 0);

  assert.equal(Math.round(porProduto * 100) / 100, 32.49);
  assert.equal(summary.totalCommission, 32.49);
  assert.notEqual(summary.totalCommission + porProduto, summary.totalCommission);
});

test("groupByDevice conta e calcula percentual", () => {
  const devices = groupByDevice([
    conversion({ device: "MOBILE" }),
    conversion({ conversionId: "c2", device: "MOBILE" }),
    conversion({ conversionId: "c3", device: "DESKTOP" }),
    conversion({ conversionId: "c4", device: null }),
  ]);

  assert.equal(devices[0].device, "Mobile");
  assert.equal(devices[0].count, 2);
  assert.equal(devices[0].percentage, 50);
  assert.ok(devices.some((entry) => entry.device === "Não informado"));
});

test("groupByOrderStatus não traduz enum desconhecido, só deixa legível", () => {
  const statuses = groupByOrderStatus(SAMPLE);

  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].status, "COMPLETED", "o valor da Shopee é preservado");
  assert.equal(statuses[0].label, "Completed");
  assert.equal(statuses[0].count, 1);
});

test("groupBySource só mostra origem presente nos dados", () => {
  const sources = groupBySource(SAMPLE);

  assert.ok(sources.some((entry) => entry.field === "referrer" && entry.value === "https://exemplo/post"));
  assert.ok(sources.some((entry) => entry.field === "channelType" && entry.value === "SOCIAL"));
  assert.ok(
    !sources.some((entry) => /whatsapp|instagram|tiktok/i.test(entry.value)),
    "nada é deduzido como rede social",
  );
});

test("listRefunds traz só itens com reembolso", () => {
  const refunds = listRefunds(SAMPLE);

  assert.equal(refunds.length, 1);
  assert.equal(refunds[0].item.itemId, "i2");
  assert.equal(refunds[0].orderId, "o1");
});

test("listFraudFlags separa o que a Shopee marcou, sem esconder nada", () => {
  const flagged = [
    conversion({
      orders: [
        {
          orderId: "o1",
          orderStatus: null,
          items: [
            item({ itemId: "ok" }),
            item({ itemId: "suspeito", fraudStatus: "SUSPECTED", fraudReason: "motivo" }),
          ],
        },
      ],
    }),
  ];

  const entries = listFraudFlags(flagged);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].item.itemId, "suspeito");
  // O registro marcado continua contando nos totais.
  assert.equal(summarize(flagged).items, 2);
});

