"use client";

import { useCart } from "./cart-context";

export function CartButton() {
  const cart = useCart();
  return (
    <button
      onClick={cart.openDrawer}
      className="relative p-2 text-ink hover:text-gold transition-colors"
      aria-label={`Abrir carrinho (${cart.count} itens)`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {cart.hydrated && cart.count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gold text-cream text-[10px] rounded-full min-w-4.5 h-4.5 px-1 flex items-center justify-center">
          {cart.count}
        </span>
      )}
    </button>
  );
}
