"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";

export type CartItem = {
  /** Variação é a unidade de estoque — chave do item no carrinho */
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantLabel: string;
  unitPriceCents: number;
  photo: string | null;
  quantity: number;
  /** Estoque no momento em que foi adicionado (limite da UI; o servidor revalida) */
  maxStock: number;
};

type PersistedCart = {
  items: CartItem[];
  couponCode: string;
  /** false apenas no snapshot de servidor/hidratação */
  hydrated: boolean;
};

const STORAGE_KEY = "lamu_cart_v1";
const SERVER_SNAPSHOT: PersistedCart = { items: [], couponCode: "", hydrated: false };

// Store externo (module-level) sincronizado com localStorage via useSyncExternalStore —
// evita setState em effect e o mismatch de hidratação.
let state: PersistedCart = SERVER_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();

function getSnapshot(): PersistedCart {
  if (!initialized) {
    initialized = true;
    let items: CartItem[] = [];
    let couponCode = "";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.items)) items = parsed.items;
        if (typeof parsed.couponCode === "string") couponCode = parsed.couponCode;
      }
    } catch {
      // carrinho corrompido: começa vazio
    }
    state = { items, couponCode, hydrated: true };
  }
  return state;
}

function getServerSnapshot(): PersistedCart {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(partial: Partial<Pick<PersistedCart, "items" | "couponCode">>) {
  state = { ...getSnapshot(), ...partial, hydrated: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items, couponCode: state.couponCode }));
  } catch {
    // storage indisponível: carrinho vive só na sessão
  }
  listeners.forEach((l) => l());
}

type CartState = PersistedCart & {
  drawerOpen: boolean;
  subtotalCents: number;
  count: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (variantId: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  setCouponCode: (code: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const value = useMemo<CartState>(() => {
    const { items } = persisted;
    return {
      ...persisted,
      drawerOpen,
      subtotalCents: items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
      count: items.reduce((s, i) => s + i.quantity, 0),
      addItem: (item, quantity) => {
        const current = getSnapshot().items;
        const existing = current.find((i) => i.variantId === item.variantId);
        const next = existing
          ? current.map((i) =>
              i.variantId === item.variantId
                ? { ...i, ...item, quantity: Math.min(existing.quantity + quantity, item.maxStock) }
                : i,
            )
          : [...current, { ...item, quantity: Math.min(quantity, item.maxStock) }];
        update({ items: next });
        setDrawerOpen(true);
      },
      removeItem: (variantId) =>
        update({ items: getSnapshot().items.filter((i) => i.variantId !== variantId) }),
      setQuantity: (variantId, quantity) =>
        update({
          items: getSnapshot().items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i,
          ),
        }),
      setCouponCode: (code) => update({ couponCode: code }),
      clear: () => update({ items: [], couponCode: "" }),
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [persisted, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
