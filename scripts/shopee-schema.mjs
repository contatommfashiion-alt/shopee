// Descobre, no próprio endpoint da Shopee, quais operações e campos existem.
//
// Não inventa nada: usa introspecção de GraphQL, que é o mesmo mecanismo que o
// GraphiQL oficial usa para montar o autocomplete e a aba "Docs".
//
// Uso (com .env.local preenchido):
//   npm run shopee:schema
//   npm run shopee:schema -- --busca=report
//   npm run shopee:schema -- --tipo=NomeDoTipo
//
// Uso (sem .env.local, passando as credenciais):
//   npm run shopee:schema -- --app-id=... --secret=... --url=...
//   (atenção: o Secret fica no histórico do terminal)

import { createShopeeAuthorization } from "../lib/shopee-auth.ts";

function readArgs() {
  const args = {};
  for (const raw of process.argv.slice(2)) {
    const match = /^--([^=]+)=(.*)$/.exec(raw);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

const args = readArgs();

try {
  process.loadEnvFile(".env.local");
} catch {
  // Sem .env.local: as credenciais têm que vir por argumento.
}

const appId = args["app-id"] ?? process.env.SHOPEE_APP_ID ?? "";
const secret = args.secret ?? process.env.SHOPEE_SECRET ?? "";
const apiUrl = args.url ?? process.env.SHOPEE_API_URL ?? "";

if (!appId || !secret || !apiUrl) {
  console.error("\nFaltam credenciais.\n");
  console.error("  Opção 1: preencha .env.local (SHOPEE_APP_ID, SHOPEE_SECRET, SHOPEE_API_URL)");
  console.error("  Opção 2: npm run shopee:schema -- --app-id=... --secret=... --url=...\n");
  process.exit(1);
}

/** Nome legível de um tipo do GraphQL (desembrulha NON_NULL e LIST). */
function typeName(type) {
  if (!type) return "?";
  if (type.kind === "NON_NULL") return `${typeName(type.ofType)}!`;
  if (type.kind === "LIST") return `[${typeName(type.ofType)}]`;
  return type.name ?? "?";
}

const TYPE_REF = `
  kind
  name
  ofType { kind name ofType { kind name ofType { kind name } } }
`;

const QUERY_OPERATIONS = `{
  __schema {
    queryType {
      name
      fields {
        name
        description
        args { name description type { ${TYPE_REF} } }
        type { ${TYPE_REF} }
      }
    }
  }
}`;

const typeQuery = (name) => `{
  __type(name: "${name}") {
    name
    description
    fields {
      name
      description
      args { name type { ${TYPE_REF} } }
      type { ${TYPE_REF} }
    }
  }
}`;

async function callShopee(query) {
  const payload = JSON.stringify({ query });
  const { authorization } = createShopeeAuthorization(appId, secret, payload);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  let response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: payload,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`A Shopee respondeu HTTP ${response.status}.`);
  }

  const json = await response.json();

  if (Array.isArray(json.errors) && json.errors.length > 0) {
    throw new Error(json.errors.map((entry) => entry?.message ?? "?").join(" | "));
  }

  return json.data;
}

function printField(field, indent = "  ") {
  const args = (field.args ?? [])
    .map((arg) => `${arg.name}: ${typeName(arg.type)}`)
    .join(", ");

  console.log(`${indent}${field.name}${args ? `(${args})` : ""} -> ${typeName(field.type)}`);

  if (field.description) {
    console.log(`${indent}  ${field.description.split("\n")[0]}`);
  }
}

try {
  if (args.tipo) {
    const data = await callShopee(typeQuery(args.tipo));
    const type = data?.__type;

    if (!type) {
      console.error(`\nTipo "${args.tipo}" não existe no schema.\n`);
      process.exit(1);
    }

    console.log(`\n=== ${type.name} ===`);
    if (type.description) console.log(type.description);
    console.log("");
    for (const field of type.fields ?? []) printField(field);
    console.log("");
    process.exit(0);
  }

  const data = await callShopee(QUERY_OPERATIONS);
  const fields = data?.__schema?.queryType?.fields ?? [];
  const busca = (args.busca ?? "").toLowerCase();

  const visible = busca
    ? fields.filter(
        (field) =>
          field.name.toLowerCase().includes(busca) ||
          (field.description ?? "").toLowerCase().includes(busca),
      )
    : fields;

  console.log(`\n=== Operações disponíveis em ${data?.__schema?.queryType?.name ?? "Query"} ===`);
  console.log(`${visible.length} de ${fields.length}${busca ? ` (filtro: "${busca}")` : ""}\n`);

  for (const field of visible) {
    printField(field);
    console.log("");
  }

  console.log("Para ver os campos de um tipo de retorno:");
  console.log("  npm run shopee:schema -- --tipo=NomeDoTipo\n");
} catch (error) {
  console.error(`\nFalhou: ${error instanceof Error ? error.message : error}\n`);
  console.error("Se a mensagem citar introspecção desabilitada, use a aba 'Docs' do");
  console.error("GraphiQL oficial da Shopee e me mande o nome da operação de relatório.\n");
  process.exit(1);
}
