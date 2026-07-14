"use server";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { and, eq, like, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";

export type ActionResult = { error: string } | void;

function parseCategoryForm(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  const parentRaw = ((formData.get("parentId") as string) || "").trim();
  const parentId = parentRaw === "" ? null : parseInt(parentRaw, 10);
  const sortOrderRaw = ((formData.get("sortOrder") as string) || "0").trim();
  const sortOrder = parseInt(sortOrderRaw === "" ? "0" : sortOrderRaw, 10);
  return {
    name,
    parentId: parentId !== null && Number.isInteger(parentId) ? parentId : null,
    sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
  };
}

/** Slug único; para filhas, prefixado com o nome do pai (padrão do seed: "brincos-argola"). */
async function uniqueCategorySlug(name: string, parentId: number | null, ignoreId?: number): Promise<string> {
  let base = slugify(name) || "categoria";
  if (parentId) {
    const [parent] = await db.select().from(categories).where(eq(categories.id, parentId));
    if (parent) base = slugify(`${parent.name} ${name}`);
  }
  const collisionFilter = ignoreId
    ? and(like(categories.slug, `${base}%`), ne(categories.id, ignoreId))
    : like(categories.slug, `${base}%`);
  const existing = await db.select({ slug: categories.slug }).from(categories).where(collisionFilter);
  const taken = new Set(existing.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

async function validateParent(parentId: number | null, selfId?: number): Promise<string | null> {
  if (parentId === null) return null;
  if (selfId && parentId === selfId) return "Uma categoria não pode ser filha de si mesma.";
  const [parent] = await db.select().from(categories).where(eq(categories.id, parentId));
  if (!parent) return "Categoria pai não encontrada.";
  if (parent.parentId !== null) return "Só há um nível de subcategorias: escolha uma categoria principal como pai.";
  return null;
}

export async function saveCategoryAction(formData: FormData): Promise<ActionResult> {
  const data = parseCategoryForm(formData);
  if (!data.name) return { error: "Informe o nome da categoria." };

  const parentError = await validateParent(data.parentId);
  if (parentError) return { error: parentError };

  const slug = await uniqueCategorySlug(data.name, data.parentId);
  await db.insert(categories).values({ ...data, slug });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
}

export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Categoria inválida." };

  const data = parseCategoryForm(formData);
  if (!data.name) return { error: "Informe o nome da categoria." };

  const [current] = await db.select().from(categories).where(eq(categories.id, id));
  if (!current) return { error: "Categoria não encontrada." };

  const parentError = await validateParent(data.parentId, id);
  if (parentError) return { error: parentError };

  if (data.parentId !== null) {
    const [{ count: childCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(eq(categories.parentId, id));
    if (childCount > 0) {
      return { error: "Esta categoria tem subcategorias, então não pode virar filha de outra." };
    }
  }

  // Slug só muda se nome ou pai mudaram (evita quebrar links divulgados)
  const slug =
    current.name === data.name && current.parentId === data.parentId
      ? current.slug
      : await uniqueCategorySlug(data.name, data.parentId, id);

  await db.update(categories).set({ ...data, slug }).where(eq(categories.id, id));

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Categoria inválida." };

  const [{ count: childCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories)
    .where(eq(categories.parentId, id));
  if (childCount > 0) {
    return { error: "Exclua ou mova as subcategorias antes de excluir esta categoria." };
  }

  const [{ count: productCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.categoryId, id));
  if (productCount > 0) {
    return { error: `Há ${productCount} produto(s) nesta categoria. Mova-os para outra categoria antes de excluir.` };
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
}
