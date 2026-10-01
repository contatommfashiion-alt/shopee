# OfertaZap

**Encontre. Compartilhe. Ganhe.**

Ferramenta web para afiliados da Shopee Brasil. Consulta ofertas reais pela
**Shopee Affiliate Open API**, mostra preço, desconto, vendas, avaliação e
comissão (em % e em reais), e monta uma **mensagem pronta** para você
compartilhar no WhatsApp.

> O OfertaZap **não automatiza o WhatsApp**. Ele apenas prepara a mensagem.
> Você escolhe manualmente a conversa ou o grupo e aperta ENVIAR.

**Sem banco de dados. Sem login. Sem histórico. Nada é persistido.**

```
Browser → Next.js (Route Handler) → Shopee Affiliate Open API → normalização → Browser
```

---

## Requisitos

- **Node.js 20.9+** (recomendado 22 ou 24). Verifique com `node --version`.
  O script de testes usa o executor nativo do Node com TypeScript, disponível a
  partir do Node 22.18 / 23.6 — se o seu Node for mais antigo, `npm run dev`,
  `npm run lint` e `npm run build` funcionam normalmente, apenas `npm test`
  precisará de uma versão mais nova.
- **npm 10+**
- Uma conta de afiliado Shopee com **acesso aprovado à Affiliate Open API**
  (App ID e Secret).

---

## Instalação

```bash
npm install
```

---

## Duas formas de informar as credenciais

| | **`.env.local` (recomendado)** | **Tela de credenciais** |
| --- | --- | --- |
| Onde fica o Secret | só no servidor | digitado no navegador, enviado ao servidor a cada busca |
| Passa pelo navegador | **não** | sim |
| Quando usar | sempre que você puder editar arquivos / variáveis na Vercel | para testar rápido, ou em uma instância que você mesmo usa |

A **tela de credenciais aparece sozinha** quando o servidor não tem as três
variáveis configuradas. Se você preencher o `.env.local`, ela não aparece.

Nos dois casos a assinatura é calculada **no servidor** e nada é gravado lá.
Veja [Segurança](#segurança) antes de usar a tela em um deploy público.

---

## Configuração

> Pode pular esta seção se for usar a tela de credenciais: rode `npm run dev`,
> abra <http://localhost:3000> e preencha os três campos.

### 1. Crie o arquivo de ambiente

Copie o modelo:

```bash
# Windows (PowerShell)
Copy-Item .env.local.example .env.local

# macOS / Linux
cp .env.local.example .env.local
```

### 2. Preencha as três variáveis

Abra `.env.local` e preencha:

```ini
SHOPEE_APP_ID=
SHOPEE_SECRET=
SHOPEE_API_URL=
```

| Variável          | O que é                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SHOPEE_APP_ID`   | O **Credential / App ID** da sua aplicação, no painel de afiliado da Shopee.                                                                               |
| `SHOPEE_SECRET`   | O **Secret** privado da aplicação. Funciona como uma senha — veja [Segurança](#segurança).                                                                 |
| `SHOPEE_API_URL`  | A URL do endpoint **GraphQL** da Shopee Affiliate Open API, exatamente como aparece no GraphiQL oficial que você já usou para testar o `productOfferV2`.    |

Sem aspas, sem espaços em volta do `=`. Exemplo de formato (valores fictícios):

```ini
SHOPEE_APP_ID=15349500000
SHOPEE_SECRET=ABCDEFGHIJKLMNOPQRSTUVWXYZ123456
SHOPEE_API_URL=https://exemplo-endpoint-graphql-da-shopee/graphql
```

> O arquivo `.env.local` está no `.gitignore` e **nunca** deve ser comitado.
> O `.env.local.example` é versionado justamente por não conter valor nenhum.

### 3. Relógio do computador

A Shopee rejeita requisições cuja diferença de horário passe de **10 minutos**.
Se você receber "Credenciais inválidas" com credenciais corretas, confira se a
data/hora do sistema está sincronizada.

---

## Executar

```bash
npm run dev
```

Abra <http://localhost:3000>.

Se o `.env.local` ainda não estiver preenchido, aparece a **tela "Conecte sua
conta de afiliado"** com os três campos (App ID, Secret, URL da API). Preencha e
clique em **BUSCAR OFERTAS**.

- O botão do olho mostra/oculta o Secret.
- A caixa **"Lembrar nesta aba"** é opcional e vem desmarcada. Se marcar, os três
  valores ficam no `sessionStorage` desta aba e são apagados quando você a fecha.
  Não marque em computador compartilhado.
- Depois de carregar, o link **"Trocar credenciais"** no fim da página volta para
  essa tela.
- Se a Shopee recusar a autenticação, a tela reabre com a mensagem do erro para
  você corrigir o que digitou.

---

## Scripts

| Comando          | O que faz                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| `npm run dev`    | Servidor de desenvolvimento (Turbopack).                                    |
| `npm run build`  | Build de produção, incluindo checagem de TypeScript.                        |
| `npm start`      | Sobe o build de produção (rode `npm run build` antes).                      |
| `npm run lint`   | ESLint com as regras do `eslint-config-next`.                               |
| `npm test`       | Testes unitários no executor nativo do Node (sem framework de teste).       |

### Build

```bash
npm run build
```

---

## Deploy na Vercel

1. **Suba o código para um repositório** (GitHub, GitLab ou Bitbucket).
   Confirme antes que `.env.local` **não** está entre os arquivos:

   ```bash
   git status --short
   git check-ignore -v .env.local   # deve apontar para a regra do .gitignore
   ```

2. **Acesse** <https://vercel.com/new> e importe o repositório.

3. **Framework Preset**: a Vercel detecta **Next.js** automaticamente. Não mude
   build command nem output directory.

4. **Antes de clicar em Deploy**, abra **Environment Variables** e adicione as
   três variáveis, uma por vez:

   | Name              | Value                       |
   | ----------------- | --------------------------- |
   | `SHOPEE_APP_ID`   | seu App ID                  |
   | `SHOPEE_SECRET`   | seu Secret                  |
   | `SHOPEE_API_URL`  | a URL do endpoint GraphQL   |

   Marque os três ambientes (**Production**, **Preview**, **Development**).
   Não use o prefixo `NEXT_PUBLIC_` em nenhuma delas: isso publicaria o valor
   no navegador.

5. **Deploy**. Ao terminar, abra a URL gerada.

6. **Se precisar alterar uma variável depois**: Project → Settings →
   Environment Variables → edite → **Redeploy**. Variáveis de ambiente só
   passam a valer em um novo deploy.

### Custo

O MVP cabe no plano gratuito: não há banco de dados, cron, fila nem storage.
Cada visita faz uma requisição server-side à Shopee, e nada é cacheado nem
persistido.

---

## Segurança

**O `SHOPEE_SECRET` funciona como uma senha da sua conta de afiliado.** Quem
tiver o App ID e o Secret pode assinar requisições se passando pela sua
aplicação. Trate-o como trataria a senha do banco.

### Pelo `.env.local` (caminho recomendado)

- As três variáveis **não** têm prefixo `NEXT_PUBLIC_`, então o Next.js nunca
  as injeta no bundle do navegador.
- `lib/env.ts`, `lib/shopee.ts` e `lib/shopee-auth.ts` são importados **apenas**
  pelo Route Handler (`app/api/offers/route.ts`), que roda no servidor.
- O navegador conversa somente com `/api/offers`. A resposta contém produtos
  normalizados — **nunca** o Secret, o App ID ou o header `Authorization`.
- O Secret nunca vai para `console.log`. Quando falta configuração, o erro
  reporta apenas os **nomes** das variáveis ausentes.
- As mensagens de erro mostradas na tela são fixas e escolhidas por código de
  erro; texto bruto da Shopee fica no log do servidor.

### Pela tela de credenciais (o trade-off)

Uma tela de preenchimento **exige** que o Secret passe pelo navegador — não há
como evitar isso. O que foi feito para limitar o risco:

- Os valores vão no **corpo de um `POST`**, nunca em query string (query strings
  aparecem em logs de acesso, histórico e referrer).
- O servidor usa as credenciais para assinar **uma** requisição e as descarta:
  não grava em disco, não grava em banco, não loga e não devolve na resposta.
- O navegador **não guarda nada** por padrão. Só com a caixa marcada, e aí em
  `sessionStorage` (apagado ao fechar a aba), nunca em `localStorage`.
- Em produção, `POST /api/offers` recusa `http://` e endereços internos
  (`localhost`, `127.*`, `10.*`, `192.168.*`, `172.16-31.*`, `169.254.*`,
  `::1`, `*.internal`). Sem isso, como o MVP **não tem login** por
  especificação, qualquer pessoa que achasse a URL do seu deploy poderia usar
  seu servidor como proxy para alcançar endereços que só ele vê.

**Recomendação:** num deploy público, configure as variáveis na Vercel e use o
`.env.local`/env da Vercel. Deixe a tela para uso local ou para uma instância
que só você acessa.

### Se o Secret vazar

Gere um novo par App ID / Secret no painel da Shopee, atualize `.env.local` e as
variáveis na Vercel, e faça um novo deploy.

---

## Como funciona a autenticação

A Shopee exige o header:

```
Authorization: SHA256 Credential={AppId}, Timestamp={Timestamp}, Signature={Signature}
```

Onde `Signature = SHA256(AppId + Timestamp + Payload + Secret)`, em hexadecimal
minúsculo, e `Payload` é **exatamente** o corpo enviado na requisição.

Isso é implementado em [`lib/shopee-auth.ts`](lib/shopee-auth.ts) com
`node:crypto`. O ponto crítico está em [`lib/shopee.ts`](lib/shopee.ts): o corpo
é serializado **uma única vez**, essa string é assinada, e a **mesma** string é
enviada como `body`. Nenhum `JSON.stringify` extra depois da assinatura — um
único espaço de diferença invalida a assinatura (há um teste cobrindo isso).

---

## Estrutura

```
app/
  api/offers/route.ts     GET (credenciais do servidor) + POST (credenciais da
                          tela) — server-side, Cache-Control: no-store
  layout.tsx              shell, fonte, metadata pt-BR
  page.tsx                Server Component: cabeçalho + <OfferExplorer/>
  globals.css             Tailwind v4 + animações do modal/drawer

components/
  OfferExplorer.tsx       Client Component: busca, estado, filtros, ordenação
  CredentialsForm.tsx     tela de App ID / Secret / URL da API
  SearchBar.tsx           pesquisa local
  QuickFilters.tsx        filtros rápidos
  AdvancedFilters.tsx     filtros avançados (APLICAR / LIMPAR)
  SortSelect.tsx          ordenação
  ProductCard.tsx         card de produto
  ProductImage.tsx        next/image + fallback visual
  OfferModal.tsx          modal (desktop) / bottom sheet (mobile)
  SkeletonGrid.tsx        loading
  EmptyState.tsx          nenhuma oferta com esses filtros
  ErrorState.tsx          erros amigáveis + TENTAR NOVAMENTE

lib/
  types.ts                tipos da API e tipos normalizados
  shopee-auth.ts          assinatura SHA256
  env.ts                  leitura/validação das variáveis (server-only)
  credentials.ts          validação das credenciais recebidas do navegador
  shopee.ts               cliente GraphQL: query, timeout, erros
  normalize.ts            resposta da Shopee → Product (sem NaN)
  format.ts               formatBRL, formatSales, formatPercentage, formatRating
  filters.ts              busca, filtros e ordenação locais
  message.ts              templates de mensagem + URL do WhatsApp
  offer-link.ts           getPreferredOfferLink
  api-errors.ts           textos de erro compartilhados

tests/                    testes unitários (executor nativo do Node)
```

---

## Decisões e limitações desta versão

### A query é a confirmada, sem argumentos

`productOfferV2` é chamado exatamente como foi validado no GraphiQL oficial,
**sem nenhum argumento**. Nada na API foi inventado.

Consequência: **a pesquisa, os filtros e a ordenação acontecem no navegador**,
sobre os produtos que a API retornou. A arquitetura já está pronta para a troca
— tudo passa por `GET /api/offers`, então mover a busca para o servidor mexe
apenas em `lib/shopee.ts` e no route handler.

### TODOs em aberto

| Onde                  | O que falta confirmar                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/shopee.ts`       | Os argumentos oficiais de `productOfferV2` (`keyword`, `sort`, `page`, `limit`…) para mover busca/ordenação/paginação para o servidor.                                                      |
| `lib/offer-link.ts`   | Se o `offerLink` retornado por `productOfferV2` já carrega a atribuição de afiliado correta da aplicação autenticada. Hoje a prioridade é `offerLink` → `productLink`, sem reescrever nada. |
| `lib/normalize.ts`    | A unidade real de `priceDiscountRate`. A heurística documentada está isolada em `normalizeDiscountRate` (`35` → 35%, `0.35` → 35%, `1` → 1% por ser ambíguo).                               |
| `lib/shopee.ts`       | Os códigos oficiais em `extensions.code` dos erros GraphQL, hoje classificados pelo texto da mensagem.                                                                                     |
| `lib/types.ts`        | O significado dos códigos de `shopType` (o campo é consultado, mas não é exibido).                                                                                                         |
| `next.config.ts`      | Outros hosts de imagem além de `cf.shopee.com.br`, caso apareçam na resposta.                                                                                                              |

### Paginação

`pageInfo` (incluindo `hasNextPage` e `scrollId`) é normalizado e devolvido pelo
endpoint, mas a interface ainda não navega entre páginas — isso depende dos
argumentos de paginação citados acima.

### Interface

Tema claro apenas, mobile-first: 2 colunas no celular, 3 no tablet, 4 no
desktop. O modal vira bottom sheet no celular, com foco preso, fechamento por
`Esc` e devolução do foco ao fechar.

### `AGENTS.md` e `CLAUDE.md`

São gerados e reescritos automaticamente pelo `next dev`. Não fazem parte da
aplicação.

---

## Testes

```bash
npm test
```

Cobrem:

- **`createShopeeAuthorization`** — assinatura SHA256 determinística (timestamp
  fixo), formato do header, e o fato de que reserializar o payload muda a
  assinatura.
- **`formatBRL` / `formatPercentage` / `formatSales` / `formatRating` /
  `formatDiscount`** — incluindo os casos em que o valor é nulo ou inválido
  (nunca aparece `NaN`).
- **Normalização** — payload real com números em string, campos faltando,
  derivação da comissão, descarte de ofertas inutilizáveis, `priceDiscountRate`.
- **`getPreferredOfferLink`** — prioridade `offerLink` → `productLink`.
- **Templates de mensagem** — os três modelos e a regra de ocultar linhas sem
  dado, sem deixar espaço em branco sobrando.
- **Validação das credenciais** da tela — campos faltando, tipos errados,
  protocolos recusados (`file://`, `javascript:`, `ftp://`) e o bloqueio de
  endereços internos em produção.

Os testes rodam no executor nativo do Node (`node --test`) com suporte nativo a
TypeScript, por isso o projeto **não** tem nenhuma dependência de teste.

---

## Checklist antes de usar com credenciais reais

- [ ] `.env.local` criado a partir do `.env.local.example` e preenchido
- [ ] `git check-ignore -v .env.local` confirma que ele é ignorado
- [ ] `git status` não lista nenhum arquivo `.env` além do `.example`
- [ ] Relógio do sistema sincronizado
- [ ] `npm run lint`, `npm test` e `npm run build` passando
