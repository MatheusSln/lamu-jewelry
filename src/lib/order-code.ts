/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L) para código lido por humanos. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Gera código público de pedido no formato LM-XXXXX. */
export function generateOrderCode(random: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return `LM-${suffix}`;
}

/** Normaliza código digitado pela cliente: maiúsculas, aceita com ou sem "LM-". */
export function normalizeOrderCode(input: string): string {
  const clean = input.trim().toUpperCase();
  if (!clean) return "";
  return clean.startsWith("LM-") ? clean : `LM-${clean}`;
}
