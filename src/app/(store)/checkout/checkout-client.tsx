"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/money";
import { createOrderAction, validateCouponAction } from "./actions";

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold";

type AddressFields = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function CheckoutClient({
  freeShippingThresholdCents,
  fallbackShippingCents,
}: {
  freeShippingThresholdCents: number;
  fallbackShippingCents: number;
}) {
  const cart = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [address, setAddress] = useState<AddressFields>({ street: "", neighborhood: "", city: "", state: "" });

  // Revalida o cupom aplicado no carrinho
  useEffect(() => {
    if (!cart.hydrated || !cart.couponCode || cart.subtotalCents === 0) return;
    let cancelled = false;
    validateCouponAction(cart.couponCode, cart.subtotalCents).then((res) => {
      if (cancelled) return;
      if (res.ok) setDiscountCents(res.discountCents);
      else {
        setDiscountCents(0);
        cart.setCouponCode("");
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.hydrated, cart.couponCode, cart.subtotalCents]);

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress({
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        });
      }
    } catch {
      // ViaCEP fora do ar: cliente preenche manualmente
    } finally {
      setCepLoading(false);
    }
  }

  // Desconto só vale com cupom aplicado, nunca acima do subtotal
  const appliedDiscountCents = cart.couponCode ? Math.min(discountCents, cart.subtotalCents) : 0;
  const shippingCents =
    freeShippingThresholdCents > 0 && cart.subtotalCents >= freeShippingThresholdCents
      ? 0
      : fallbackShippingCents;
  const totalCents = cart.subtotalCents - appliedDiscountCents + shippingCents;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createOrderAction({
        items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        customer: {
          name: (fd.get("name") as string) || "",
          whatsapp: (fd.get("whatsapp") as string) || "",
          email: (fd.get("email") as string) || "",
        },
        address: {
          cep,
          street: (fd.get("street") as string) || "",
          number: (fd.get("number") as string) || "",
          complement: (fd.get("complement") as string) || "",
          neighborhood: (fd.get("neighborhood") as string) || "",
          city: (fd.get("city") as string) || "",
          state: (fd.get("state") as string) || "",
        },
        couponCode: cart.couponCode,
      });
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      cart.clear();
      router.push(`/pedido/${result.publicCode}?novo=1`);
    } catch {
      setError("Não foi possível concluir o pedido. Verifique a conexão e tente de novo.");
      setPending(false);
    }
  }

  if (cart.hydrated && cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl text-ink">Seu carrinho está vazio</h1>
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
      <h1 className="text-3xl text-ink mb-6">Finalizar Compra</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 rounded px-4 py-3 text-sm" role="alert">
              {error}
            </div>
          )}

          <section className="bg-card border border-gold-light/30 p-5 space-y-4">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">1. Seus dados</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Nome completo *</label>
                <input type="text" name="name" required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">WhatsApp (com DDD) *</label>
                <input type="tel" name="whatsapp" required placeholder="(11) 99999-8888" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">E-mail (opcional)</label>
                <input type="email" name="email" className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-card border border-gold-light/30 p-5 space-y-4">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">2. Endereço de entrega</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">CEP *</label>
                <input
                  type="text"
                  name="cep"
                  required
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className={inputClass}
                />
                {cepLoading && <p className="text-[11px] text-ink-soft mt-1">Buscando endereço…</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Rua *</label>
                <input
                  type="text" name="street" required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Número *</label>
                <input type="text" name="number" required className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Complemento</label>
                <input type="text" name="complement" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Bairro *</label>
                <input
                  type="text" name="neighborhood" required
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Cidade *</label>
                <input
                  type="text" name="city" required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">UF *</label>
                <input
                  type="text" name="state" required maxLength={2}
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="bg-card border border-gold-light/30 p-5 space-y-3">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">3. Entrega</h2>
            <div className="flex justify-between items-center border border-gold rounded px-4 py-3 text-sm">
              <span className="text-ink">{shippingCents === 0 ? "Frete grátis" : "Entrega padrão"}</span>
              <span className="text-gold font-medium">{shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</span>
            </div>
            <p className="text-[11px] text-ink-soft">
              Após enviar o pedido, combinamos o pagamento e a postagem pelo WhatsApp.
            </p>
          </section>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-gold-light/30 p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">Resumo</h2>
            <ul className="space-y-2 text-sm text-ink-soft max-h-56 overflow-y-auto">
              {cart.items.map((i) => (
                <li key={i.variantId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {i.quantity}x {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""}
                  </span>
                  <span className="whitespace-nowrap">{formatBRL(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gold-light/30 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span><span>{formatBRL(cart.subtotalCents)}</span>
              </div>
              {appliedDiscountCents > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Cupom {cart.couponCode}</span><span>-{formatBRL(appliedDiscountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Frete</span><span>{shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</span>
              </div>
              <div className="flex justify-between text-ink font-medium text-base pt-2 border-t border-gold-light/20">
                <span>Total</span><span>{formatBRL(totalCents)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={pending || !cart.hydrated || cart.items.length === 0}
              className="w-full bg-gold hover:bg-gold-dark text-cream py-3 text-sm tracking-[0.2em] uppercase transition-colors disabled:opacity-50"
            >
              {pending ? "Enviando pedido..." : "Enviar Pedido"}
            </button>
            <Link href="/carrinho" className="block text-center text-sm text-gold hover:underline tracking-widest uppercase">
              Voltar ao carrinho
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
