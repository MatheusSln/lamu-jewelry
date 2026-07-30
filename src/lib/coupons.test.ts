import { describe, expect, it } from "vitest";
import { applyCoupon, type CouponLike } from "./coupons";

const base: CouponLike = {
  code: "TESTE10",
  type: "percent",
  value: 10,
  expiresAt: null,
  maxUses: null,
  usedCount: 0,
  minOrderCents: 0,
  isActive: true,
};

describe("applyCoupon", () => {
  it("aplica desconto percentual arredondando para baixo", () => {
    expect(applyCoupon(base, 15990)).toEqual({ ok: true, discountCents: 1599 });
  });

  it("aplica desconto fixo em centavos", () => {
    const fixed: CouponLike = { ...base, type: "fixed", value: 1500 };
    expect(applyCoupon(fixed, 10000)).toEqual({ ok: true, discountCents: 1500 });
  });

  it("limita o desconto ao subtotal", () => {
    const fixed: CouponLike = { ...base, type: "fixed", value: 99999 };
    expect(applyCoupon(fixed, 5000)).toEqual({ ok: true, discountCents: 5000 });
  });

  it("rejeita cupom inexistente ou inativo", () => {
    expect(applyCoupon(null, 10000).ok).toBe(false);
    expect(applyCoupon({ ...base, isActive: false }, 10000).ok).toBe(false);
  });

  it("rejeita cupom expirado, mas aceita dentro da validade", () => {
    const now = new Date("2026-07-29T12:00:00");
    const expired = { ...base, expiresAt: new Date("2026-07-28T23:59:59") };
    const valid = { ...base, expiresAt: new Date("2026-07-30T23:59:59") };
    expect(applyCoupon(expired, 10000, now).ok).toBe(false);
    expect(applyCoupon(valid, 10000, now).ok).toBe(true);
  });

  it("rejeita cupom com limite de usos atingido", () => {
    expect(applyCoupon({ ...base, maxUses: 5, usedCount: 5 }, 10000).ok).toBe(false);
    expect(applyCoupon({ ...base, maxUses: 5, usedCount: 4 }, 10000).ok).toBe(true);
  });

  it("rejeita subtotal abaixo do pedido mínimo com mensagem formatada", () => {
    const result = applyCoupon({ ...base, minOrderCents: 19900 }, 10000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("R$ 199,00");
  });
});
