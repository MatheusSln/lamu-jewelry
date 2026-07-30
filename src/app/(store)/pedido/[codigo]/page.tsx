import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { normalizeOrderCode } from "@/lib/order-code";
import { waLink } from "@/lib/whatsapp";
import { getSettingsMap } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Acompanhar pedido — Lámu" };

const TIMELINE: { status: string; label: string }[] = [
  { status: "aguardando_confirmacao", label: "Pedido recebido" },
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
  searchParams: Promise<{ novo?: string }>;
}) {
  const [{ codigo }, { novo }] = await Promise.all([params, searchParams]);
  const publicCode = normalizeOrderCode(decodeURIComponent(codigo));

  const [order] = await db.select().from(orders).where(eq(orders.publicCode, publicCode));
  if (!order) notFound();

  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)),
    getSettingsMap(),
  ]);

  const cancelled = order.status === "cancelado";
  // aguardando_pagamento equivale ao primeiro passo da linha do tempo
  const effectiveStatus = order.status === "aguardando_pagamento" ? "aguardando_confirmacao" : order.status;
  const currentStep = TIMELINE.findIndex((t) => t.status === effectiveStatus);

  const waMessage =
    `Olá! Acabei de fazer o pedido *${order.publicCode}* no site:\n\n` +
    items.map((i) => `• ${i.quantity}x ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""}`).join("\n") +
    `\n\nTotal: ${formatBRL(order.totalCents)}\n\nComo faço o pagamento?`;
  const waUrl = waLink(settings.whatsapp_number || "", waMessage);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {novo === "1" && !cancelled && (
        <div className="bg-green-50 border border-green-300 text-green-900 rounded p-5 text-center space-y-3">
          <p className="text-lg">Pedido enviado com sucesso! 💛</p>
          <p className="text-sm">
            Guarde o código <strong>{order.publicCode}</strong> para acompanhar por esta página.
          </p>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold hover:bg-gold-dark text-cream px-6 py-2.5 text-sm tracking-[0.15em] uppercase transition-colors"
            >
              Confirmar pelo WhatsApp
            </a>
          )}
          <p className="text-xs text-green-800">
            Envie a mensagem para combinarmos o pagamento e o envio.
          </p>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-ink-soft">Pedido</p>
        <h1 className="text-3xl text-ink">{order.publicCode}</h1>
        <p className="text-sm text-ink-soft mt-1">
          Feito em {order.createdAt.toLocaleDateString("pt-BR")} por {order.customerName}
        </p>
      </div>

      {cancelled ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 rounded p-4 text-center text-sm">
          Este pedido foi cancelado. Qualquer dúvida, fale com a gente pelo WhatsApp.
        </div>
      ) : (
        <ol className="relative border-s-2 border-gold-light/40 ml-4 space-y-6">
          {TIMELINE.map((step, i) => {
            const done = i <= currentStep;
            const current = i === currentStep;
            return (
              <li key={step.status} className="ms-6">
                <span
                  className={`absolute -start-[9px] mt-1 w-4 h-4 rounded-full border-2 ${
                    done ? "bg-gold border-gold" : "bg-cream border-gold-light/50"
                  }`}
                  aria-hidden
                />
                <p className={`text-sm ${done ? "text-ink" : "text-ink-soft"} ${current ? "font-medium" : ""}`}>
                  {step.label}
                  {current && <span className="ml-2 text-[10px] tracking-widest uppercase text-gold">Atual</span>}
                </p>
                {step.status === "enviado" && order.trackingCode && done && (
                  <p className="text-xs text-ink-soft mt-1">
                    Rastreio:{" "}
                    <a
                      href={`https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(order.trackingCode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      {order.trackingCode}
                    </a>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="bg-card border border-gold-light/30 p-5">
        <h2 className="text-sm tracking-[0.15em] uppercase text-ink mb-4">Itens</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2 text-ink-soft">
              <span>
                {i.quantity}x {i.productName}{i.variantLabel ? ` (${i.variantLabel})` : ""}
              </span>
              <span>{formatBRL(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-gold-light/30 mt-4 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span><span>{formatBRL(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Desconto</span><span>-{formatBRL(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-soft">
            <span>Frete{order.shippingName ? ` (${order.shippingName})` : ""}</span>
            <span>{order.shippingCents > 0 ? formatBRL(order.shippingCents) : "Grátis"}</span>
          </div>
          <div className="flex justify-between text-ink font-medium text-base pt-2 border-t border-gold-light/20">
            <span>Total</span><span>{formatBRL(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="bg-card border border-gold-light/30 p-5 text-sm text-ink-soft">
          <h2 className="text-sm tracking-[0.15em] uppercase text-ink mb-3">Endereço de entrega</h2>
          <p>{order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}</p>
          <p>{order.address.neighborhood} — {order.address.city}/{order.address.state}</p>
          <p>CEP {order.address.cep}</p>
        </div>
      )}

      <div className="text-center space-y-3">
        {waUrl && novo !== "1" && (
          <a
            href={waLink(settings.whatsapp_number || "", `Olá! Tenho uma dúvida sobre o pedido ${order.publicCode}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-gold text-gold hover:bg-gold hover:text-cream px-6 py-2.5 text-sm tracking-[0.15em] uppercase transition-colors"
          >
            Falar com a loja
          </a>
        )}
        <p>
          <Link href="/" className="text-sm text-gold hover:underline tracking-widest uppercase">
            Voltar à loja
          </Link>
        </p>
      </div>
    </div>
  );
}
