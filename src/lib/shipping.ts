export type ShippingOption = { name: string; cents: number };

export type ShippingSettings = {
  /** Vazio ou ausente desativa frete grátis */
  free_shipping_threshold_cents?: string;
  fallback_shipping_cents?: string;
};

function parseCents(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/**
 * Opções de frete a partir das settings do admin.
 * Sem integração de cotação por CEP (SuperFrete) por enquanto: frete grátis
 * acima do limiar, senão o frete padrão configurado.
 */
export function getShippingOptions(subtotalCents: number, settings: ShippingSettings): ShippingOption[] {
  const threshold = parseCents(settings.free_shipping_threshold_cents);
  if (threshold !== null && subtotalCents >= threshold) {
    return [{ name: "Frete grátis", cents: 0 }];
  }
  const fallback = parseCents(settings.fallback_shipping_cents) ?? 0;
  return [{ name: "Entrega padrão", cents: fallback }];
}

/** Quanto falta para o frete grátis; null quando desativado ou já atingido. */
export function remainingForFreeShipping(subtotalCents: number, settings: ShippingSettings): number | null {
  const threshold = parseCents(settings.free_shipping_threshold_cents);
  if (threshold === null || threshold === 0) return null;
  return subtotalCents >= threshold ? null : threshold - subtotalCents;
}
