import Link from "next/link";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { sql } from "drizzle-orm";
import Image from "next/image";
import { DeleteProductButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage() {
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceCents: products.priceCents,
      isActive: products.isActive,
      photo: sql<string>`${products.photos}->>0`,
      totalStock: sql<number>`COALESCE(sum(${productVariants.stock}), 0)::int`,
    })
    .from(products)
    .leftJoin(productVariants, sql`${products.id} = ${productVariants.productId}`)
    .groupBy(products.id)
    .orderBy(products.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-serif text-ink">Produtos</h1>
        <Link href="/admin/produtos/novo" className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors inline-block text-center">
          + Novo Produto
        </Link>
      </div>

      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gold-light/30 flex gap-4">
          <input 
            type="search" 
            placeholder="Buscar produtos..." 
            className="flex-1 max-w-sm bg-transparent border border-gold-light/50 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4 w-16">Foto</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Preço</th>
                <th className="py-3 px-4">Estoque</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink-soft">Nenhum produto cadastrado.</td>
                </tr>
              ) : allProducts.map((p) => (
                <tr key={p.id} className="border-b border-gold-light/20 hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4">
                    {p.photo ? (
                      <div className="w-10 h-10 relative bg-cream-dark rounded overflow-hidden">
                        <Image src={p.photo} alt={p.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-cream-dark rounded"></div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-soft">Slug: {p.slug}</p>
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {formatBRL(p.priceCents)}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {p.totalStock} un.
                  </td>
                  <td className="py-3 px-4">
                    {p.isActive ? (
                       <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Ativo</span>
                    ) : (
                       <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Inativo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/produtos/${p.id}/editar`} className="text-gold hover:text-gold-dark text-sm tracking-wide">Editar</Link>
                    <DeleteProductButton id={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gold-light/30 flex justify-between items-center text-sm text-ink-soft">
          <span>Mostrando {allProducts.length} produtos</span>
        </div>
      </div>
    </div>
  );
}
