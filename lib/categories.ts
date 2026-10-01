/**
 * Nichos (categorias de nível 1) aceitos por `productOfferV2(productCatId:)`.
 *
 * ============================================================================
 * COMO ESTA LISTA FOI OBTIDA
 * ============================================================================
 *
 * A Shopee **não expõe** uma operação que liste categorias, e o nó
 * `ProductOfferV2` só devolve `productCatIds: [Int!]` — ids, sem nome. Então
 * nada aqui foi copiado de documentação: tudo veio de consulta ao endpoint.
 *
 * 1. `productCatIds` chega como `[nível1, nível2, nível3]` — confirmado em
 *    produtos reais, por exemplo `[100630, 100659, 100871]`.
 *
 * 2. Para separar o nível 1 dos demais, cada id candidato foi consultado com
 *    `productOfferV2(productCatId: X)` e verificou-se em que POSIÇÃO ele
 *    aparece no `productCatIds` dos produtos que ele mesmo filtrou. Posição 0
 *    significa nível 1. Esse teste é objetivo, não um palpite.
 *
 * 3. Os **ids** abaixo, portanto, são fato verificado.
 *
 * 4. Os **nomes** são a única parte inferida: cada categoria foi consultada e
 *    rotulada a partir de ~20 produtos reais devolvidos por ela. Um rótulo
 *    errado não quebra a busca — o filtro usa o id —, no máximo deixa o nome
 *    impreciso no menu. Se algum não bater com o que aparece, é só corrigir a
 *    string aqui.
 *
 * O id 100014 foi encontrado e é de nível 1, mas devolveu um único produto no
 * catálogo inteiro; ficou de fora por não ser utilizável como nicho.
 *
 * Para reconferir: `npm run shopee:schema -- --tipo=ProductOfferV2`
 */

export interface Niche {
  /** `productCatId` — verificado como nível 1 contra o endpoint. */
  id: number;
  /** Nome inferido a partir dos produtos reais da categoria. */
  label: string;
}

export const NICHES: Niche[] = [
  { id: 100630, label: "Beleza e cuidados" },
  { id: 100001, label: "Saúde" },
  { id: 100636, label: "Casa e cozinha" },
  { id: 100010, label: "Eletrodomésticos" },
  { id: 100013, label: "Celulares e acessórios" },
  { id: 100644, label: "Informática" },
  { id: 100635, label: "Câmeras e segurança" },
  { id: 100634, label: "Games" },
  { id: 100017, label: "Moda feminina" },
  { id: 100011, label: "Moda masculina" },
  { id: 100633, label: "Moda infantil" },
  { id: 100012, label: "Calçados" },
  { id: 100016, label: "Bolsas e mochilas" },
  { id: 100009, label: "Acessórios de moda" },
  { id: 100015, label: "Bagagem e viagem" },
  { id: 100632, label: "Mãe e bebê" },
  { id: 100631, label: "Pet shop" },
  { id: 100637, label: "Esporte e lazer" },
  { id: 100629, label: "Alimentos e bebidas" },
  { id: 100639, label: "Hobbies e artesanato" },
  { id: 100643, label: "Livros" },
  { id: 100638, label: "Papelaria e escritório" },
  { id: 100640, label: "Acessórios automotivos" },
  { id: 102187, label: "Automotivo (geral)" },
  { id: 100641, label: "Motos e acessórios" },
  { id: 100642, label: "Serviços e outros" },
];

/** Procura um nicho pelo id. */
export function findNiche(id: number | null): Niche | null {
  if (id === null) return null;
  return NICHES.find((niche) => niche.id === id) ?? null;
}

/** Nome para exibir; ids fora da lista aparecem como número, nunca inventados. */
export function nicheLabel(id: number | null): string {
  if (id === null) return "Todos os nichos";
  return findNiche(id)?.label ?? `Categoria ${id}`;
}
