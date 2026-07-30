"use client";

import { useState } from "react";
import { centsToInputText, inputTextToCents } from "@/lib/money";
import { ADMIN_FIELD_SHELL, ADMIN_INPUT_BARE } from "./ui";

/**
 * Campo de dinheiro do admin: a pessoa digita em reais ("159,00") e o valor
 * segue para o banco em centavos inteiros, formato que o schema exige.
 *
 * Dois modos de uso:
 * - com `name`: renderiza um input escondido com os centavos, para quem lê via
 *   FormData (preço do produto, cupom, configurações);
 * - com `onCentsChange`: reporta os centavos para o estado do pai, para quem
 *   serializa em JSON (variações do produto).
 * Os dois podem ser usados juntos.
 *
 * O texto digitado é sempre estado interno — nunca derivado dos centavos a cada
 * render — senão digitar "1," seria reescrito para "1,00" no meio da digitação.
 * Por isso, listas que usam este componente precisam de `key` estável.
 */
export function MoneyInput({
  id,
  name,
  defaultCents,
  onCentsChange,
  allowNegative = false,
  required = false,
  placeholder = "0,00",
  ariaLabel,
  describedBy,
}: {
  id?: string;
  /** Quando presente, cria o input escondido com o valor em centavos. */
  name?: string;
  /** Valor inicial em centavos (número, string do banco, ou vazio). */
  defaultCents?: number | string | null;
  onCentsChange?: (cents: number | null) => void;
  allowNegative?: boolean;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  describedBy?: string;
}) {
  const [text, setText] = useState(() =>
    defaultCents === null || defaultCents === undefined ? "" : centsToInputText(defaultCents),
  );

  const cents = inputTextToCents(text, { allowNegative });

  function handleChange(raw: string) {
    // Mantém só o que pode compor um valor; o "-" apenas no começo.
    const cleaned = allowNegative
      ? raw.replace(/(?!^)-/g, "").replace(/[^\d.,-]/g, "")
      : raw.replace(/[^\d.,]/g, "");
    setText(cleaned);
    onCentsChange?.(inputTextToCents(cleaned, { allowNegative }));
  }

  function handleBlur() {
    // Normaliza o que ficou: "159" vira "159,00"; lixo vira vazio.
    setText(cents === null ? "" : centsToInputText(cents));
  }

  return (
    <>
      <div className={ADMIN_FIELD_SHELL}>
        <span className="shrink-0 select-none border-r border-gold-light/50 pr-2.5 text-sm text-ink-soft">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode={allowNegative ? "text" : "decimal"}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          className={`${ADMIN_INPUT_BARE} tabular-nums`}
        />
      </div>
      {name && <input type="hidden" name={name} value={cents === null ? "" : String(cents)} />}
    </>
  );
}
