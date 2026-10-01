"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Clipboard, ExternalLink, Share2, ShoppingCart, Star, X } from "lucide-react";
import ProductImage from "./ProductImage";
import { formatBRL, formatDiscount, formatPercentage, formatRating, formatSales } from "@/lib/format";
import { DEFAULT_TEMPLATE_ID, MESSAGE_TEMPLATES, buildMessage, buildWhatsAppShareUrl } from "@/lib/message";
import { getPreferredOfferLink } from "@/lib/offer-link";
import type { MessageTemplateId, Product } from "@/lib/types";

interface OfferModalProps {
  product: Product;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/** Last-resort copy for browsers without the async Clipboard API. */
function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Bottom sheet on phones, centered modal on larger screens.
 *
 * The WhatsApp button only OPENS WhatsApp's share flow with the message
 * pre-filled. The user picks the conversation or group and presses send —
 * nothing is sent automatically and no WhatsApp API is used.
 */
/** Feedback is tied to the template it was produced for. */
interface Feedback {
  templateId: MessageTemplateId;
  copied: boolean;
  message: string;
}

export default function OfferModal({ product, onClose }: OfferModalProps) {
  const [templateId, setTemplateId] = useState<MessageTemplateId>(DEFAULT_TEMPLATE_ID);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const message = useMemo(() => buildMessage(product, templateId), [product, templateId]);
  const preferredLink = useMemo(() => getPreferredOfferLink(product), [product]);

  // Switching template invalidates the previous feedback. Deriving it from the
  // selected template avoids an effect that would only reset state.
  const activeFeedback = feedback?.templateId === templateId ? feedback : null;
  const copied = activeFeedback?.copied ?? false;
  const status = activeFeedback?.message ?? null;

  // Escape to close, Tab trapped inside the dialog, scroll locked, focus restored.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    let ok = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) ok = legacyCopy(message);

    setFeedback({
      templateId,
      copied: ok,
      message: ok
        ? "Mensagem copiada!"
        : "Não foi possível copiar automaticamente. Selecione o texto da prévia e copie manualmente.",
    });
  }, [message, templateId]);

  const handleWhatsApp = useCallback(() => {
    const shareWindow = window.open(buildWhatsAppShareUrl(message), "_blank", "noopener,noreferrer");

    if (shareWindow) {
      setFeedback({
        templateId,
        copied: false,
        message: "WhatsApp aberto. Escolha a conversa ou o grupo e aperte enviar.",
      });
      return;
    }

    // Pop-up blocked: fall back to copying so the message is not lost.
    void handleCopy();
  }, [message, templateId, handleCopy]);

  return (
    <div
      className="oz-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        className="oz-panel-in flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 id="offer-modal-title" className="text-base font-bold text-slate-900">
            Criar oferta
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="flex gap-3.5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
              <ProductImage src={product.image} alt={product.name} sizes="96px" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900">
                {product.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{product.shopName}</p>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{formatBRL(product.price)}</span>

                {product.discountRate !== null && product.discountRate > 0 ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {formatDiscount(product.discountRate)} OFF
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                {product.rating !== null ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {formatRating(product.rating)}
                  </span>
                ) : null}

                {product.sales > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {formatSales(product.sales)} vendidos
                  </span>
                ) : null}

                {product.commissionRate !== null && product.commissionRate > 0 ? (
                  <span className="font-semibold text-emerald-700">
                    Comissão {formatPercentage(product.commissionRate)}
                    {product.commission !== null && product.commission > 0
                      ? ` · ~${formatBRL(product.commission)}`
                      : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              Escolha o modelo da mensagem
            </legend>

            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {MESSAGE_TEMPLATES.map((template) => {
                const selected = template.id === templateId;

                return (
                  <label
                    key={template.id}
                    className={`cursor-pointer rounded-xl border px-2.5 py-2.5 text-center transition ${
                      selected
                        ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="message-template"
                      value={template.id}
                      checked={selected}
                      onChange={() => setTemplateId(template.id)}
                      className="sr-only"
                    />
                    <span
                      className={`block text-sm font-bold ${selected ? "text-emerald-800" : "text-slate-800"}`}
                    >
                      {template.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
                      {template.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-4">
            <label
              htmlFor="message-preview"
              className="text-xs font-bold tracking-wide text-slate-500 uppercase"
            >
              Prévia da mensagem
            </label>

            <textarea
              id="message-preview"
              readOnly
              value={message}
              rows={12}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          <p aria-live="polite" role="status" className="mt-2 min-h-5 text-xs font-semibold text-emerald-700">
            {status}
          </p>
        </div>

        <div className="space-y-2 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 active:bg-slate-100"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <Clipboard className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "MENSAGEM COPIADA!" : "📋 COPIAR MENSAGEM"}
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            COMPARTILHAR NO WHATSAPP
          </button>

          {preferredLink ? (
            <a
              href={preferredLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              VER NA SHOPEE
            </a>
          ) : null}

          <p className="pt-0.5 text-center text-[11px] leading-snug text-slate-400">
            Você escolhe a conversa e aperta enviar. O OfertaZap não envia nada automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
