import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCredentials } from "../lib/credentials.ts";

const VALID = {
  appId: "1234567890",
  secret: "secret-not-real",
  apiUrl: "https://exemplo-endpoint/graphql",
};

test("accepts a complete body and trims the values", () => {
  const result = parseCredentials(
    { appId: "  1234567890  ", secret: " secret-not-real ", apiUrl: " https://exemplo-endpoint/graphql " },
    false,
  );

  assert.ok(result.ok);
  assert.deepEqual(result.credentials, VALID);
});

test("reports which fields are missing, by name", () => {
  const result = parseCredentials({ appId: "1234567890" }, false);

  assert.ok(!result.ok);
  assert.equal(result.reason, "missing");
  assert.deepEqual(result.missing, ["Secret", "URL da API"]);
});

test("treats blank strings and wrong types as missing", () => {
  for (const body of [
    {},
    null,
    undefined,
    "não é objeto",
    { appId: "   ", secret: "   ", apiUrl: "   " },
    { appId: 123, secret: true, apiUrl: ["x"] },
  ]) {
    const result = parseCredentials(body, false);
    assert.ok(!result.ok, `deveria recusar: ${JSON.stringify(body)}`);
    assert.equal(result.reason, "missing");
  }
});

test("rejects anything that is not an http(s) URL", () => {
  for (const apiUrl of [
    "não é url",
    "/graphql",
    "ftp://exemplo/graphql",
    "file:///etc/passwd",
    "javascript:alert(1)",
  ]) {
    const result = parseCredentials({ ...VALID, apiUrl }, false);
    assert.ok(!result.ok, `deveria recusar: ${apiUrl}`);
    assert.equal(result.reason, "invalidUrl");
  }
});

test("allows http and local hosts outside production (local development)", () => {
  for (const apiUrl of ["http://localhost:4555/graphql", "http://127.0.0.1:4555/graphql"]) {
    const result = parseCredentials({ ...VALID, apiUrl }, false);
    assert.ok(result.ok, `deveria aceitar fora de produção: ${apiUrl}`);
  }
});

test("in production, blocks http and addresses only the server can reach", () => {
  // Without this, a public deploy (which has no login, by design) could be used
  // by a stranger as a proxy into private networks.
  for (const apiUrl of [
    "http://exemplo-endpoint/graphql",
    "https://localhost/graphql",
    "https://127.0.0.1/graphql",
    "https://10.0.0.5/graphql",
    "https://192.168.1.10/graphql",
    "https://172.16.0.9/graphql",
    "https://172.31.255.1/graphql",
    "https://169.254.169.254/latest/meta-data",
    "https://metadata.internal/graphql",
    "https://[::1]/graphql",
    "https://0.0.0.0/graphql",
  ]) {
    const result = parseCredentials({ ...VALID, apiUrl }, true);
    assert.ok(!result.ok, `deveria bloquear em produção: ${apiUrl}`);
    assert.equal(result.reason, "blockedUrl", apiUrl);
  }
});

test("in production, still accepts a public https endpoint", () => {
  const result = parseCredentials({ ...VALID, apiUrl: "https://exemplo-endpoint/graphql" }, true);

  assert.ok(result.ok);
  assert.equal(result.credentials.apiUrl, "https://exemplo-endpoint/graphql");
});

test("172.32 is public and must not be blocked", () => {
  const result = parseCredentials({ ...VALID, apiUrl: "https://172.32.0.1/graphql" }, true);

  assert.ok(result.ok);
});
