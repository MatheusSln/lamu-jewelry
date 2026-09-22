import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { normalizeOrderCode } from "@/lib/order-code";
import { waLink } from "@/lib/whatsapp";
import { getSettingsMap } from "@/lib/catalog";
import { CopyOrderLinkButton } from "./copy-link-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Acompanhar pedido — Lámu" };

const TIMELINE: { status: string; label: string }[] = [
  { status: "aguardando_pagamento", label: "Pedido criado" },
  { status: "pago", label: "Pagamento confirmado" },
  { status: "separando", label: "Separando com carinho" },
  { status: "enviado", label: "Enviado" },
  { status: "entregue", label: "Entregue" },
];

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ novo?: string; status?: string }>;
}) {
  const [{ codigo }, { novo, status: mpStatus }] = await Promise.all([params, searchParams]);
  const publicCode = normalizeOrderCode(decodeURIComponent(codigo));

  const [order] = await db.select().from(orders).where(eq(orders.publicCode, publicCode));
  if (!order) notFound();

  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)),
    getSettingsMap(),
  ]);

  const cancelled = order.status === "cancelado";
  const isPaid = order.status === "pago" || order.status === "separando" || order.status === "enviado" || order.status === "entregue";
  const isAguardandoPagamento = order.status === "aguardando_pagamento";

  // Mapeia o status para a linha do tempo
  const effectiveStatus = order.status === "aguardando_confirmacao" ? "aguardando_pagamento" : order.status;
  const currentStep = TIMELINE.findIndex((t) => t.status === effectiveStatus);

  const waMessage =
    `Olá! Gostaria de tirar uma dúvida sobre o meu pedido *${order.publicCode}* no site da Lámu.`;
  const waUrl = waLink(settings.whatsapp_number || "", waMessage);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* 1. STATUS DO MERCADO PAGO / BANNER SUPERIOR */}
      {isAguardandoPagamento && !cancelled && (
        <div className="bg-amber-50/80 border border-amber-300 text-amber-950 rounded-lg p-6 text-center space-y-3.5 shadow-sm">
          <div className="text-2xl">⏳</div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-amber-950">Aguardando Pagamento</h2>
            <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
              Seu pedido <strong>{order.publicCode}</strong> foi registrado! Se você ainda não concluiu o Pix ou Cartão,
              clique abaixo para abrir o Mercado Pago:
            </p>
          </div>

          {order.paymentUrl && (
            <div className="pt-1">
              <a
                href={order.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gold hover:bg-gold-dark text-cream px-7 py-2.5 text-xs tracking-[0.15em] uppercase font-medium transition-colors shadow"
              >
                Pagar com Mercado Pago
              </a>
            </div>
          )}

          <p className="text-[11px] text-amber-700">
            Assim que você pagar, o Mercado Pago confirma automaticamente o pedido aqui no site.
          </p>
        </div>
      )}

      {isPaid && !cancelled && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-lg p-6 text-center space-y-2 shadow-sm">
          <div className="text-2xl">✨</div>
          <h2 className="text-lg font-medium text-emerald-950">Pagamento Confirmado! 💛</h2>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Obrigada por escolher a Lámu! O seu pagamento foi aprovado e suas semijoias já estão em preparação para envio.
          </p>
          {order.deliveryTimeDays && (
            <p className="text-xs text-emerald-900 pt-1 font-medium">
              Prazo estimado de entrega: até {order.deliveryTimeDays} dias úteis ({order.shippingName || "Entrega no DF"}).
            </p>
          )}
        </div>
      )}

      {/* CABEÇALHO DO PEDIDO */}
      <div className="text-center space-y-1">
        <p className="text-xs tracking-[0.2em] uppercase text-ink-soft">Código do Pedido</p>
        <h1 className="text-3xl text-ink font-light tracking-wide">{order.publicCode}</h1>
        <p className="text-xs text-ink-soft">
          Realizado em {order.createdAt.toLocaleDateString("pt-BR")} às {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} por {order.customerName}
        </p>
        <div className="pt-2">
          <CopyOrderLinkButton orderCode={order.publicCode} />
        </div>
      </div>

      {/* LINHA DO TEMPO */}
      {cancelled ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 rounded p-4 text-center text-sm">
          Este pedido foi cancelado. Se tiver alguma dúvida, fale com nossa equipe pelo WhatsApp.
        </div>
      ) : (
        <div className="bg-card border border-gold-light/30 p-6 rounded-lg">
          <h2 className="text-xs tracking-[0.15em] uppercase text-ink mb-6">Status do Envio</h2>
          <ol className="relative border-s-2 border-gold-light/40 ml-4 space-y-6">
            {TIMELINE.map((step, i) => {
              const done = i <= currentStep;
              const current = i === currentStep;
              return (
                <li key={step.status} className="ms-6">
                  <span
                    className={`absolute -start-[9px] mt-1 w-4 h-4 rounded-full border-2 transition-all ${
                      done ? "bg-gold border-gold" : "bg-cream border-gold-light/50"
                    }`}
                    aria-hidden
                  />
                  <p className={`text-sm ${done ? "text-ink" : "text-ink-soft"} ${current ? "font-semibold" : ""}`}>
                    {step.label}
                    {current && <span className="ml-2 text-[10px] tracking-widest uppercase text-gold bg-gold-light/10 px-2 py-0.5 rounded">Atual</span>}
                  </p>
                  {step.status === "enviado" && order.trackingCode && done && (
                    <p className="text-xs text-ink-soft mt-1">
                      Código de Rastreio:{" "}
                      <a
                        href={`https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(order.trackingCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline font-medium"
                      >
                        {order.trackingCode} ↗
                      </a>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* ITENS DO PEDIDO */}
      <div className="bg-card border border-gold-light/30 p-6 rounded-lg space-y-4">
        <h2 className="text-xs tracking-[0.15em] uppercase text-ink">Resumo dos Itens</h2>
        <ul className="space-y-2.5 text-sm divide-y divide-gold-light/20">
          {items.map((i) => (
            <li key={i.id} className="pt-2 flex justify-between gap-2 text-ink-soft first:pt-0">
              <span>
                <strong className="text-ink">{i.quantity}x</strong> {i.productName}
                {i.variantLabel ? <span className="text-xs text-ink-soft block">Variação: {i.variantLabel}</span> : ""}
              </span>
              <span className="whitespace-nowrap text-ink font-medium">{formatBRL(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-gold-light/30 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatBRL(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Desconto</span>
              <span>-{formatBRL(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-soft">
            <span>Frete ({order.shippingName || "Entrega no DF"})</span>
            <span>{order.shippingCents > 0 ? formatBRL(order.shippingCents) : "Grátis"}</span>
          </div>
          <div className="flex justify-between text-ink font-medium text-base pt-2 border-t border-gold-light/20">
            <span>Total Pago</span>
            <span className="text-gold font-semibold">{formatBRL(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {/* ENDEREÇO DE ENTREGA */}
      {order.address && (
        <div className="bg-card border border-gold-light/30 p-6 rounded-lg text-sm text-ink-soft space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs tracking-[0.15em] uppercase text-ink">Endereço de Entrega</h2>
            <span className="text-[11px] text-gold bg-gold-light/10 px-2 py-0.5 rounded">Distrito Federal</span>
          </div>
          <p className="text-ink">
            {order.address.street}, nº {order.address.number}
            {order.address.complement ? ` — ${order.address.complement}` : ""}
          </p>
          <p>
            {order.address.neighborhood} — {order.address.city}/{order.address.state}
          </p>
          <p className="text-xs">CEP: {order.address.cep}</p>
        </div>
      )}

      {/* AÇÕES DE SUPORTE E RETORNO */}
      <div className="text-center space-y-3 pt-4">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-gold text-gold hover:bg-gold hover:text-cream px-6 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors"
          >
            Dúvidas? Fale conosco no WhatsApp
          </a>
        )}
        <p>
          <Link href="/" className="text-xs text-ink-soft hover:text-gold hover:underline tracking-widest uppercase">
            ← Continuar comprando na loja
          </Link>
        </p>
      </div>
    </div>
  );
}
