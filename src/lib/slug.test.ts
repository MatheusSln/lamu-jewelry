import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("remove acentos e coloca em minúsculas", () => {
    expect(slugify("Anéis")).toBe("aneis");
  });

  it("troca espaços por hífens", () => {
    expect(slugify("Conjunto Gota Zircônia")).toBe("conjunto-gota-zirconia");
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Brinco 2º Furo!")).toBe("brinco-2-furo");
  });

  it("colapsa hífens repetidos e das pontas", () => {
    expect(slugify("  Colar -- Longo  ")).toBe("colar-longo");
  });
});
