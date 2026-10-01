import { Wallet } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { formatRate } from "@/lib/report-formatters";
import type { ReportSummary } from "@/lib/report-types";

interface CommissionSummaryProps {
  summary: ReportSummary;
  /** Taxa MCN da primeira conversão que a informar, quando aplicável. */
  mcnRate: number | null;
  mcnName: string | null;
}

/**
 * Detalhe das comissões, no nível de CONVERSÃO.
 *
 * Linhas sem valor não aparecem: nada é exibido como R$ 0,00 quando o campo
 * simplesmente não veio.
 */
export default function CommissionSummary({ summary, mcnRate, mcnName }: CommissionSummaryProps) {
  const rows: { label: string; value: string; strong?: boolean }[] = [];

  rows.push({ label: "Comissão total", value: formatBRL(summary.totalCommission), strong: true });

  if (summary.netCommission !== 0) {
    rows.push({ label: "Comissão líquida", value: formatBRL(summary.netCommission), strong: true });
  }

  if (summary.sellerCommission !== 0) {
    rows.push({ label: "Comissão do vendedor", value: formatBRL(summary.sellerCommission) });
  }

  if (summary.shopeeCommissionCapped !== 0) {
    rows.push({ label: "Comissão Shopee (teto)", value: formatBRL(summary.shopeeCommissionCapped) });
  }

  if (summary.mcnManagementFee !== 0) {
    rows.push({ label: "Taxa MCN", value: formatBRL(summary.mcnManagementFee) });
  }

  if (mcnRate !== null && mcnRate !== 0) {
    rows.push({ label: "Percentual MCN", value: formatRate(mcnRate) });
  }

  if (mcnName) {
    rows.push({ label: "MCN", value: mcnName });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Wallet className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Comissões
      </h3>

      <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd
              className={`text-sm font-semibold ${
                row.strong ? "text-brand-700" : "text-slate-900"
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Valores do nível da conversão. As comissões por produto, mais abaixo, vêm do nível do item —
        as duas visões não se somam.
      </p>
    </section>
  );
}
