import type { ProductRow } from "@/lib/catalog";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return <p className="text-center text-ink-soft py-12">Nenhum produto encontrado.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
