/**
 * Turns a Shopee product title into TikTok search keywords.
 *
 * TikTok has no public API for searching videos, so the app only builds a
 * link to TikTok's own search page — nothing is fetched from TikTok.
 *
 * Shopee titles are stuffed with marketing words ("Promoção", "Envio
 * Imediato", "Kit 3"), which make TikTok searches worse. The cleaning below
 * keeps the words that describe the product itself.
 */

/**
 * `/search`, not `/search/video`: on phones TikTok redirects `/search/video`
 * to the For You feed and the query is lost. `/search` works on both.
 */
const TIKTOK_SEARCH_URL = "https://www.tiktok.com/search";

/** Portuguese connectives that never help a search on their own. */
const STOPWORDS = new Set([
  "a", "o", "as", "os", "e", "ou", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "para", "pra", "p", "por", "com", "sem", "c", "um", "uma", "uns", "umas", "ao", "aos", "à", "às",
  "que", "se", "seu", "sua",
]);

/** Shopee listing noise: offers, shipping, quantities, hype. */
const NOISE = new Set([
  "kit", "kits", "promoção", "promocao", "promo", "oferta", "ofertas", "desconto", "liquidação",
  "liquidacao", "queima", "estoque", "envio", "imediato", "imediata", "pronta", "entrega", "frete",
  "grátis", "gratis", "full", "original", "originais", "oficial", "lançamento", "lancamento", "novo",
  "nova", "novos", "novas", "top", "barato", "barata", "atacado", "revenda", "unidade", "unidades",
  "un", "und", "unid", "pç", "pçs", "pc", "pcs", "peça", "peças", "peca", "pecas", "pares", "par",
  "brinde", "envios", "hoje", "melhor", "qualidade", "premium", "luxo", "garantia", "nf", "nota",
  "fiscal", "importado", "importada", "pronto", "super", "mega",
]);

/** "3x", "10pcs", "2un" — quantity markers glued to a number. */
const QUANTITY_TOKEN = /^\d+(x|un|und|unid|pc|pcs|pç|pçs|peças?|pares)$/;
const YEAR_TOKEN = /^20\d\d$/;

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    // Drop bracketed tags like "[ENVIO 24H]" or "(Promoção)".
    .replace(/[[(【{][^\])】}]*[\])】}]/g, " ")
    // Keep letters (with accents), digits and hyphens; everything else splits words.
    .replace(/[^\p{L}\p{N}-]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter((token) => token !== "");
}

/**
 * The product-describing words of a title, in their original order, without
 * duplicates. Bare numbers are kept only after a kept word ("iphone 15") and
 * when they are not a quantity ("camisetas 3 unidades").
 */
export function extractKeywords(name: string | null | undefined): string[] {
  if (typeof name !== "string") return [];

  const tokens = tokenize(name);
  const kept: string[] = [];

  tokens.forEach((token, index) => {
    if (STOPWORDS.has(token) || NOISE.has(token)) return;
    if (QUANTITY_TOKEN.test(token) || YEAR_TOKEN.test(token)) return;

    if (/^\d+$/.test(token)) {
      const next = tokens[index + 1];
      const isQuantity = next !== undefined && NOISE.has(next);
      if (kept.length === 0 || isQuantity) return;
    }

    if (token.length < 2 && !/^\d$/.test(token)) return;
    if (!kept.includes(token)) kept.push(token);
  });

  return kept;
}

/**
 * Up to three search phrases, most specific first: the leading 4, 3 and 2
 * keywords. Shorter phrases find more videos; longer ones are closer matches.
 */
export function buildTikTokSuggestions(name: string | null | undefined): string[] {
  const keywords = extractKeywords(name);
  if (keywords.length === 0) return [];

  const suggestions: string[] = [];
  for (const size of [4, 3, 2]) {
    const phrase = keywords.slice(0, size).join(" ");
    if (!suggestions.includes(phrase)) suggestions.push(phrase);
  }

  return suggestions;
}

/** Link to TikTok's video search for `query`, or null for a blank query. */
export function buildTikTokSearchUrl(query: string): string | null {
  const trimmed = query.trim().replace(/\s+/g, " ");
  if (trimmed === "") return null;

  return `${TIKTOK_SEARCH_URL}?q=${encodeURIComponent(trimmed)}`;
}

/** Package name of the TikTok app on Android (outside Asia). */
const TIKTOK_ANDROID_PACKAGE = "com.zhiliaoapp.musically";

/**
 * Same search, but asking Android to open it in the TikTok app.
 *
 * A plain https link opens in the browser unless the phone was set to open
 * TikTok links in the app. An `intent://` link names the app explicitly; when
 * it is not installed, Chrome follows `browser_fallback_url` to the web search.
 *
 * iOS has no equivalent: Safari only hands a link to an app through Universal
 * Links, which the phone decides, so iOS keeps the https link.
 */
export function buildTikTokAndroidUrl(query: string): string | null {
  const webUrl = buildTikTokSearchUrl(query);
  if (webUrl === null) return null;

  const pathAndQuery = webUrl.replace(/^https:\/\//, "");

  return (
    `intent://${pathAndQuery}#Intent;scheme=https;package=${TIKTOK_ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
  );
}

/** True on Android phones and tablets, where `buildTikTokAndroidUrl` applies. */
export function isAndroid(userAgent: string): boolean {
  return /\bAndroid\b/i.test(userAgent);
}
