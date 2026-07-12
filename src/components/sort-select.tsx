"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/filters";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("ordem") ?? "lancamentos";

  function onChange(value: string) {
    const q = new URLSearchParams(searchParams.toString());
    if (value === "lancamentos") q.delete("ordem");
    else q.set("ordem", value);
    q.delete("pagina");
    router.push(`${pathname}${q.size ? `?${q}` : ""}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Ordenar por"
      className="bg-card border border-gold-light/50 text-sm px-3 py-1.5 focus:outline-none focus:border-gold"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.slug} value={o.slug}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
