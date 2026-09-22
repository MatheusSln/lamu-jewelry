"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    if (status) params.set("status", status);

    router.push(`/perfil?${params.toString()}`);
  };

  const handleClear = () => {
    setStart("");
    setEnd("");
    setStatus("");
    router.push("/perfil");
  };

  return (
    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Data Inicial</label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Data Final</label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Todos</option>
          <option value="aguardando_pagamento">Aguardando Pagamento</option>
          <option value="pago">Pago</option>
          <option value="separando">Separando</option>
          <option value="enviado">Enviado</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div className="flex gap-2 ml-auto">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
        >
          Limpar
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-medium text-white bg-black rounded hover:bg-gray-800"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
}
