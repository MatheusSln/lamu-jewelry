import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ProductForm } from "../form";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/produtos" className="text-ink-soft hover:text-gold transition-colors">
          &larr; Voltar
        </Link>
        <h1 className="text-2xl font-serif text-ink">Novo Produto</h1>
      </div>
      
      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm p-6">
        <ProductForm categories={allCategories} />
      </div>
    </div>
  );
}
