"use client";

import { useState } from "react";

export function CopyOrderLinkButton({ orderCode }: { orderCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // Fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark border border-gold/40 hover:border-gold px-3.5 py-1.5 rounded transition-colors uppercase tracking-widest"
    >
      <span>{copied ? "✓ Link Copiado!" : "📋 Salvar Link do Pedido"}</span>
    </button>
  );
}
