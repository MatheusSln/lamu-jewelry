"use server";

import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { redirect } from "next/navigation";

export async function saveProductAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceCents = parseInt(formData.get("priceCents") as string, 10);
  const categoryId = parseInt(formData.get("categoryId") as string, 10);
  const material = formData.get("material") as "semijoia" | "prata925";
  
  const isActive = formData.get("isActive") === "on";
  const isLaunch = formData.get("isLaunch") === "on";
  const isBestseller = formData.get("isBestseller") === "on";
  
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
  }).returning();

  // Create a default variant
  await db.insert(productVariants).values({
    productId: newProduct.id,
    label: "", // Default variant
    stock: 0,
    priceDeltaCents: 0,
    isDefault: true,
    isActive: true,
  });

  redirect("/admin/produtos");
}
