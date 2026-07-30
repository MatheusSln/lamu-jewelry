import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ProductForm } from "../form";
import { ADMIN_CARD } from "../../ui";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/produtos" className="text-ink-soft hover:text-gold transition-colors">
          &larr; Voltar
        </Link>
        <h1 className="admin-title text-ink">Novo Produto</h1>
      </div>

      <div className={`${ADMIN_CARD} p-6`}>
        <ProductForm categories={allCategories} />
      </div>
    </div>
  );
}
