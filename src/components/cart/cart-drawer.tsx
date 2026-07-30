"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-context";
import { formatBRL } from "@/lib/money";
import { FreeShippingBar } from "./free-shipping-bar";

export function CartDrawer({ freeShippingThresholdCents }: { freeShippingThresholdCents: number }) {
  const cart = useCart();

  return (
    <>
      {cart.drawerOpen && (
        <div className="fixed inset-0 bg-ink/30 z-50" onClick={cart.closeDrawer} aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-cream z-50 shadow-xl transform transition-transform flex flex-col ${
          cart.drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrinho de compras"
      >
        <div className="p-4 border-b border-gold-light/40 flex justify-between items-center">
          <h2 className="text-lg tracking-[0.15em] uppercase text-ink">Seu Carrinho</h2>
          <button onClick={cart.closeDrawer} className="text-ink p-2 hover:text-gold" aria-label="Fechar carrinho">✕</button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-ink-soft">Seu carrinho está vazio.</p>
            <button onClick={cart.closeDrawer} className="text-gold hover:underline text-sm tracking-widest uppercase">
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.items.map((item) => (
                <div key={item.variantId} className="flex gap-3 border-b border-gold-light/20 pb-4">
                  <Link href={`/produto/${item.slug}`} onClick={cart.closeDrawer} className="w-20 h-20 bg-cream-dark relative flex-shrink-0 overflow-hidden">
                    {item.photo && <Image src={item.photo} alt={item.name} fill className="object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/produto/${item.slug}`} onClick={cart.closeDrawer} className="text-sm text-ink hover:text-gold block truncate">
                      {item.name}
                    </Link>
                    {item.variantLabel && <p className="text-xs text-ink-soft">{item.variantLabel}</p>}
                    <p className="text-sm text-gold mt-1">{formatBRL(item.unitPriceCents)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gold-light/50 rounded">
                        <button
                          onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)}
                          className="px-2.5 py-1 text-ink hover:text-gold disabled:opacity-30"
                          disabled={item.quantity <= 1}
                          aria-label="Diminuir quantidade"
                        >−</button>
                        <span className="px-2 text-sm text-ink min-w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)}
                          className="px-2.5 py-1 text-ink hover:text-gold disabled:opacity-30"
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Aumentar quantidade"
                        >+</button>
                      </div>
                      <button
                        onClick={() => cart.removeItem(item.variantId)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gold-light/40 space-y-4 bg-cream">
              <FreeShippingBar subtotalCents={cart.subtotalCents} thresholdCents={freeShippingThresholdCents} />
              <div className="flex justify-between text-ink">
                <span className="text-sm tracking-widest uppercase">Subtotal</span>
                <span className="font-medium">{formatBRL(cart.subtotalCents)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={cart.closeDrawer}
                className="block w-full bg-gold hover:bg-gold-dark text-cream text-center py-3 text-sm tracking-[0.2em] uppercase transition-colors"
              >
                Finalizar Compra
              </Link>
              <Link
                href="/carrinho"
                onClick={cart.closeDrawer}
                className="block w-full text-center text-sm text-gold hover:underline tracking-widest uppercase"
              >
                Ver carrinho completo
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
