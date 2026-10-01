import { ShieldAlert } from "lucide-react";
import type { FraudEntry } from "@/lib/report-types";

interface FraudReportProps {
  entries: FraudEntry[];
}

/**
 * Registros com indicação de fraude.
 *
 * Nada é escondido e nada é classificado como válido ou inválido por nossa
 * conta: os enums oficiais de `fraudStatus` não estão documentados aqui, então
 * o status e o motivo aparecem exatamente como a Shopee devolveu. Estes
 * registros continuam contando nos totais — separá-los aqui é só para dar
 * visibilidade.
 *
 * TODO: confirmar os valores oficiais de `fraudStatus` para poder sinalizar
 * gravidade sem adivinhar.
 */
export default function FraudReport({ entries }: FraudReportProps) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <ShieldAlert className="h-4 w-4 text-amber-700" aria-hidden="true" />
        Registros sinalizados pela Shopee
      </h3>

      <p className="mt-1 text-xs leading-relaxed text-amber-800">
        A Shopee marcou estes itens. Os valores continuam somados nos indicadores — mostramos o
        status e o motivo como vieram, sem interpretar.
      </p>

      <ul className="mt-3 divide-y divide-amber-200/70">
        {entries.map((entry, index) => (
          <li key={`${entry.orderId}-${entry.item.itemId}-${index}`} className="py-2.5">
            <p className="line-clamp-2 text-sm font-semibold text-amber-900">
              {entry.item.itemName}
            </p>
            <p className="font-mono text-[11px] text-amber-700">pedido {entry.orderId || "—"}</p>

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-amber-900">
              {entry.item.fraudStatus ? (
                <span>
                  <span className="font-mono text-[11px] text-amber-700">fraudStatus:</span>{" "}
                  <strong className="font-semibold">{entry.item.fraudStatus}</strong>
                </span>
              ) : null}

              {entry.item.fraudReason ? (
                <span>
                  <span className="font-mono text-[11px] text-amber-700">fraudReason:</span>{" "}
                  <strong className="font-semibold">{entry.item.fraudReason}</strong>
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
