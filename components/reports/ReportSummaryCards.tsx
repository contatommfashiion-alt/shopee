import { Banknote, Package, PiggyBank, ShoppingCart, Undo2, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { ReportSummary } from "@/lib/report-types";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

/**
 * Indicadores gerais.
 *
 * As comissões vêm do nível de CONVERSÃO (`totalCommission`, `netCommission`),
 * nunca somadas com as de item — ver a nota em `lib/report-aggregations.ts`.
 */
export default function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const cards = [
    {
      key: "pedidos",
      label: "Pedidos",
      value: summary.orders.toString(),
      icon: ShoppingCart,
      hint: "orderId distintos",
    },
    {
      key: "itens",
      label: "Itens vendidos",
      value: summary.items.toString(),
      icon: Package,
      hint: "soma de qty",
    },
    {
      key: "valor",
      label: "Valor dos pedidos",
      value: formatBRL(summary.ordersValue),
      icon: Banknote,
      hint: "soma de actualAmount",
    },
    {
      key: "comissao",
      label: "Comissão total",
      value: formatBRL(summary.totalCommission),
      icon: Wallet,
      hint: "totalCommission",
    },
    {
      key: "liquida",
      label: "Comissão líquida",
      value: formatBRL(summary.netCommission),
      icon: PiggyBank,
      hint: "netCommission",
      highlight: true,
    },
    {
      key: "reembolsos",
      label: "Reembolsos",
      value: formatBRL(summary.refunds),
      icon: Undo2,
      hint: "soma de refundAmount",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const highlight = card.highlight === true;

        return (
          <div
            key={card.key}
            className={`rounded-2xl border p-4 ${
              highlight ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
            }`}
          >
            <p
              className={`flex items-center gap-1.5 text-xs font-medium ${
                highlight ? "text-brand-700" : "text-slate-500"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {card.label}
            </p>

            <p
              className={`mt-1.5 text-xl font-bold tracking-tight sm:text-2xl ${
                highlight ? "text-brand-900" : "text-slate-900"
              }`}
            >
              {card.value}
            </p>

            {/* Qual campo da API gerou o número, para dar para conferir. */}
            <p className="mt-1 truncate font-mono text-[10px] text-slate-400">{card.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
