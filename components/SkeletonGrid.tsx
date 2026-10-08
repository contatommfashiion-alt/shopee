/** Loading placeholders with the same shape as a product card. */
export default function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando ofertas"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-sm bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
        >
          <div className="aspect-square w-full bg-slate-200" />
          <div className="space-y-2 p-2">
            <div className="h-3 w-full rounded-sm bg-slate-200" />
            <div className="h-3 w-3/4 rounded-sm bg-slate-200" />
            <div className="h-4 w-20 rounded-sm bg-slate-200" />
            <div className="h-2.5 w-1/2 rounded-sm bg-slate-100" />
            <div className="h-8 w-full rounded-sm bg-slate-200" />
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando ofertas da Shopee...</span>
    </div>
  );
}
