import Link from "next/link";
import type { CatalogParams } from "@/lib/filters";
import { buildCatalogHref } from "@/lib/filters";

export function Pagination({
  base,
  params,
  total,
  perPage,
}: {
  base: string;
  params: CatalogParams;
  total: number;
  perPage: number;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginação" className="flex justify-center gap-2 mt-8">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={buildCatalogHref(base, params, { page: n })}
          className={`px-3 py-1.5 text-sm border ${
            n === params.page
              ? "border-gold bg-gold text-cream"
              : "border-gold-light/50 text-ink-soft hover:border-gold"
          }`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
