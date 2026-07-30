"use client";

import { useState } from "react";
import { centsToInputText, formatBRL, inputTextToCents } from "@/lib/money";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_ALERT_OK,
  ADMIN_BTN_PRIMARY,
  ADMIN_FIELD_SHELL,
  ADMIN_HINT,
  ADMIN_INPUT,
  ADMIN_INPUT_BARE,
  ADMIN_LABEL,
} from "../ui";
import { saveSettingsAction } from "./actions";
import type { SettingField, SettingSection, SettingWidth } from "./fields";

const WIDTH_CLASS: Record<SettingWidth, string> = {
  full: "md:col-span-6",
  half: "md:col-span-3",
  third: "md:col-span-2",
};

function MoneyField({
  id,
  field,
  initialCents,
}: {
  id: string;
  field: SettingField;
  initialCents: string;
}) {
  const [text, setText] = useState(() => centsToInputText(initialCents));
  const cents = inputTextToCents(text);
  const previewId = `${id}-preview`;
  const hintId = `${id}-hint`;

  return (
    <>
      <div className={ADMIN_FIELD_SHELL}>
        <span className="shrink-0 select-none border-r border-gold-light/50 pr-2.5 text-sm text-ink-soft">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={() => setText(cents === null ? "" : centsToInputText(cents))}
          placeholder="0,00"
          aria-describedby={`${previewId} ${hintId}`}
          className={`${ADMIN_INPUT_BARE} tabular-nums`}
        />
      </div>

      {/* É este valor que vai para o banco: inteiro em centavos, formato inalterado. */}
      <input type="hidden" name={field.key} value={cents === null ? "" : String(cents)} />

      <p id={previewId} aria-live="polite" className="mt-2 text-sm text-ink">
        {cents === null ? (
          <span className="italic text-ink-soft">{field.previewEmpty}</span>
        ) : (
          field.preview?.split("{valor}").map((part, i) => (
            <span key={i}>
              {part}
              {i === 0 && <strong className="font-medium text-gold-dark">{formatBRL(cents)}</strong>}
            </span>
          ))
        )}
      </p>
    </>
  );
}

function FieldRow({ field, value }: { field: SettingField; value: string }) {
  const id = `set-${field.key}`;
  const hintId = `${id}-hint`;

  return (
    <div className={`col-span-1 ${WIDTH_CLASS[field.width]}`}>
      <label htmlFor={id} className={ADMIN_LABEL}>
        {field.label}
      </label>

      {field.kind === "longtext" ? (
        <textarea
          id={id}
          name={field.key}
          rows={field.rows ?? 3}
          defaultValue={value}
          placeholder={field.placeholder}
          aria-describedby={hintId}
          className={`${ADMIN_INPUT} leading-relaxed resize-y`}
        />
      ) : field.kind === "money" ? (
        <MoneyField id={id} field={field} initialCents={value} />
      ) : (
        <div className={ADMIN_FIELD_SHELL}>
          {field.prefix && (
            <span className="shrink-0 select-none border-r border-gold-light/50 pr-2.5 text-sm text-ink-soft">
              {field.prefix}
            </span>
          )}
          <input
            id={id}
            name={field.key}
            type="text"
            inputMode={field.kind === "integer" ? "numeric" : "text"}
            defaultValue={value}
            placeholder={field.placeholder}
            aria-describedby={hintId}
            className={`${ADMIN_INPUT_BARE} ${field.kind === "integer" ? "tabular-nums" : ""}`}
          />
          {field.suffix && (
            <span className="shrink-0 select-none text-xs uppercase tracking-wider text-ink-soft">
              {field.suffix}
            </span>
          )}
        </div>
      )}

      <p id={hintId} className={ADMIN_HINT}>
        {field.hint}
      </p>
    </div>
  );
}

export function SettingsForm({
  sections,
  values,
}: {
  sections: SettingSection[];
  values: Record<string, string>;
}) {
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
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div className={ADMIN_ALERT_ERROR} role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className={ADMIN_ALERT_OK} role="status">
          Configurações salvas.
        </div>
      )}

      {sections.map((section, i) => (
        <section key={section.id} className={i > 0 ? "border-t border-gold-light/30 pt-8" : ""}>
          <h2 className="admin-subtitle text-ink">{section.title}</h2>
          <p className="mt-1 mb-6 max-w-prose text-xs text-ink-soft">{section.description}</p>
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-6">
            {section.fields.map((f) => (
              <FieldRow key={f.key} field={f} value={values[f.key] ?? ""} />
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center justify-end gap-4 border-t border-gold-light/30 pt-6">
        <button type="submit" disabled={pending} className={ADMIN_BTN_PRIMARY}>
          {pending ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}
