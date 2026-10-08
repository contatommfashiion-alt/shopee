import { Smartphone } from "lucide-react";
import type { DevicePerformance } from "@/lib/report-types";

interface DeviceReportProps {
  devices: DevicePerformance[];
}

/**
 * Conversões por dispositivo.
 *
 * O gráfico é uma barra em CSS — não vale puxar uma biblioteca de gráficos só
 * para isto.
 */
export default function DeviceReport({ devices }: DeviceReportProps) {
  if (devices.length === 0) return null;

  return (
    <section className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Smartphone className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Conversões por dispositivo
      </h3>

      <ul className="mt-3 space-y-2.5">
        {devices.map((entry) => (
          <li key={entry.device}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-slate-700">{entry.device}</span>
              <span className="shrink-0 text-slate-600">
                <span className="font-semibold text-slate-900">{entry.count}</span>{" "}
                <span className="text-xs">
                  ({entry.percentage.toString().replace(".", ",")}%)
                </span>
              </span>
            </div>

            <div
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${entry.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
