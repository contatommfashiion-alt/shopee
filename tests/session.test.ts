import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CREDENTIALS_STORAGE_KEY,
  LEGACY_CREDENTIALS_STORAGE_KEY,
  SIGNED_OUT_KEY,
  accountInitial,
  accountLabel,
  describeApiHost,
  parseStoredSession,
} from "../lib/session.ts";

test("describeApiHost shows only the host", () => {
  assert.equal(describeApiHost("https://exemplo-endpoint/graphql"), "exemplo-endpoint");
  assert.equal(describeApiHost("https://api.exemplo.com.br/v2/graphql?x=1"), "api.exemplo.com.br");
  assert.equal(describeApiHost("http://localhost:4555/graphql"), "localhost:4555");
});

test("describeApiHost never throws on bad input", () => {
  assert.equal(describeApiHost(""), "—");
  assert.equal(describeApiHost("não é url"), "—");
  assert.equal(describeApiHost("/graphql"), "—");
});

test("accountLabel prefers the name the user typed", () => {
  assert.equal(accountLabel("Loja da Ju", "18374881053"), "Loja da Ju");
  assert.equal(accountLabel("  Loja da Ju  ", "18374881053"), "Loja da Ju");
});

test("accountLabel falls back to the App ID, then to the server", () => {
  assert.equal(accountLabel("", "18374881053"), "App ID 18374881053");
  assert.equal(accountLabel("   ", "18374881053"), "App ID 18374881053");
  assert.equal(accountLabel("", null), "Credenciais do servidor");
  assert.equal(accountLabel("", "   "), "Credenciais do servidor");
  // A name still wins when the credentials come from the server.
  assert.equal(accountLabel("Loja da Ju", null), "Loja da Ju");
});

test("accountInitial gives one uppercase character for the avatar", () => {
  assert.equal(accountInitial("Loja da Ju"), "L");
  assert.equal(accountInitial("App ID 18374881053"), "A");
  assert.equal(accountInitial("  khayla  "), "K");
  assert.equal(accountInitial(""), "?");
  assert.equal(accountInitial("   "), "?");
});

test("parseStoredSession reads a complete stored session", () => {
  const raw = JSON.stringify({
    appId: "18374881053",
    secret: "secret-not-real",
    apiUrl: "https://exemplo-endpoint/graphql",
    displayName: "Loja da Ju",
  });

  assert.deepEqual(parseStoredSession(raw), {
    credentials: {
      appId: "18374881053",
      secret: "secret-not-real",
      apiUrl: "https://exemplo-endpoint/graphql",
    },
    displayName: "Loja da Ju",
  });
});

test("parseStoredSession accepts a session saved before the name existed", () => {
  const raw = JSON.stringify({
    appId: "18374881053",
    secret: "secret-not-real",
    apiUrl: "https://exemplo-endpoint/graphql",
  });

  const parsed = parseStoredSession(raw);

  assert.ok(parsed);
  assert.equal(parsed.displayName, "");
  assert.equal(parsed.credentials.appId, "18374881053");
});

test("parseStoredSession rejects anything incomplete or corrupted", () => {
  assert.equal(parseStoredSession(null), null);
  assert.equal(parseStoredSession(""), null);
  assert.equal(parseStoredSession("{não é json"), null);
  assert.equal(parseStoredSession("null"), null);
  assert.equal(parseStoredSession('"texto"'), null);
  assert.equal(parseStoredSession(JSON.stringify({ appId: "1", secret: "2" })), null);
  assert.equal(
    parseStoredSession(JSON.stringify({ appId: "1", secret: "2", apiUrl: "   " })),
    null,
  );
  assert.equal(
    parseStoredSession(JSON.stringify({ appId: 1, secret: 2, apiUrl: 3, displayName: 4 })),
    null,
  );
});

test("a non-string display name is dropped, not rendered as an object", () => {
  const raw = JSON.stringify({
    appId: "1",
    secret: "2",
    apiUrl: "https://x/graphql",
    displayName: { nome: "x" },
  });

  const parsed = parseStoredSession(raw);

  assert.ok(parsed);
  assert.equal(parsed.displayName, "");
});

test("as chaves de armazenamento são estáveis", () => {
  // Renomear sem migrar faria o navegador esquecer sessões já gravadas: a
  // pessoa seria desconectada sem ter clicado em Sair.
  assert.equal(CREDENTIALS_STORAGE_KEY, "laranjinha:credentials");
  assert.equal(SIGNED_OUT_KEY, "laranjinha:signed-out");
});

test("a chave da marca antiga continua sendo lida na migração", () => {
  // O rename OfertaZap -> Laranjinha não pode desconectar quem já estava
  // conectado: `readStoredSession` ainda procura aqui antes de desistir.
  assert.equal(LEGACY_CREDENTIALS_STORAGE_KEY, "ofertazap:credentials");
  assert.notEqual(LEGACY_CREDENTIALS_STORAGE_KEY, CREDENTIALS_STORAGE_KEY);
});
