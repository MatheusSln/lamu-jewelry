"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { categories } from "@/db/schema";
import { ADMIN_ALERT_ERROR, ADMIN_BTN_GHOST, ADMIN_BTN_PRIMARY, ADMIN_INPUT, ADMIN_LABEL, ADMIN_LINK_DANGER } from "../ui";
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
  promoPriceCents: number | null;
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
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? []);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants ?? [{ label: "", stock: 0, priceDeltaCents: 0, isDefault: true }]
  );

  // Object URLs dos previews de upload precisam ser revogados no unmount,
  // não só na próxima seleção — senão vazam até a página fechar.
  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    const files = Array.from(e.target.files ?? []);
    setFilePreviews(files.map((f) => URL.createObjectURL(f)));
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
    setError(null);
    const formData = new FormData(e.currentTarget);

    // Anexar as fotos que não estão vazias
    const validPhotos = photos.filter(p => p.trim() !== "");
    formData.set("photos", JSON.stringify(validPhotos));

    // Anexar as variações
    formData.set("variants", JSON.stringify(variants));

    try {
      let result;
      if (initialData?.id) {
        formData.set("id", initialData.id.toString());
        result = await updateProductAction(formData);
      } else {
        result = await saveProductAction(formData);
      }
      if (result?.error) {
        setError(result.error);
      } else {
        // Sucesso: os previews locais não servem mais (as fotos já foram enviadas)
        filePreviews.forEach((url) => URL.revokeObjectURL(url));
        setFilePreviews([]);
      }
    } catch {
      setError("Erro inesperado ao salvar. Verifique a conexão e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {error && (
        <div className={ADMIN_ALERT_ERROR} role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="prod-name" className={ADMIN_LABEL}>Nome do Produto</label>
          <input
            id="prod-name"
            type="text"
            name="name"
            required
            defaultValue={initialData?.name}
            className={ADMIN_INPUT}
          />
        </div>
        <div>
          <label htmlFor="prod-category" className={ADMIN_LABEL}>Categoria</label>
          <select
            id="prod-category"
            name="categoryId"
            required
            defaultValue={initialData?.categoryId}
            className={ADMIN_INPUT}
          >
            <option value="">Selecione...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prod-price" className={ADMIN_LABEL}>Preço (em centavos)</label>
          <input
            id="prod-price"
            type="number"
            name="priceCents"
            required
            min={1}
            defaultValue={initialData?.priceCents}
            placeholder="Ex: 8990 (R$ 89,90)"
            className={ADMIN_INPUT}
          />
        </div>
        <div>
          <label htmlFor="prod-promo-price" className={ADMIN_LABEL}>Preço Promocional (centavos)</label>
          <input
            id="prod-promo-price"
            type="number"
            name="promoPriceCents"
            min={1}
            defaultValue={initialData?.promoPriceCents ?? ""}
            placeholder="Deixe vazio se não houver promoção"
            className={ADMIN_INPUT}
          />
        </div>
        <div>
          <label htmlFor="prod-material" className={ADMIN_LABEL}>Material</label>
          <select
            id="prod-material"
            name="material"
            required
            defaultValue={initialData?.material || "semijoia"}
            className={ADMIN_INPUT}
          >
            <option value="semijoia">Semijoia</option>
            <option value="prata925">Prata 925</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="prod-description" className={ADMIN_LABEL}>Descrição</label>
        <textarea
          id="prod-description"
          name="description"
          rows={4}
          defaultValue={initialData?.description}
          className={ADMIN_INPUT}
        ></textarea>
      </div>

      {/* Seção de Fotos */}
      <div className="border border-gold-light/30 rounded p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] tracking-[0.16em] uppercase text-ink-soft">Fotos do Produto</span>
          <button type="button" onClick={addPhoto} className="text-xs text-gold hover:underline uppercase tracking-wider">
            + Adicionar Foto via URL
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="prod-upload" className="block text-xs font-medium text-ink-soft mb-2">Fazer upload do computador</label>
          <input
            id="prod-upload"
            type="file"
            name="newPhotos"
            multiple
            accept="image/*"
            onChange={handleFilesSelected}
            className={`${ADMIN_INPUT} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-cream hover:file:bg-gold-dark cursor-pointer`}
          />
          <p className="text-[11px] text-ink-soft mt-1">Até 8MB por foto. Elas serão enviadas ao salvar o produto.</p>
          {filePreviews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {filePreviews.map((src, i) => (
                <div key={i} className="w-16 h-16 bg-cream-dark border border-gold-light/30 rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Nova foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-gold-light/20">
          <span className="block text-xs font-medium text-ink-soft">Fotos atuais (URLs)</span>
          {photos.map((p, index) => (
            <div key={index} className="flex gap-2">
              {(p.startsWith('http') || p.startsWith('/')) && (
                 <div className="w-10 h-10 bg-cream-dark border border-gold-light/30 rounded flex-shrink-0 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="Preview" className="w-full h-full object-cover" />
                 </div>
              )}
              <input
                type="text"
                value={p}
                onChange={(e) => updatePhoto(index, e.target.value)}
                placeholder="https://..."
                aria-label={`URL da foto ${index + 1}`}
                className={`flex-1 ${ADMIN_INPUT}`}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                aria-label={`Remover foto ${index + 1}`}
                className="text-danger hover:opacity-70 px-3 border border-danger/30 rounded bg-danger/5"
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
            <span className="text-[11px] tracking-[0.16em] uppercase text-ink-soft">Estoque e Variações</span>
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
                aria-label={`Nome da variação ${index + 1}`}
                className={ADMIN_INPUT}
              />
              <input
                type="number"
                value={v.stock}
                min={0}
                onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value, 10) || 0)}
                placeholder="Estoque"
                title="Quantidade em estoque"
                aria-label={`Estoque da variação ${index + 1}`}
                className={ADMIN_INPUT}
              />
              <input
                type="number"
                value={v.priceDeltaCents}
                onChange={(e) => updateVariant(index, "priceDeltaCents", parseInt(e.target.value, 10) || 0)}
                placeholder="+ R$ 0,00 (centavos)"
                title="Diferença de preço (+ ou - em centavos)"
                aria-label={`Diferença de preço da variação ${index + 1}`}
                className={ADMIN_INPUT}
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                disabled={variants.length === 1}
                aria-label={`Remover variação ${index + 1}`}
                className="text-danger hover:opacity-70 px-3 py-2 border border-danger/30 rounded bg-danger/5 disabled:opacity-30 disabled:cursor-not-allowed"
                title={variants.length === 1 ? "O produto precisa ter pelo menos uma variação" : "Remover"}
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
        <Link href="/admin/produtos" className={ADMIN_BTN_GHOST}>
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className={ADMIN_BTN_PRIMARY}
        >
          {pending ? "Salvando..." : (initialData ? "Atualizar Produto" : "Criar Produto")}
        </button>
      </div>
    </form>
  );
}
