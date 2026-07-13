import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-ink">Pedidos</h1>
      
      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
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
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-ink-soft">Nenhum pedido encontrado.</td></tr>
              ) : allOrders.map(order => (
                <tr key={order.id} className="border-b border-gold-light/20 hover:bg-cream/50">
                  <td className="py-3 px-4 font-medium">{order.publicCode}</td>
                  <td className="py-3 px-4">{order.customerName}</td>
                  <td className="py-3 px-4 text-ink-soft">{order.customerWhatsapp}</td>
                  <td className="py-3 px-4 text-ink-soft">{order.createdAt.toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-ink-soft">{formatBRL(order.totalCents)}</td>
                  <td className="py-3 px-4">
                    <span className="bg-gold-light/30 text-gold-dark px-2 py-1 rounded text-xs uppercase tracking-wider">
                      {order.status.replace(/_/g, " ")}
                    </span>
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
