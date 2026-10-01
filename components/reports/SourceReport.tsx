import { Megaphone } from "lucide-react";
import type { SourcePerformance } from "@/lib/report-types";

interface SourceReportProps {
  sources: SourcePerformance[];
}

const FIELD_LABELS: Record<SourcePerformance["field"], string> = {
  referrer: "referrer",
  utmContent: "utmContent",
  channelType: "channelType",
};

/**
 * Origem das conversões.
 *
 * Mostra apenas o que existe nos dados (`referrer`, `utmContent`,
 * `channelType`), com o campo de origem ao lado. Nenhuma conversão é
 * classificada como WhatsApp, Instagram ou TikTok por dedução.
 */
export default function SourceReport({ sources }: SourceReportProps) {
  if (sources.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Megaphone className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Origem das conversões
      </h3>

      <ul className="mt-3 divide-y divide-slate-100">
        {sources.slice(0, 12).map((entry) => (
          <li
            key={`${entry.field}:${entry.value}`}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-900" title={entry.value}>
                {entry.value}
              </p>
              <p className="font-mono text-[11px] text-slate-400">{FIELD_LABELS[entry.field]}</p>
            </div>

            <span className="shrink-0 text-sm font-semibold text-slate-900">{entry.count}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Mostrado exatamente como a Shopee devolveu. Nada é deduzido como rede social.
      </p>
    </section>
  );
}
