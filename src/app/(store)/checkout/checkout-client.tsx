"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/money";
import { validateCouponAction } from "./actions";

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold";

type AddressFields = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type ShippingOptionItem = {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  delivery_time: number;
  custom_delivery_time: number;
  company?: {
    name: string;
    picture?: string;
  };
  is_free?: boolean;
};

function checkIsDistritoFederal(cepDigits: string, state?: string): boolean {
  if (state && state.trim().toUpperCase() === "DF") return true;
  if (cepDigits.length !== 8) return false;
  const num = parseInt(cepDigits, 10);
  return num >= 70000000 && num <= 73699999;
}

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

  // Endereço
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [isOutOfDF, setIsOutOfDF] = useState(false);
  const [address, setAddress] = useState<AddressFields>({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  // Frete (Melhor Envio)
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionItem[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOptionItem | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Revalida cupom
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
    return () => {
      cancelled = true;
    };
  }, [cart.hydrated, cart.couponCode, cart.subtotalCents]);

  // Busca CEP e calcula frete
  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    setError(null);

    let stateFound = "";
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        stateFound = data.uf || "";
        setAddress({
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: stateFound,
        });
      }
    } catch {
      // ViaCEP falhou: cliente digita manualmente
    } finally {
      setCepLoading(false);
    }

    // Validação geográfica: Fase de testes restrita ao Distrito Federal
    const isDF = checkIsDistritoFederal(digits, stateFound);
    if (!isDF) {
      setIsOutOfDF(true);
      setShippingOptions([]);
      setSelectedShipping(null);
      return;
    }

    setIsOutOfDF(false);
    await fetchShipping(digits);
  }

  async function fetchShipping(digits: string) {
    setShippingLoading(true);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: digits }),
      });

      if (!res.ok) throw new Error("Falha ao calcular frete");
      const data: ShippingOptionItem[] = await res.json();

      // Aplica regra de Frete Grátis na opção mais econômica se atingir o mínimo
      const hasFreeShipping =
        freeShippingThresholdCents > 0 && cart.subtotalCents >= freeShippingThresholdCents;

      const processedOptions = data.map((opt, index) => {
        // A primeira opção é a mais econômica (ordenada por preço no backend)
        const isFree = hasFreeShipping && index === 0;
        return {
          ...opt,
          is_free: isFree,
          displayPriceCents: isFree ? 0 : Math.round(parseFloat(opt.custom_price) * 100),
        };
      });

      setShippingOptions(processedOptions);
      if (processedOptions.length > 0) {
        setSelectedShipping(processedOptions[0]);
      }
    } catch {
      // Fallback caso a API do Melhor Envio oscile
      const fallback: ShippingOptionItem = {
        id: 999,
        name: "Entrega Expressa DF",
        price: (fallbackShippingCents / 100).toFixed(2),
        custom_price: (fallbackShippingCents / 100).toFixed(2),
        delivery_time: 2,
        custom_delivery_time: 2,
        is_free: freeShippingThresholdCents > 0 && cart.subtotalCents >= freeShippingThresholdCents,
      };
      setShippingOptions([fallback]);
      setSelectedShipping(fallback);
    } finally {
      setShippingLoading(false);
    }
  }

  // Cálculos de Totais
  const appliedDiscountCents = cart.couponCode ? Math.min(discountCents, cart.subtotalCents) : 0;
  const currentShippingCents = selectedShipping
    ? selectedShipping.is_free
      ? 0
      : Math.round(parseFloat(selectedShipping.custom_price) * 100)
    : 0;

  const totalCents = Math.max(0, cart.subtotalCents - appliedDiscountCents + currentShippingCents);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isOutOfDF) {
      setError("No momento, nossa fase de lançamento atende exclusivamente o Distrito Federal.");
      return;
    }

    if (!selectedShipping) {
      setError("Por favor, selecione uma opção de frete para continuar.");
      return;
    }

    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
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
          shippingOption: selectedShipping,
          couponCode: cart.couponCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Não foi possível criar o pedido.");
        setPending(false);
        return;
      }

      // Limpa carrinho e redireciona direto para o pagamento seguro no Mercado Pago
      cart.clear();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        router.push(`/pedido/${data.orderId}?novo=1`);
      }
    } catch {
      setError("Erro de conexão ao processar seu pagamento. Tente novamente.");
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

          {/* 1. DADOS PESSOAIS */}
          <section className="bg-card border border-gold-light/30 p-5 space-y-4">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">1. Seus dados</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Nome completo *</label>
                <input type="text" name="name" required className={inputClass} placeholder="Ex: Maria Silva" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">WhatsApp (com DDD) *</label>
                <input type="tel" name="whatsapp" required placeholder="(61) 99999-8888" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">E-mail (para confirmação) *</label>
                <input type="email" name="email" required placeholder="seuemail@exemplo.com" className={inputClass} />
              </div>
            </div>
          </section>

          {/* 2. ENDEREÇO DE ENTREGA */}
          <section className="bg-card border border-gold-light/30 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm tracking-[0.15em] uppercase text-ink">2. Endereço de entrega</h2>
              <span className="text-[11px] bg-gold-light/20 text-gold-dark px-2 py-0.5 rounded border border-gold/30">
                Atendimento no DF
              </span>
            </div>

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
                  placeholder="70000-000"
                  className={inputClass}
                />
                {cepLoading && <p className="text-[11px] text-gold mt-1 animate-pulse">Buscando CEP...</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Rua / Quadra / Bloco *</label>
                <input
                  type="text"
                  name="street"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Ex: SQN 205 Bloco C"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Número / Apto *</label>
                <input type="text" name="number" required placeholder="Ex: 302" className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Complemento</label>
                <input type="text" name="complement" placeholder="Ex: Próximo à portaria principal" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Bairro / Região *</label>
                <input
                  type="text"
                  name="neighborhood"
                  required
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  placeholder="Ex: Asa Norte"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Cidade *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="Brasília"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">UF *</label>
                <input
                  type="text"
                  name="state"
                  required
                  maxLength={2}
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                  placeholder="DF"
                  className={inputClass}
                />
              </div>
            </div>

            {/* AVISO REGIONAL: FORA DO DISTRITO FEDERAL */}
            {isOutOfDF && (
              <div className="bg-amber-50 border border-amber-300 rounded p-4 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <span>📍</span>
                  <span>Entrega temporariamente restrita ao Distrito Federal</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Nossa fase de lançamento atende exclusivamente endereços em Brasília e no Distrito Federal. Em breve
                  liberaremos entregas para todo o território nacional!
                </p>
              </div>
            )}
          </section>

          {/* 3. OPÇÕES DE FRETE (MELHOR ENVIO) */}
          <section className="bg-card border border-gold-light/30 p-5 space-y-3">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">3. Opções de Frete</h2>

            {shippingLoading && (
              <div className="py-4 text-center text-sm text-ink-soft animate-pulse">
                Calculando opções de transportadoras e prazos...
              </div>
            )}

            {!shippingLoading && !isOutOfDF && shippingOptions.length === 0 && (
              <p className="text-xs text-ink-soft">
                Digite o seu CEP acima para visualizar as opções de frete dos Correios e transportadoras.
              </p>
            )}

            {!shippingLoading && isOutOfDF && (
              <p className="text-xs text-ink-soft">
                Insira um CEP válido de Brasília/DF para calcular o frete.
              </p>
            )}

            {!shippingLoading && !isOutOfDF && shippingOptions.length > 0 && (
              <div className="space-y-2">
                {shippingOptions.map((opt) => {
                  const isSelected = selectedShipping?.id === opt.id && selectedShipping?.name === opt.name;
                  const priceFormatted = opt.is_free
                    ? "Grátis"
                    : formatBRL(Math.round(parseFloat(opt.custom_price) * 100));

                  const deliveryDays = opt.custom_delivery_time || opt.delivery_time;

                  return (
                    <label
                      key={`${opt.id}-${opt.name}`}
                      className={`flex items-center justify-between p-3.5 border rounded cursor-pointer transition-all ${
                        isSelected
                          ? "border-gold bg-gold-light/10 shadow-sm"
                          : "border-gold-light/30 hover:border-gold-light/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_radio"
                          checked={isSelected}
                          onChange={() => setSelectedShipping(opt)}
                          className="accent-gold h-4 w-4"
                        />
                        <div>
                          <p className="text-sm font-medium text-ink flex items-center gap-2">
                            <span>{opt.name}</span>
                            {opt.is_free && (
                              <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-1.5 py-0.5 rounded">
                                FRETE GRÁTIS
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {deliveryDays ? `Chega em até ${deliveryDays} dias úteis` : "Prazo rápido"}
                            {opt.company?.name ? ` • via ${opt.company.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${opt.is_free ? "text-green-700 font-semibold" : "text-ink"}`}>
                          {priceFormatted}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RESUMO DO PEDIDO E BOTÃO DE PAGAMENTO */}
        <div className="space-y-4">
          <div className="bg-card border border-gold-light/30 p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="text-sm tracking-[0.15em] uppercase text-ink">Resumo do Pedido</h2>
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
                <span>Subtotal</span>
                <span>{formatBRL(cart.subtotalCents)}</span>
              </div>

              {appliedDiscountCents > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Cupom {cart.couponCode}</span>
                  <span>-{formatBRL(appliedDiscountCents)}</span>
                </div>
              )}

              <div className="flex justify-between text-ink-soft">
                <span>Frete</span>
                <span>
                  {selectedShipping
                    ? selectedShipping.is_free
                      ? "Grátis"
                      : formatBRL(currentShippingCents)
                    : "Calcular no CEP"}
                </span>
              </div>

              <div className="flex justify-between text-ink font-medium text-base pt-2 border-t border-gold-light/20">
                <span>Total</span>
                <span>{formatBRL(totalCents)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending || isOutOfDF || !selectedShipping || cart.items.length === 0}
              className="w-full bg-gold hover:bg-gold-dark text-cream py-3.5 text-sm tracking-[0.2em] uppercase transition-colors disabled:opacity-50 font-medium shadow"
            >
              {pending ? "Iniciando Mercado Pago..." : "Pagar com Mercado Pago"}
            </button>

            <div className="text-center pt-2 space-y-1">
              <p className="text-[11px] text-ink-soft flex items-center justify-center gap-1">
                <span>🔒</span> Pagamento 100% Seguro
              </p>
              <p className="text-[10px] text-ink-soft">
                Pix com aprovação imediata ou Cartão de Crédito via Mercado Pago
              </p>
            </div>

            <Link href="/carrinho" className="block text-center text-xs text-gold hover:underline tracking-widest uppercase pt-2">
              Voltar ao carrinho
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
