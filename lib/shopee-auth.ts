import crypto from "crypto";

/**
 * Builds the `Authorization` header required by the Shopee Affiliate Open API.
 *
 * Official structure:
 *   Authorization: SHA256 Credential={AppId}, Timestamp={Timestamp}, Signature={Signature}
 *
 * Signature = SHA256(AppId + Timestamp + Payload + Secret), hex lowercase.
 *
 * IMPORTANT: `payload` must be the EXACT request body string that is sent to
 * the API. Serialize the body once, sign that string, and send that same
 * string — re-serializing after signing breaks the signature.
 *
 * Shopee rejects requests whose timestamp differs from the server clock by more
 * than 10 minutes, so the default is the current Unix time in seconds. The
 * parameter is exposed so tests can pin it and get a deterministic signature.
 */
export function createShopeeAuthorization(
  appId: string,
  secret: string,
  payload: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): { authorization: string; timestamp: number; signature: string } {
  const factor = appId + timestamp.toString() + payload + secret;

  const signature = crypto.createHash("sha256").update(factor, "utf8").digest("hex");

  const authorization = `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;

  return { authorization, timestamp, signature };
}
