"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { FreeShippingBar } from "@/components/cart/free-shipping-bar";
import { formatBRL } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";
import { validateCouponAction } from "../checkout/actions";

export function CartPageClient({
  freeShippingThresholdCents,
  fallbackShippingCents,
  storeWhatsapp,
}: {
  freeShippingThresholdCents: number;
  fallbackShippingCents: number;
  storeWhatsapp: string;
}) {
  const cart = useCart();
  const [couponInput, setCouponInput] = useState(cart.couponCode);
  const [couponMsg, setCouponMsg] = useState<{ type: "ok" | "erro"; text: string } | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [checking, setChecking] = useState(false);

  // Revalida cupom já aplicado quando o subtotal muda
  useEffect(() => {
    let cancelled = false;
    if (!cart.hydrated || !cart.couponCode || cart.subtotalCents === 0) return;
    validateCouponAction(cart.couponCode, cart.subtotalCents).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setDiscountCents(res.discountCents);
        setCouponMsg({ type: "ok", text: `Cupom ${res.code} aplicado: -${formatBRL(res.discountCents)}` });
      } else {
        setDiscountCents(0);
        setCouponMsg({ type: "erro", text: res.error });
        cart.setCouponCode("");
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.hydrated, cart.couponCode, cart.subtotalCents]);

  async function handleApplyCoupon() {
    setChecking(true);
    setCouponMsg(null);
    try {
      const res = await validateCouponAction(couponInput, cart.subtotalCents);
      if (res.ok) {
        cart.setCouponCode(res.code);
        setDiscountCents(res.discountCents);
        setCouponMsg({ type: "ok", text: `Cupom ${res.code} aplicado: -${formatBRL(res.discountCents)}` });
      } else {
        cart.setCouponCode("");
        setDiscountCents(0);
        setCouponMsg({ type: "erro", text: res.error });
      }
    } catch {
      setCouponMsg({ type: "erro", text: "Não foi possível validar o cupom. Tente de novo." });
    } finally {
      setChecking(false);
    }
  }

  // Desconto só vale com cupom aplicado, nunca acima do subtotal
  const appliedDiscountCents = cart.couponCode ? Math.min(discountCents, cart.subtotalCents) : 0;
  const shippingCents =
    freeShippingThresholdCents > 0 && cart.subtotalCents >= freeShippingThresholdCents
      ? 0
      : fallbackShippingCents;
  const totalCents = cart.subtotalCents - appliedDiscountCents + (cart.items.length > 0 ? shippingCents : 0);

  const waMessage =
    `Olá! Quero fechar este pedido:\n\n` +
    cart.items.map((i) => `• ${i.quantity}x ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""} — ${formatBRL(i.unitPriceCents * i.quantity)}`).join("\n") +
    `\n\nSubtotal: ${formatBRL(cart.subtotalCents)}`;
  const waUrl = waLink(storeWhatsapp, waMessage);

  if (cart.hydrated && cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl text-ink">Seu carrinho está vazio</h1>
        <p className="text-ink-soft">Que tal dar uma olhada nas novidades?</p>
        <Link
          href="/"
          className="inline-block bg-gold hover:bg-gold-dark text-cream px-8 py-2.5 text-sm tracking-[0.15em] uppercase transition-colors"
        >
          Ver a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl text-ink mb-6">Carrinho</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.variantId} className="flex gap-4 bg-card border border-gold-light/30 p-4">
              <Link href={`/produto/${item.slug}`} className="w-24 h-24 bg-cream-dark relative flex-shrink-0 overflow-hidden">
                {item.photo && <Image src={item.photo} alt={item.name} fill className="object-cover" />}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/produto/${item.slug}`} className="text-ink hover:text-gold block">{item.name}</Link>
                {item.variantLabel && <p className="text-xs text-ink-soft mt-0.5">{item.variantLabel}</p>}
                <p className="text-gold mt-1">{formatBRL(item.unitPriceCents)}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-gold-light/50 rounded">
                    <button
                      onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 text-ink hover:text-gold disabled:opacity-30"
                      aria-label="Diminuir quantidade"
                    >−</button>
                    <span className="px-2 text-sm min-w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="px-3 py-1 text-ink hover:text-gold disabled:opacity-30"
                      aria-label="Aumentar quantidade"
                    >+</button>
                  </div>
                  <button onClick={() => cart.removeItem(item.variantId)} className="text-xs text-red-500 hover:text-red-700">
                    Remover
                  </button>
                </div>
              </div>
              <div className="text-right text-ink font-medium">
                {formatBRL(item.unitPriceCents * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-gold-light/30 p-5 space-y-4">
            <FreeShippingBar subtotalCents={cart.subtotalCents} thresholdCents={freeShippingThresholdCents} />

            <div>
              <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Cupom de desconto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Ex: BEMVINDA10"
                  className="flex-1 bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm uppercase focus:outline-none focus:border-gold"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={checking || !couponInput.trim()}
                  className="px-4 py-2 border border-gold text-gold hover:bg-gold hover:text-cream rounded text-xs tracking-widest uppercase transition-colors disabled:opacity-40"
                >
                  {checking ? "..." : "Aplicar"}
                </button>
              </div>
              {couponMsg && (
                <p className={`text-xs mt-1.5 ${couponMsg.type === "ok" ? "text-green-700" : "text-red-600"}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            <div className="border-t border-gold-light/30 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span><span>{formatBRL(cart.subtotalCents)}</span>
              </div>
              {appliedDiscountCents > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Desconto</span><span>-{formatBRL(appliedDiscountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Frete</span>
                <span>{shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</span>
              </div>
              <div className="flex justify-between text-ink font-medium text-base pt-2 border-t border-gold-light/20">
                <span>Total</span><span>{formatBRL(totalCents)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-gold hover:bg-gold-dark text-cream text-center py-3 text-sm tracking-[0.2em] uppercase transition-colors"
            >
              Finalizar Compra
            </Link>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full border border-gold text-gold hover:bg-gold hover:text-cream text-center py-3 text-sm tracking-[0.15em] uppercase transition-colors"
              >
                Fechar pelo WhatsApp
              </a>
            )}
          </div>
          <Link href="/" className="block text-center text-sm text-gold hover:underline tracking-widest uppercase">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
