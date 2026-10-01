import { BarChart3 } from "lucide-react";

/** Cabeçalho da área de Relatórios. */
export default function ReportHeader() {
  return (
    <header className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"
      >
        <BarChart3 className="h-5 w-5" />
      </span>

      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Relatórios</h2>
        <p className="mt-0.5 text-sm text-slate-600">Acompanhe suas vendas e comissões.</p>
      </div>
    </header>
  );
}
