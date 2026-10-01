import type { ShopeeCredentials } from "./types.ts";

/**
 * Validation of credentials sent by the browser (the credentials screen).
 *
 * SERVER SIDE these values are used to sign one request and then discarded:
 * nothing is written to disk, to a database or to a log.
 */

export type CredentialsParseResult =
  | { ok: true; credentials: ShopeeCredentials }
  | { ok: false; reason: "missing"; missing: string[] }
  | { ok: false; reason: "invalidUrl" }
  | { ok: false; reason: "blockedUrl" };

function readField(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Hosts refused in production.
 *
 * Without this, a publicly deployed instance (which has no login, by design)
 * could be used by a stranger as a proxy to reach addresses only the server can
 * see. Loopback stays allowed outside production so the endpoint can be pointed
 * at a local stand-in during development.
 */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^f[cd][0-9a-f]{2}:/.test(host)) return true;

  return false;
}

/** Parses and validates the JSON body of `POST /api/offers`. */
export function parseCredentials(body: unknown, isProduction: boolean): CredentialsParseResult {
  const source = (body ?? {}) as Record<string, unknown>;

  const appId = readField(source, "appId");
  const secret = readField(source, "secret");
  const apiUrl = readField(source, "apiUrl");

  const missing: string[] = [];
  if (appId === "") missing.push("App ID");
  if (secret === "") missing.push("Secret");
  if (apiUrl === "") missing.push("URL da API");

  if (missing.length > 0) return { ok: false, reason: "missing", missing };

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    return { ok: false, reason: "invalidUrl" };
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return { ok: false, reason: "invalidUrl" };
  }

  if (isProduction && (parsedUrl.protocol === "http:" || isBlockedHost(parsedUrl.hostname))) {
    return { ok: false, reason: "blockedUrl" };
  }

  return { ok: true, credentials: { appId, secret, apiUrl } };
}
