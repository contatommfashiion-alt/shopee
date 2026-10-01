"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

interface ProductImageProps {
  src: string | null;
  alt: string;
  /** Responsive `sizes` hint for the optimizer. */
  sizes: string;
  priority?: boolean;
}

/**
 * Product image with a visual fallback.
 *
 * Covers both cases: `imageUrl` came back empty, or the URL is broken / served
 * from a host that is not in `next.config.ts` remotePatterns.
 */
export default function ProductImage({ src, alt, sizes, priority = false }: ProductImageProps) {
  // Storing WHICH url failed (instead of a boolean) means a recycled card that
  // receives a new `src` retries automatically, with no effect to reset.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={`Sem imagem disponível para ${alt}`}
        className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-400"
      >
        <ImageOff className="h-7 w-7" aria-hidden="true" />
        <span className="text-[11px] font-medium">Sem imagem</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailedSrc(src)}
      className="object-cover"
    />
  );
}
