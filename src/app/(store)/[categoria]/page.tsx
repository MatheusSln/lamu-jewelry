import { notFound } from "next/navigation";
import { getCategoryBySlug, getNavTree, listProducts } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/filters";
import { FiltersSidebar } from "@/components/filters-sidebar";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { SortSelect } from "@/components/sort-select";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category || category.parentId != null) notFound();

  const catalogParams = parseCatalogParams(await searchParams);
  const nav = await getNavTree();
  const subs = nav.find((n) => n.id === category.id)?.children ?? [];

  // Filtro de subcategoria restringe à filha; senão, pai + todas as filhas
  const subSelected = catalogParams.sub ? subs.find((s) => s.slug === catalogParams.sub) : undefined;
  const categoryIds = subSelected ? [subSelected.id] : [category.id, ...subs.map((s) => s.id)];

  const { items, total, perPage } = await listProducts({ categoryIds, params: catalogParams });
  const base = `/${category.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl text-center mb-8">{category.name}</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <FiltersSidebar base={base} params={catalogParams} subs={subs} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ink-soft">
              {total} produto{total === 1 ? "" : "s"}
            </p>
            <SortSelect />
          </div>
          <ProductGrid products={items} />
          <Pagination base={base} params={catalogParams} total={total} perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
