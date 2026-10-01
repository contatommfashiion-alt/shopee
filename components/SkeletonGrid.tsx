/** Loading placeholders with the same shape as a product card. */
export default function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando ofertas"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="aspect-square w-full bg-slate-200" />
          <div className="space-y-2.5 p-3.5">
            <div className="h-3.5 w-full rounded bg-slate-200" />
            <div className="h-3.5 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-5 w-24 rounded bg-slate-200" />
            <div className="h-14 w-full rounded-xl bg-slate-100" />
            <div className="h-10 w-full rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando ofertas da Shopee...</span>
    </div>
  );
}
