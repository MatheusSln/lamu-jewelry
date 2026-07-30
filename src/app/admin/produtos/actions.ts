"use server";

import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq, inArray, and, ne, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";
import { uploadImages, deleteBlobImages } from "@/lib/uploads";
import type { VariantData } from "./form";

export type ActionResult = { error: string } | void;

type ParsedProduct = {
  name: string;
  description: string;
  priceCents: number;
  promoPriceCents: number | null;
  categoryId: number;
  material: "semijoia" | "prata925";
  isActive: boolean;
  isLaunch: boolean;
  isBestseller: boolean;
  photos: string[];
  variants: VariantData[];
};

function parseProductForm(formData: FormData): { data: ParsedProduct } | { error: string } {
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { error: "Informe o nome do produto." };

  const priceCents = parseInt(formData.get("priceCents") as string, 10);
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return { error: "Preço inválido. Informe um valor maior que zero (ex.: 159,00)." };
  }

  const promoRaw = ((formData.get("promoPriceCents") as string) || "").trim();
  let promoPriceCents: number | null = null;
  if (promoRaw !== "") {
    promoPriceCents = parseInt(promoRaw, 10);
    if (!Number.isInteger(promoPriceCents) || promoPriceCents <= 0) {
      return { error: "Preço promocional inválido. Deixe em branco para não ter promoção." };
    }
    if (promoPriceCents >= priceCents) {
      return { error: "O preço promocional precisa ser menor que o preço normal." };
    }
  }

  const categoryId = parseInt(formData.get("categoryId") as string, 10);
  if (!Number.isInteger(categoryId)) return { error: "Selecione uma categoria." };

  const material = formData.get("material") as "semijoia" | "prata925";
  if (material !== "semijoia" && material !== "prata925") {
    return { error: "Material inválido." };
  }

  let photos: string[];
  let variants: VariantData[];
  try {
    photos = JSON.parse((formData.get("photos") as string) || "[]");
    variants = JSON.parse((formData.get("variants") as string) || "[]");
  } catch {
    return { error: "Dados do formulário corrompidos. Recarregue a página e tente de novo." };
  }

  if (variants.length === 0) {
    return { error: "O produto precisa de pelo menos uma variação (use nome em branco se não houver tamanhos/cores)." };
  }
  for (const v of variants) {
    if (!Number.isInteger(v.stock) || v.stock < 0) {
      return { error: `Estoque inválido na variação "${v.label || "padrão"}".` };
    }
    if (!Number.isInteger(v.priceDeltaCents)) {
      return { error: `Diferença de preço inválida na variação "${v.label || "padrão"}".` };
    }
  }
  const labels = variants.map((v) => v.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) {
    return { error: "Há variações com o mesmo nome. Cada variação precisa de um nome diferente." };
  }

  return {
    data: {
      name,
      description: (formData.get("description") as string) || "",
      priceCents,
      promoPriceCents,
      categoryId,
      material,
      isActive: formData.get("isActive") === "on",
      isLaunch: formData.get("isLaunch") === "on",
      isBestseller: formData.get("isBestseller") === "on",
      photos: photos.filter((p) => typeof p === "string" && p.trim() !== ""),
      variants,
    },
  };
}

/** Gera slug único a partir do nome, acrescentando -2, -3… em caso de colisão. */
async function uniqueSlug(name: string, ignoreProductId?: number): Promise<string> {
  const base = slugify(name) || "produto";
  const collisionFilter = ignoreProductId
    ? and(like(products.slug, `${base}%`), ne(products.id, ignoreProductId))
    : like(products.slug, `${base}%`);
  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(collisionFilter);
  const taken = new Set(existing.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function saveProductAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;
  const data = parsed.data;

  const uploaded = await uploadImages(formData.getAll("newPhotos"));
  if ("error" in uploaded) return { error: uploaded.error };
  const photos = [...data.photos, ...uploaded.urls];

  const slug = await uniqueSlug(data.name);

  const [newProduct] = await db
    .insert(products)
    .values({
      name: data.name,
      slug,
      description: data.description,
      priceCents: data.priceCents,
      promoPriceCents: data.promoPriceCents,
      categoryId: data.categoryId,
      material: data.material,
      isActive: data.isActive,
      isLaunch: data.isLaunch,
      isBestseller: data.isBestseller,
      photos,
    })
    .returning();

  await db.insert(productVariants).values(
    data.variants.map((v, index) => ({
      productId: newProduct.id,
      label: v.label.trim(),
      stock: v.stock,
      priceDeltaCents: v.priceDeltaCents,
      isDefault: index === 0,
      isActive: true,
    })),
  );

  revalidatePath("/admin/produtos");
  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

export async function updateProductAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Produto inválido." };

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;
  const data = parsed.data;

  const [current] = await db.select().from(products).where(eq(products.id, id));
  if (!current) return { error: "Produto não encontrado." };

  const uploaded = await uploadImages(formData.getAll("newPhotos"));
  if ("error" in uploaded) return { error: uploaded.error };
  const photos = [...data.photos, ...uploaded.urls];

  // Slug só muda se o nome mudou (evita quebrar links já divulgados sem necessidade)
  const slug =
    current.name === data.name ? current.slug : await uniqueSlug(data.name, id);

  await db
    .update(products)
    .set({
      name: data.name,
      slug,
      description: data.description,
      priceCents: data.priceCents,
      promoPriceCents: data.promoPriceCents,
      categoryId: data.categoryId,
      material: data.material,
      isActive: data.isActive,
      isLaunch: data.isLaunch,
      isBestseller: data.isBestseller,
      photos,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  // Upsert de variações: atualiza as existentes, insere novas e remove as excluídas.
  // (delete+recriar zeraria variant_id em order_items, por isso o upsert.)
  const existingVariants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id));
  const existingIds = new Set(existingVariants.map((v) => v.id));
  const incomingIds = data.variants
    .map((v) => v.id)
    .filter((vid): vid is number => Boolean(vid));

  const idsToDelete = existingVariants
    .filter((ev) => !incomingIds.includes(ev.id))
    .map((v) => v.id);
  if (idsToDelete.length > 0) {
    await db.delete(productVariants).where(inArray(productVariants.id, idsToDelete));
  }

  for (const [i, v] of data.variants.entries()) {
    if (v.id && existingIds.has(v.id)) {
      await db
        .update(productVariants)
        .set({
          label: v.label.trim(),
          stock: v.stock,
          priceDeltaCents: v.priceDeltaCents,
          isDefault: i === 0,
        })
        .where(eq(productVariants.id, v.id));
    } else {
      await db.insert(productVariants).values({
        productId: id,
        label: v.label.trim(),
        stock: v.stock,
        priceDeltaCents: v.priceDeltaCents,
        isDefault: i === 0,
        isActive: true,
      });
    }
  }

  // Fotos removidas na edição saem também do Blob
  const removed = (current.photos || []).filter((p) => !photos.includes(p));
  await deleteBlobImages(removed);

  revalidatePath("/admin/produtos");
  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

export async function deleteProductAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Produto inválido." };

  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return { error: "Produto não encontrado." };

  await db.delete(products).where(eq(products.id, id));
  await deleteBlobImages(product.photos || []);

  revalidatePath("/admin/produtos");
  revalidatePath("/", "layout");
}
