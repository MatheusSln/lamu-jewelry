"use server";

import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { put } from "@vercel/blob";

export async function saveProductAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceCents = parseInt(formData.get("priceCents") as string, 10);
  const categoryId = parseInt(formData.get("categoryId") as string, 10);
  const material = formData.get("material") as "semijoia" | "prata925";
  
  const isActive = formData.get("isActive") === "on";
  const isLaunch = formData.get("isLaunch") === "on";
  const isBestseller = formData.get("isBestseller") === "on";

  // Parse existing photos (URLs)
  let photos = JSON.parse((formData.get("photos") as string) || "[]");
  
  // Upload new physical files
  const newPhotos = formData.getAll("newPhotos");
  for (const file of newPhotos) {
    if (file instanceof File && file.size > 0) {
      const blob = await put(file.name, file, { access: 'public' });
      photos.push(blob.url);
    }
  }

  const variants = JSON.parse((formData.get("variants") as string) || "[]");
  
  // Basic slug generation (in a real app, use a proper slugifier and handle collisions)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const [newProduct] = await db.insert(products).values({
    name,
    slug,
    description,
    priceCents,
    categoryId,
    material,
    isActive,
    isLaunch,
    isBestseller,
    photos,
  }).returning();

  // Insert variants
  if (variants && variants.length > 0) {
    await db.insert(productVariants).values(
      variants.map((v: any, index: number) => ({
        productId: newProduct.id,
        label: v.label || "",
        stock: v.stock || 0,
        priceDeltaCents: v.priceDeltaCents || 0,
        isDefault: index === 0, // A primeira variação é a padrão
        isActive: true,
      }))
    );
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos");
}

export async function updateProductAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceCents = parseInt(formData.get("priceCents") as string, 10);
  const categoryId = parseInt(formData.get("categoryId") as string, 10);
  const material = formData.get("material") as "semijoia" | "prata925";
  
  const isActive = formData.get("isActive") === "on";
  const isLaunch = formData.get("isLaunch") === "on";
  const isBestseller = formData.get("isBestseller") === "on";

  let photos = JSON.parse((formData.get("photos") as string) || "[]");

  // Upload new physical files if provided
  const newPhotos = formData.getAll("newPhotos");
  for (const file of newPhotos) {
    if (file instanceof File && file.size > 0) {
      const blob = await put(file.name, file, { access: 'public' });
      photos.push(blob.url);
    }
  }

  const variants = JSON.parse((formData.get("variants") as string) || "[]");

  // Update main product
  await db.update(products)
    .set({
      name,
      description,
      priceCents,
      categoryId,
      material,
      isActive,
      isLaunch,
      isBestseller,
      photos,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  // Update variants: Para simplificar, apagamos as antigas e inserimos as novas
  // Em produção pesada, usaríamos update/upsert, mas delete+insert é seguro aqui se não houver FKs complexas de pedidos que exijam o ID.
  // IMPORTANTE: Se orders guardam variant_id, deletar e recriar causaria set null.
  // Vamos tentar upsert em vez disso!
  
  const existingVariants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
  const incomingIds = variants.map((v: any) => v.id).filter(Boolean);

  // Deletar as variações que foram removidas pelo admin
  const variantsToDelete = existingVariants.filter(ev => !incomingIds.includes(ev.id));
  if (variantsToDelete.length > 0) {
    await db.delete(productVariants).where(inArray(productVariants.id, variantsToDelete.map(v => v.id)));
  }

  // Update or insert
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (v.id) {
      await db.update(productVariants).set({
        label: v.label || "",
        stock: v.stock || 0,
        priceDeltaCents: v.priceDeltaCents || 0,
        isDefault: i === 0,
      }).where(eq(productVariants.id, v.id));
    } else {
      await db.insert(productVariants).values({
        productId: id,
        label: v.label || "",
        stock: v.stock || 0,
        priceDeltaCents: v.priceDeltaCents || 0,
        isDefault: i === 0,
        isActive: true,
      });
    }
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos");
}

export async function deleteProductAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  if (!id) return;
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos");
}
