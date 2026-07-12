import Image from "next/image";
import Link from "next/link";
import { getActiveBanners, getHomeVitrines } from "@/lib/catalog";
import { PRICE_BUCKETS } from "@/lib/filters";
import { BannerCarousel } from "@/components/banner-carousel";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [bannersList, vitrines] = await Promise.all([getActiveBanners(), getHomeVitrines()]);
  return (
    <div className="pb-8">
      {bannersList.length > 0 ? (
        <BannerCarousel banners={bannersList} />
      ) : (
        <section className="bg-cream-dark">
          <div className="mx-auto max-w-6xl px-4 py-16 flex flex-col items-center text-center gap-4">
            <Image
              src="/brand/logo.jpeg"
              alt="Lámu"
              width={160}
              height={160}
              className="rounded-full"
              priority
            />
            <h1 className="text-4xl text-ink">Semijoias e Prata 925</h1>
            <p className="text-ink-soft max-w-md">Peças delicadas para todos os momentos.</p>
            <Link
              href="/conjuntos"
              className="mt-2 bg-gold hover:bg-gold-dark text-cream px-8 py-2.5 text-sm tracking-[0.15em] uppercase transition-colors"
            >
              Ver coleção
            </Link>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4">
        {vitrines.launches.length > 0 && (
          <section>
            <SectionHeading>Lançamentos</SectionHeading>
            <ProductGrid products={vitrines.launches.slice(0, 4)} />
          </section>
        )}

        <section>
          <SectionHeading>Presentes por preço</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRICE_BUCKETS.map((b) => (
              <Link
                key={b.slug}
                href={`/busca?preco=${b.slug}`}
                className="bg-cream-dark border border-gold-light/40 text-center py-8 hover:border-gold transition-colors"
              >
                <span
                  className="block text-2xl text-gold"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  {b.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {vitrines.bestsellers.length > 0 && (
          <section>
            <SectionHeading>Mais Vendidos</SectionHeading>
            <ProductGrid products={vitrines.bestsellers.slice(0, 4)} />
          </section>
        )}

        {vitrines.promos.length > 0 && (
          <section>
            <SectionHeading>Promoções</SectionHeading>
            <ProductGrid products={vitrines.promos.slice(0, 4)} />
          </section>
        )}
      </div>
    </div>
  );
}
