import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coupons, orderItems, orders } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "../status-labels";
import { OrderStatusForm } from "./status-form";
import { ADMIN_CARD } from "../../ui";

export const dynamic = "force-dynamic";

export default async function AdminPedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) notFound();

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id));

  const coupon = order.couponId
    ? (await db.select().from(coupons).where(eq(coupons.id, order.couponId)))[0]
    : null;

  const whatsappDigits = order.customerWhatsapp.replace(/\D/g, "");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/admin/pedidos" className="text-gold hover:underline text-sm tracking-widest uppercase mb-2 block">
          &larr; Voltar para pedidos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="admin-title text-ink">Pedido {order.publicCode}</h1>
          <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${ORDER_STATUS_STYLES[order.status] ?? "bg-gold-light/30 text-gold-dark"}`}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
          {order.needsStockReview && (
            <span className="bg-danger/15 text-danger px-2 py-1 rounded text-xs uppercase tracking-wider">
              Revisar estoque
            </span>
          )}
        </div>
        <p className="text-xs text-ink-soft mt-1">
          Criado em {order.createdAt.toLocaleString("pt-BR")} · Origem: {order.origin === "whatsapp" ? "WhatsApp" : "Site"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Itens */}
          <div className={ADMIN_CARD}>
            <div className="p-4 border-b border-gold-light/30">
              <h2 className="text-sm tracking-widest uppercase text-ink-soft">Itens do Pedido</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Qtd</th>
                    <th className="py-3 px-4">Preço un.</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gold-light/20">
                      <td className="py-3 px-4">
                        <p className="font-medium text-ink">{item.productName}</p>
                        {item.variantLabel && <p className="text-xs text-ink-soft">{item.variantLabel}</p>}
                      </td>
                      <td className="py-3 px-4 text-ink-soft">{item.quantity}</td>
                      <td className="py-3 px-4 text-ink-soft">{formatBRL(item.unitPriceCents)}</td>
                      <td className="py-3 px-4 text-right text-ink">{formatBRL(item.unitPriceCents * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gold-light/30 space-y-1 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span><span>{formatBRL(order.subtotalCents)}</span>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <span>Desconto{coupon ? ` (cupom ${coupon.code})` : ""}</span>
                  <span>-{formatBRL(order.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Frete{order.shippingName ? ` (${order.shippingName})` : ""}</span>
                <span>{order.shippingCents > 0 ? formatBRL(order.shippingCents) : "Grátis"}</span>
              </div>
              <div className="flex justify-between text-ink font-medium text-base pt-2 border-t border-gold-light/20">
                <span>Total</span><span>{formatBRL(order.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Cliente e entrega */}
          <div className={`${ADMIN_CARD} p-4 space-y-3`}>
            <h2 className="text-sm tracking-widest uppercase text-ink-soft">Cliente e Entrega</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-ink">{order.customerName}</p>
                <p className="text-ink-soft">
                  WhatsApp:{" "}
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    {order.customerWhatsapp}
                  </a>
                </p>
                {order.customerEmail && <p className="text-ink-soft">E-mail: {order.customerEmail}</p>}
              </div>
              <div className="text-ink-soft">
                {order.address ? (
                  <>
                    <p>{order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}</p>
                    <p>{order.address.neighborhood} — {order.address.city}/{order.address.state}</p>
                    <p>CEP {order.address.cep}</p>
                  </>
                ) : (
                  <p>Sem endereço cadastrado (pedido via WhatsApp).</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-6">
          <div className={`${ADMIN_CARD} p-4`}>
            <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-4">Atualizar Pedido</h2>
            <OrderStatusForm orderId={order.id} status={order.status} trackingCode={order.trackingCode} />
          </div>
          <div className={`${ADMIN_CARD} p-4 text-sm text-ink-soft space-y-1`}>
            <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Pagamento</h2>
            <p>Cobrança AbacatePay: {order.abacatepayChargeId || "—"}</p>
            <p>Última atualização: {order.updatedAt.toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
