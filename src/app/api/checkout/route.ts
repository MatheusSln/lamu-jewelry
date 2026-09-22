import { preference } from "@/lib/mercadopago";
import { db } from "@/db";
import { orders, orderItems, coupons, productVariants, products, type OrderAddress } from "@/db/schema";
import { auth } from "@/lib/next-auth";
import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { applyCoupon } from "@/lib/coupons";
import crypto from "crypto";

export function isDistritoFederal(cep: string, state?: string): boolean {
  if (state && state.trim().toUpperCase() === "DF") return true;
  const digits = (cep || "").replace(/\D/g, "");
  if (digits.length !== 8) return false;
  const num = parseInt(digits, 10);
  // Faixas do Distrito Federal: 70000-000 a 73699-999
  return num >= 70000000 && num <= 73699999;
}

interface CartItemInput {
  variantId: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { items, customer, address, shippingOption, couponCode } = body as {
      items: CartItemInput[];
      customer: { name?: string; email?: string; whatsapp?: string };
      address: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
      };
      shippingOption?: {
        name: string;
        price: string;
        custom_price: string;
        delivery_time?: number;
        custom_delivery_time?: number;
        is_free?: boolean;
      };
      couponCode?: string;
    };

    // 1. Validações básicas
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });
    }

    if (!customer?.name?.trim()) {
      return NextResponse.json({ error: "Por favor, informe seu nome." }, { status: 400 });
    }

    if (!customer?.whatsapp?.trim() || customer.whatsapp.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Por favor, informe um WhatsApp válido com DDD." }, { status: 400 });
    }

    if (!address?.cep || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
      return NextResponse.json({ error: "Endereço incompleto. Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    // 2. Validação de Restrição Regional (DF)
    if (!isDistritoFederal(address.cep, address.state)) {
      return NextResponse.json({
        error: "No momento, nossa fase de lançamento atende exclusivamente o Distrito Federal. Em breve atenderemos todo o Brasil!",
      }, { status: 400 });
    }

    // 3. Validação dos itens no banco de dados e cálculo de subtotal real
    const variantIds = items.map((i) => i.variantId).filter(Boolean);
    const dbVariants = await db
      .select({
        variant: productVariants,
        product: products,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, variantIds));

    if (dbVariants.length !== variantIds.length) {
      return NextResponse.json({ error: "Alguns itens do carrinho não estão mais disponíveis." }, { status: 400 });
    }

    const itemMap = new Map(items.map((i) => [i.variantId, i.quantity]));
    const lineItems = dbVariants.map(({ variant, product }) => {
      const quantity = itemMap.get(variant.id) || 1;
      // Preço efetivo (considera promoção do produto e acréscimo da variação)
      const basePrice = product.promoPriceCents ?? product.priceCents;
      const unitPriceCents = basePrice + (variant.priceDeltaCents || 0);
      return {
        variant,
        product,
        quantity,
        unitPriceCents,
        name: product.name + (variant.label ? ` (${variant.label})` : ""),
      };
    });

    // Validação de estoque e status
    for (const li of lineItems) {
      if (!li.product.isActive || !li.variant.isActive) {
        return NextResponse.json({ error: `"${li.product.name}" não está mais disponível.` }, { status: 400 });
      }
      if (li.variant.stock < li.quantity) {
        return NextResponse.json({
          error: li.variant.stock === 0
            ? `"${li.name}" esgotou no momento.`
            : `"${li.name}" possui apenas ${li.variant.stock} unidade(s) em estoque.`,
        }, { status: 400 });
      }
    }

    const subtotalCents = lineItems.reduce((acc, li) => acc + li.unitPriceCents * li.quantity, 0);

    // 4. Cupom de desconto
    let discountCents = 0;
    let couponId: number | null = null;
    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const [dbCoupon] = await db.select().from(coupons).where(eq(coupons.code, cleanCode));
      if (dbCoupon) {
        const couponRes = applyCoupon(dbCoupon, subtotalCents);
        if (couponRes.ok) {
          discountCents = couponRes.discountCents;
          couponId = dbCoupon.id;
        }
      }
    }

    // 5. Frete
    let shippingCents = 0;
    let shippingName = "Entrega no DF";
    let deliveryTimeDays: number | null = null;

    if (shippingOption) {
      shippingName = shippingOption.name;
      deliveryTimeDays = shippingOption.custom_delivery_time || shippingOption.delivery_time || null;
      if (!shippingOption.is_free && shippingOption.custom_price) {
        shippingCents = Math.round(parseFloat(shippingOption.custom_price) * 100);
      }
    }

    const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
    const publicCode = `LM-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const formattedAddress: OrderAddress = {
      cep: address.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
      street: address.street.trim(),
      number: address.number.trim(),
      complement: address.complement?.trim() || undefined,
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim().toUpperCase(),
    };

    // 6. Criação do Pedido no Banco de Dados
    const [order] = await db.insert(orders).values({
      publicCode,
      customerName: customer.name.trim(),
      customerEmail: customer.email?.trim() || session?.user?.email || "",
      customerWhatsapp: customer.whatsapp.trim(),
      userId: session?.user?.id || null,
      address: formattedAddress,
      shippingName,
      shippingCents,
      deliveryTimeDays,
      couponId,
      subtotalCents,
      discountCents,
      totalCents,
      status: "aguardando_pagamento",
      origin: "site",
    }).returning();

    // Itens do Pedido
    await db.insert(orderItems).values(
      lineItems.map((li) => ({
        orderId: order.id,
        variantId: li.variant.id,
        productName: li.product.name,
        variantLabel: li.variant.label || "",
        unitPriceCents: li.unitPriceCents,
        quantity: li.quantity,
      }))
    );

    // 7. Preparação dos itens para o Mercado Pago
    // Se houver desconto de cupom, calcula o fator de desconto para os itens
    const itemsNetCents = Math.max(1, subtotalCents - discountCents);
    const discountRatio = itemsNetCents / subtotalCents;

    const mpItems = lineItems.map((li, idx) => {
      // Ajusta o preço unitário proporcionalmente para que a soma bata com o total com desconto
      const adjustedPriceCents = Math.round(li.unitPriceCents * discountRatio);
      return {
        id: String(li.variant.id || idx),
        title: li.name,
        quantity: li.quantity,
        unit_price: adjustedPriceCents / 100,
      };
    });

    if (shippingCents > 0) {
      mpItems.push({
        id: "FRETE",
        title: `Frete - ${shippingName}`,
        quantity: 1,
        unit_price: shippingCents / 100,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const isHttps = baseUrl.startsWith("https://");

    // 8. Criação da Preferência no Mercado Pago
    const pref = await preference.create({
      body: {
        items: mpItems,
        external_reference: String(order.id),
        statement_descriptor: "LAMU JOIAS",
        back_urls: {
          success: `${baseUrl}/pedido/${publicCode}?status=success`,
          pending: `${baseUrl}/pedido/${publicCode}?status=pending`,
          failure: `${baseUrl}/pedido/${publicCode}?status=failure`,
        },
        ...(isHttps ? {
          auto_return: "approved" as const,
          notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        } : {}),
      },
    });

    const paymentUrl = pref.init_point || pref.sandbox_init_point || "";

    // Atualiza o pedido com o link do Mercado Pago
    if (paymentUrl) {
      await db.update(orders).set({ paymentUrl }).where(eq(orders.id, order.id));
    }

    return NextResponse.json({
      orderId: order.publicCode,
      init_point: paymentUrl,
    });

  } catch (error) {
    console.error("Erro no checkout:", error);
    const msg = error instanceof Error ? error.message : "Erro ao processar checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
