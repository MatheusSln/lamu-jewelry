"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavCategory } from "@/lib/catalog";

export function MobileMenu({ nav }: { nav: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen(!open)}
        className="p-1 text-ink"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="fixed inset-x-0 top-32 bottom-0 bg-cream z-50 overflow-y-auto px-6 py-4">
          <ul className="space-y-1">
            {nav.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm tracking-[0.15em] uppercase border-b border-gold-light/30"
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <ul className="pl-4 py-1">
                    {cat.children.map((sub) => (
                      <li key={sub.slug}>
                        <Link
                          href={`/${cat.slug}?sub=${sub.slug}`}
                          onClick={() => setOpen(false)}
                          className="block py-1.5 text-sm text-ink-soft"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
