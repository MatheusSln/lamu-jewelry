"use client";

import { formatBRL } from "@/lib/money";

/** Barra de progresso para o frete grátis. thresholdCents <= 0 desativa. */
export function FreeShippingBar({ subtotalCents, thresholdCents }: { subtotalCents: number; thresholdCents: number }) {
  if (thresholdCents <= 0) return null;
  const reached = subtotalCents >= thresholdCents;
  const pct = Math.min(100, Math.round((subtotalCents / thresholdCents) * 100));
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink-soft">
        {reached ? (
          <span className="text-gold font-medium">Você ganhou frete grátis! 🎉</span>
        ) : (
          <>Faltam <span className="text-gold font-medium">{formatBRL(thresholdCents - subtotalCents)}</span> para o frete grátis</>
        )}
      </p>
      <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
