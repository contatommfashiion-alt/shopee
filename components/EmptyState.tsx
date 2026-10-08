import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  /** `true` when filters are narrowing the list, `false` when the API returned nothing. */
  filtered: boolean;
  /** Keyword sent to Shopee, when the empty result came from a search. */
  keyword?: string;
  onClearFilters: () => void;
}

export default function EmptyState({ filtered, keyword = "", onClearFilters }: EmptyStateProps) {
  const searchedShopee = !filtered && keyword !== "";

  const title = filtered
    ? "Nenhuma oferta encontrada com esses filtros."
    : searchedShopee
      ? `A Shopee não encontrou ofertas para "${keyword}".`
      : "A Shopee não retornou ofertas agora.";

  const hint = filtered
    ? "Tente ampliar a faixa de preço ou reduzir as exigências."
    : searchedShopee
      ? "Tente outras palavras, menos palavras ou outro nicho."
      : "Tente novamente em alguns instantes.";

  return (
    <div className="flex flex-col items-center gap-4 rounded-sm border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-sm bg-slate-100 text-slate-400"
      >
        <PackageSearch className="h-7 w-7" />
      </span>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>

      {filtered || searchedShopee ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-sm bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 active:bg-brand-800"
        >
          {filtered ? "LIMPAR FILTROS" : "LIMPAR BUSCA"}
        </button>
      ) : null}
    </div>
  );
}
