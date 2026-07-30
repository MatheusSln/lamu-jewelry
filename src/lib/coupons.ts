import { formatBRL } from "./money";

export type CouponLike = {
  code: string;
  type: "percent" | "fixed";
  /** percent: pontos percentuais; fixed: centavos */
  value: number;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  minOrderCents: number;
  isActive: boolean;
};

export type CouponResult =
  | { ok: true; discountCents: number }
  | { ok: false; error: string };

/** Valida um cupom contra um subtotal e calcula o desconto (nunca maior que o subtotal). */
export function applyCoupon(coupon: CouponLike | null, subtotalCents: number, now = new Date()): CouponResult {
  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "Cupom não encontrado ou inativo." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { ok: false, error: "Este cupom expirou." };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Este cupom atingiu o limite de usos." };
  }
  if (subtotalCents < coupon.minOrderCents) {
    return {
      ok: false,
      error: `Este cupom vale para pedidos a partir de ${formatBRL(coupon.minOrderCents)}.`,
    };
  }
  const raw =
    coupon.type === "percent"
      ? Math.floor((subtotalCents * coupon.value) / 100)
      : coupon.value;
  return { ok: true, discountCents: Math.min(raw, subtotalCents) };
}
