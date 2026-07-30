/**
 * Tokens de estilo compartilhados do admin. Strings simples (sem JSX, sem
 * "use client") para poderem ser importadas por server e client components,
 * no mesmo espírito de `pedidos/status-labels.ts`.
 *
 * Propositalmente NÃO viram classes em globals.css: Tailwind v4 emite todo
 * utilitário dentro de `@layer utilities`, e uma classe fora de layer vence
 * qualquer coisa dentro de layer — então um "admin-input" no CSS global não
 * poderia ser sobrescrito por nenhum utilitário no call site. Mantendo tudo
 * como strings de utilitário, a ordem normal do Tailwind continua valendo.
 */

export const ADMIN_CARD = "bg-card border border-gold-light/40 rounded-lg shadow-sm";

export const ADMIN_LABEL = "block text-[11px] tracking-[0.16em] uppercase text-ink-soft mb-1.5";

export const ADMIN_HINT = "text-xs text-ink-soft/90 mt-1.5 leading-relaxed";

/** Moldura do campo: carrega borda + estado de foco. Usar com ADMIN_INPUT_BARE dentro — não concatenar com ADMIN_INPUT. */
export const ADMIN_FIELD_SHELL =
  "flex items-center gap-2.5 bg-transparent border border-gold-light/60 rounded-md px-3.5 py-2.5 " +
  "transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20";

/** Controle sem borda própria, para viver dentro de ADMIN_FIELD_SHELL. */
export const ADMIN_INPUT_BARE =
  "w-full min-w-0 bg-transparent text-base text-ink placeholder:text-ink-soft/50 focus:outline-none";

/** Controle com borda própria (textarea, select, input avulso). text-base evita zoom automático no iOS. */
export const ADMIN_INPUT =
  "w-full bg-transparent text-base text-ink placeholder:text-ink-soft/50 " +
  "border border-gold-light/60 rounded-md px-3.5 py-2.5 " +
  "transition-colors focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export const ADMIN_BTN_PRIMARY =
  "bg-gold hover:bg-gold-dark text-cream px-6 py-2.5 rounded-md text-sm tracking-[0.14em] uppercase " +
  "transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold/40";

export const ADMIN_BTN_GHOST =
  "px-6 py-2.5 border border-gold-light/60 rounded-md text-sm text-ink hover:bg-cream transition-colors";

export const ADMIN_LINK = "text-sm tracking-wide text-gold hover:text-gold-dark";

export const ADMIN_LINK_DANGER = "text-sm tracking-wide text-danger hover:opacity-70 disabled:opacity-50";

export const ADMIN_ALERT_ERROR = "bg-danger/10 border border-danger/40 text-danger rounded-md px-4 py-3 text-sm";

export const ADMIN_ALERT_OK = "bg-success/10 border border-success/40 text-success rounded-md px-4 py-3 text-sm";

/** Pill de ativo/inativo, reutilizado por produtos e cupons. */
export const ADMIN_PILL_ACTIVE = "bg-success/15 text-success px-2 py-1 rounded text-xs uppercase tracking-wider";
export const ADMIN_PILL_INACTIVE = "bg-ink-soft/15 text-ink-soft px-2 py-1 rounded text-xs uppercase tracking-wider";
