import { db } from "@/db";
import { coupons } from "@/db/schema";
import { desc } from "drizzle-orm";
import { formatBRL } from "@/lib/money";

export default async function AdminCuponsPage() {
  const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-ink">Cupons</h1>
        <button className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors">
          + Novo Cupom
        </button>
      </div>
      
      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Usos</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {allCoupons.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-ink-soft">Nenhum cupom encontrado.</td></tr>
              ) : allCoupons.map(c => (
                <tr key={c.id} className="border-b border-gold-light/20 hover:bg-cream/50">
                  <td className="py-3 px-4 font-medium">{c.code}</td>
                  <td className="py-3 px-4 text-ink-soft">{c.type === "percent" ? "Porcentagem" : "Fixo"}</td>
                  <td className="py-3 px-4 text-ink-soft">
                    {c.type === "percent" ? `${c.value}%` : formatBRL(c.value)}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : ""}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {c.expiresAt ? c.expiresAt.toLocaleDateString("pt-BR") : "Sem validade"}
                  </td>
                  <td className="py-3 px-4">
                    {c.isActive ? (
                       <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Ativo</span>
                    ) : (
                       <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Inativo</span>
                    )}
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
