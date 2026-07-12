export type PriceBucket = { slug: string; label: string; min: number; max: number | null };

export const PRICE_BUCKETS: PriceBucket[] = [
  { slug: "ate-50", label: "Até R$ 50", min: 0, max: 5000 },
  { slug: "50-100", label: "R$ 50 a R$ 100", min: 5000, max: 10000 },
  { slug: "100-150", label: "R$ 100 a R$ 150", min: 10000, max: 15000 },
  { slug: "acima-150", label: "Acima de R$ 150", min: 15000, max: null },
];

export const SORT_OPTIONS = [
  { slug: "lancamentos", label: "Lançamentos" },
  { slug: "menor-preco", label: "Menor preço" },
  { slug: "maior-preco", label: "Maior preço" },
  { slug: "mais-vendidos", label: "Mais vendidos" },
] as const;

export type SortSlug = (typeof SORT_OPTIONS)[number]["slug"];

export type CatalogParams = {
  q: string | undefined;
  sub: string | undefined;
  material: "semijoia" | "prata925" | undefined;
  price: { slug: string; min: number; max: number | null } | undefined;
  sort: SortSlug;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function single(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const material = single(raw.material);
  const precoSlug = single(raw.preco);
  const bucket = PRICE_BUCKETS.find((b) => b.slug === precoSlug);
  const ordem = single(raw.ordem);
  const sort = SORT_OPTIONS.some((o) => o.slug === ordem) ? (ordem as SortSlug) : "lancamentos";
  const pageNum = Number(single(raw.pagina));
  return {
    q: single(raw.q)?.trim() || undefined,
    sub: single(raw.sub) || undefined,
    material: material === "semijoia" || material === "prata925" ? material : undefined,
    price: bucket ? { slug: bucket.slug, min: bucket.min, max: bucket.max } : undefined,
    sort,
    page: Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1,
  };
}

/**
 * Monta href preservando os filtros atuais. Overrides com valor undefined
 * removem o filtro. Troca de filtro sempre volta à página 1 (page só entra
 * quando definida explicitamente no override).
 */
export function buildCatalogHref(
  base: string,
  current: CatalogParams,
  overrides: Partial<{
    sub: string | undefined;
    material: string | undefined;
    price: string | undefined;
    sort: SortSlug;
    page: number;
  }>,
): string {
  const sub = "sub" in overrides ? overrides.sub : current.sub;
  const material = "material" in overrides ? overrides.material : current.material;
  const price = "price" in overrides ? overrides.price : current.price?.slug;
  const sort = overrides.sort ?? current.sort;
  const page = overrides.page;

  const params = new URLSearchParams();
  if (current.q) params.set("q", current.q);
  if (sub) params.set("sub", sub);
  if (material) params.set("material", material);
  if (price) params.set("preco", price);
  if (sort !== "lancamentos") params.set("ordem", sort);
  if (page && page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
