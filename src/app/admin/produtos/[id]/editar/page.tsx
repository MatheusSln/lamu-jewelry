import { db } from "@/db";
import { categories, products, productVariants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ProductForm, type ProductInitialData } from "../../form";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  
  if (isNaN(id)) {
    notFound();
  }

  const [product] = await db.select().from(products).where(eq(products.id, id));
  
  if (!product) {
    notFound();
  }

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.id));

  const allCategories = await db.select().from(categories).orderBy(asc(categories.name));

  const initialData: ProductInitialData = {
    id: product.id,
    name: product.name,
    priceCents: product.priceCents,
    promoPriceCents: product.promoPriceCents,
    categoryId: product.categoryId,
    material: product.material,
    description: product.description,
    isActive: product.isActive,
    isLaunch: product.isLaunch,
    isBestseller: product.isBestseller,
    photos: product.photos || [],
    variants: variants.map(v => ({
      id: v.id,
      label: v.label,
      stock: v.stock,
      priceDeltaCents: v.priceDeltaCents,
      isDefault: v.isDefault,
    })),
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/admin/produtos" className="text-gold hover:underline text-sm tracking-widest uppercase mb-2 block">
            &larr; Voltar
          </Link>
          <h1 className="text-2xl font-serif text-ink">Editar Produto</h1>
        </div>
      </div>
      
      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm p-6">
        <ProductForm categories={allCategories} initialData={initialData} />
      </div>
    </div>
  );
}
