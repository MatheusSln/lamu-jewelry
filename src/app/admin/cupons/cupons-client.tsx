"use client";

import { useState } from "react";
import type { coupons } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_LINK,
  ADMIN_LINK_DANGER,
  ADMIN_PILL_ACTIVE,
  ADMIN_PILL_INACTIVE,
} from "../ui";
import { MoneyInput } from "../money-input";
import { saveCouponAction, updateCouponAction, deleteCouponAction } from "./actions";

type Coupon = typeof coupons.$inferSelect;

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function CouponForm({ coupon, onDone }: { coupon?: Coupon; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"percent" | "fixed">(coupon?.type ?? "percent");

  const idPrefix = coupon ? `coupon-${coupon.id}` : "coupon-new";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      let result;
      if (coupon) {
        formData.set("id", coupon.id.toString());
        result = await updateCouponAction(formData);
      } else {
        result = await saveCouponAction(formData);
      }
      if (result?.error) {
        setError(result.error);
      } else {
        onDone();
      }
    } catch {
      setError("Erro inesperado ao salvar. Tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {error && (
        <div className={ADMIN_ALERT_ERROR} role="alert">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-code`} className={ADMIN_LABEL}>Código</label>
          <input id={`${idPrefix}-code`} type="text" name="code" required defaultValue={coupon?.code} placeholder="BEMVINDA10" className={`${ADMIN_INPUT} uppercase`} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-type`} className={ADMIN_LABEL}>Tipo</label>
          <select
            id={`${idPrefix}-type`}
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            className={ADMIN_INPUT}
          >
            <option value="percent">Porcentagem (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-value`} className={ADMIN_LABEL}>
            {type === "percent" ? "Desconto (%)" : "Desconto"}
          </label>
          {type === "percent" ? (
            <input
              // key por tipo: 10 como "10%" e 10 como "R$ 10,00" são coisas
              // diferentes, então trocar o tipo limpa o campo em vez de
              // reinterpretar o número em silêncio.
              key="percent"
              id={`${idPrefix}-value`}
              type="number"
              name="value"
              required
              min={1}
              max={100}
              defaultValue={coupon?.type === "percent" ? coupon.value : ""}
              placeholder="Ex: 10 (= 10%)"
              className={ADMIN_INPUT}
            />
          ) : (
            <MoneyInput
              key="fixed"
              id={`${idPrefix}-value`}
              name="value"
              defaultCents={coupon?.type === "fixed" ? coupon.value : null}
              required
            />
          )}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-min`} className={ADMIN_LABEL}>Pedido mínimo</label>
          <MoneyInput
            id={`${idPrefix}-min`}
            name="minOrderCents"
            defaultCents={coupon?.minOrderCents || null}
            describedBy={`${idPrefix}-min-hint`}
          />
          <p id={`${idPrefix}-min-hint`} className="text-xs text-ink-soft mt-1.5">Vazio = sem mínimo.</p>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-maxuses`} className={ADMIN_LABEL}>Limite de usos</label>
          <input
            id={`${idPrefix}-maxuses`}
            type="number"
            name="maxUses"
            min={1}
            defaultValue={coupon?.maxUses ?? ""}
            placeholder="Vazio = ilimitado"
            className={ADMIN_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-expires`} className={ADMIN_LABEL}>Validade</label>
          <input id={`${idPrefix}-expires`} type="date" name="expiresAt" defaultValue={toDateInputValue(coupon?.expiresAt ?? null)} className={ADMIN_INPUT} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isActive" defaultChecked={coupon ? coupon.isActive : true} className="accent-gold w-4 h-4" />
          Ativo
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onDone} className={ADMIN_BTN_GHOST}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className={ADMIN_BTN_PRIMARY}
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function CuponsManager({ coupons }: { coupons: Coupon[] }) {
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formOpen = creating || editing !== null;

  async function handleDelete(c: Coupon) {
    if (!confirm(`Excluir o cupom ${c.code}?`)) return;
    setDeletingId(c.id);
    const formData = new FormData();
    formData.set("id", c.id.toString());
    const result = await deleteCouponAction(formData);
    if (result?.error) alert(result.error);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="admin-title text-ink">Cupons</h1>
        <button
          onClick={() => { setCreating(!creating); setEditing(null); }}
          className={ADMIN_BTN_PRIMARY}
        >
          {formOpen ? "Fechar" : "+ Novo Cupom"}
        </button>
      </div>

      {formOpen && (
        <div className={ADMIN_CARD}>
          <div className="p-4 border-b border-gold-light/30">
            <h2 className="text-sm tracking-widest uppercase text-ink-soft">
              {editing ? `Editar cupom ${editing.code}` : "Novo Cupom"}
            </h2>
          </div>
          <CouponForm
            key={editing?.id ?? "new"}
            coupon={editing ?? undefined}
            onDone={() => { setEditing(null); setCreating(false); }}
          />
        </div>
      )}

      <div className={ADMIN_CARD}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Usos</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-ink-soft">Nenhum cupom encontrado.</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="border-b border-gold-light/20 hover:bg-cream/50">
                  <td className="py-3 px-4 font-medium">{c.code}</td>
                  <td className="py-3 px-4 text-ink-soft">{c.type === "percent" ? "Porcentagem" : "Fixo"}</td>
                  <td className="py-3 px-4 text-ink-soft">
                    {c.type === "percent" ? `${c.value}%` : formatBRL(c.value)}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : ""}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {c.expiresAt ? c.expiresAt.toLocaleDateString("pt-BR") : "Sem validade"}
                  </td>
                  <td className="py-3 px-4">
                    {c.isActive ? (
                       <span className={ADMIN_PILL_ACTIVE}>Ativo</span>
                    ) : (
                       <span className={ADMIN_PILL_INACTIVE}>Inativo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => { setEditing(c); setCreating(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={ADMIN_LINK}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      className={`${ADMIN_LINK_DANGER} ml-4`}
                    >
                      {deletingId === c.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
