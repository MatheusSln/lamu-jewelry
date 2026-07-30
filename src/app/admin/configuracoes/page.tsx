import { db } from "@/db";
import { settings } from "@/db/schema";
import { ADMIN_CARD } from "../ui";
import { SETTING_SECTIONS } from "./fields";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracoesPage() {
  const rows = await db.select().from(settings);
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="admin-title text-ink">Configurações da Loja</h1>
      <div className={`${ADMIN_CARD} p-6 md:p-8`}>
        <SettingsForm sections={SETTING_SECTIONS} values={values} />
      </div>
    </div>
  );
}
