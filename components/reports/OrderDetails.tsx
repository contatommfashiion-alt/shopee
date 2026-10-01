"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import ProductImage from "../ProductImage";
import { formatBRL } from "@/lib/format";
import { formatDateTime, formatRate, getOrderStatusLabel } from "@/lib/report-formatters";
import type { OrderRow } from "./RecentOrders";

interface OrderDetailsProps {
  row: OrderRow;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/** Itens do pedido. Bottom sheet no celular, modal no desktop. */
export default function OrderDetails({ row, onClose }: OrderDetailsProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const { conversion, order } = row;

  return (
    <div
      className="oz-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="oz-panel-in flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="order-details-title" className="text-base font-bold text-slate-900">
              Pedido {order.orderId || "—"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(conversion.purchaseTime)} ·{" "}
              {getOrderStatusLabel(order.orderStatus)}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Itens</dt>
              <dd className="font-semibold text-slate-900">{row.qty}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Valor</dt>
              <dd className="font-semibold text-slate-900">{formatBRL(row.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Comissão (itens)</dt>
              <dd className="font-semibold text-brand-700">{formatBRL(row.commission)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Conversão</dt>
              <dd className="truncate font-mono text-xs text-slate-700">
                {conversion.conversionId || "—"}
              </dd>
            </div>
          </dl>

          <h3 className="mt-5 text-xs font-bold tracking-wide text-slate-500 uppercase">
            Produtos
          </h3>

          <ul className="mt-2 divide-y divide-slate-100">
            {order.items.map((item, index) => (
              <li key={`${item.itemId}-${index}`} className="flex items-start gap-3 py-3.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <ProductImage src={item.imageUrl} alt={item.itemName} sizes="64px" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900">
                    {item.itemName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{item.shopName}</p>

                  <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                    {item.itemPrice !== null ? (
                      <Detail label="Preço" value={formatBRL(item.itemPrice)} />
                    ) : null}

                    <Detail label="Quantidade" value={item.qty.toString()} />

                    {item.actualAmount !== null ? (
                      <Detail label="Valor efetivo" value={formatBRL(item.actualAmount)} />
                    ) : null}

                    {item.refundAmount > 0 ? (
                      <Detail
                        label="Reembolso"
                        value={formatBRL(item.refundAmount)}
                        tone="text-rose-700"
                      />
                    ) : null}

                    {item.itemTotalCommission !== null ? (
                      <Detail
                        label="Comissão"
                        value={formatBRL(item.itemTotalCommission)}
                        tone="text-brand-700"
                      />
                    ) : null}

                    {item.itemSellerCommissionRate !== null ? (
                      <Detail
                        label="Taxa vendedor"
                        value={formatRate(item.itemSellerCommissionRate)}
                      />
                    ) : null}
                  </dl>

                  {item.displayItemStatus ? (
                    <p className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {item.displayItemStatus}
                    </p>
                  ) : null}

                  {item.fraudStatus || item.fraudReason ? (
                    <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                      <strong className="font-semibold">Fraude:</strong>{" "}
                      {[item.fraudStatus, item.fraudReason].filter(Boolean).join(" — ")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className={`font-semibold ${tone ?? "text-slate-800"}`}>{value}</dd>
    </div>
  );
}
