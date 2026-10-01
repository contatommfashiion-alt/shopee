import { ListChecks } from "lucide-react";
import type { OrderStatusCount } from "@/lib/report-types";

interface OrderStatusSummaryProps {
  statuses: OrderStatusCount[];
}

/**
 * Pedidos por `orderStatus`.
 *
 * Os rótulos saem de `getOrderStatusLabel`, que mostra o valor da Shopee como
 * veio — sem tradução inventada.
 */
export default function OrderStatusSummary({ statuses }: OrderStatusSummaryProps) {
  if (statuses.length === 0) return null;

  const total = statuses.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <ListChecks className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Status dos pedidos
      </h3>

      <ul className="mt-3 space-y-2.5">
        {statuses.map((entry) => {
          const percentage = total === 0 ? 0 : Math.round((entry.count / total) * 100);

          return (
            <li key={entry.status || "sem-status"}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate text-slate-700" title={entry.status || undefined}>
                  {entry.label}
                </span>
                <span className="font-semibold text-slate-900">{entry.count}</span>
              </div>

              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
