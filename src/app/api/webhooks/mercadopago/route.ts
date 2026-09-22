import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (type !== "payment" || !dataId) {
      return new NextResponse("Ignorado", { status: 200 });
    }

    // Na vida real, você verificaria a assinatura usando a chave do webhook (x-signature)
    // E faria um GET na API do Mercado Pago usando o ID para confirmar os dados reais.
    // fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, { headers: { Authorization: `Bearer ${MP_TOKEN}` } })

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not set");
      return new NextResponse("Server Error", { status: 500 });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${mpToken}` }
    });

    if (!paymentRes.ok) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    const payment = await paymentRes.json();
    const orderId = payment.external_reference;

    if (!orderId) {
      return new NextResponse("No external reference", { status: 200 });
    }

    // Map Mercado Pago status to our status
    let newStatus = null;
    if (payment.status === "approved") {
      newStatus = "pago";
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      newStatus = "cancelado";
    }

    if (newStatus) {
      await db.update(orders)
        // @ts-expect-error Drizzle enum typing
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(orders.id, parseInt(orderId, 10)));
      
      console.log(`Order ${orderId} updated to ${newStatus}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook MP Error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
