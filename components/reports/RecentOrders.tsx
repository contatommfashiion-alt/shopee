"use client";

import { Receipt } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { formatDateTime, getOrderStatusLabel } from "@/lib/report-formatters";
import type { NormalizedConversion, NormalizedOrder } from "@/lib/report-types";

export interface OrderRow {
  conversion: NormalizedConversion;
  order: NormalizedOrder;
  qty: number;
  amount: number;
  /** Comissão do nível de ITEM, somada dentro deste pedido. */
  commission: number;
}

interface RecentOrdersProps {
  rows: OrderRow[];
  limit?: number;
  onOpenDetails: (row: OrderRow) => void;
}

/** Tabela no desktop, cards no celular. */
export default function RecentOrders({ rows, limit = 20, onOpenDetails }: RecentOrdersProps) {
  if (rows.length === 0) return null;

  const visible = rows.slice(0, limit);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
        <Receipt className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Pedidos recentes
      </h3>

      <table className="hidden w-full text-left text-sm lg:table">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">
              Pedido
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Data
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Produtos
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Qtd
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Valor
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Comissão
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {visible.map((row) => (
            <tr key={`${row.conversion.conversionId}-${row.order.orderId}`} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-slate-900">
                {row.order.orderId || "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                {formatDateTime(row.conversion.purchaseTime)}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {getOrderStatusLabel(row.order.orderStatus)}
                </span>
              </td>
              <td className="max-w-xs px-4 py-3">
                <p className="truncate text-slate-700" title={row.order.items.map((i) => i.itemName).join(", ")}>
                  {row.order.items[0]?.itemName ?? "—"}
                  {row.order.items.length > 1 ? ` +${row.order.items.length - 1}` : ""}
                </p>
              </td>
              <td className="px-4 py-3 text-right text-slate-900">{row.qty}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-slate-900">
                {formatBRL(row.amount)}
              </td>
              <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-brand-700">
                {formatBRL(row.commission)}
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onOpenDetails(row)}
                  className="text-xs font-semibold text-brand-700 transition hover:text-brand-900 hover:underline"
                >
                  Ver detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {visible.map((row) => (
          <li key={`${row.conversion.conversionId}-${row.order.orderId}`} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-500">{row.order.orderId || "—"}</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900">
                  {row.order.items[0]?.itemName ?? "—"}
                  {row.order.items.length > 1 ? ` +${row.order.items.length - 1}` : ""}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {getOrderStatusLabel(row.order.orderStatus)}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(row.conversion.purchaseTime)} · {row.qty}{" "}
              {row.qty === 1 ? "item" : "itens"}
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-900">{formatBRL(row.amount)}</span>
              <span className="text-sm font-bold text-brand-700">{formatBRL(row.commission)}</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenDetails(row)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              VER DETALHES
            </button>
          </li>
        ))}
      </ul>

      {rows.length > visible.length ? (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Mostrando os {visible.length} primeiros de {rows.length} pedidos.
        </p>
      ) : null}
    </section>
  );
}
