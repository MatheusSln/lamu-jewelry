# Lámu — Plano 2: Vitrine (Home, Categorias, Produto, Busca)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vitrine pública completa no estilo Morana: home com vitrines, páginas de categoria com filtros/ordenação/paginação, página de produto e busca — lendo do Postgres já populado pelo Plano 1.

**Architecture:** Server Components do Next.js consultando o banco via Drizzle (`src/db`). Lógica pura (preço efetivo, parsing de filtros) isolada em `src/lib` com testes. Componentes visuais em `src/components`. Páginas da loja num route group `(store)` com layout próprio (barra promo + header + footer). Todas as páginas da loja usam `dynamic = "force-dynamic"` (estoque/preço sempre frescos e sem acesso a banco no build). Carrinho/checkout ficam no Plano 3; a página de produto já expõe variações e estado de estoque, com botão de carrinho desabilitado ("em breve").

**Tech Stack:** Next.js App Router (RSC), Drizzle ORM, Tailwind v4 (tokens da marca), Vitest.

**Spec:** `docs/superpowers/specs/2026-07-12-lamu-ecommerce-design.md`

**Estrutura de arquivos:**

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/pricing.ts` (+test) | Preço efetivo (promo ?? cheio), flag de promoção |
| `src/lib/filters.ts` (+test) | Parse dos query params de catálogo e montagem de hrefs de filtro |
| `src/lib/catalog.ts` | Todas as queries da vitrine (nav, produtos, busca, vitrines da home, settings) |
| `src/components/promo-bar.tsx` | Barra fina de promoção (texto de settings) |
| `src/components/site-header.tsx` | Logo central, busca, nav de categorias com dropdown |
| `src/components/mobile-menu.tsx` | Menu hambúrguer (client) |
| `src/components/site-footer.tsx` | Rodapé (contatos, políticas, pagamento) |
| `src/components/product-card.tsx` | Card com troca de foto no hover, preço/promo |
| `src/components/product-grid.tsx` | Grade responsiva de cards |
| `src/components/section-heading.tsx` | Título de seção serif com divisor dourado |
| `src/components/banner-carousel.tsx` | Carrossel de banners (client, auto-avanço) |
| `src/components/filters-sidebar.tsx` | Filtros por links (subcategoria, material, preço) |
| `src/components/sort-select.tsx` | Ordenação (client, navega via router) |
| `src/components/pagination.tsx` | Paginação por links |
| `src/components/product-gallery.tsx` | Galeria de fotos do produto (client) |
| `src/app/(store)/layout.tsx` | Layout da loja (promo bar + header + footer) |
| `src/app/(store)/page.tsx` | Home (substitui `src/app/page.tsx`, que é removida) |
| `src/app/(store)/busca/page.tsx` | Resultados de busca |
| `src/app/(store)/produto/[slug]/page.tsx` | Página de produto |
| `src/app/(store)/[categoria]/page.tsx` | Página de categoria (catch de slug; 404 se não existir) |

**Parâmetros de URL do catálogo:** `?sub=<slug-filha>&material=semijoia|prata925&preco=ate-50|50-100|100-150|acima-150&ordem=lancamentos|menor-preco|maior-preco|mais-vendidos&pagina=N` — 12 produtos por página.

---

### Task 1: Lógica pura — preço efetivo e filtros (TDD)

**Files:**
- Create: `src/lib/pricing.ts`, `src/lib/filters.ts`
- Test: `src/lib/pricing.test.ts`, `src/lib/filters.test.ts`

- [ ] **Step 1: Testes que falham**

`src/lib/pricing.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { effectivePriceCents, isOnPromo } from "./pricing";

describe("pricing", () => {
  it("usa preço promocional quando existe e é menor", () => {
    expect(effectivePriceCents({ priceCents: 10000, promoPriceCents: 7990 })).toBe(7990);
    expect(isOnPromo({ priceCents: 10000, promoPriceCents: 7990 })).toBe(true);
  });

  it("usa preço cheio quando não há promoção", () => {
    expect(effectivePriceCents({ priceCents: 10000, promoPriceCents: null })).toBe(10000);
    expect(isOnPromo({ priceCents: 10000, promoPriceCents: null })).toBe(false);
  });

  it("ignora promoção maior ou igual ao preço cheio", () => {
    expect(effectivePriceCents({ priceCents: 5000, promoPriceCents: 5000 })).toBe(5000);
    expect(isOnPromo({ priceCents: 5000, promoPriceCents: 6000 })).toBe(false);
  });
});
```

`src/lib/filters.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar**

`src/lib/pricing.ts`:
```ts
type Priced = { priceCents: number; promoPriceCents: number | null };

/** Preço efetivo: promocional quando existir e for menor que o cheio. */
export function effectivePriceCents(p: Priced): number {
  return isOnPromo(p) ? p.promoPriceCents! : p.priceCents;
}

export function isOnPromo(p: Priced): boolean {
  return p.promoPriceCents != null && p.promoPriceCents < p.priceCents;
}
```

`src/lib/filters.ts`:
```ts
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
  overrides: Partial<{ sub: string | undefined; material: string | undefined; price: string | undefined; sort: SortSlug; page: number }>,
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
```

- [ ] **Step 4: Rodar e ver passar** — `npm test` → PASS (18 testes no total).

- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: logica de preco efetivo e filtros de catalogo"`

---

### Task 2: Queries do catálogo

**Files:**
- Create: `src/lib/catalog.ts`

- [ ] **Step 1: Implementar as queries**

`src/lib/catalog.ts`:
```ts
import { and, asc, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { banners, categories, products, productVariants, settings } from "@/db/schema";
import type { CatalogParams } from "./filters";

export type NavCategory = { id: number; name: string; slug: string; children: { id: number; name: string; slug: string }[] };

export async function getNavTree(): Promise<NavCategory[]> {
  const all = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  return all
    .filter((c) => c.parentId == null)
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      children: all
        .filter((c) => c.parentId === parent.id)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    }));
}

export async function getCategoryBySlug(slug: string) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
  return cat ?? null;
}

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getActiveBanners() {
  return db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder));
}

/** coalesce(promo, cheio) — preço usado em filtro e ordenação */
const effectivePrice = sql<number>`coalesce(${products.promoPriceCents}, ${products.priceCents})`;

export type ProductRow = typeof products.$inferSelect;

export type ListResult = { items: ProductRow[]; total: number; perPage: number };

export async function listProducts(opts: {
  categoryIds?: number[];
  search?: string;
  params: CatalogParams;
  perPage?: number;
}): Promise<ListResult> {
  const { categoryIds, search, params } = opts;
  const perPage = opts.perPage ?? 12;

  const conds: SQL[] = [eq(products.isActive, true)];
  if (categoryIds && categoryIds.length > 0) conds.push(inArray(products.categoryId, categoryIds));
  if (params.material) conds.push(eq(products.material, params.material));
  if (params.price) {
    conds.push(sql`${effectivePrice} >= ${params.price.min}`);
    if (params.price.max != null) conds.push(sql`${effectivePrice} < ${params.price.max}`);
  }
  if (search) {
    conds.push(or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`))!);
  }
  const where = and(...conds);

  const orderBy = {
    lancamentos: [desc(products.createdAt)],
    "menor-preco": [asc(effectivePrice)],
    "maior-preco": [desc(effectivePrice)],
    "mais-vendidos": [desc(products.isBestseller), desc(products.createdAt)],
  }[params.sort];

  const [items, [{ count }]] = await Promise.all([
    db.select().from(products).where(where).orderBy(...orderBy).limit(perPage).offset((params.page - 1) * perPage),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  return { items, total: count, perPage };
}

export type VariantRow = typeof productVariants.$inferSelect;

export async function getProductBySlug(slug: string): Promise<(ProductRow & { variants: VariantRow[] }) | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)));
  if (!product) return null;
  const variants = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
    .orderBy(asc(productVariants.id));
  return { ...product, variants };
}

export async function getRelatedProducts(categoryId: number, excludeId: number, limit = 4) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId), sql`${products.id} <> ${excludeId}`))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function getHomeVitrines() {
  const base = eq(products.isActive, true);
  const [launches, bestsellers, promos] = await Promise.all([
    db.select().from(products).where(and(base, eq(products.isLaunch, true))).orderBy(desc(products.createdAt)).limit(8),
    db.select().from(products).where(and(base, eq(products.isBestseller, true))).orderBy(desc(products.createdAt)).limit(8),
    db.select().from(products).where(and(base, isNotNull(products.promoPriceCents), sql`${products.promoPriceCents} < ${products.priceCents}`)).orderBy(desc(products.updatedAt)).limit(8),
  ]);
  return { launches, bestsellers, promos };
}
```

- [ ] **Step 2: Type-check e smoke test contra o banco real**

Run: `npx tsc --noEmit`
Expected: sem erros.

Criar script temporário no scratchpad e rodar `npx tsx --env-file=.env.local <scratchpad>/smoke-catalog.mts`:
```ts
import { getHomeVitrines, getNavTree, getProductBySlug, listProducts } from "../../src/lib/catalog"; // ajustar caminho relativo real
import { parseCatalogParams } from "../../src/lib/filters";
const nav = await getNavTree();
console.log("nav:", nav.length, "pais;", nav.find((n) => n.slug === "brincos")?.children.length, "filhas de brincos");
const list = await listProducts({ params: parseCatalogParams({ ordem: "menor-preco" }) });
console.log("listProducts:", list.total, "produtos; primeiro:", list.items[0]?.name);
const vit = await getHomeVitrines();
console.log("vitrines:", vit.launches.length, "lançamentos,", vit.bestsellers.length, "best,", vit.promos.length, "promos");
const p = await getProductBySlug(list.items[0].slug);
console.log("produto:", p?.name, "variações:", p?.variants.length);
process.exit(0);
```
Expected: contagens coerentes com o seed (10 produtos, 4 lançamentos, 4 best, promos ≥ 1, nav com 7 pais).
Obs.: o script importa de `src/`, então precisa rodar com cwd na raiz do projeto (tsx resolve `@/` não; usar caminhos relativos).

- [ ] **Step 3: Commit** — `git add -A; git commit -m "feat: queries do catalogo da vitrine"`

---

### Task 3: Layout da loja — promo bar, header, menu mobile, footer

**Files:**
- Create: `src/components/promo-bar.tsx`, `src/components/site-header.tsx`, `src/components/mobile-menu.tsx`, `src/components/site-footer.tsx`, `src/app/(store)/layout.tsx`
- Move: conteúdo de `src/app/page.tsx` → `src/app/(store)/page.tsx` (home provisória até a Task 4)
- Delete: `src/app/page.tsx`

- [ ] **Step 1: Componentes**

`src/components/promo-bar.tsx`:
```tsx
export function PromoBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-ink text-cream text-center text-[11px] tracking-[0.2em] uppercase py-2 px-4">
      {text}
    </div>
  );
}
```

`src/components/site-header.tsx` (server component; recebe nav pronto):
```tsx
import Image from "next/image";
import Link from "next/link";
import type { NavCategory } from "@/lib/catalog";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader({ nav }: { nav: NavCategory[] }) {
  return (
    <header className="bg-cream border-b border-gold-light/40 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center gap-3">
          <MobileMenu nav={nav} />
          <form action="/busca" className="hidden md:block w-full max-w-55">
            <input
              type="search"
              name="q"
              placeholder="Buscar..."
              className="w-full bg-card border border-gold-light/50 rounded-full px-4 py-1.5 text-sm placeholder:text-ink-soft focus:outline-none focus:border-gold"
            />
          </form>
        </div>
        <Link href="/" className="justify-self-center" aria-label="Lámu — página inicial">
          <Image src="/brand/logo.jpeg" alt="Lámu" width={72} height={72} className="rounded-full" priority />
        </Link>
        <div className="justify-self-end flex items-center gap-4">
          <span className="hidden md:inline text-xs text-ink-soft tracking-wide uppercase">Carrinho em breve</span>
        </div>
      </div>
      <nav className="hidden md:block border-t border-gold-light/30">
        <ul className="mx-auto max-w-6xl flex justify-center gap-7 text-[12px] tracking-[0.15em] uppercase">
          {nav.map((cat) => (
            <li key={cat.slug} className="relative group">
              <Link href={`/${cat.slug}`} className="block py-3 hover:text-gold transition-colors">
                {cat.name}
              </Link>
              {cat.children.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block bg-card border border-gold-light/40 shadow-lg min-w-44 z-50">
                  <ul className="py-2">
                    {cat.children.map((sub) => (
                      <li key={sub.slug}>
                        <Link
                          href={`/${cat.slug}?sub=${sub.slug}`}
                          className="block px-4 py-2 normal-case tracking-normal text-sm hover:bg-cream-dark hover:text-gold"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <form action="/busca" className="md:hidden px-4 pb-3">
        <input
          type="search"
          name="q"
          placeholder="Buscar..."
          className="w-full bg-card border border-gold-light/50 rounded-full px-4 py-1.5 text-sm placeholder:text-ink-soft focus:outline-none focus:border-gold"
        />
      </form>
    </header>
  );
}
```

`src/components/mobile-menu.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavCategory } from "@/lib/catalog";

export function MobileMenu({ nav }: { nav: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen(!open)}
        className="p-1 text-ink"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 top-30 bg-cream z-50 overflow-y-auto px-6 py-4">
          <ul className="space-y-1">
            {nav.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm tracking-[0.15em] uppercase border-b border-gold-light/30"
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <ul className="pl-4 py-1">
                    {cat.children.map((sub) => (
                      <li key={sub.slug}>
                        <Link
                          href={`/${cat.slug}?sub=${sub.slug}`}
                          onClick={() => setOpen(false)}
                          className="block py-1.5 text-sm text-ink-soft"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

`src/components/site-footer.tsx`:
```tsx
import Link from "next/link";

export function SiteFooter({ settings }: { settings: Record<string, string> }) {
  const whatsapp = settings.whatsapp_number?.replace(/\D/g, "");
  const instagram = settings.instagram_handle?.replace(/^@/, "");
  return (
    <footer className="bg-cream-dark border-t border-gold-light/40 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <h3 className="text-lg text-gold mb-3">Atendimento</h3>
          <ul className="space-y-2 text-ink-soft">
            {whatsapp && (
              <li>
                <a href={`https://wa.me/55${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                  WhatsApp
                </a>
              </li>
            )}
            {instagram && (
              <li>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                  Instagram
                </a>
              </li>
            )}
            <li>
              <Link href="/pedido" className="hover:text-gold">Acompanhar pedido</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg text-gold mb-3">Políticas</h3>
          <p className="text-ink-soft whitespace-pre-line">{settings.exchange_policy}</p>
        </div>
        <div>
          <h3 className="text-lg text-gold mb-3">Pagamento</h3>
          <p className="text-ink-soft">Pix, cartão de crédito e boleto.</p>
        </div>
      </div>
      <div className="text-center text-xs text-ink-soft pb-6 tracking-[0.2em] uppercase">
        Lámu — Semijoias e Prata 925
      </div>
    </footer>
  );
}
```

Obs.: o link "Acompanhar pedido" aponta para `/pedido`, que só existirá no Plano 3 — aceitável ficar 404 até lá? Não: até o Plano 3, remover o `<li>` de "Acompanhar pedido" (deixar apenas WhatsApp/Instagram). O Plano 3 o adiciona de volta.

`src/app/(store)/layout.tsx`:
```tsx
import { getNavTree, getSettingsMap } from "@/lib/catalog";
import { PromoBar } from "@/components/promo-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [nav, settings] = await Promise.all([getNavTree(), getSettingsMap()]);
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBar text={settings.promo_bar_text ?? ""} />
      <SiteHeader nav={nav} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
```

- [ ] **Step 2: Mover a home** — criar `src/app/(store)/page.tsx` com o conteúdo atual de `src/app/page.tsx` (sem o `<main className="min-h-screen">`, que vira `<div className="py-20 flex flex-col items-center gap-6">`) e apagar `src/app/page.tsx`.

- [ ] **Step 3: Verificar no preview** — home carrega com promo bar, header com nav do banco (7 categorias, dropdown em Brincos/Colares/Pulseiras), footer. Menu mobile abre/fecha em viewport estreito.

- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: layout da loja com header, nav, promo bar e footer"`

---

### Task 4: Cards de produto e home completa

**Files:**
- Create: `src/components/product-card.tsx`, `src/components/product-grid.tsx`, `src/components/section-heading.tsx`, `src/components/banner-carousel.tsx`
- Modify: `src/app/(store)/page.tsx` (home real)

- [ ] **Step 1: Componentes**

`src/components/product-card.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { effectivePriceCents, isOnPromo } from "@/lib/pricing";

export function ProductCard({ product }: { product: ProductRow }) {
  const [first, second] = product.photos;
  const promo = isOnPromo(product);
  return (
    <Link href={`/produto/${product.slug}`} className="group block bg-card border border-gold-light/30 hover:shadow-md transition-shadow">
      <div className="relative aspect-square overflow-hidden">
        {first ? (
          <>
            <Image
              src={first}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${second ? "group-hover:opacity-0" : ""}`}
            />
            {second && (
              <Image
                src={second}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-cream-dark" />
        )}
        {promo && (
          <span className="absolute top-2 left-2 bg-gold text-cream text-[10px] tracking-widest uppercase px-2 py-1">
            Promo
          </span>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm text-ink truncate">{product.name}</p>
        <div className="mt-1 text-sm">
          {promo && (
            <span className="text-ink-soft line-through mr-2">{formatBRL(product.priceCents)}</span>
          )}
          <span className="text-gold font-medium">{formatBRL(effectivePriceCents(product))}</span>
        </div>
      </div>
    </Link>
  );
}
```

`src/components/product-grid.tsx`:
```tsx
import type { ProductRow } from "@/lib/catalog";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return <p className="text-center text-ink-soft py-12">Nenhum produto encontrado.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

`src/components/section-heading.tsx`:
```tsx
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center my-8">
      <h2 className="text-3xl text-ink">{children}</h2>
      <div className="mx-auto mt-2 w-16 h-px bg-gold" />
    </div>
  );
}
```

`src/components/banner-carousel.tsx`:
```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = { id: number; imageUrl: string; linkUrl: string };

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];
  const img = (
    <Image src={banner.imageUrl} alt="" fill sizes="100vw" className="object-cover" priority />
  );
  return (
    <div className="relative w-full aspect-[21/8] bg-cream-dark">
      {banner.linkUrl ? <Link href={banner.linkUrl}>{img}</Link> : img}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? "bg-gold" : "bg-cream/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Home real**

`src/app/(store)/page.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import { getActiveBanners, getHomeVitrines } from "@/lib/catalog";
import { PRICE_BUCKETS } from "@/lib/filters";
import { BannerCarousel } from "@/components/banner-carousel";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [bannersList, vitrines] = await Promise.all([getActiveBanners(), getHomeVitrines()]);
  return (
    <div className="pb-8">
      {bannersList.length > 0 ? (
        <BannerCarousel banners={bannersList} />
      ) : (
        <section className="bg-cream-dark">
          <div className="mx-auto max-w-6xl px-4 py-16 flex flex-col items-center text-center gap-4">
            <Image src="/brand/logo.jpeg" alt="Lámu" width={160} height={160} className="rounded-full" priority />
            <h1 className="text-4xl text-ink">Semijoias e Prata 925</h1>
            <p className="text-ink-soft max-w-md">Peças delicadas para todos os momentos.</p>
            <Link href="/conjuntos" className="mt-2 bg-gold hover:bg-gold-dark text-cream px-8 py-2.5 text-sm tracking-[0.15em] uppercase transition-colors">
              Ver coleção
            </Link>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4">
        {vitrines.launches.length > 0 && (
          <section>
            <SectionHeading>Lançamentos</SectionHeading>
            <ProductGrid products={vitrines.launches.slice(0, 4)} />
          </section>
        )}

        <section>
          <SectionHeading>Presentes por preço</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRICE_BUCKETS.map((b) => (
              <Link
                key={b.slug}
                href={`/busca?preco=${b.slug}`}
                className="bg-cream-dark border border-gold-light/40 text-center py-8 hover:border-gold transition-colors"
              >
                <span className="block text-2xl text-gold" style={{ fontFamily: "var(--font-cormorant)" }}>
                  {b.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {vitrines.bestsellers.length > 0 && (
          <section>
            <SectionHeading>Mais Vendidos</SectionHeading>
            <ProductGrid products={vitrines.bestsellers.slice(0, 4)} />
          </section>
        )}

        {vitrines.promos.length > 0 && (
          <section>
            <SectionHeading>Promoções</SectionHeading>
            <ProductGrid products={vitrines.promos.slice(0, 4)} />
          </section>
        )}
      </div>
    </div>
  );
}
```
Obs.: `/busca?preco=...` sem `q` deve listar todos os produtos filtrados por preço (a página de busca da Task 6 trata `q` vazio listando tudo).

- [ ] **Step 3: Verificar no preview** — home mostra hero fallback (sem banners no seed), Lançamentos (4), cards de faixa de preço, Mais Vendidos (4), Promoções, cards com hover.

- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: home com vitrines, cards de produto e carrossel de banners"`

---

### Task 5: Página de categoria com filtros, ordenação e paginação

**Files:**
- Create: `src/components/filters-sidebar.tsx`, `src/components/sort-select.tsx`, `src/components/pagination.tsx`, `src/app/(store)/[categoria]/page.tsx`

- [ ] **Step 1: Componentes de filtro**

`src/components/filters-sidebar.tsx`:
```tsx
import Link from "next/link";
import type { CatalogParams } from "@/lib/filters";
import { buildCatalogHref, PRICE_BUCKETS } from "@/lib/filters";

type SubItem = { name: string; slug: string };

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm tracking-[0.15em] uppercase text-ink mb-2">{title}</h3>
      <ul className="space-y-1 text-sm">{children}</ul>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className={active ? "text-gold font-medium" : "text-ink-soft hover:text-gold"}>
        {active ? "✓ " : ""}{children}
      </Link>
    </li>
  );
}

export function FiltersSidebar({ base, params, subs }: { base: string; params: CatalogParams; subs: SubItem[] }) {
  return (
    <aside className="w-full md:w-52 shrink-0">
      {subs.length > 0 && (
        <FilterGroup title="Categoria">
          <FilterLink href={buildCatalogHref(base, params, { sub: undefined })} active={!params.sub}>
            Todas
          </FilterLink>
          {subs.map((s) => (
            <FilterLink key={s.slug} href={buildCatalogHref(base, params, { sub: s.slug })} active={params.sub === s.slug}>
              {s.name}
            </FilterLink>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Material">
        <FilterLink href={buildCatalogHref(base, params, { material: undefined })} active={!params.material}>
          Todos
        </FilterLink>
        <FilterLink href={buildCatalogHref(base, params, { material: "semijoia" })} active={params.material === "semijoia"}>
          Semijoia
        </FilterLink>
        <FilterLink href={buildCatalogHref(base, params, { material: "prata925" })} active={params.material === "prata925"}>
          Prata 925
        </FilterLink>
      </FilterGroup>
      <FilterGroup title="Preço">
        <FilterLink href={buildCatalogHref(base, params, { price: undefined })} active={!params.price}>
          Todos
        </FilterLink>
        {PRICE_BUCKETS.map((b) => (
          <FilterLink key={b.slug} href={buildCatalogHref(base, params, { price: b.slug })} active={params.price?.slug === b.slug}>
            {b.label}
          </FilterLink>
        ))}
      </FilterGroup>
    </aside>
  );
}
```

`src/components/sort-select.tsx`:
```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/filters";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("ordem") ?? "lancamentos";

  function onChange(value: string) {
    const q = new URLSearchParams(searchParams.toString());
    if (value === "lancamentos") q.delete("ordem");
    else q.set("ordem", value);
    q.delete("pagina");
    router.push(`${pathname}${q.size ? `?${q}` : ""}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Ordenar por"
      className="bg-card border border-gold-light/50 text-sm px-3 py-1.5 focus:outline-none focus:border-gold"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.slug} value={o.slug}>{o.label}</option>
      ))}
    </select>
  );
}
```

`src/components/pagination.tsx`:
```tsx
import Link from "next/link";
import type { CatalogParams } from "@/lib/filters";
import { buildCatalogHref } from "@/lib/filters";

export function Pagination({ base, params, total, perPage }: { base: string; params: CatalogParams; total: number; perPage: number }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginação" className="flex justify-center gap-2 mt-8">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={buildCatalogHref(base, params, { page: n })}
          className={`px-3 py-1.5 text-sm border ${n === params.page ? "border-gold bg-gold text-cream" : "border-gold-light/50 text-ink-soft hover:border-gold"}`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Página de categoria**

`src/app/(store)/[categoria]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getCategoryBySlug, getNavTree, listProducts } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/filters";
import { FiltersSidebar } from "@/components/filters-sidebar";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { SortSelect } from "@/components/sort-select";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category || category.parentId != null) notFound();

  const catalogParams = parseCatalogParams(await searchParams);
  const nav = await getNavTree();
  const subs = nav.find((n) => n.id === category.id)?.children ?? [];

  // Filtro de subcategoria restringe à filha; senão, pai + todas as filhas
  const subSelected = catalogParams.sub ? subs.find((s) => s.slug === catalogParams.sub) : undefined;
  const categoryIds = subSelected ? [subSelected.id] : [category.id, ...subs.map((s) => s.id)];

  const { items, total, perPage } = await listProducts({ categoryIds, params: catalogParams });
  const base = `/${category.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl text-center mb-8">{category.name}</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <FiltersSidebar base={base} params={catalogParams} subs={subs} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ink-soft">{total} produto{total === 1 ? "" : "s"}</p>
            <SortSelect />
          </div>
          <ProductGrid products={items} />
          <Pagination base={base} params={catalogParams} total={total} perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar no preview** — `/brincos` lista produtos, sidebar filtra por subcategoria/material/preço, ordenação reordena, URL reflete filtros. `/categoria-inexistente` → 404.

- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: pagina de categoria com filtros, ordenacao e paginacao"`

---

### Task 6: Busca

**Files:**
- Create: `src/app/(store)/busca/page.tsx`

- [ ] **Step 1: Página**

`src/app/(store)/busca/page.tsx`:
```tsx
import { listProducts } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/filters";
import { FiltersSidebar } from "@/components/filters-sidebar";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { SortSelect } from "@/components/sort-select";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = (Array.isArray(raw.q) ? raw.q[0] : raw.q)?.trim() ?? "";
  const catalogParams = parseCatalogParams(raw);
  const { items, total, perPage } = await listProducts({ search: q || undefined, params: catalogParams });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl text-center mb-2">{q ? `Busca: “${q}”` : "Todos os produtos"}</h1>
      <p className="text-center text-sm text-ink-soft mb-8">{total} resultado{total === 1 ? "" : "s"}</p>
      <div className="flex flex-col md:flex-row gap-8">
        <FiltersSidebar base="/busca" params={catalogParams} subs={[]} />
        <div className="flex-1">
          <div className="flex justify-end mb-4"><SortSelect /></div>
          <ProductGrid products={items} />
          <Pagination base="/busca" params={catalogParams} total={total} perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
```
Obs.: `q` já é capturado por `parseCatalogParams` e preservado por `buildCatalogHref` (Task 1), então os filtros mantêm o termo buscado automaticamente.

- [ ] **Step 2: Verificar no preview** — busca do header leva a `/busca?q=exemplo` com resultados; `/busca?preco=ate-50` (link da home) filtra sem `q`; filtros preservam o termo buscado.

- [ ] **Step 3: Commit** — `git add -A; git commit -m "feat: pagina de busca"`

---

### Task 7: Página de produto

**Files:**
- Create: `src/components/product-gallery.tsx`, `src/app/(store)/produto/[slug]/page.tsx`

- [ ] **Step 1: Galeria (client)**

`src/components/product-gallery.tsx`:
```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  if (photos.length === 0) {
    return <div className="aspect-square bg-cream-dark" />;
  }
  return (
    <div>
      <div className="relative aspect-square bg-card border border-gold-light/30">
        <Image src={photos[selected]} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-2">
          {photos.map((p, i) => (
            <button
              key={p}
              onClick={() => setSelected(i)}
              aria-label={`Foto ${i + 1}`}
              className={`relative w-16 h-16 border ${i === selected ? "border-gold" : "border-gold-light/40"}`}
            >
              <Image src={p} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Página**

`src/app/(store)/produto/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { effectivePriceCents, isOnPromo } from "@/lib/pricing";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  const promo = isOnPromo(product);
  const visibleVariants = product.variants.filter((v) => !v.isDefault);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <ProductGallery photos={product.photos} alt={product.name} />
        <div>
          <h1 className="text-4xl">{product.name}</h1>
          <p className="text-xs tracking-[0.15em] uppercase text-ink-soft mt-1">
            {product.material === "prata925" ? "Prata 925" : "Semijoia"}
          </p>
          <div className="mt-4 text-2xl">
            {promo && <span className="text-ink-soft line-through text-lg mr-3">{formatBRL(product.priceCents)}</span>}
            <span className="text-gold font-medium">{formatBRL(effectivePriceCents(product))}</span>
          </div>

          {visibleVariants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm tracking-[0.15em] uppercase mb-2">Opções</p>
              <div className="flex flex-wrap gap-2">
                {visibleVariants.map((v) => (
                  <span
                    key={v.id}
                    className={`px-4 py-2 text-sm border ${v.stock > 0 ? "border-gold-light text-ink" : "border-gold-light/30 text-ink-soft line-through"}`}
                  >
                    {v.label}
                    {v.stock === 0 && " (esgotado)"}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            disabled
            className="mt-8 w-full bg-gold/50 text-cream py-3 text-sm tracking-[0.2em] uppercase cursor-not-allowed"
            title="Carrinho disponível em breve"
          >
            {totalStock > 0 ? "Adicionar ao carrinho (em breve)" : "Esgotado"}
          </button>

          {product.description && (
            <div className="mt-8 border-t border-gold-light/30 pt-6 text-sm text-ink-soft whitespace-pre-line">
              {product.description}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading>Você também vai gostar</SectionHeading>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
```
Obs.: botão de carrinho e cálculo de frete por CEP nesta página chegam no Plano 3.

- [ ] **Step 3: Verificar no preview** — abrir um produto pelo card da home: galeria, preço, material, variações dos anéis com estado, descrição, relacionados. Slug inexistente → 404.

- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: pagina de produto com galeria e variacoes"`

---

### Task 8: Verificação final

- [ ] `npm test` → todos passam (pricing + filters + money + slug)
- [ ] `npx tsc --noEmit` → sem erros
- [ ] `npm run build` → build de produção sem erros
- [ ] Preview manual: home → categoria → filtro → produto → busca, desktop (1280px) e mobile (375px)
- [ ] Commit final se houver ajustes
