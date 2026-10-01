// The explicit `.ts` extensions let Node's native test runner load this module
// without a test framework. Next's bundler resolves them the same way.
import { formatBRL, formatRating, formatSales } from "./format.ts";
import { getPreferredOfferLink } from "./offer-link.ts";
import type { MessageTemplate, MessageTemplateId, Product } from "./types";

/**
 * Builds the ready-to-share message.
 *
 * Lines whose data is missing are dropped automatically, and empty blocks
 * collapse so the message never shows a dangling emoji or a blank gap.
 * No value is ever invented: only what the API returned is used.
 */

/** Joins non-empty lines into blocks separated by one blank line. */
function assemble(blocks: (string | null)[][]): string {
  return blocks
    .map((lines) => lines.filter((line): line is string => line !== null && line.trim() !== "").join("\n"))
    .filter((block) => block !== "")
    .join("\n\n");
}

function ratingLine(product: Product): string | null {
  return product.rating === null ? null : `⭐ ${formatRating(product.rating)}`;
}

function salesLine(product: Product): string | null {
  return product.sales > 0 ? `🛒 ${formatSales(product.sales)} vendidos` : null;
}

function priceText(product: Product): string | null {
  return product.price > 0 ? formatBRL(product.price) : null;
}

function buildDireto(product: Product): string {
  const price = priceText(product);
  const link = getPreferredOfferLink(product);

  return assemble([
    ["🔥 OFERTA SHOPEE!"],
    [product.name],
    [price === null ? null : `💰 Por ${price}`],
    [ratingLine(product), salesLine(product)],
    link === null ? [] : ["🛍️ Confira:", link],
    ["⚠️ Preço e disponibilidade podem mudar."],
  ]);
}

function buildUrgencia(product: Product): string {
  const price = priceText(product);
  const link = getPreferredOfferLink(product);

  return assemble([
    ["🚨 OLHA ESSA OFERTA!"],
    [product.name],
    [price === null ? null : `🔥 Por apenas ${price}`],
    [ratingLine(product), salesLine(product)],
    link === null ? [] : ["Confira enquanto estiver disponível 👇"],
    link === null ? [] : [link],
  ]);
}

function buildSimples(product: Product): string {
  const price = priceText(product);
  const link = getPreferredOfferLink(product);

  return assemble([
    [`🛍️ ${product.name}`],
    [price === null ? null : `🔥 ${price}`],
    link === null ? [] : ["Confira na Shopee 👇", link],
  ]);
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "direto",
    label: "Direto",
    description: "Oferta completa, com aviso de preço",
    build: buildDireto,
  },
  {
    id: "urgencia",
    label: "Urgência",
    description: "Chamada mais forte, para grupos",
    build: buildUrgencia,
  },
  {
    id: "simples",
    label: "Simples",
    description: "Curto, só o essencial",
    build: buildSimples,
  },
];

export const DEFAULT_TEMPLATE_ID: MessageTemplateId = "direto";

export function buildMessage(product: Product, templateId: MessageTemplateId): string {
  const template = MESSAGE_TEMPLATES.find((entry) => entry.id === templateId) ?? MESSAGE_TEMPLATES[0];
  return template.build(product);
}

/**
 * WhatsApp share URL.
 *
 * `wa.me` with only a `text` parameter opens WhatsApp's own share flow: the
 * user picks the person or group and presses send. Nothing is sent
 * automatically, and no WhatsApp API is involved.
 */
export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
