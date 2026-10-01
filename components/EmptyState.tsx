import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  /** `true` when filters are narrowing the list, `false` when the API returned nothing. */
  filtered: boolean;
  onClearFilters: () => void;
}

export default function EmptyState({ filtered, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
      >
        <PackageSearch className="h-7 w-7" />
      </span>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">
          {filtered
            ? "Nenhuma oferta encontrada com esses filtros."
            : "A Shopee não retornou ofertas agora."}
        </p>
        <p className="text-sm text-slate-500">
          {filtered
            ? "Tente ampliar a faixa de preço ou reduzir as exigências."
            : "Tente novamente em alguns instantes."}
        </p>
      </div>

      {filtered ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800"
        >
          LIMPAR FILTROS
        </button>
      ) : null}
    </div>
  );
}
