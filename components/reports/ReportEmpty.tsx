import { CalendarX2, Inbox } from "lucide-react";
import { API_MAX_WINDOW_DAYS } from "@/lib/report-period";
import { formatDate } from "@/lib/report-formatters";

interface ReportEmptyProps {
  /** `true` quando o período pedido é anterior ao que a Shopee permite consultar. */
  outsideApiWindow: boolean;
  /** O período mais antigo consultável, em Unix de segundos. */
  earliest: number;
  onUseMaxPeriod: () => void;
}

/**
 * Estado sem conversões.
 *
 * Separa dois casos que pareciam iguais: não houve vendas no período, e o
 * período pedido está fora do limite de 3 meses da Shopee. O segundo não é
 * ausência de vendas — é limite da API, e dizer isso evita achar que as vendas
 * sumiram.
 */
export default function ReportEmpty({
  outsideApiWindow,
  earliest,
  onUseMaxPeriod,
}: ReportEmptyProps) {
  if (outsideApiWindow) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-sm border border-amber-200 bg-amber-50 px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-sm bg-amber-100 text-amber-700"
        >
          <CalendarX2 className="h-7 w-7" />
        </span>

        <div className="max-w-lg space-y-2">
          <p className="text-base font-semibold text-amber-900">
            A Shopee não permite consultar esse período.
          </p>
          <p className="text-sm leading-relaxed text-amber-800">
            A API de afiliados devolve apenas os últimos {API_MAX_WINDOW_DAYS} dias — ou seja, a
            partir de <strong className="font-semibold">{formatDate(earliest)}</strong>. Vendas
            anteriores a essa data existem na sua conta, mas não são acessíveis por aqui.
          </p>
          <p className="text-sm leading-relaxed text-amber-800">
            É um limite da Shopee, não da Laranjinha. Para períodos mais antigos, use os relatórios
            do painel de afiliado.
          </p>
        </div>

        <button
          type="button"
          onClick={onUseMaxPeriod}
          className="rounded-sm bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 active:bg-amber-800"
        >
          VER OS ÚLTIMOS 3 MESES
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-sm border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-sm bg-slate-100 text-slate-400"
      >
        <Inbox className="h-7 w-7" />
      </span>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">
          Você ainda não possui conversões neste período.
        </p>
        <p className="text-sm text-slate-500">
          Quando alguém comprar pelos seus links, os pedidos aparecem aqui.
        </p>
      </div>

      <button
        type="button"
        onClick={onUseMaxPeriod}
        className="rounded-sm bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 active:bg-brand-800"
      >
        VER OS ÚLTIMOS 3 MESES
      </button>
    </div>
  );
}
