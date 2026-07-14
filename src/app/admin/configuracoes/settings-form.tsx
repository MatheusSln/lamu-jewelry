"use client";

import { useState } from "react";
import { saveSettingsAction } from "./actions";
import type { SettingField } from "./fields";

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold";

export function SettingsForm({ fields, values }: { fields: SettingField[]; values: Record<string, string> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await saveSettingsAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    } catch {
      setError("Erro inesperado ao salvar. Tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded px-4 py-3 text-sm" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-300 text-green-800 rounded px-4 py-3 text-sm" role="status">
          Configurações salvas.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f) => (
          <div key={f.key} className={f.multiline ? "md:col-span-2" : ""}>
            <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">{f.label}</label>
            {f.multiline ? (
              <textarea name={f.key} rows={3} defaultValue={values[f.key] ?? ""} className={inputClass} />
            ) : (
              <input
                type={f.numeric ? "number" : "text"}
                name={f.key}
                defaultValue={values[f.key] ?? ""}
                className={inputClass}
              />
            )}
            <p className="text-[11px] text-ink-soft mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gold-light/30 pt-6 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-gold hover:bg-gold-dark text-cream px-6 py-2 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}
