"use client";

import { useState } from "react";
import type { coupons } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { saveCouponAction, updateCouponAction, deleteCouponAction } from "./actions";

type Coupon = typeof coupons.$inferSelect;

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold";

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function CouponForm({ coupon, onDone }: { coupon?: Coupon; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"percent" | "fixed">(coupon?.type ?? "percent");

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
        <div className="bg-red-50 border border-red-300 text-red-800 rounded px-3 py-2 text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Código</label>
          <input type="text" name="code" required defaultValue={coupon?.code} placeholder="BEMVINDA10" className={`${inputClass} uppercase`} />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Tipo</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            className={inputClass}
          >
            <option value="percent">Porcentagem (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">
            {type === "percent" ? "Desconto (%)" : "Desconto (centavos)"}
          </label>
          <input
            type="number"
            name="value"
            required
            min={1}
            defaultValue={coupon?.value}
            placeholder={type === "percent" ? "Ex: 10 (= 10%)" : "Ex: 1500 (= R$ 15,00)"}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Pedido mínimo (centavos)</label>
          <input
            type="number"
            name="minOrderCents"
            min={0}
            defaultValue={coupon?.minOrderCents || ""}
            placeholder="Vazio = sem mínimo"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Limite de usos</label>
          <input
            type="number"
            name="maxUses"
            min={1}
            defaultValue={coupon?.maxUses ?? ""}
            placeholder="Vazio = ilimitado"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Validade</label>
          <input type="date" name="expiresAt" defaultValue={toDateInputValue(coupon?.expiresAt ?? null)} className={inputClass} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isActive" defaultChecked={coupon ? coupon.isActive : true} className="accent-gold w-4 h-4" />
          Ativo
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onDone} className="px-4 py-2 border border-gold-light/50 rounded text-sm text-ink hover:bg-cream transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
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
        <h1 className="text-2xl font-serif text-ink">Cupons</h1>
        <button
          onClick={() => { setCreating(!creating); setEditing(null); }}
          className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors"
        >
          {formOpen ? "Fechar" : "+ Novo Cupom"}
        </button>
      </div>

      {formOpen && (
        <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
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

      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
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
                       <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Ativo</span>
                    ) : (
                       <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Inativo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => { setEditing(c); setCreating(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="text-gold hover:text-gold-dark text-sm tracking-wide"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      className="text-red-500 hover:text-red-700 text-sm tracking-wide disabled:opacity-50 ml-4"
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
