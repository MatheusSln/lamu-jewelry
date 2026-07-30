"use server";

import { db } from "@/db";
import { coupons, orderItems, orders, products, productVariants, type OrderAddress } from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { applyCoupon } from "@/lib/coupons";
import { getShippingOptions } from "@/lib/shipping";
import { generateOrderCode } from "@/lib/order-code";
import { getSettingsMap } from "@/lib/catalog";
import { effectivePriceCents } from "@/lib/pricing";

export type CouponCheck =
  | { ok: true; code: string; discountCents: number }
  | { ok: false; error: string };

export async function validateCouponAction(codeRaw: string, subtotalCents: number): Promise<CouponCheck> {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Digite o código do cupom." };

  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
  const result = applyCoupon(coupon ?? null, subtotalCents);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, code, discountCents: result.discountCents };
}

export type CheckoutPayload = {
  items: { variantId: number; quantity: number }[];
  customer: { name: string; whatsapp: string; email: string };
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  couponCode: string;
};

export type CheckoutResult = { publicCode: string; error?: never } | { error: string; publicCode?: never };

function validatePayload(p: CheckoutPayload): string | null {
  if (!Array.isArray(p.items) || p.items.length === 0) return "Seu carrinho está vazio.";
  for (const i of p.items) {
    if (!Number.isInteger(i.variantId) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) {
      return "Itens do carrinho inválidos. Recarregue a página.";
    }
  }
  if (!p.customer.name.trim()) return "Informe seu nome.";
  const waDigits = p.customer.whatsapp.replace(/\D/g, "");
  if (waDigits.length < 10) return "Informe um WhatsApp válido com DDD.";
  const cepDigits = p.address.cep.replace(/\D/g, "");
  if (cepDigits.length !== 8) return "Informe um CEP válido.";
  if (!p.address.street.trim()) return "Informe a rua.";
  if (!p.address.number.trim()) return "Informe o número.";
  if (!p.address.neighborhood.trim()) return "Informe o bairro.";
  if (!p.address.city.trim()) return "Informe a cidade.";
  if (!/^[A-Za-z]{2}$/.test(p.address.state.trim())) return "Informe a UF (2 letras).";
  return null;
}

export async function createOrderAction(payload: CheckoutPayload): Promise<CheckoutResult> {
  const invalid = validatePayload(payload);
  if (invalid) return { error: invalid };

  // Consolida quantidades por variação (carrinho não deveria duplicar, mas por garantia)
  const qtyByVariant = new Map<number, number>();
  for (const i of payload.items) {
    qtyByVariant.set(i.variantId, (qtyByVariant.get(i.variantId) ?? 0) + i.quantity);
  }
  const variantIds = [...qtyByVariant.keys()];

  // Revalida itens no banco: produto ativo, variação ativa, preço atual, estoque
  const rows = await db
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  if (rows.length !== variantIds.length) {
    return { error: "Um dos itens do carrinho não está mais disponível. Atualize o carrinho." };
  }

  const lineItems = rows.map(({ variant, product }) => {
    const quantity = qtyByVariant.get(variant.id)!;
    return {
      variant,
      product,
      quantity,
      unitPriceCents: effectivePriceCents(product) + variant.priceDeltaCents,
    };
  });

  for (const li of lineItems) {
    if (!li.product.isActive || !li.variant.isActive) {
      return { error: `"${li.product.name}" não está mais disponível na loja.` };
    }
    if (li.variant.stock < li.quantity) {
      const label = li.variant.label ? ` (${li.variant.label})` : "";
      return {
        error:
          li.variant.stock === 0
            ? `"${li.product.name}"${label} esgotou. Remova-o do carrinho.`
            : `"${li.product.name}"${label} tem só ${li.variant.stock} unidade(s) em estoque.`,
      };
    }
  }

  const subtotalCents = lineItems.reduce((s, li) => s + li.unitPriceCents * li.quantity, 0);

  // Cupom (opcional)
  let discountCents = 0;
  let couponId: number | null = null;
  const couponCode = (payload.couponCode || "").trim().toUpperCase();
  if (couponCode) {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, couponCode));
    const result = applyCoupon(coupon ?? null, subtotalCents);
    if (!result.ok) return { error: `Cupom ${couponCode}: ${result.error}` };
    discountCents = result.discountCents;
    couponId = coupon.id;
  }

  // Frete calculado no servidor a partir das settings
  const settings = await getSettingsMap();
  const [shipping] = getShippingOptions(subtotalCents, settings);
  const totalCents = subtotalCents - discountCents + shipping.cents;

  // Código público único
  let publicCode = generateOrderCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const [existing] = await db.select({ id: orders.id }).from(orders).where(eq(orders.publicCode, publicCode));
    if (!existing) break;
    publicCode = generateOrderCode();
  }

  const address: OrderAddress = {
    cep: payload.address.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
    street: payload.address.street.trim(),
    number: payload.address.number.trim(),
    complement: payload.address.complement.trim() || undefined,
    neighborhood: payload.address.neighborhood.trim(),
    city: payload.address.city.trim(),
    state: payload.address.state.trim().toUpperCase(),
  };

  try {
    await db.transaction(async (tx) => {
      // Baixa de estoque condicional — falha se outra compra levou o estoque no meio do caminho
      for (const li of lineItems) {
        const updated = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${li.quantity}` })
          .where(and(eq(productVariants.id, li.variant.id), gte(productVariants.stock, li.quantity)))
          .returning({ id: productVariants.id });
        if (updated.length === 0) {
          throw new Error(`SEM_ESTOQUE:${li.product.name}`);
        }
      }

      if (couponId !== null) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, couponId));
      }

      const [order] = await tx
        .insert(orders)
        .values({
          publicCode,
          customerName: payload.customer.name.trim(),
          customerWhatsapp: payload.customer.whatsapp.trim(),
          customerEmail: payload.customer.email.trim(),
          address,
          shippingName: shipping.name,
          shippingCents: shipping.cents,
          couponId,
          subtotalCents,
          discountCents,
          totalCents,
          status: "aguardando_confirmacao",
          origin: "site",
        })
        .returning();

      await tx.insert(orderItems).values(
        lineItems.map((li) => ({
          orderId: order.id,
          variantId: li.variant.id,
          productName: li.product.name,
          variantLabel: li.variant.label,
          unitPriceCents: li.unitPriceCents,
          quantity: li.quantity,
        })),
      );
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("SEM_ESTOQUE:")) {
      return { error: `"${msg.slice("SEM_ESTOQUE:".length)}" acabou de esgotar. Atualize o carrinho.` };
    }
    console.error("Erro ao criar pedido:", err);
    return { error: "Não foi possível concluir o pedido. Tente de novo em instantes." };
  }

  return { publicCode };
}
