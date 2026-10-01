"use client";

import { Flame, ShoppingCart, Star, Wallet } from "lucide-react";
import ProductImage from "./ProductImage";
import { formatBRL, formatDiscount, formatPercentage, formatRating, formatSales } from "@/lib/format";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onCreateOffer: (product: Product) => void;
}

const IMAGE_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export default function ProductCard({ product, priority = false, onCreateOffer }: ProductCardProps) {
  const hasDiscount = product.discountRate !== null && product.discountRate > 0;
  const hasCommissionRate = product.commissionRate !== null && product.commissionRate > 0;
  const hasEstimate = product.commission !== null && product.commission > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <ProductImage src={product.image} alt={product.name} sizes={IMAGE_SIZES} priority={priority} />

        {hasDiscount ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDiscount(product.discountRate)} OFF
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900" title={product.name}>
          {product.name}
        </h3>

        <p className="truncate text-xs text-slate-500" title={product.shopName}>
          {product.shopName}
        </p>

        <p className="text-xl font-bold tracking-tight text-slate-900">{formatBRL(product.price)}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          {product.rating !== null ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span aria-label={`Avaliação ${formatRating(product.rating)} de 5`}>
                {formatRating(product.rating)}
              </span>
            </span>
          ) : null}

          {product.sales > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {formatSales(product.sales)} vendidos
            </span>
          ) : null}
        </div>

        {hasCommissionRate || hasEstimate ? (
          <div className="mt-auto rounded-xl bg-emerald-50 px-3 py-2.5">
            {hasCommissionRate ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                Comissão: {formatPercentage(product.commissionRate)}
              </p>
            ) : null}

            {hasEstimate ? (
              <>
                <p className="mt-1 text-[11px] leading-tight text-emerald-700">
                  Você pode receber aproximadamente:
                </p>
                <p className="text-sm font-bold text-emerald-900">{formatBRL(product.commission)}</p>
              </>
            ) : null}
          </div>
        ) : (
          <div className="mt-auto" />
        )}

        <button
          type="button"
          onClick={() => onCreateOffer(product)}
          aria-label={`Criar oferta para ${product.name}`}
          className="mt-1 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800"
        >
          CRIAR OFERTA
        </button>
      </div>
    </article>
  );
}
