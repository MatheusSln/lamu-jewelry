import { describe, expect, it } from "vitest";
import { buildCatalogHref, parseCatalogParams, PRICE_BUCKETS } from "./filters";

describe("parseCatalogParams", () => {
  it("retorna defaults para params vazios", () => {
    expect(parseCatalogParams({})).toEqual({
      q: undefined,
      sub: undefined,
      material: undefined,
      price: undefined,
      sort: "lancamentos",
      page: 1,
    });
  });

  it("captura o termo de busca q", () => {
    expect(parseCatalogParams({ q: " argola " }).q).toBe("argola");
    expect(parseCatalogParams({ q: "   " }).q).toBeUndefined();
  });

  it("aceita valores válidos", () => {
    const p = parseCatalogParams({
      sub: "brincos-argola",
      material: "prata925",
      preco: "50-100",
      ordem: "menor-preco",
      pagina: "3",
    });
    expect(p.sub).toBe("brincos-argola");
    expect(p.material).toBe("prata925");
    expect(p.price).toEqual({ slug: "50-100", min: 5000, max: 10000 });
    expect(p.sort).toBe("menor-preco");
    expect(p.page).toBe(3);
  });

  it("descarta valores inválidos", () => {
    const p = parseCatalogParams({
      material: "ouro",
      preco: "banana",
      ordem: "xpto",
      pagina: "-2",
    });
    expect(p.material).toBeUndefined();
    expect(p.price).toBeUndefined();
    expect(p.sort).toBe("lancamentos");
    expect(p.page).toBe(1);
  });

  it("expõe os 4 buckets de preço", () => {
    expect(PRICE_BUCKETS.map((b) => b.slug)).toEqual([
      "ate-50",
      "50-100",
      "100-150",
      "acima-150",
    ]);
  });
});

describe("buildCatalogHref", () => {
  const current = parseCatalogParams({ material: "semijoia", ordem: "menor-preco" });

  it("preserva filtros atuais e aplica override", () => {
    expect(buildCatalogHref("/brincos", current, { sub: "brincos-argola" })).toBe(
      "/brincos?sub=brincos-argola&material=semijoia&ordem=menor-preco",
    );
  });

  it("remove filtro com override undefined e reseta página", () => {
    const withPage = { ...current, page: 4 };
    expect(buildCatalogHref("/brincos", withPage, { material: undefined })).toBe(
      "/brincos?ordem=menor-preco",
    );
  });

  it("mantém página apenas quando override a define", () => {
    expect(buildCatalogHref("/busca", current, { page: 2 })).toBe(
      "/busca?material=semijoia&ordem=menor-preco&pagina=2",
    );
  });

  it("preserva o termo de busca q", () => {
    const withQ = parseCatalogParams({ q: "argola", material: "semijoia" });
    expect(buildCatalogHref("/busca", withQ, { material: undefined })).toBe(
      "/busca?q=argola",
    );
  });
});
