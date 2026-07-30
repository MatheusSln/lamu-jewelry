"use client";

import { useState } from "react";
import { updateOrderAction } from "../actions";
import { ORDER_STATUS_LABELS } from "../status-labels";
import { ADMIN_ALERT_ERROR, ADMIN_ALERT_OK, ADMIN_BTN_PRIMARY, ADMIN_HINT, ADMIN_INPUT, ADMIN_LABEL } from "../../ui";

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
        <div className={ADMIN_ALERT_ERROR} role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className={ADMIN_ALERT_OK} role="status">
          Pedido atualizado.
        </div>
      )}
      <div>
        <label htmlFor="order-status" className={ADMIN_LABEL}>Status</label>
        <select id="order-status" name="status" defaultValue={status} className={ADMIN_INPUT}>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="order-tracking" className={ADMIN_LABEL}>Código de rastreio</label>
        <input
          id="order-tracking"
          type="text"
          name="trackingCode"
          defaultValue={trackingCode ?? ""}
          placeholder="Ex: AA123456789BR"
          className={ADMIN_INPUT}
        />
        <p className={ADMIN_HINT}>A cliente acompanha pelo código público do pedido.</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`w-full ${ADMIN_BTN_PRIMARY}`}
      >
        {pending ? "Salvando..." : "Salvar Alterações"}
      </button>
    </form>
  );
}
