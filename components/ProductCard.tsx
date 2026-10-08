"use client";

import { Star, Wallet } from "lucide-react";
import ProductImage from "./ProductImage";
import { formatBRL, formatDiscount, formatPercentage, formatRating, formatSales } from "@/lib/format";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onCreateOffer: (product: Product) => void;
}

const IMAGE_SIZES =
  "(min-width: 1280px) 190px, (min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw";

/** "R$ 12,90" → "12,90", so the currency sign can be drawn smaller, as Shopee does. */
function priceDigits(value: number): string {
  return formatBRL(value).replace(/^R\$\s?/, "");
}

/**
 * Product tile in Shopee's grid style: square image, two-line title, orange
 * price, sales on the right, orange outline on hover.
 */
export default function ProductCard({ product, priority = false, onCreateOffer }: ProductCardProps) {
  const hasDiscount = product.discountRate !== null && product.discountRate > 0;
  const hasCommissionRate = product.commissionRate !== null && product.commissionRate > 0;
  const hasEstimate = product.commission !== null && product.commission > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-sm border border-transparent bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition hover:z-10 hover:-translate-y-px hover:border-brand-500 hover:shadow-[0_1px_20px_rgba(0,0,0,0.05)]">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <ProductImage src={product.image} alt={product.name} sizes={IMAGE_SIZES} priority={priority} />

        {hasCommissionRate ? (
          <span className="absolute bottom-0 left-0 inline-flex items-center gap-1 bg-brand-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Wallet className="h-3 w-3" aria-hidden="true" />
            Comissão {formatPercentage(product.commissionRate)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-800" title={product.name}>
          {product.name}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <p className="text-brand-500" aria-label={formatBRL(product.price)}>
            <span className="text-xs">R$</span>
            <span className="text-base font-medium">{priceDigits(product.price)}</span>
          </p>

          {hasDiscount ? (
            <span className="rounded-[2px] bg-brand-50 px-1 py-px text-[10px] font-medium text-brand-600">
              -{formatDiscount(product.discountRate)}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
          {product.rating !== null ? (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span aria-label={`Avaliação ${formatRating(product.rating)} de 5`}>
                {formatRating(product.rating)}
              </span>
            </span>
          ) : (
            <span />
          )}

          {product.sales > 0 ? <span>{formatSales(product.sales)} vendidos</span> : null}
        </div>

        <p className="mt-0.5 truncate text-[11px] text-slate-400" title={product.shopName}>
          {product.shopName}
        </p>

        {hasEstimate ? (
          <p className="mt-1.5 rounded-[2px] border border-dashed border-brand-300 bg-brand-50 px-1.5 py-1 text-[11px] leading-tight text-brand-700">
            Você ganha ~<strong className="font-bold">{formatBRL(product.commission)}</strong>
          </p>
        ) : null}

        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={() => onCreateOffer(product)}
            aria-label={`Criar oferta para ${product.name}`}
            className="w-full rounded-sm bg-brand-600 px-2 py-2 text-xs font-medium text-white transition hover:bg-brand-700 active:bg-brand-800"
          >
            CRIAR OFERTA
          </button>
        </div>
      </div>
    </article>
  );
}
