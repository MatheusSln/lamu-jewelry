import Image from "next/image";
import Link from "next/link";
import type { NavCategory } from "@/lib/catalog";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader({ nav }: { nav: NavCategory[] }) {
  return (
    <header className="bg-cream border-b border-gold-light/40 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center gap-3">
          <MobileMenu nav={nav} />
          <form action="/busca" className="hidden md:block w-full max-w-55">
            <input
              type="search"
              name="q"
              placeholder="Buscar..."
              className="w-full bg-card border border-gold-light/50 rounded-full px-4 py-1.5 text-sm placeholder:text-ink-soft focus:outline-none focus:border-gold"
            />
          </form>
        </div>
        <Link href="/" className="justify-self-center" aria-label="Lámu — página inicial">
          <Image src="/brand/logo.jpeg" alt="Lámu" width={72} height={72} className="rounded-full" priority />
        </Link>
        <div className="justify-self-end flex items-center gap-4">
          <span className="hidden md:inline text-xs text-ink-soft tracking-wide uppercase">Carrinho em breve</span>
        </div>
      </div>
      <nav className="hidden md:block border-t border-gold-light/30">
        <ul className="mx-auto max-w-6xl flex justify-center gap-7 text-[12px] tracking-[0.15em] uppercase">
          {nav.map((cat) => (
            <li key={cat.slug} className="relative group">
              <Link href={`/${cat.slug}`} className="block py-3 hover:text-gold transition-colors">
                {cat.name}
              </Link>
              {cat.children.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block bg-card border border-gold-light/40 shadow-lg min-w-44 z-50">
                  <ul className="py-2">
                    {cat.children.map((sub) => (
                      <li key={sub.slug}>
                        <Link
                          href={`/${cat.slug}?sub=${sub.slug}`}
                          className="block px-4 py-2 normal-case tracking-normal text-sm hover:bg-cream-dark hover:text-gold"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <form action="/busca" className="md:hidden px-4 pb-3">
        <input
          type="search"
          name="q"
          placeholder="Buscar..."
          className="w-full bg-card border border-gold-light/50 rounded-full px-4 py-1.5 text-sm placeholder:text-ink-soft focus:outline-none focus:border-gold"
        />
      </form>
    </header>
  );
}
