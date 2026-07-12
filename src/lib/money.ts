const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos (inteiro) como moeda pt-BR. Ex.: 16990 → "R$ 169,90" */
export function formatBRL(cents: number): string {
  // Intl usa espaço não separável (U+00A0) após "R$"; normalizamos para espaço comum
  return brl.format(cents / 100).replace(/\u00A0/g, " ");
}
