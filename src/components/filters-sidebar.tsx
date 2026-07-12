"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  const filtersContent = (
    <>
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
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button 
        className="md:hidden w-full mb-4 bg-cream-dark py-2 text-sm tracking-widest uppercase border border-gold-light/50"
        onClick={() => setOpen(true)}
      >
        Filtrar Produtos
      </button>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 bg-ink/20 z-50 md:hidden flex justify-end">
          <div className="w-4/5 max-w-sm bg-cream h-full overflow-y-auto p-6 shadow-xl animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-6">
              <span className="tracking-[0.15em] uppercase text-gold font-medium">Filtros</span>
              <button onClick={() => setOpen(false)} className="p-2 text-ink">
                ✕
              </button>
            </div>
            <div onClick={() => setOpen(false)}>
              {filtersContent}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-52 shrink-0">
        {filtersContent}
      </aside>
    </>
  );
}
