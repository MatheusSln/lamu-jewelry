import Link from "next/link";
import type { CatalogParams } from "@/lib/filters";
import { buildCatalogHref, PRICE_BUCKETS } from "@/lib/filters";

type SubItem = { name: string; slug: string };

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm tracking-[0.15em] uppercase text-ink mb-2">{title}</h3>
      <ul className="space-y-1 text-sm">{children}</ul>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} className={active ? "text-gold font-medium" : "text-ink-soft hover:text-gold"}>
        {active ? "✓ " : ""}
        {children}
      </Link>
    </li>
  );
}

export function FiltersSidebar({
  base,
  params,
  subs,
}: {
  base: string;
  params: CatalogParams;
  subs: SubItem[];
}) {
  return (
    <aside className="w-full md:w-52 shrink-0">
      {subs.length > 0 && (
        <FilterGroup title="Categoria">
          <FilterLink href={buildCatalogHref(base, params, { sub: undefined })} active={!params.sub}>
            Todas
          </FilterLink>
          {subs.map((s) => (
            <FilterLink
              key={s.slug}
              href={buildCatalogHref(base, params, { sub: s.slug })}
              active={params.sub === s.slug}
            >
              {s.name}
            </FilterLink>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Material">
        <FilterLink href={buildCatalogHref(base, params, { material: undefined })} active={!params.material}>
          Todos
        </FilterLink>
        <FilterLink
          href={buildCatalogHref(base, params, { material: "semijoia" })}
          active={params.material === "semijoia"}
        >
          Semijoia
        </FilterLink>
        <FilterLink
          href={buildCatalogHref(base, params, { material: "prata925" })}
          active={params.material === "prata925"}
        >
          Prata 925
        </FilterLink>
      </FilterGroup>
      <FilterGroup title="Preço">
        <FilterLink href={buildCatalogHref(base, params, { price: undefined })} active={!params.price}>
          Todos
        </FilterLink>
        {PRICE_BUCKETS.map((b) => (
          <FilterLink
            key={b.slug}
            href={buildCatalogHref(base, params, { price: b.slug })}
            active={params.price?.slug === b.slug}
          >
            {b.label}
          </FilterLink>
        ))}
      </FilterGroup>
    </aside>
  );
}
