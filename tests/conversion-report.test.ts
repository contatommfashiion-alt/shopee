import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildConversionReportQuery,
  normalizeConversion,
  normalizeConversions,
  normalizeReportPageInfo,
} from "../lib/conversion-report.ts";
import type { Conversion } from "../lib/report-types.ts";

/** Resposta no formato real: números chegando como string. */
const RAW: Conversion = {
  clickTime: 1727650000,
  purchaseTime: "1727654400",
  conversionId: 987654321,
  shopeeCommissionCapped: "7.50",
  sellerCommission: "24.99",
  totalCommission: "32.49",
  netCommission: "29.24",
  mcnManagementFeeRate: "0.1",
  mcnManagementFee: "3.25",
  mcnContractId: 555,
  linkedMcnName: "MCN Exemplo",
  buyerType: "NEW_BUYER",
  utmContent: "campanha-x",
  device: "MOBILE",
  productType: "ALL",
  referrer: "https://exemplo/post",
  orders: [
    {
      orderId: 111222333,
      shopType: [1, 2],
      orderStatus: "COMPLETED",
      items: [
        {
          shopId: 444,
          shopName: "Loja XYZ",
          completeTime: 1727700000,
          promotionId: 1,
          modelId: 2,
          itemId: 22222222222,
          itemName: "Air Fryer 5L",
          itemPrice: "249.90",
          displayItemStatus: "COMPLETED",
          actualAmount: "249.90",
          refundAmount: "0",
          qty: "2",
          imageUrl: "https://cf.shopee.com.br/file/abc",
          itemTotalCommission: "24.99",
          itemSellerCommission: "19.99",
          itemSellerCommissionRate: "0.08",
          itemShopeeCommissionCapped: "5.00",
          itemShopeeCommissionRate: "0.02",
          itemNotes: null,
          globalCategoryLv1Name: "Casa",
          globalCategoryLv2Name: "Cozinha",
          globalCategoryLv3Name: "Fritadeiras",
          fraudStatus: null,
          fraudReason: null,
          attributionType: "LAST_CLICK",
          channelType: "SOCIAL",
          campaignPartnerName: null,
          campaignType: null,
        },
      ],
    },
  ],
};

const PARAMS = { purchaseTimeStart: 1788300000, purchaseTimeEnd: 1790892000, limit: 200 };

test("a query usa só argumentos confirmados no schema da Shopee", () => {
  const query = buildConversionReportQuery(PARAMS);

  assert.ok(query.includes("conversionReport("));

  for (const arg of [
    "conversionStatus: ALL",
    "categoryType: ALL",
    "orderStatus: ALL",
    "buyerType: ALL",
    "productType: ALL",
    "fraudStatus: ALL",
    "device: ALL",
    "purchaseTimeStart: 1788300000",
    "purchaseTimeEnd: 1790892000",
    "limit: 200",
  ]) {
    assert.ok(query.includes(arg), `faltou o argumento ${arg}`);
  }

  // A introspecção mostrou que `page` NÃO existe nesta operação: a paginação é
  // por cursor. Nomes inventados não podem voltar para a query.
  for (const forbidden of ["page:", "startDate", "endDate", "offset", "pageSize"]) {
    assert.ok(!query.includes(forbidden), `argumento inexistente foi usado: ${forbidden}`);
  }
});

test("as datas vão como literais inline, em segundos", () => {
  // Passar por variável GraphQL devolve "wrong type"; passar milissegundos
  // devolve "Timestamp unit is seconds". Ambos confirmados contra o endpoint.
  const query = buildConversionReportQuery(PARAMS);

  assert.ok(!query.includes("$"), "nenhuma variável GraphQL");
  assert.ok(!query.includes("1788300000000"), "nada de milissegundos");
});

test("a primeira página não manda scrollId", () => {
  assert.ok(!buildConversionReportQuery(PARAMS).includes("scrollId:"));
  assert.ok(!buildConversionReportQuery({ ...PARAMS, scrollId: "" }).includes("scrollId:"));
  assert.ok(!buildConversionReportQuery({ ...PARAMS, scrollId: null }).includes("scrollId:"));
});

test("o scrollId vai como string escapada", () => {
  const query = buildConversionReportQuery({ ...PARAMS, scrollId: 'abc"123' });

  assert.ok(query.includes('scrollId: "abc\\"123"'), "aspas internas são escapadas");
});

test("valores quebrados não geram query inválida", () => {
  const query = buildConversionReportQuery({
    purchaseTimeStart: 1788300000.9,
    purchaseTimeEnd: 1790892000.4,
    limit: 200.7,
  });

  assert.ok(query.includes("purchaseTimeStart: 1788300000"), "decimais são truncados");
  assert.ok(query.includes("limit: 200"));
});

test("a seleção de campos continua completa em todas as páginas", () => {
  const query = buildConversionReportQuery({ ...PARAMS, scrollId: "cursor" });

  for (const field of [
    "totalCommission",
    "netCommission",
    "itemTotalCommission",
    "refundAmount",
    "globalCategoryLv1Name",
    "fraudStatus",
    "hasNextPage",
    "scrollId",
  ]) {
    assert.ok(query.includes(field), `faltou o campo ${field}`);
  }
});

test("normalizeConversion converte strings em números", () => {
  const normalized = normalizeConversion(RAW);

  assert.ok(normalized);
  assert.equal(normalized.conversionId, "987654321");
  assert.equal(normalized.purchaseTime, 1727654400);
  assert.equal(normalized.clickTime, 1727650000);
  assert.equal(normalized.totalCommission, 32.49);
  assert.equal(normalized.netCommission, 29.24);
  assert.equal(normalized.sellerCommission, 24.99);
  assert.equal(normalized.shopeeCommissionCapped, 7.5);
  assert.equal(normalized.mcnManagementFee, 3.25);
  assert.equal(normalized.mcnManagementFeeRate, 0.1);
  assert.equal(normalized.linkedMcnName, "MCN Exemplo");
  assert.equal(normalized.device, "MOBILE");
});

test("normalizeConversion normaliza pedidos e itens", () => {
  const normalized = normalizeConversion(RAW);

  assert.ok(normalized);
  assert.equal(normalized.orders.length, 1);

  const order = normalized.orders[0];
  assert.equal(order.orderId, "111222333");
  assert.equal(order.orderStatus, "COMPLETED");
  assert.equal(order.items.length, 1);

  const item = order.items[0];
  assert.equal(item.itemId, "22222222222");
  assert.equal(item.itemName, "Air Fryer 5L");
  assert.equal(item.qty, 2);
  assert.equal(item.itemPrice, 249.9);
  assert.equal(item.actualAmount, 249.9);
  assert.equal(item.refundAmount, 0);
  assert.equal(item.itemTotalCommission, 24.99);
  assert.equal(item.itemSellerCommissionRate, 0.08);
  assert.equal(item.categoryLv1, "Casa");
  assert.equal(item.categoryLv3, "Fritadeiras");
  assert.equal(item.channelType, "SOCIAL");
});

test("nenhum campo numérico vira NaN quando o valor é inválido", () => {
  const normalized = normalizeConversion({
    conversionId: "c1",
    purchaseTime: "não é data",
    totalCommission: "abc",
    netCommission: "",
    orders: [
      {
        orderId: null,
        orderStatus: null,
        items: [{ itemId: null, qty: "abc", actualAmount: "", refundAmount: "x" }],
      },
    ],
  });

  assert.ok(normalized);
  assert.equal(normalized.purchaseTime, null);
  assert.equal(normalized.totalCommission, null);
  assert.equal(normalized.netCommission, null);

  const item = normalized.orders[0].items[0];
  assert.equal(item.qty, 0);
  assert.equal(item.actualAmount, null);
  assert.equal(item.refundAmount, 0);

  for (const value of Object.values(item)) {
    assert.ok(!Number.isNaN(value as number), "nenhum campo do item pode ser NaN");
  }
});

test("normalizeConversion tolera conversão sem pedidos", () => {
  const normalized = normalizeConversion({ conversionId: "c1", orders: null });

  assert.ok(normalized);
  assert.deepEqual(normalized.orders, []);
});

test("normalizeConversions ignora nós inválidos e lista ausente", () => {
  assert.equal(normalizeConversions([RAW, null]).length, 1);
  assert.deepEqual(normalizeConversions(null), []);
  assert.deepEqual(normalizeConversions(undefined), []);
});

test("normalizeReportPageInfo normaliza e usa padrões seguros", () => {
  assert.deepEqual(
    normalizeReportPageInfo({ page: "2", limit: "50", hasNextPage: true, scrollId: "abc" }),
    { page: 2, limit: 50, hasNextPage: true, scrollId: "abc" },
  );

  assert.deepEqual(normalizeReportPageInfo(null), {
    page: 1,
    limit: 0,
    hasNextPage: false,
    scrollId: null,
  });

  assert.deepEqual(normalizeReportPageInfo({ hasNextPage: null, scrollId: "" }), {
    page: 1,
    limit: 0,
    hasNextPage: false,
    scrollId: null,
  });
});
