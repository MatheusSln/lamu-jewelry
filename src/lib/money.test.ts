import { describe, expect, it } from "vitest";
import { centsToInputText, formatBRL, inputTextToCents } from "./money";

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

describe("centsToInputText", () => {
  it("converte centavos para texto em reais", () => {
    expect(centsToInputText("19900")).toBe("199,00");
    expect(centsToInputText(19900)).toBe("199,00");
    expect(centsToInputText("80")).toBe("0,80");
    expect(centsToInputText("0")).toBe("0,00");
  });

  it("string vazia vira string vazia", () => {
    expect(centsToInputText("")).toBe("");
  });

  it("valor invalido vira string vazia", () => {
    expect(centsToInputText("abc")).toBe("");
  });
});

describe("inputTextToCents", () => {
  it("converte texto simples em reais para centavos", () => {
    expect(inputTextToCents("199")).toBe(19900);
    expect(inputTextToCents("0")).toBe(0);
  });

  it("aceita virgula decimal", () => {
    expect(inputTextToCents("199,5")).toBe(19950);
    expect(inputTextToCents("199,90")).toBe(19990);
  });

  it("aceita separador de milhar com ponto", () => {
    expect(inputTextToCents("1.299,90")).toBe(129990);
  });

  it("string vazia vira null", () => {
    expect(inputTextToCents("")).toBeNull();
    expect(inputTextToCents("   ")).toBeNull();
  });

  it("texto nao numerico vira null", () => {
    expect(inputTextToCents("abc")).toBeNull();
  });

  it("negativo vira null por padrao", () => {
    expect(inputTextToCents("-10")).toBeNull();
  });

  it("aceita negativo com allowNegative", () => {
    expect(inputTextToCents("-10", { allowNegative: true })).toBe(-1000);
    expect(inputTextToCents("-1.299,90", { allowNegative: true })).toBe(-129990);
    expect(inputTextToCents("10", { allowNegative: true })).toBe(1000);
    expect(inputTextToCents("", { allowNegative: true })).toBeNull();
  });

  it("centsToInputText formata negativo", () => {
    expect(centsToInputText(-1000)).toBe("-10,00");
  });

  it("faz o round-trip completo", () => {
    const cents = 19900;
    const text = centsToInputText(cents);
    expect(inputTextToCents(text)).toBe(cents);
  });
});
