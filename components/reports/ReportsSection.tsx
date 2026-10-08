"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import ErrorState from "../ErrorState";
import CategoryReport from "./CategoryReport";
import CommissionSummary from "./CommissionSummary";
import DeviceReport from "./DeviceReport";
import FraudReport from "./FraudReport";
import OrderDetails from "./OrderDetails";
import OrderStatusSummary from "./OrderStatusSummary";
import PeriodFilter from "./PeriodFilter";
import RecentOrders from "./RecentOrders";
import type { OrderRow } from "./RecentOrders";
import RefundReport from "./RefundReport";
import ReportEmpty from "./ReportEmpty";
import ReportHeader from "./ReportHeader";
import ReportSkeleton from "./ReportSkeleton";
import ReportSummaryCards from "./ReportSummaryCards";
import SourceReport from "./SourceReport";
import TopProducts from "./TopProducts";
import { callApi } from "@/lib/api-client";
import {
  groupByCategory,
  groupByDevice,
  groupByOrderStatus,
  groupByProduct,
  groupBySource,
  listFraudFlags,
  listRefunds,
  summarize,
} from "@/lib/report-aggregations";
import { parseDateInput } from "@/lib/report-formatters";
import {
  DEFAULT_PAGE_LIMIT,
  earliestQueryableTime,
  resolveWindow,
} from "@/lib/report-period";
import type {
  CustomRange,
  NormalizedConversion,
  NormalizedPageInfo,
  PeriodId,
  ReportPayload,
} from "@/lib/report-types";
import type { ApiErrorCode, ShopeeCredentials } from "@/lib/types";

interface ReportsSectionProps {
  credentials: ShopeeCredentials | null;
}

type View =
  | { status: "loading" }
  | { status: "ready"; conversions: NormalizedConversion[]; pageInfo: NormalizedPageInfo }
  | { status: "error"; code: ApiErrorCode };

/**
 * Área de Relatórios.
 *
 * O período vai na consulta (`purchaseTimeStart` / `purchaseTimeEnd`, em
 * segundos), então trocar o período refaz a busca na Shopee. A paginação é por
 * cursor (`scrollId`), não por número de página — foi o que a introspecção do
 * schema mostrou.
 *
 * Todos os indicadores vêm dos dados reais recebidos; nada é inventado.
 */
export default function ReportsSection({ credentials }: ReportsSectionProps) {
  const [view, setView] = useState<View>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  /** Derivado: evita um estado paralelo que poderia sair de sincronia. */
  const busy = view.status === "loading";

  const [period, setPeriod] = useState<PeriodId>("30dias");
  const [custom, setCustom] = useState<CustomRange>({ from: "", to: "" });
  const [categoryLevel, setCategoryLevel] = useState<1 | 2 | 3>(1);
  const [openOrder, setOpenOrder] = useState<OrderRow | null>(null);

  /** O período que será enviado, já recortado para a janela que a Shopee aceita. */
  const window = useMemo(
    () => resolveWindow(period, new Date(), custom, parseDateInput),
    [period, custom],
  );

  const { from, to } = window;

  useEffect(() => {
    let cancelled = false;

    void callApi<ReportPayload>("/api/reports", credentials, {
      from,
      to,
      limit: DEFAULT_PAGE_LIMIT,
    }).then((result) => {
      if (cancelled) return;

      setView(
        result.ok
          ? {
              status: "ready",
              conversions: result.data.conversions ?? [],
              pageInfo: result.data.pageInfo,
            }
          : { status: "error", code: result.code },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [credentials, from, to, reloadToken]);

  // Trocar o período refaz a busca: o esqueleto entra aqui, no gesto, para o
  // efeito acima não precisar mexer em estado antes do `await`.
  const handlePeriodChange = useCallback((next: PeriodId) => {
    setView({ status: "loading" });
    setPeriod(next);
  }, []);

  const handleCustomChange = useCallback((next: CustomRange) => {
    setView({ status: "loading" });
    setCustom(next);
  }, []);

  const handleReload = useCallback(() => {
    setView({ status: "loading" });
    setReloadToken((token) => token + 1);
  }, []);

  const handleUseMaxPeriod = useCallback(() => {
    setView({ status: "loading" });
    setPeriod("90dias");
    setCustom({ from: "", to: "" });
  }, []);

  /** Página seguinte, pelo cursor devolvido em `pageInfo.scrollId`. */
  const handleLoadMore = useCallback(() => {
    if (view.status !== "ready" || !view.pageInfo.scrollId) return;

    const scrollId = view.pageInfo.scrollId;
    setLoadingMore(true);

    void callApi<ReportPayload>("/api/reports", credentials, {
      from,
      to,
      limit: DEFAULT_PAGE_LIMIT,
      scrollId,
    }).then((result) => {
      setLoadingMore(false);
      if (!result.ok) return;

      setView((previous) =>
        previous.status === "ready"
          ? {
              status: "ready",
              conversions: [...previous.conversions, ...(result.data.conversions ?? [])],
              pageInfo: result.data.pageInfo,
            }
          : previous,
      );
    });
  }, [view, credentials, from, to]);

  const conversions = useMemo(
    () => (view.status === "ready" ? view.conversions : []),
    [view],
  );

  const summary = useMemo(() => summarize(conversions), [conversions]);
  const products = useMemo(() => groupByProduct(conversions), [conversions]);
  const categories = useMemo(
    () => groupByCategory(conversions, categoryLevel),
    [conversions, categoryLevel],
  );
  const devices = useMemo(() => groupByDevice(conversions), [conversions]);
  const statuses = useMemo(() => groupByOrderStatus(conversions), [conversions]);
  const sources = useMemo(() => groupBySource(conversions), [conversions]);
  const refunds = useMemo(() => listRefunds(conversions), [conversions]);
  const fraudFlags = useMemo(() => listFraudFlags(conversions), [conversions]);

  /** Uma linha por pedido, com os totais daquele pedido (comissão de ITEM). */
  const orderRows = useMemo<OrderRow[]>(() => {
    const rows: OrderRow[] = [];

    for (const conversion of conversions) {
      for (const order of conversion.orders) {
        let qty = 0;
        let amount = 0;
        let commission = 0;

        for (const item of order.items) {
          qty += item.qty;
          if (item.actualAmount !== null) amount += item.actualAmount;
          if (item.itemTotalCommission !== null) commission += item.itemTotalCommission;
        }

        rows.push({
          conversion,
          order,
          qty,
          amount: Math.round(amount * 100) / 100,
          commission: Math.round(commission * 100) / 100,
        });
      }
    }

    return rows.sort(
      (a, b) =>
        (b.conversion.purchaseTime ?? Number.NEGATIVE_INFINITY) -
        (a.conversion.purchaseTime ?? Number.NEGATIVE_INFINITY),
    );
  }, [conversions]);

  /** Dados de MCN da primeira conversão que os informar. */
  const mcn = useMemo(() => {
    const withMcn = conversions.find(
      (entry) => entry.mcnManagementFeeRate !== null || entry.linkedMcnName !== null,
    );

    return {
      rate: withMcn?.mcnManagementFeeRate ?? null,
      name: withMcn?.linkedMcnName ?? null,
    };
  }, [conversions]);

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <ReportHeader />

      <button
        type="button"
        onClick={handleReload}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
        Atualizar
      </button>
    </div>
  );

  const filter = (
    <PeriodFilter
      period={period}
      custom={custom}
      onPeriodChange={handlePeriodChange}
      onCustomChange={handleCustomChange}
      window={window}
      loaded={conversions.length}
      busy={busy}
    />
  );

  if (view.status === "loading") {
    return (
      <div className="space-y-4">
        {header}
        {filter}
        <ReportSkeleton />
      </div>
    );
  }

  if (view.status === "error") {
    return (
      <div className="space-y-4">
        {header}
        {filter}
        <ErrorState code={view.code} onRetry={handleReload} retrying={busy} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {filter}

      {conversions.length === 0 ? (
        <ReportEmpty
          outsideApiWindow={window.outsideApiWindow}
          earliest={earliestQueryableTime(new Date())}
          onUseMaxPeriod={handleUseMaxPeriod}
        />
      ) : (
        <>
          <ReportSummaryCards summary={summary} />

          {fraudFlags.length > 0 ? <FraudReport entries={fraudFlags} /> : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CommissionSummary summary={summary} mcnRate={mcn.rate} mcnName={mcn.name} />
            <OrderStatusSummary statuses={statuses} />
          </div>

          <TopProducts products={products} />

          <RecentOrders rows={orderRows} onOpenDetails={setOpenOrder} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryReport
              categories={categories}
              level={categoryLevel}
              onLevelChange={setCategoryLevel}
            />
            <DeviceReport devices={devices} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SourceReport sources={sources} />
            <RefundReport refunds={refunds} />
          </div>

          {view.pageInfo.hasNextPage ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  CARREGANDO...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  CARREGAR MAIS
                </>
              )}
            </button>
          ) : null}
        </>
      )}

      {openOrder ? <OrderDetails row={openOrder} onClose={() => setOpenOrder(null)} /> : null}
    </div>
  );
}
