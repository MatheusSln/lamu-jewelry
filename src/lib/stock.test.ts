import { describe, expect, it } from "vitest";
import { getLowStockThreshold } from "./stock";

describe("getLowStockThreshold", () => {
  it("le o valor configurado", () => {
    expect(getLowStockThreshold({ low_stock_threshold: "2" })).toBe(2);
    expect(getLowStockThreshold({ low_stock_threshold: "0" })).toBe(0);
  });

  it("usa o fallback quando ausente ou invalido", () => {
    expect(getLowStockThreshold({})).toBe(3);
    expect(getLowStockThreshold({ low_stock_threshold: "" })).toBe(3);
    expect(getLowStockThreshold({ low_stock_threshold: "abc" })).toBe(3);
    expect(getLowStockThreshold({ low_stock_threshold: "-1" })).toBe(3);
  });
});
