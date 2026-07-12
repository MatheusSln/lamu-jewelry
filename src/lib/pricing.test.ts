import { describe, expect, it } from "vitest";
import { effectivePriceCents, isOnPromo } from "./pricing";

describe("pricing", () => {
  it("usa preço promocional quando existe e é menor", () => {
    expect(effectivePriceCents({ priceCents: 10000, promoPriceCents: 7990 })).toBe(7990);
    expect(isOnPromo({ priceCents: 10000, promoPriceCents: 7990 })).toBe(true);
  });

  it("usa preço cheio quando não há promoção", () => {
    expect(effectivePriceCents({ priceCents: 10000, promoPriceCents: null })).toBe(10000);
    expect(isOnPromo({ priceCents: 10000, promoPriceCents: null })).toBe(false);
  });

  it("ignora promoção maior ou igual ao preço cheio", () => {
    expect(effectivePriceCents({ priceCents: 5000, promoPriceCents: 5000 })).toBe(5000);
    expect(isOnPromo({ priceCents: 5000, promoPriceCents: 6000 })).toBe(false);
  });
});
