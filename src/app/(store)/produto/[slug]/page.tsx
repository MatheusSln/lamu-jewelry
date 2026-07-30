import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, getSettingsMap } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { effectivePriceCents, isOnPromo } from "@/lib/pricing";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { AddToCart } from "@/components/add-to-cart";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getSettingsMap(),
  ]);
  const promo = isOnPromo(product);

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

          <AddToCart
            productId={product.id}
            slug={product.slug}
            name={product.name}
            basePriceCents={effectivePriceCents(product)}
            photo={product.photos[0] ?? null}
            variants={product.variants.map((v) => ({
              id: v.id,
              label: v.label,
              stock: v.stock,
              priceDeltaCents: v.priceDeltaCents,
              isDefault: v.isDefault,
            }))}
            storeWhatsapp={settings.whatsapp_number || ""}
          />

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
