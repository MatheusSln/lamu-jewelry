import { describe, expect, it } from "vitest";
import { getShippingOptions, remainingForFreeShipping } from "./shipping";

const settings = {
  free_shipping_threshold_cents: "19900",
  fallback_shipping_cents: "1500",
};

describe("getShippingOptions", () => {
  it("dá frete grátis no limiar ou acima", () => {
    expect(getShippingOptions(19900, settings)).toEqual([{ name: "Frete grátis", cents: 0 }]);
    expect(getShippingOptions(50000, settings)).toEqual([{ name: "Frete grátis", cents: 0 }]);
  });

  it("cobra frete padrão abaixo do limiar", () => {
    expect(getShippingOptions(19899, settings)).toEqual([{ name: "Entrega padrão", cents: 1500 }]);
  });

  it("sem limiar configurado, sempre cobra o frete padrão", () => {
    expect(getShippingOptions(99999, { fallback_shipping_cents: "1500" })).toEqual([
      { name: "Entrega padrão", cents: 1500 },
    ]);
  });

  it("settings inválidas ou ausentes viram frete zero (não bloqueia a venda)", () => {
    expect(getShippingOptions(1000, {})).toEqual([{ name: "Entrega padrão", cents: 0 }]);
    expect(getShippingOptions(1000, { fallback_shipping_cents: "abc" })).toEqual([
      { name: "Entrega padrão", cents: 0 },
    ]);
  });
});

describe("remainingForFreeShipping", () => {
  it("calcula quanto falta", () => {
    expect(remainingForFreeShipping(10000, settings)).toBe(9900);
  });

  it("retorna null quando já atingiu ou está desativado", () => {
    expect(remainingForFreeShipping(19900, settings)).toBeNull();
    expect(remainingForFreeShipping(10000, {})).toBeNull();
    expect(remainingForFreeShipping(10000, { free_shipping_threshold_cents: "0" })).toBeNull();
  });
});
