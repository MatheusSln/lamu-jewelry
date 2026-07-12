import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { effectivePriceCents, isOnPromo } from "@/lib/pricing";

export function ProductCard({ product }: { product: ProductRow }) {
  const [first, second] = product.photos;
  const promo = isOnPromo(product);
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block bg-card border border-gold-light/30 hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square overflow-hidden">
        {first ? (
          <>
            <Image
              src={first}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${second ? "group-hover:opacity-0" : ""}`}
            />
            {second && (
              <Image
                src={second}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-cream-dark" />
        )}
        {promo && (
          <span className="absolute top-2 left-2 bg-gold text-cream text-[10px] tracking-widest uppercase px-2 py-1">
            Promo
          </span>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm text-ink truncate">{product.name}</p>
        <div className="mt-1 text-sm">
          {promo && (
            <span className="text-ink-soft line-through mr-2">{formatBRL(product.priceCents)}</span>
          )}
          <span className="text-gold font-medium">{formatBRL(effectivePriceCents(product))}</span>
        </div>
      </div>
    </Link>
  );
}
