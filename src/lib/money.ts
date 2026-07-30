const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos (inteiro) como moeda pt-BR. Ex.: 16990 → "R$ 169,90" */
export function formatBRL(cents: number): string {
  // Intl usa espaço não separável (U+00A0) após "R$"; normalizamos para espaço comum
  return brl.format(cents / 100).replace(/\u00A0/g, " ");
}

/**
 * Centavos (armazenados como string, ex.: em `settings`) para texto editavel em reais.
 * Ex.: "19900" para "199,00"; "" para "".
 */
export function centsToInputText(cents: string | number): string {
  const str = String(cents).trim();
  if (str === "") return "";
  const n = parseInt(str, 10);
  if (!Number.isFinite(n)) return "";
  return (n / 100).toFixed(2).replace(".", ",");
}

/**
 * Texto digitado em reais para centavos inteiros (ou null se vazio/invalido).
 * Aceita separador de milhar "." e decimal "," ou so decimal.
 * Ex.: "199" para 19900; "199,5" para 19950; "1.299,90" para 129990; "" para null.
 *
 * Negativo so e aceito com allowNegative (usado na diferenca de preco de
 * variacao, que pode baixar o preco: "-10,00" para -1000).
 */
export function inputTextToCents(
  text: string,
  opts: { allowNegative?: boolean } = {},
): number | null {
  const trimmed = text.trim();
  const negative = trimmed.startsWith("-");
  if (negative && !opts.allowNegative) return null;

  const cleaned = trimmed.replace(/[^\d,.]/g, "");
  if (cleaned === "") return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalPos = Math.max(lastComma, lastDot);

  let normalized: string;
  if (decimalPos === -1) {
    normalized = cleaned;
  } else {
    const intPart = cleaned.slice(0, decimalPos).replace(/[,.]/g, "");
    const fracPart = cleaned.slice(decimalPos + 1).replace(/[,.]/g, "");
    normalized = `${intPart}.${fracPart}`;
  }

  const reais = Number(normalized);
  if (!Number.isFinite(reais) || reais < 0) return null;
  const cents = Math.round(reais * 100);
  return negative ? -cents : cents;
}
