import Link from "next/link";
import { db } from "@/db";
import { orders, productVariants } from "@/db/schema";
import { eq, and, gt, desc, sql, inArray, lte } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { getSettingsMap } from "@/lib/catalog";
import { getLowStockThreshold } from "@/lib/stock";
import { ADMIN_CARD } from "./ui";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, PENDING_ORDER_STATUSES } from "./pedidos/status-labels";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const settings = await getSettingsMap();
  const lowStockThreshold = getLowStockThreshold(settings);

  // 1. Vendas do Mês (status pago, separando, enviado, entregue)
  const salesResult = await db
    .select({ total: sql<number>`sum(${orders.totalCents})` })
    .from(orders)
    .where(
      and(
        gt(orders.createdAt, firstDayOfMonth),
        inArray(orders.status, ["pago", "separando", "enviado", "entregue"])
      )
    );

  const salesMonthCents = salesResult[0]?.total || 0;

  // 2. Pedidos Pendentes
  const pendingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(inArray(orders.status, PENDING_ORDER_STATUSES));
  const pendingCount = pendingResult[0]?.count || 0;

  // 3. Estoque Baixo (variação ativa com estoque igual ou abaixo do limite configurado)
  const lowStockResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.isActive, true),
        lte(productVariants.stock, lowStockThreshold)
      )
    );
  const lowStockCount = lowStockResult[0]?.count || 0;

  // 4. Últimos Pedidos
  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return (
    <div className="space-y-6">
      <h1 className="admin-title text-ink mb-2">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/pedidos" className={`${ADMIN_CARD} p-6 block hover:border-gold/60 transition-colors`}>
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Vendas do Mês</h2>
          <p className="text-3xl admin-title text-gold">{formatBRL(salesMonthCents)}</p>
          <p className="text-xs text-ink-soft mt-2">Neste mês corrente</p>
        </Link>
        <Link href="/admin/pedidos?status=pendentes" className={`${ADMIN_CARD} p-6 block hover:border-gold/60 transition-colors`}>
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Pedidos Pendentes</h2>
          <p className="text-3xl admin-title text-gold">{pendingCount}</p>
          <p className="text-xs text-ink-soft mt-2">Aguardando envio / pgto</p>
        </Link>
        <Link href="/admin/produtos?estoque=baixo" className={`${ADMIN_CARD} p-6 block hover:border-gold/60 transition-colors`}>
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Estoque Baixo</h2>
          <p className="text-3xl admin-title text-gold">{lowStockCount}</p>
          <p className="text-xs text-ink-soft mt-2">Produtos precisam de reposição (≤ {lowStockThreshold} un.)</p>
        </Link>
      </div>

      <div className={`${ADMIN_CARD} p-6 mt-8`}>
        <h2 className="admin-subtitle text-ink mb-4">Últimos Pedidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-ink-soft">Nenhum pedido encontrado.</td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gold-light/20 hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">
                    <Link href={`/admin/pedidos/${order.id}`} className="hover:text-gold transition-colors">
                      {order.publicCode}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-ink-soft">{order.customerName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${ORDER_STATUS_STYLES[order.status] ?? "bg-gold-light/30 text-gold-dark"}`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-soft">{formatBRL(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
