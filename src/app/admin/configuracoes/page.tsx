import { db } from "@/db";
import { settings } from "@/db/schema";
import { SETTING_FIELDS } from "./fields";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracoesPage() {
  const rows = await db.select().from(settings);
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-serif text-ink">Configurações da Loja</h1>
      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm p-6">
        <SettingsForm fields={SETTING_FIELDS} values={values} />
      </div>
    </div>
  );
}
