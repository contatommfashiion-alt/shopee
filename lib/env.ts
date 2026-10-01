/**
 * Server-only access to the Shopee credentials.
 *
 * These names are deliberately NOT prefixed with `NEXT_PUBLIC_`, so Next.js
 * never inlines them into the client bundle. This module must only ever be
 * imported from server code (the route handler / the Shopee client).
 */

import type { ShopeeCredentials } from "./types";

export type ShopeeEnvResult =
  | { ok: true; env: ShopeeCredentials }
  | { ok: false; missing: string[] };

/**
 * Validates the environment on every request (the values can change between
 * deploys and between serverless invocations).
 *
 * Only the NAMES of the missing variables are reported — never a value.
 */
export function readShopeeEnv(): ShopeeEnvResult {
  const appId = process.env.SHOPEE_APP_ID?.trim() ?? "";
  const secret = process.env.SHOPEE_SECRET?.trim() ?? "";
  const apiUrl = process.env.SHOPEE_API_URL?.trim() ?? "";

  const missing: string[] = [];
  if (appId === "") missing.push("SHOPEE_APP_ID");
  if (secret === "") missing.push("SHOPEE_SECRET");
  if (apiUrl === "") missing.push("SHOPEE_API_URL");

  if (missing.length > 0) return { ok: false, missing };

  return { ok: true, env: { appId, secret, apiUrl } };
}
