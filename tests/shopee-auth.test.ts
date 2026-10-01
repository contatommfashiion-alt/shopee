import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { createShopeeAuthorization } from "../lib/shopee-auth.ts";

const APP_ID = "1234567890";
const SECRET = "test-secret-not-a-real-credential";
const PAYLOAD = '{"query":"{ productOfferV2 { nodes { itemId } } }"}';
const TIMESTAMP = 1700000000;

test("signs AppId + Timestamp + Payload + Secret with SHA256 hex lowercase", () => {
  const expected = crypto
    .createHash("sha256")
    .update(APP_ID + String(TIMESTAMP) + PAYLOAD + SECRET, "utf8")
    .digest("hex");

  const result = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP);

  assert.equal(result.signature, expected);
  assert.equal(result.signature, result.signature.toLowerCase());
  assert.match(result.signature, /^[0-9a-f]{64}$/);
});

test("is deterministic for a fixed timestamp", () => {
  const first = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP);
  const second = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP);

  assert.equal(first.signature, second.signature);
  assert.equal(first.authorization, second.authorization);
  assert.equal(first.timestamp, TIMESTAMP);
});

test("builds the Authorization header in the official format", () => {
  const { authorization, signature } = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP);

  assert.equal(
    authorization,
    `SHA256 Credential=${APP_ID}, Timestamp=${TIMESTAMP}, Signature=${signature}`,
  );
});

test("the signature changes when any factor changes", () => {
  const base = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP).signature;

  assert.notEqual(createShopeeAuthorization("999", SECRET, PAYLOAD, TIMESTAMP).signature, base);
  assert.notEqual(createShopeeAuthorization(APP_ID, "other", PAYLOAD, TIMESTAMP).signature, base);
  assert.notEqual(createShopeeAuthorization(APP_ID, SECRET, "{}", TIMESTAMP).signature, base);
  assert.notEqual(createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP + 1).signature, base);
});

test("a single extra whitespace in the payload produces a different signature", () => {
  // Guards the rule that the signed string must be the exact request body.
  const signed = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD, TIMESTAMP).signature;
  const reserialized = createShopeeAuthorization(
    APP_ID,
    SECRET,
    JSON.stringify(JSON.parse(PAYLOAD), null, 2),
    TIMESTAMP,
  ).signature;

  assert.notEqual(signed, reserialized);
});

test("defaults the timestamp to the current Unix time in seconds", () => {
  const before = Math.floor(Date.now() / 1000);
  const { timestamp } = createShopeeAuthorization(APP_ID, SECRET, PAYLOAD);
  const after = Math.floor(Date.now() / 1000);

  assert.ok(timestamp >= before && timestamp <= after, "timestamp must be in seconds, not ms");
});
