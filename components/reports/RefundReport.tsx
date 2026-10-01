import { Undo2 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { RefundEntry } from "@/lib/report-types";

interface RefundReportProps {
  refunds: RefundEntry[];
}

/** Itens com `refundAmount > 0`. */
export default function RefundReport({ refunds }: RefundReportProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Undo2 className="h-4 w-4 text-rose-500" aria-hidden="true" />
        Reembolsos
      </h3>

      {refunds.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Nenhum reembolso encontrado.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {refunds.map((entry, index) => (
            <li key={`${entry.orderId}-${entry.item.itemId}-${index}`} className="py-3">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                {entry.item.itemName}
              </p>
              <p className="font-mono text-[11px] text-slate-400">pedido {entry.orderId || "—"}</p>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {entry.item.actualAmount !== null ? (
                  <span className="text-slate-600">
                    Valor original:{" "}
                    <strong className="font-semibold text-slate-900">
                      {formatBRL(entry.item.actualAmount)}
                    </strong>
                  </span>
                ) : null}

                <span className="text-slate-600">
                  Reembolsado:{" "}
                  <strong className="font-semibold text-rose-700">
                    {formatBRL(entry.item.refundAmount)}
                  </strong>
                </span>

                {entry.item.displayItemStatus ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    {entry.item.displayItemStatus}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
