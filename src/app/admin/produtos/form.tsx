"use client";

import { useState } from "react";
import type { categories } from "@/db/schema";
import { saveProductAction } from "./actions";

type Category = typeof categories.$inferSelect;

export function ProductForm({ categories, initialData }: { categories: Category[], initialData?: any }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    await saveProductAction(formData);
    setPending(false);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Nome do Produto</label>
          <input 
            type="text" 
            name="name" 
            required
            defaultValue={initialData?.name}
            className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Preço (em centavos)</label>
          <input 
            type="number" 
            name="priceCents" 
            required
            defaultValue={initialData?.priceCents}
            placeholder="Ex: 8990 (R$ 89,90)"
            className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Categoria</label>
          <select 
            name="categoryId" 
            required
            defaultValue={initialData?.categoryId}
            className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">Selecione...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Material</label>
          <select 
            name="material" 
            required
            defaultValue={initialData?.material || "semijoia"}
            className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
          >
            <option value="semijoia">Semijoia</option>
            <option value="prata925">Prata 925</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Descrição</label>
        <textarea 
          name="description" 
          rows={4}
          defaultValue={initialData?.description}
          className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
        ></textarea>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isActive" defaultChecked={initialData ? initialData.isActive : true} className="accent-gold w-4 h-4" />
          Produto Ativo (Visível na loja)
        </label>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isLaunch" defaultChecked={initialData?.isLaunch} className="accent-gold w-4 h-4" />
          É Lançamento?
        </label>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isBestseller" defaultChecked={initialData?.isBestseller} className="accent-gold w-4 h-4" />
          Mais Vendido?
        </label>
      </div>
      
      <div className="border-t border-gold-light/30 pt-6 mt-6 flex justify-end gap-4">
        <button type="button" className="px-6 py-2 border border-gold-light/50 rounded text-sm hover:bg-cream transition-colors text-ink">
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={pending}
          className="bg-gold hover:bg-gold-dark text-cream px-6 py-2 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar Produto"}
        </button>
      </div>
    </form>
  );
}
