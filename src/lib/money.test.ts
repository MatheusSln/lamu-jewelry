import { describe, expect, it } from "vitest";
import { formatBRL } from "./money";

describe("formatBRL", () => {
  it("formata centavos como reais pt-BR", () => {
    expect(formatBRL(16990)).toBe("R$ 169,90");
  });

  it("formata valores baixos", () => {
    expect(formatBRL(80)).toBe("R$ 0,80");
  });

  it("formata zero", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("formata milhares com separador", () => {
    expect(formatBRL(123456789)).toBe("R$ 1.234.567,89");
  });
});
