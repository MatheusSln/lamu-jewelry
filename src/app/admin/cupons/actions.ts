"use server";

import { db } from "@/db";
import { coupons } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | void;

type ParsedCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderCents: number;
  maxUses: number | null;
  expiresAt: Date | null;
  isActive: boolean;
};

function parseCouponForm(formData: FormData): { data: ParsedCoupon } | { error: string } {
  const code = ((formData.get("code") as string) || "").trim().toUpperCase();
  if (!code) return { error: "Informe o código do cupom (ex.: BEMVINDA10)." };
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { error: "O código só pode ter letras, números, hífen e underline (sem espaços)." };
  }

  const type = formData.get("type") as "percent" | "fixed";
  if (type !== "percent" && type !== "fixed") return { error: "Tipo de cupom inválido." };

  const value = parseInt(formData.get("value") as string, 10);
  if (!Number.isInteger(value) || value <= 0) {
    return { error: type === "percent" ? "Informe a porcentagem de desconto (ex.: 10)." : "Informe o valor do desconto (ex.: 15,00)." };
  }
  if (type === "percent" && value > 100) {
    return { error: "Desconto percentual não pode passar de 100%." };
  }

  const minOrderRaw = ((formData.get("minOrderCents") as string) || "").trim();
  const minOrderCents = minOrderRaw === "" ? 0 : parseInt(minOrderRaw, 10);
  if (!Number.isInteger(minOrderCents) || minOrderCents < 0) {
    return { error: "Pedido mínimo inválido. Deixe vazio para não exigir valor mínimo." };
  }

  const maxUsesRaw = ((formData.get("maxUses") as string) || "").trim();
  let maxUses: number | null = null;
  if (maxUsesRaw !== "") {
    maxUses = parseInt(maxUsesRaw, 10);
    if (!Number.isInteger(maxUses) || maxUses <= 0) {
      return { error: "Limite de usos inválido (deixe vazio para ilimitado)." };
    }
  }

  const expiresRaw = ((formData.get("expiresAt") as string) || "").trim();
  let expiresAt: Date | null = null;
  if (expiresRaw !== "") {
    // Fim do dia local para a validade valer o dia inteiro
    expiresAt = new Date(`${expiresRaw}T23:59:59`);
    if (isNaN(expiresAt.getTime())) return { error: "Data de validade inválida." };
  }

  return {
    data: {
      code,
      type,
      value,
      minOrderCents,
      maxUses,
      expiresAt,
      isActive: formData.get("isActive") === "on",
    },
  };
}

export async function saveCouponAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseCouponForm(formData);
  if ("error" in parsed) return parsed;

  const [existing] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, parsed.data.code));
  if (existing) return { error: `Já existe um cupom com o código ${parsed.data.code}.` };

  await db.insert(coupons).values(parsed.data);
  revalidatePath("/admin/cupons");
}

export async function updateCouponAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Cupom inválido." };

  const parsed = parseCouponForm(formData);
  if ("error" in parsed) return parsed;

  const [existing] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(and(eq(coupons.code, parsed.data.code), ne(coupons.id, id)));
  if (existing) return { error: `Já existe outro cupom com o código ${parsed.data.code}.` };

  await db.update(coupons).set(parsed.data).where(eq(coupons.id, id));
  revalidatePath("/admin/cupons");
}

export async function deleteCouponAction(formData: FormData): Promise<ActionResult> {
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isInteger(id)) return { error: "Cupom inválido." };

  const [current] = await db.select().from(coupons).where(eq(coupons.id, id));
  if (!current) return { error: "Cupom não encontrado." };
  if (current.usedCount > 0) {
    return { error: "Este cupom já foi usado em pedidos; desative-o em vez de excluir." };
  }

  await db.delete(coupons).where(eq(coupons.id, id));
  revalidatePath("/admin/cupons");
}
