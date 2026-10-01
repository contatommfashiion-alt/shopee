import { test } from "node:test";
import assert from "node:assert/strict";
import { NICHES, findNiche, nicheLabel } from "../lib/categories.ts";

test("todo nicho tem id positivo e rótulo não vazio", () => {
  assert.ok(NICHES.length > 0);

  for (const niche of NICHES) {
    assert.ok(Number.isInteger(niche.id) && niche.id > 0, `id inválido: ${niche.id}`);
    assert.ok(niche.label.trim() !== "", `rótulo vazio em ${niche.id}`);
  }
});

test("não há id nem rótulo repetido", () => {
  const ids = new Set(NICHES.map((niche) => niche.id));
  const labels = new Set(NICHES.map((niche) => niche.label));

  assert.equal(ids.size, NICHES.length, "ids duplicados");
  assert.equal(labels.size, NICHES.length, "rótulos duplicados");
});

test("os ids são os verificados contra o endpoint", () => {
  // Cada um foi confirmado como nível 1: consultado com productCatId e os
  // produtos devolvidos o trazem na posição 0 de productCatIds.
  for (const id of [100630, 100001, 100636, 100013, 100631, 100634, 102187]) {
    assert.ok(
      NICHES.some((niche) => niche.id === id),
      `faltou o nicho verificado ${id}`,
    );
  }

  // 100014 é nível 1 mas tinha um único produto no catálogo: fica de fora.
  assert.ok(!NICHES.some((niche) => niche.id === 100014), "100014 não deve ser oferecido");

  // Ids de nível 2/3 observados não podem aparecer como nicho.
  for (const subcategoria of [100018, 100659, 100660, 100003, 100645]) {
    assert.ok(
      !NICHES.some((niche) => niche.id === subcategoria),
      `${subcategoria} é subcategoria, não nicho`,
    );
  }
});

test("findNiche acha pelo id e devolve null fora da lista", () => {
  assert.equal(findNiche(100630)?.label, "Beleza e cuidados");
  assert.equal(findNiche(999999), null);
  assert.equal(findNiche(null), null);
});

test("nicheLabel nunca inventa nome para um id desconhecido", () => {
  assert.equal(nicheLabel(null), "Todos os nichos");
  assert.equal(nicheLabel(100630), "Beleza e cuidados");
  assert.equal(nicheLabel(999999), "Categoria 999999", "mostra o número, não um palpite");
});
