/** Esqueleto da área de Relatórios, com a mesma forma do conteúdo real. */
export default function ReportSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Carregando relatórios"
    >
      <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-7 w-28 rounded bg-slate-200" />
            <div className="mt-2 h-2.5 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>

      <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />

      <span className="sr-only">Carregando relatórios da Shopee...</span>
    </div>
  );
}
