import Link from "next/link";

/**
 * Paginação simples do admin. Diferente de `src/components/pagination.tsx` (acoplada
 * a CatalogParams/buildCatalogHref da vitrine), esta recebe a querystring atual como
 * objeto livre — serve qualquer tela do admin sem depender dos filtros da loja.
 */
export function AdminPagination({
  basePath,
  searchParams,
  page,
  totalPages,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("pagina", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginação" className="flex justify-center gap-2 p-4 border-t border-gold-light/30">
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`px-3 py-1.5 text-sm border rounded ${
            p === page ? "border-gold bg-gold text-cream" : "border-gold-light/50 text-ink-soft hover:border-gold"
          }`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
