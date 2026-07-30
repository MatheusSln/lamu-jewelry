"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { SETTING_FIELDS } from "./fields";

export type ActionResult = { error: string } | void;

export async function saveSettingsAction(formData: FormData): Promise<ActionResult> {
  for (const field of SETTING_FIELDS) {
    const value = ((formData.get(field.key) as string) ?? "").trim();
    const isNumeric = field.kind === "money" || field.kind === "integer";
    if (isNumeric && value !== "" && !/^\d+$/.test(value)) {
      return { error: `"${field.label}" precisa ser um número inteiro (em centavos quando for valor).` };
    }
    await db
      .insert(settings)
      .values({ key: field.key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracoes");
}
