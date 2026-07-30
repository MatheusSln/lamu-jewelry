import Link from "next/link";
import { db } from "@/db";
import { categories, products, productVariants } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { getSettingsMap } from "@/lib/catalog";
import { getLowStockThreshold } from "@/lib/stock";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import Image from "next/image";
import { DeleteProductButton } from "./delete-button";
import { ADMIN_BTN_PRIMARY, ADMIN_CARD, ADMIN_INPUT, ADMIN_LINK, ADMIN_PILL_ACTIVE, ADMIN_PILL_INACTIVE } from "../ui";
import { AdminPagination } from "../pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estoque?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const categoriaId = sp.categoria ? parseInt(sp.categoria, 10) : undefined;
  const lowStockOnly = sp.estoque === "baixo";
  const pageRequested = Math.max(1, parseInt(sp.pagina ?? "1", 10) || 1);

  const [settingsMap, allCategories] = await Promise.all([
    getSettingsMap(),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  const threshold = getLowStockThreshold(settingsMap);

  const conds: SQL[] = [];
  if (q) conds.push(or(ilike(products.name, `%${q}%`), ilike(products.slug, `%${q}%`))!);
  if (Number.isInteger(categoriaId)) conds.push(eq(products.categoryId, categoriaId!));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = await db
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
    .where(where)
    .groupBy(products.id)
    .orderBy(products.id);

  // O filtro de estoque baixo é sobre a soma das variações (agregado), então é
  // aplicado em memória — o catálogo é pequeno o bastante para isso ser trivial.
  // Se crescer para centenas de produtos, mover para HAVING no SQL.
  const filtered = lowStockOnly ? rows.filter((p) => p.totalStock <= threshold) : rows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pageRequested, totalPages);
  const pageProducts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilter = Boolean(q || categoriaId || lowStockOnly);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="admin-title text-ink">Produtos</h1>
        <Link href="/admin/produtos/novo" className={ADMIN_BTN_PRIMARY}>
          + Novo Produto
        </Link>
      </div>

      <div className={ADMIN_CARD}>
        <form method="get" className="p-4 border-b border-gold-light/30 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <label htmlFor="prod-q" className="block text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-1">
              Buscar
            </label>
            <input id="prod-q" type="text" name="q" defaultValue={q} placeholder="Nome do produto..." className={ADMIN_INPUT} />
          </div>
          <div className="min-w-[180px]">
            <label htmlFor="prod-categoria" className="block text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-1">
              Categoria
            </label>
            <select id="prod-categoria" name="categoria" defaultValue={categoriaId ?? ""} className={ADMIN_INPUT}>
              <option value="">Todas</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer pb-2.5">
            <input type="checkbox" name="estoque" value="baixo" defaultChecked={lowStockOnly} className="accent-gold w-4 h-4" />
            Só estoque baixo
          </label>
          <button type="submit" className={ADMIN_BTN_PRIMARY}>Filtrar</button>
          {hasFilter && (
            <Link href="/admin/produtos" className={ADMIN_LINK}>Limpar</Link>
          )}
        </form>

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
              {pageProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink-soft">
                    Nenhum produto encontrado{hasFilter ? " com esses filtros." : "."}
                  </td>
                </tr>
              ) : pageProducts.map((p) => (
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
                       <span className={ADMIN_PILL_ACTIVE}>Ativo</span>
                    ) : (
                       <span className={ADMIN_PILL_INACTIVE}>Inativo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Link href={`/admin/produtos/${p.id}/editar`} className={ADMIN_LINK}>Editar</Link>
                    <DeleteProductButton id={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gold-light/30 flex justify-between items-center text-sm text-ink-soft">
          <span>
            {filtered.length === 0
              ? "Nenhum produto"
              : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} de ${filtered.length} produtos`}
          </span>
        </div>
        <AdminPagination
          basePath="/admin/produtos"
          searchParams={{ q: q || undefined, categoria: sp.categoria, estoque: sp.estoque }}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
