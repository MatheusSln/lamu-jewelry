import { describe, expect, it } from "vitest";
import { normalizeWhatsappNumber, waLink } from "./whatsapp";
import { generateOrderCode, normalizeOrderCode } from "./order-code";

describe("normalizeWhatsappNumber", () => {
  it("adiciona DDI 55 a número local com DDD", () => {
    expect(normalizeWhatsappNumber("(11) 99999-8888")).toBe("5511999998888");
  });

  it("não duplica DDI já presente", () => {
    expect(normalizeWhatsappNumber("+55 11 99999-8888")).toBe("5511999998888");
    expect(normalizeWhatsappNumber("5511999998888")).toBe("5511999998888");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(normalizeWhatsappNumber("")).toBe("");
    expect(normalizeWhatsappNumber("abc")).toBe("");
  });
});

describe("waLink", () => {
  it("monta link com mensagem codificada", () => {
    expect(waLink("11999998888", "Olá! Pedido LM-ABC12")).toBe(
      "https://wa.me/5511999998888?text=Ol%C3%A1!%20Pedido%20LM-ABC12",
    );
  });

  it("retorna vazio sem número", () => {
    expect(waLink("", "oi")).toBe("");
  });
});

describe("order-code", () => {
  it("gera código LM- com 5 caracteres sem ambíguos", () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^LM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
  });

  it("normaliza código digitado", () => {
    expect(normalizeOrderCode("lm-ab234")).toBe("LM-AB234");
    expect(normalizeOrderCode("ab234")).toBe("LM-AB234");
    expect(normalizeOrderCode("  ")).toBe("");
  });
});
