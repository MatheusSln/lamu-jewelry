"use client";

import { useState } from "react";
import type { categories } from "@/db/schema";
import { saveProductAction, updateProductAction } from "./actions";

type Category = typeof categories.$inferSelect;

export type VariantData = {
  id?: number;
  label: string;
  stock: number;
  priceDeltaCents: number;
  isDefault: boolean;
};

export type ProductInitialData = {
  id?: number;
  name: string;
  priceCents: number;
  categoryId: number;
  material: "semijoia" | "prata925";
  description: string;
  isActive: boolean;
  isLaunch: boolean;
  isBestseller: boolean;
  photos: string[];
  variants: VariantData[];
};

export function ProductForm({ categories, initialData }: { categories: Category[], initialData?: ProductInitialData }) {
  const [pending, setPending] = useState(false);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? [""]);
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants ?? [{ label: "", stock: 0, priceDeltaCents: 0, isDefault: true }]
  );

  function addPhoto() {
    setPhotos([...photos, ""]);
  }

  function updatePhoto(index: number, value: string) {
    const newPhotos = [...photos];
    newPhotos[index] = value;
    setPhotos(newPhotos);
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  function addVariant() {
    setVariants([...variants, { label: "", stock: 0, priceDeltaCents: 0, isDefault: false }]);
  }

  function updateVariant(index: number, field: keyof VariantData, value: string | number) {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    
    // Anexar as fotos que não estão vazias
    const validPhotos = photos.filter(p => p.trim() !== "");
    formData.set("photos", JSON.stringify(validPhotos));

    // Anexar as variações
    formData.set("variants", JSON.stringify(variants));

    if (initialData?.id) {
      formData.set("id", initialData.id.toString());
      await updateProductAction(formData);
    } else {
      await saveProductAction(formData);
    }
    
    setPending(false);
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
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

      {/* Seção de Fotos */}
      <div className="border border-gold-light/30 rounded p-4">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-xs tracking-widest uppercase text-ink-soft">Fotos do Produto</label>
          <button type="button" onClick={addPhoto} className="text-xs text-gold hover:underline uppercase tracking-wider">
            + Adicionar Foto via URL
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-ink-soft mb-2">Fazer upload do computador (Vercel Blob)</label>
          <input 
            type="file" 
            name="newPhotos" 
            multiple 
            accept="image/*"
            className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-cream hover:file:bg-gold-dark cursor-pointer"
          />
          <p className="text-[11px] text-ink-soft mt-1">Selecione uma ou mais fotos do seu computador. Elas serão salvas no Vercel Blob.</p>
        </div>

        <div className="space-y-3 pt-4 border-t border-gold-light/20">
          <label className="block text-xs font-medium text-ink-soft">URLs existentes ou coladas</label>
          {photos.map((p, index) => (
            <div key={index} className="flex gap-2">
              {p.startsWith('http') && (
                 <div className="w-10 h-10 bg-cream-dark border border-gold-light/30 rounded flex-shrink-0 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="Preview" className="w-full h-full object-cover" />
                 </div>
              )}
              <input 
                type="url" 
                value={p}
                onChange={(e) => updatePhoto(index, e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <button 
                type="button" 
                onClick={() => removePhoto(index)}
                className="text-red-500 hover:text-red-700 px-3 border border-red-200 rounded bg-red-50/10"
              >
                X
              </button>
            </div>
          ))}
          {photos.length === 0 && <p className="text-sm text-ink-soft">Nenhuma foto adicionada.</p>}
        </div>
      </div>

      {/* Seção de Variações/Estoque */}
      <div className="border border-gold-light/30 rounded p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-ink-soft">Estoque e Variações</label>
            <p className="text-[11px] text-ink-soft mt-1">
              Deixe o nome em branco se o produto não tem tamanhos ou cores diferentes.
            </p>
          </div>
          <button type="button" onClick={addVariant} className="text-xs text-gold hover:underline uppercase tracking-wider">
            + Adicionar Variação
          </button>
        </div>
        
        <div className="space-y-4">
          {variants.map((v, index) => (
            <div key={index} className="grid grid-cols-[1fr_100px_120px_auto] gap-2 items-center">
              <input 
                type="text" 
                value={v.label}
                onChange={(e) => updateVariant(index, "label", e.target.value)}
                placeholder={v.isDefault ? "Variação padrão (ex: Único)" : "Nome (ex: Tam. 16)"}
                className="w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <input 
                type="number" 
                value={v.stock}
                onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value, 10) || 0)}
                placeholder="Estoque"
                title="Quantidade em estoque"
                className="w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <input 
                type="number" 
                value={v.priceDeltaCents}
                onChange={(e) => updateVariant(index, "priceDeltaCents", parseInt(e.target.value, 10) || 0)}
                placeholder="+ R$ 0,00 (centavos)"
                title="Diferença de preço (+ ou - em centavos)"
                className="w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <button 
                type="button" 
                onClick={() => removeVariant(index)}
                disabled={v.isDefault && variants.length === 1}
                className="text-red-500 hover:text-red-700 px-3 py-2 border border-red-200 rounded bg-red-50/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title={v.isDefault && variants.length === 1 ? "O produto precisa ter pelo menos uma variação" : "Remover"}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 border border-gold-light/30 rounded p-4">
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isActive" defaultChecked={initialData ? initialData.isActive : true} className="accent-gold w-4 h-4" />
          Visível na Loja
        </label>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isLaunch" defaultChecked={initialData?.isLaunch} className="accent-gold w-4 h-4" />
          Lançamento
        </label>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" name="isBestseller" defaultChecked={initialData?.isBestseller} className="accent-gold w-4 h-4" />
          Mais Vendido
        </label>
      </div>
      
      <div className="border-t border-gold-light/30 pt-6 flex justify-end gap-4">
        <button type="button" onClick={() => window.history.back()} className="px-6 py-2 border border-gold-light/50 rounded text-sm hover:bg-cream transition-colors text-ink">
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={pending}
          className="bg-gold hover:bg-gold-dark text-cream px-6 py-2 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : (initialData ? "Atualizar Produto" : "Criar Produto")}
        </button>
      </div>
    </form>
  );
}
