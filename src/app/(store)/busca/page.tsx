import { listProducts } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/filters";
import { FiltersSidebar } from "@/components/filters-sidebar";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { SortSelect } from "@/components/sort-select";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const catalogParams = parseCatalogParams(raw);
  const q = catalogParams.q ?? "";
  const { items, total, perPage } = await listProducts({
    search: q || undefined,
    params: catalogParams,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl text-center mb-2">{q ? `Busca: “${q}”` : "Todos os produtos"}</h1>
      <p className="text-center text-sm text-ink-soft mb-8">
        {total} resultado{total === 1 ? "" : "s"}
      </p>
      <div className="flex flex-col md:flex-row gap-8">
        <FiltersSidebar base="/busca" params={catalogParams} subs={[]} />
        <div className="flex-1">
          <div className="flex justify-end mb-4">
            <SortSelect />
          </div>
          <ProductGrid products={items} />
          <Pagination base="/busca" params={catalogParams} total={total} perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
