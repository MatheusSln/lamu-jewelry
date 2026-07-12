import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { effectivePriceCents, isOnPromo } from "@/lib/pricing";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  const promo = isOnPromo(product);
  const visibleVariants = product.variants.filter((v) => !v.isDefault);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <ProductGallery photos={product.photos} alt={product.name} />
        <div>
          <h1 className="text-4xl">{product.name}</h1>
          <p className="text-xs tracking-[0.15em] uppercase text-ink-soft mt-1">
            {product.material === "prata925" ? "Prata 925" : "Semijoia"}
          </p>
          <div className="mt-4 text-2xl">
            {promo && (
              <span className="text-ink-soft line-through text-lg mr-3">
                {formatBRL(product.priceCents)}
              </span>
            )}
            <span className="text-gold font-medium">{formatBRL(effectivePriceCents(product))}</span>
          </div>

          {visibleVariants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm tracking-[0.15em] uppercase mb-2">Opções</p>
              <div className="flex flex-wrap gap-2">
                {visibleVariants.map((v) => (
                  <span
                    key={v.id}
                    className={`px-4 py-2 text-sm border ${
                      v.stock > 0
                        ? "border-gold-light text-ink"
                        : "border-gold-light/30 text-ink-soft line-through"
                    }`}
                  >
                    {v.label}
                    {v.stock === 0 && " (esgotado)"}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            disabled
            className="mt-8 w-full bg-gold/50 text-cream py-3 text-sm tracking-[0.2em] uppercase cursor-not-allowed"
            title="Carrinho disponível em breve"
          >
            {totalStock > 0 ? "Adicionar ao carrinho (em breve)" : "Esgotado"}
          </button>

          {product.description && (
            <div className="mt-8 border-t border-gold-light/30 pt-6 text-sm text-ink-soft whitespace-pre-line">
              {product.description}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading>Você também vai gostar</SectionHeading>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
