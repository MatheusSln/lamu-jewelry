type Priced = { priceCents: number; promoPriceCents: number | null };

/** Preço efetivo: promocional quando existir e for menor que o cheio. */
export function effectivePriceCents(p: Priced): number {
  return isOnPromo(p) ? p.promoPriceCents! : p.priceCents;
}

export function isOnPromo(p: Priced): boolean {
  return p.promoPriceCents != null && p.promoPriceCents < p.priceCents;
}
