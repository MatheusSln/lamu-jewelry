import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { CategoriasManager } from "./categorias-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  const [allCategories, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ categoryId: products.categoryId, count: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.categoryId),
  ]);

  const productCounts = Object.fromEntries(counts.map((c) => [c.categoryId, c.count]));

  return <CategoriasManager categories={allCategories} productCounts={productCounts} />;
}
