"use server";

import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadImages, deleteBlobImages } from "@/lib/uploads";

export type ActionResult = { error: string } | void;

function parseBannerForm(formData: FormData) {
  const imageUrl = ((formData.get("imageUrl") as string) || "").trim();
  const linkUrl = ((formData.get("linkUrl") as string) || "").trim();
  const sortOrderRaw = ((formData.get("sortOrder") as string) || "0").trim();
  const sortOrder = parseInt(sortOrderRaw === "" ? "0" : sortOrderRaw, 10);
  const isActive = formData.get("isActive") === "on";
  return { imageUrl, linkUrl, sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0, isActive };
}

async function resolveImage(formData: FormData, currentUrl: string): Promise<{ url: string } | { error: string }> {
  const uploaded = await uploadImages(formData.getAll("newImage"));
  if ("error" in uploaded) return { error: uploaded.error };
  if (uploaded.urls.length > 0) return { url: uploaded.urls[0] };
  if (currentUrl) return { url: currentUrl };
  return { error: "Envie uma imagem ou informe a URL do banner." };
}

export async function saveBannerAction(formData: FormData): Promise<ActionResult> {
  const data = parseBannerForm(formData);
  const image = await resolveImage(formData, data.imageUrl);
  if ("error" in image) return image;

  await db.insert(banners).values({
    imageUrl: image.url,
    linkUrl: data.linkUrl,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function updateBannerAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Banner inválido." };

  const [current] = await db.select().from(banners).where(eq(banners.id, id));
  if (!current) return { error: "Banner não encontrado." };

  const data = parseBannerForm(formData);
  const image = await resolveImage(formData, data.imageUrl);
  if ("error" in image) return image;

  await db
    .update(banners)
    .set({
      imageUrl: image.url,
      linkUrl: data.linkUrl,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    })
    .where(eq(banners.id, id));

  if (current.imageUrl !== image.url) {
    await deleteBlobImages([current.imageUrl]);
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBannerAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Banner inválido." };

  const [current] = await db.select().from(banners).where(eq(banners.id, id));
  if (!current) return { error: "Banner não encontrado." };

  await db.delete(banners).where(eq(banners.id, id));
  await deleteBlobImages([current.imageUrl]);

  revalidatePath("/admin/banners");
  revalidatePath("/");
}
