"use server";

import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | void;

type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export async function updateOrderAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Pedido inválido." };

  const status = formData.get("status") as OrderStatus;
  if (!orderStatusEnum.enumValues.includes(status)) {
    return { error: "Status inválido." };
  }

  const trackingCode = ((formData.get("trackingCode") as string) || "").trim();

  const [current] = await db.select().from(orders).where(eq(orders.id, id));
  if (!current) return { error: "Pedido não encontrado." };

  await db
    .update(orders)
    .set({
      status,
      trackingCode: trackingCode || null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}
