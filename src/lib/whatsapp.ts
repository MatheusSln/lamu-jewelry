/**
 * Normaliza um número de WhatsApp brasileiro para o formato do wa.me:
 * só dígitos, com DDI 55 (adicionado se não estiver presente).
 */
export function normalizeWhatsappNumber(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  // 10-11 dígitos = DDD + número local, sem DDI
  if (digits.length <= 11 && !digits.startsWith("55")) return `55${digits}`;
  // 12-13 dígitos começando com 55 = já tem DDI
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

/** Monta link wa.me com mensagem pré-preenchida. Retorna "" se não houver número. */
export function waLink(rawNumber: string, message?: string): string {
  const number = normalizeWhatsappNumber(rawNumber);
  if (!number) return "";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}
