"use client";

import { useMemo, useState } from "react";
import { useCart } from "./cart/cart-context";
import { formatBRL } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";

export type BuyableVariant = {
  id: number;
  label: string;
  stock: number;
  priceDeltaCents: number;
  isDefault: boolean;
};

export function AddToCart({
  productId,
  slug,
  name,
  basePriceCents,
  photo,
  variants,
  storeWhatsapp,
}: {
  productId: number;
  slug: string;
  name: string;
  /** Preço efetivo do produto (promo quando houver), sem delta de variação */
  basePriceCents: number;
  photo: string | null;
  variants: BuyableVariant[];
  storeWhatsapp: string;
}) {
  const cart = useCart();
  const visible = variants.filter((v) => !v.isDefault || v.label !== "");
  const hasOptions = visible.length > 0;

  const initial = hasOptions
    ? (visible.find((v) => v.stock > 0)?.id ?? null)
    : (variants[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<number | null>(initial);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? null,
    [variants, selectedId],
  );

  const unitPriceCents = basePriceCents + (selected?.priceDeltaCents ?? 0);
  const maxStock = selected?.stock ?? 0;
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = totalStock === 0;

  function handleAdd() {
    if (!selected || selected.stock === 0) {
      setFeedback("Escolha uma opção disponível.");
      return;
    }
    cart.addItem(
      {
        variantId: selected.id,
        productId,
        slug,
        name,
        variantLabel: selected.isDefault && selected.label === "" ? "" : selected.label,
        unitPriceCents,
        photo,
        maxStock: selected.stock,
      },
      quantity,
    );
    setFeedback(null);
  }

  const waMessage =
    `Olá! Tenho interesse em:\n\n• ${quantity}x ${name}` +
    (selected && selected.label ? ` (${selected.label})` : "") +
    ` — ${formatBRL(unitPriceCents * quantity)}`;
  const waUrl = waLink(storeWhatsapp, waMessage);

  return (
    <div className="mt-6">
      {hasOptions && (
        <div>
          <p className="text-sm tracking-[0.15em] uppercase mb-2">Opções</p>
          <div className="flex flex-wrap gap-2">
            {visible.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { setSelectedId(v.id); setQuantity(1); setFeedback(null); }}
                disabled={v.stock === 0}
                className={`px-4 py-2 text-sm border transition-colors ${
                  v.stock === 0
                    ? "border-gold-light/30 text-ink-soft line-through cursor-not-allowed"
                    : selectedId === v.id
                      ? "border-gold bg-gold text-cream"
                      : "border-gold-light text-ink hover:border-gold"
                }`}
              >
                {v.label}
                {v.stock === 0 && " (esgotado)"}
              </button>
            ))}
          </div>
          {selected && selected.priceDeltaCents !== 0 && (
            <p className="text-xs text-ink-soft mt-2">
              Preço desta opção: <span className="text-gold">{formatBRL(unitPriceCents)}</span>
            </p>
          )}
        </div>
      )}

      {!soldOut && (
        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm tracking-[0.15em] uppercase text-ink-soft">Quantidade</span>
          <div className="flex items-center border border-gold-light/50 rounded">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3 py-1.5 text-ink hover:text-gold disabled:opacity-30"
              aria-label="Diminuir quantidade"
            >−</button>
            <span className="px-3 text-sm min-w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
              disabled={quantity >= maxStock}
              className="px-3 py-1.5 text-ink hover:text-gold disabled:opacity-30"
              aria-label="Aumentar quantidade"
            >+</button>
          </div>
          {maxStock > 0 && maxStock <= 3 && (
            <span className="text-xs text-gold">Últimas {maxStock === 1 ? "unidade" : `${maxStock} unidades`}!</span>
          )}
        </div>
      )}

      {feedback && <p className="text-sm text-red-600 mt-3">{feedback}</p>}

      <button
        type="button"
        onClick={handleAdd}
        disabled={soldOut || !selected || selected.stock === 0}
        className="mt-6 w-full bg-gold hover:bg-gold-dark text-cream py-3 text-sm tracking-[0.2em] uppercase transition-colors disabled:bg-gold/50 disabled:cursor-not-allowed"
      >
        {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
      </button>
      {waUrl && !soldOut && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full border border-gold text-gold hover:bg-gold hover:text-cream text-center py-3 text-sm tracking-[0.15em] uppercase transition-colors"
        >
          Comprar pelo WhatsApp
        </a>
      )}
    </div>
  );
}
