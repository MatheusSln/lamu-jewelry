"use client";

import { useState } from "react";
import { updateOrderAction } from "../actions";
import { ORDER_STATUS_LABELS } from "../status-labels";

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold";

export function OrderStatusForm({
  orderId,
  status,
  trackingCode,
}: {
  orderId: number;
  status: string;
  trackingCode: string | null;
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
    formData.set("id", orderId.toString());
    try {
      const result = await updateOrderAction(formData);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded px-3 py-2 text-sm" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-300 text-green-800 rounded px-3 py-2 text-sm" role="status">
          Pedido atualizado.
        </div>
      )}
      <div>
        <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Status</label>
        <select name="status" defaultValue={status} className={inputClass}>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Código de rastreio</label>
        <input
          type="text"
          name="trackingCode"
          defaultValue={trackingCode ?? ""}
          placeholder="Ex: AA123456789BR"
          className={inputClass}
        />
        <p className="text-[11px] text-ink-soft mt-1">A cliente acompanha pelo código público do pedido.</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gold hover:bg-gold-dark text-cream px-4 py-2 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar Alterações"}
      </button>
    </form>
  );
}
