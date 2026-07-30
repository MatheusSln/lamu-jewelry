import Link from "next/link";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { ADMIN_CARD, ADMIN_LINK } from "../ui";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, PENDING_ORDER_STATUSES } from "./status-labels";

export const dynamic = "force-dynamic";

type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

const FILTER_CHIPS: { key: string | undefined; label: string }[] = [
  { key: undefined, label: "Todos" },
  { key: "pendentes", label: "Pendentes" },
  ...Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => ({ key, label })),
];

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const where =
    status === "pendentes"
      ? inArray(orders.status, PENDING_ORDER_STATUSES)
      : status && orderStatusEnum.enumValues.includes(status as OrderStatus)
        ? eq(orders.status, status as OrderStatus)
        : undefined;

  const allOrders = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="admin-title text-ink">Pedidos</h1>

      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => {
          const active = status === chip.key || (!status && !chip.key);
          return (
            <Link
              key={chip.key ?? "todos"}
              href={chip.key ? `/admin/pedidos?status=${chip.key}` : "/admin/pedidos"}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-colors ${
                active
                  ? "border-gold bg-gold text-cream"
                  : "border-gold-light/50 text-ink-soft hover:border-gold"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>

      <div className={ADMIN_CARD}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-ink-soft">Nenhum pedido encontrado{status ? " com este filtro." : "."}</td></tr>
              ) : allOrders.map(order => (
                <tr key={order.id} className="border-b border-gold-light/20 hover:bg-cream/50">
                  <td className="py-3 px-4 font-medium">
                    <Link href={`/admin/pedidos/${order.id}`} className="hover:text-gold transition-colors">
                      {order.publicCode}
                    </Link>
                    {order.needsStockReview && (
                      <span className="ml-2 bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">estoque</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{order.customerName}</td>
                  <td className="py-3 px-4 text-ink-soft">{order.customerWhatsapp}</td>
                  <td className="py-3 px-4 text-ink-soft">{order.createdAt.toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-ink-soft">{formatBRL(order.totalCents)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${ORDER_STATUS_STYLES[order.status] ?? "bg-gold-light/30 text-gold-dark"}`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/pedidos/${order.id}`} className={ADMIN_LINK}>
                      Gerenciar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
