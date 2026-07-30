"use server";

import { db } from "@/db";
import { orderItems, orders, orderStatusEnum, productVariants } from "@/db/schema";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
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

  const cancelling = status === "cancelado" && current.status !== "cancelado";
  const reactivating = status !== "cancelado" && current.status === "cancelado";

  await db.transaction(async (tx) => {
    let needsStockReview = current.needsStockReview;

    if (cancelling || reactivating) {
      const items = await tx
        .select()
        .from(orderItems)
        .where(and(eq(orderItems.orderId, id), isNotNull(orderItems.variantId)));

      for (const item of items) {
        if (cancelling) {
          // Devolve o estoque reservado pelo pedido
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(eq(productVariants.id, item.variantId!));
        } else {
          // Reativação: tenta baixar de novo; sem estoque, marca para revisão
          const updated = await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(and(eq(productVariants.id, item.variantId!), gte(productVariants.stock, item.quantity)))
            .returning({ id: productVariants.id });
          if (updated.length === 0) needsStockReview = true;
        }
      }
      if (cancelling) needsStockReview = false;
    }

    await tx
      .update(orders)
      .set({
        status,
        trackingCode: trackingCode || null,
        needsStockReview,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath(`/pedido/${current.publicCode}`);
}
