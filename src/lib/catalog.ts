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
