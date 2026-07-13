import { db } from "@/db";
import { orders, productVariants } from "@/db/schema";
import { eq, and, gt, desc, sql, inArray, lt } from "drizzle-orm";
import { formatBRL } from "@/lib/money";

export default async function AdminDashboardPage() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
    .where(inArray(orders.status, ["aguardando_pagamento", "aguardando_confirmacao", "separando"]));
  const pendingCount = pendingResult[0]?.count || 0;

  // 3. Estoque Baixo (menos de 5 unidades, ativo)
  const lowStockResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.isActive, true),
        lt(productVariants.stock, 5)
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
      <h1 className="text-2xl font-serif text-ink mb-2">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm">
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Vendas do Mês</h2>
          <p className="text-3xl font-serif text-gold">{formatBRL(salesMonthCents)}</p>
          <p className="text-xs text-ink-soft mt-2">Neste mês corrente</p>
        </div>
        <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm">
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Pedidos Pendentes</h2>
          <p className="text-3xl font-serif text-gold">{pendingCount}</p>
          <p className="text-xs text-ink-soft mt-2">Aguardando envio / pgto</p>
        </div>
        <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm">
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Estoque Baixo</h2>
          <p className="text-3xl font-serif text-gold">{lowStockCount}</p>
          <p className="text-xs text-ink-soft mt-2">Produtos precisam de reposição ({"<"} 5 un.)</p>
        </div>
      </div>
      
      <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm mt-8">
        <h2 className="text-lg font-serif text-ink mb-4">Últimos Pedidos</h2>
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
                  <td className="py-3 px-4 font-medium text-ink">{order.publicCode}</td>
                  <td className="py-3 px-4 text-ink-soft">{order.customerName}</td>
                  <td className="py-3 px-4">
                    <span className="bg-gold-light/30 text-gold-dark px-2 py-1 rounded text-xs uppercase tracking-wider">
                      {order.status.replace(/_/g, " ")}
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
