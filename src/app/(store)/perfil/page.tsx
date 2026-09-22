import { auth } from "@/lib/next-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { OrderFilters } from "./order-filters";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; status?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const { start, end, status } = await searchParams;

  const conditions = [eq(orders.userId, session.user.id as string)];

  if (start) {
    conditions.push(gte(orders.createdAt, new Date(start)));
  }
  if (end) {
    conditions.push(lte(orders.createdAt, new Date(end)));
  }
  if (status) {
    // @ts-expect-error valid status from query
    conditions.push(eq(orders.status, status));
  }

  const myOrders = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        {session.user.image && (
          <Image 
            src={session.user.image} 
            alt={session.user.name || "Perfil"} 
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover border border-stone-200" 
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">Olá, {session.user.name}</h1>
          <p className="text-gray-500">{session.user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">Meus Pedidos</h2>

        <OrderFilters />

        {myOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Você ainda não fez nenhum pedido ou a busca não encontrou resultados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{order.publicCode}</td>
                    <td className="px-4 py-4">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(order.totalCents / 100)}
                    </td>
                    <td className="px-4 py-4 text-right flex justify-end gap-2">
                      <Link
                        href={`/pedido/${order.publicCode}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Detalhes
                      </Link>
                      <a
                        href={`mailto:suporte@lamu.com.br?subject=Ajuda com o pedido ${order.publicCode}`}
                        className="text-red-500 hover:underline font-medium"
                      >
                        Pedir Ajuda
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
