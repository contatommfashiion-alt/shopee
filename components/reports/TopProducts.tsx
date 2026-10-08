import { Flame } from "lucide-react";
import ProductImage from "../ProductImage";
import { formatBRL } from "@/lib/format";
import { formatQuantity } from "@/lib/report-formatters";
import type { ProductPerformance } from "@/lib/report-types";

interface TopProductsProps {
  products: ProductPerformance[];
  /** Quantos mostrar. O resto fica de fora para a seção não virar uma lista infinita. */
  limit?: number;
}

/**
 * Produtos mais vendidos, agrupados por `itemId` e ordenados por quantidade.
 *
 * A comissão aqui é a do nível de ITEM (`itemTotalCommission`).
 */
export default function TopProducts({ products, limit = 10 }: TopProductsProps) {
  if (products.length === 0) return null;

  const visible = products.slice(0, limit);

  return (
    <section className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Flame className="h-4 w-4 text-rose-500" aria-hidden="true" />
        Produtos mais vendidos
      </h3>

      <ul className="mt-3 divide-y divide-slate-100">
        {visible.map((product) => (
          <li key={product.itemId} className="flex items-start gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-slate-100">
              <ProductImage src={product.imageUrl} alt={product.itemName} sizes="56px" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900"
                title={product.itemName}
              >
                {product.itemName}
              </p>
              <p className="truncate text-xs text-slate-500" title={product.shopName}>
                {product.shopName}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                <span className="font-medium text-slate-700">{formatQuantity(product.qty)}</span>
                <span className="text-slate-600">{formatBRL(product.amount)} em vendas</span>
                <span className="font-semibold text-brand-700">
                  {formatBRL(product.commission)} em comissão
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {products.length > visible.length ? (
        <p className="mt-2 text-xs text-slate-500">
          Mostrando os {visible.length} primeiros de {products.length} produtos.
        </p>
      ) : null}
    </section>
  );
}
