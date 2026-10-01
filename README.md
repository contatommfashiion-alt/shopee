# Laranjinha

**Encontre. Compartilhe. Ganhe.**

Ferramenta web para afiliados da Shopee Brasil. Consulta ofertas reais pela
**Shopee Affiliate Open API**, mostra preço, desconto, vendas, avaliação e
comissão (em % e em reais), e monta uma **mensagem pronta** para você
compartilhar no WhatsApp.

> A Laranjinha **não automatiza o WhatsApp**. Ela apenas prepara a mensagem.
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

## Login, sair e trocar de conta

**Não existe cadastro, senha de conta nem banco de usuários** — isso foi excluído
do MVP de propósito. A identidade do app é a **aplicação de afiliado conectada**:

| Ação | O que faz |
| --- | --- |
| **Entrar** | informar App ID, Secret e URL da API na tela de login (ou usar as do servidor) |
| **Sair** | esquecer as credenciais deste navegador e voltar para o login |
| **Trocar de conta** | voltar ao login com os campos preenchidos, para ajustar ou conectar outra aplicação |

Depois de entrar, a interface é um dashboard com uma barra lateral de três
seções — **Ofertas**, **Relatórios** e **Conta** —, que são exatamente as
funções que o app tem.

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

Se o `.env.local` ainda não estiver preenchido, aparece a **tela de login** com
os três campos (App ID, Secret, URL da API). Preencha e clique em **ENTRAR**.

- O botão do olho mostra/oculta o Secret.
- **Você continua conectado** até clicar em **Sair** ou **Trocar de conta**:
  recarregar a página, fechar a aba ou fechar o navegador não desconectam. Para
  isso os três valores ficam no `localStorage`. Em computador compartilhado, use
  **Sair** ao terminar.
- Se o servidor já tiver as variáveis configuradas, a tela de login não aparece;
  e se você sair, ela oferece **USAR AS CREDENCIAIS DO SERVIDOR**. O Sair fica
  registrado, então recarregar não reconecta sozinho.
- Se a Shopee recusar a autenticação, a tela reabre com a mensagem do erro para
  você corrigir o que digitou.

### Dashboard

| Seção | O que tem |
| --- | --- |
| **Ofertas** | filtro de nicho, busca, filtros rápidos, filtros avançados, ordenação, grid e o botão CRIAR OFERTA |
| **Relatórios** | vendas, pedidos e comissões reais da conta, via `conversionReport` |
| **Conta** | nome, App ID e endpoint em uso, ATUALIZAR OFERTAS, TROCAR DE CONTA e SAIR |

A barra lateral é fixa a partir de `lg`; abaixo disso vira uma gaveta aberta
pelo botão de menu (fecha com `Esc`, clique fora ou no X). **Sair** também está
no rodapé da barra lateral.

---

## Scripts

| Comando          | O que faz                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| `npm run dev`    | Servidor de desenvolvimento (Turbopack).                                    |
| `npm run build`  | Build de produção, incluindo checagem de TypeScript.                        |
| `npm start`      | Sobe o build de produção (rode `npm run build` antes).                      |
| `npm run lint`   | ESLint com as regras do `eslint-config-next`.                               |
| `npm run shopee:schema` | Lista as operações do GraphQL da Shopee por introspecção. `-- --busca=termo` filtra, `-- --tipo=Nome` detalha um tipo. |
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
- O navegador guarda os três valores em `localStorage` para a sessão sobreviver
  a um F5. **Sair** e **Trocar de conta** apagam. Esse é o preço de não
  desconectar a cada recarga — quem não quiser pagar, use o `.env.local`, em que
  o Secret nunca chega ao navegador.
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
  api/offers/route.ts     productOfferV2 (nicho + limite) — GET (credenciais do
                          servidor) + POST (da tela), Cache-Control: no-store
  api/reports/route.ts    conversionReport — mesma mecânica
  layout.tsx              shell, fonte, metadata pt-BR
  page.tsx                Server Component: monta <LaranjinhaApp/>
  globals.css             Tailwind v4 + animações do modal/gaveta

components/
  LaranjinhaApp.tsx       Client Component raiz: sessão, carregamento, seções
  LoginScreen.tsx         entrar (App ID / Secret / URL da API)
  AppShell.tsx            dashboard: barra lateral + gaveta no celular
  OffersSection.tsx       seção Ofertas: nicho, busca, filtros, ordenação, grid
  NicheFilter.tsx         seletor de nicho (vai na consulta à Shopee)
  AccountSection.tsx      seção Conta: conexão, sair, trocar de conta
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

components/reports/
  ReportsSection.tsx      container: busca, filtro de período, agregações
  ReportHeader.tsx        título + subtítulo
  PeriodFilter.tsx        Hoje / 7 / 30 dias / Personalizado (filtro local)
  ReportSummaryCards.tsx  pedidos, itens, valor, comissões, reembolsos
  CommissionSummary.tsx   comissões no nível da conversão
  OrderStatusSummary.tsx  pedidos por orderStatus
  TopProducts.tsx         produtos mais vendidos (por itemId)
  RecentOrders.tsx        tabela no desktop, cards no celular
  OrderDetails.tsx        itens do pedido, em modal/bottom sheet
  CategoryReport.tsx      categorias (níveis 1, 2 e 3)
  DeviceReport.tsx        conversões por dispositivo
  SourceReport.tsx        origem (referrer / utmContent / channelType)
  RefundReport.tsx        itens com refundAmount > 0
  FraudReport.tsx         registros sinalizados pela Shopee
  ReportSkeleton.tsx      loading
  ReportEmpty.tsx         sem conversões no período

lib/
  types.ts                tipos da API de ofertas e tipos normalizados
  shopee-auth.ts          assinatura SHA256
  shopee.ts               transporte GraphQL (runGraphQL) + productOfferV2
  shopee-query.ts         a query de ofertas, com nicho e limite (puro)
  categories.ts           os nichos verificados contra o endpoint
  env.ts                  leitura/validação das variáveis (server-only)
  credentials.ts          validação das credenciais recebidas do navegador
  session.ts              sessão no navegador: guardar/esquecer, host, inicial
  normalize.ts            resposta da Shopee → Product (sem NaN)
  format.ts               formatBRL, formatSales, formatPercentage, formatRating
  filters.ts              busca, filtros e ordenação locais
  message.ts              templates de mensagem + URL do WhatsApp
  offer-link.ts           getPreferredOfferLink
  api-errors.ts           textos de erro compartilhados
  api-client.ts           chamadas do navegador às rotas internas
  report-types.ts         tipos da conversionReport (crus e normalizados)
  conversion-report.ts    a query confirmada + normalização (puro)
  reports.ts              fetchConversionReport (server-only)
  report-aggregations.ts  totais, agrupamentos e filtro de período (puro)
  report-formatters.ts    datas, enums e percentuais

scripts/
  shopee-schema.mjs       descobre as operações do GraphQL por introspecção

tests/                    testes unitários (executor nativo do Node)
```
```

---

## Decisões e limitações desta versão

### Ofertas: o que é filtrado no servidor e o que é no navegador

O **nicho** vai na consulta: `productOfferV2(productCatId:)`. Trocar o nicho
busca ofertas novas na Shopee, não recorta as já carregadas. O `limit` também
vai na consulta, no máximo aceito (**50** — acima disso o endpoint responde
`Exceeded the maximum number of page limit`).

A **busca por texto, os filtros rápidos, os filtros avançados e a ordenação**
continuam no navegador, sobre os produtos recebidos.

A introspecção mostrou que `productOfferV2` também aceita `keyword`, `sortType`,
`page`, `listType`, `matchId`, `itemId`, `shopId`, `isAMSOffer` e
`isKeySeller` — ainda não usados. Mover a busca e a ordenação para o servidor
mexe só em [`lib/shopee-query.ts`](lib/shopee-query.ts) e no route handler.

#### De onde vêm os nichos

A Shopee **não tem** operação que liste categorias, e `ProductOfferV2` só
devolve `productCatIds: [Int!]` — ids, sem nome. Então a lista em
[`lib/categories.ts`](lib/categories.ts) foi obtida consultando o endpoint:

1. `productCatIds` chega como `[nível1, nível2, nível3]` — confirmado em
   produtos reais, por exemplo `[100630, 100659, 100871]`.
2. Para separar o nível 1, cada id candidato foi consultado com
   `productOfferV2(productCatId: X)` e verificou-se em que **posição** ele
   aparece no `productCatIds` dos produtos que ele mesmo filtrou. Posição 0 =
   nível 1. Teste objetivo, não palpite.
3. Os **ids** são fato verificado. Os **nomes** são a única parte inferida:
   cada categoria foi rotulada a partir de ~20 produtos reais devolvidos por
   ela. Um nome errado não quebra a busca — o filtro usa o id —, só deixa o
   rótulo impreciso. É só corrigir a string no arquivo.

O id `100014` é nível 1 mas devolveu um único produto no catálogo inteiro, então
ficou de fora por não servir como nicho.

### TODOs em aberto

| Onde                  | O que falta confirmar                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/shopee-query.ts` | Usar os argumentos já confirmados de `productOfferV2` (`keyword`, `sortType`, `page`) para mover busca, ordenação e paginação para o servidor.                                             |
| `lib/categories.ts`   | Os **nomes** dos nichos foram inferidos dos produtos de cada categoria; os ids são verificados. Corrigir qualquer rótulo que não bater.                                                    |
| `lib/report-formatters.ts` | Os enums oficiais de `orderStatus`, `device` e `fraudStatus`. Hoje os valores são exibidos como a Shopee devolveu, sem tradução.                                                       |
| `lib/session.ts`      | Se existir uma operação oficial que retorne o perfil da conta de afiliado, usar o nome real em vez do nome digitado no login.                                                              |
| `lib/offer-link.ts`   | Se o `offerLink` retornado por `productOfferV2` já carrega a atribuição de afiliado correta da aplicação autenticada. Hoje a prioridade é `offerLink` → `productLink`, sem reescrever nada. |
| `lib/shopee.ts`       | Os códigos oficiais em `extensions.code` dos erros GraphQL, hoje classificados pelo texto da mensagem.                                                                                     |
| `lib/types.ts`        | O significado dos códigos de `shopType` (o campo é consultado, mas não é exibido).                                                                                                         |
| `next.config.ts`      | Outros hosts de imagem além de `cf.shopee.com.br`, caso apareçam na resposta.                                                                                                              |

### Relatórios

A aba **Relatórios** consulta a operação `conversionReport` da Shopee Affiliate
Open API e monta um painel com as suas vendas reais.

A consulta usa **exatamente** os argumentos confirmados no Shopee Affiliate Open
API Explorer, sem nenhum acrescentado:

```graphql
conversionReport(
  conversionStatus: ALL, categoryType: ALL, orderStatus: ALL,
  buyerType: ALL, productType: ALL, fraudStatus: ALL, device: ALL
)
```

Ela fica em [`lib/conversion-report.ts`](lib/conversion-report.ts), junto da
normalização; [`lib/reports.ts`](lib/reports.ts) só faz a chamada, reusando a
assinatura SHA256 de [`lib/shopee.ts`](lib/shopee.ts) — não há código de
autenticação duplicado.

#### Métricas

| Seção | De onde vem |
| --- | --- |
| Pedidos | `orderId` distintos |
| Itens vendidos | soma de `qty` |
| Valor dos pedidos | soma de `actualAmount` dos itens |
| Comissão total / líquida | `totalCommission` / `netCommission` (nível de conversão) |
| Reembolsos | soma de `refundAmount` dos itens |
| Comissões | `totalCommission`, `netCommission`, `sellerCommission`, `shopeeCommissionCapped`, `mcnManagementFee`, `mcnManagementFeeRate` |
| Status dos pedidos | `orderStatus` |
| Produtos mais vendidos | agrupado por `itemId`, comissão de `itemTotalCommission` |
| Pedidos recentes + detalhes | `orders` e `items` |
| Categorias | `globalCategoryLv1Name` (níveis 2 e 3 no seletor) |
| Dispositivos | `device` |
| Origem das conversões | `referrer`, `utmContent`, `channelType` |
| Reembolsos | itens com `refundAmount > 0` |
| Registros sinalizados | `fraudStatus` e `fraudReason` |

#### Regra crítica: comissão não é somada duas vezes

A `conversionReport` traz comissão em dois níveis, e os valores de item compõem
os da conversão. Somar os dois contaria cada comissão duas vezes.

- Os **indicadores gerais** usam só o nível de **conversão**.
- Os recortes **por produto e por categoria** usam só o nível de **item**.

As duas visões nunca são somadas entre si. Está documentado no topo de
[`lib/report-aggregations.ts`](lib/report-aggregations.ts) e tem teste
específico.

#### Nada é inventado

- `orderStatus` e `device` aparecem **como a Shopee devolveu**, só com a
  formatação deixada legível. Nenhum enum é traduzido por adivinhação.
- A origem das conversões mostra o valor cru e de qual campo veio. Nenhuma
  conversão é classificada como WhatsApp, Instagram ou TikTok por dedução.
- Registros com `fraudStatus` não são escondidos nem descartados: aparecem numa
  seção própria, com status e motivo originais, e continuam contando nos totais.
- As datas não têm unidade assumida: `toUnixSeconds` detecta segundos,
  milissegundos ou ISO pelo valor recebido.

#### Limites reais da API (confirmados contra o endpoint)

Estes números **não foram deduzidos** — cada um veio de uma resposta da Shopee:

| Limite | Valor | Como foi confirmado |
| --- | --- | --- |
| Unidade das datas | **segundos** | enviar milissegundos devolve `Params Error : Timestamp unit is seconds` |
| Janela máxima | **3 meses** | 91 dias atrás funciona, 93 devolve `can only query data for the last 3 months`; usamos 90 por margem |
| `limit` | **500** | pedir 1000 devolve `pageInfo.limit = 500` |
| Forma de passar os valores | **literal inline** | por variável GraphQL, o endpoint responde `wrong type` ou `got null for non-null` |
| Sem argumentos de data | **zero conversões** | a consulta sem período não devolve nada |

Consequências na interface:

- os botões de período são **Hoje / 7 dias / 30 dias / 3 meses / Personalizado**,
  e os campos de data têm `min` e `max` presos à janela de 3 meses;
- um período anterior a 3 meses mostra uma tela explicando que **o limite é da
  Shopee**, não do app — suas vendas existem, mas não são acessíveis por aqui;
- a paginação é por cursor (`scrollId`), com botão **CARREGAR MAIS** quando
  `hasNextPage` é `true`. Não existe `page` nesta operação.

#### TODOs restantes

| O que falta | Efeito hoje |
| --- | --- |
| Enums de `orderStatus`, `device` e `fraudStatus` | Valores exibidos como vieram, sem tradução |
| Filtros server-side extras (`productName`, `shopId`, `categoryLv1Id`, `orderId`) | Existem no schema mas ainda não são usados; hoje não há filtro por produto no relatório |
| Diferença entre `purchaseTime` e `completeTime` | Filtramos por `purchaseTimeStart`/`End`; `completeTimeStart`/`End` também existem |

Para rever o schema: `npm run shopee:schema -- --busca=conversion`

### Paginação

**Relatórios** pagina por cursor: `limit` + `scrollId`, com botão **CARREGAR
MAIS** quando `hasNextPage` é `true`. Confirmado por introspecção — não existe
`page` nessa operação.

**Ofertas** ainda não pagina: `pageInfo` é normalizado e devolvido, mas falta
confirmar os argumentos de paginação do `productOfferV2`.

### Interface

**Paleta:** laranja da Shopee (`#ee4d2d`), definido como `brand-*` em
[`app/globals.css`](app/globals.css). Os botões usam `brand-600` (`#d13d1c`),
um passo mais escuro: texto branco sobre `#ee4d2d` dá contraste 3,7:1, abaixo do
mínimo 4,5:1 da WCAG AA, e sobre `#d13d1c` sobe para 4,7:1. Trocar a marca
inteira é mexer só nesses dez tokens.

**Ícones:** família de traço única (lucide-react) em toda a interface — inclusive
nos filtros rápidos, que não usam emoji. Emoji só nos **templates de mensagem**,
que vão para o WhatsApp e foram especificados assim.

Tema claro apenas, mobile-first: dashboard com barra lateral fixa no desktop e
gaveta no celular; grid de 2 colunas no celular, 3 no tablet, 4 em telas largas.
O modal vira bottom sheet no celular, com foco preso, fechamento por `Esc` e
devolução do foco ao fechar.

A barra lateral lista **somente** o que o app faz hoje (Ofertas, Relatórios e
Conta). Não há nichos, automações, IA, cupons, planos nem backups — nada disso
existe neste MVP.

A área de Relatórios usa a mesma identidade visual: mesmos cards arredondados,
mesma paleta, mesmos estados de loading e erro. Não é um segundo design.

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
- **Validação das credenciais** do login — campos faltando, tipos errados,
  protocolos recusados (`file://`, `javascript:`, `ftp://`) e o bloqueio de
  endereços internos em produção.
- **Sessão** — host do endpoint exibido na seção Conta, inicial do avatar e a
  chave de armazenamento.
- **Relatórios** — normalização da `conversionReport` (strings viram números,
  nenhum campo vira `NaN`), contagem de pedidos e itens, totais de comissão e
  reembolso, agrupamento por `itemId`, categoria e dispositivo, filtro de
  período local e formatação de datas sem assumir a unidade.
- **A garantia contra dupla contagem de comissão** tem teste próprio: no cenário
  usado, a comissão de conversão é 32,49 e a de item também soma 32,49 — o teste
  falha se o total virar 64,98.

Os testes rodam no executor nativo do Node (`node --test`) com suporte nativo a
TypeScript, por isso o projeto **não** tem nenhuma dependência de teste.

---

## Checklist antes de usar com credenciais reais

- [ ] `.env.local` criado a partir do `.env.local.example` e preenchido
- [ ] `git check-ignore -v .env.local` confirma que ele é ignorado
- [ ] `git status` não lista nenhum arquivo `.env` além do `.example`
- [ ] Relógio do sistema sincronizado
- [ ] `npm run lint`, `npm test` e `npm run build` passando
