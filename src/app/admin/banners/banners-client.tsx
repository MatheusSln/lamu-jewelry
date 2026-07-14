"use client";

import { useState } from "react";
import Image from "next/image";
import type { banners } from "@/db/schema";
import { saveBannerAction, updateBannerAction, deleteBannerAction } from "./actions";

type Banner = typeof banners.$inferSelect;

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold";

function BannerForm({ banner, onDone }: { banner?: Banner; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      let result;
      if (banner) {
        formData.set("id", banner.id.toString());
        result = await updateBannerAction(formData);
      } else {
        result = await saveBannerAction(formData);
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
    <form onSubmit={handleSubmit} className="p-4 space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded px-3 py-2 text-sm" role="alert">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Imagem (upload)</label>
        <input
          type="file"
          name="newImage"
          accept="image/*"
          className={`${inputClass} file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-cream cursor-pointer`}
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">ou URL da imagem</label>
        <input type="text" name="imageUrl" defaultValue={banner?.imageUrl} placeholder="https://..." className={inputClass} />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Link ao clicar (opcional)</label>
        <input type="text" name="linkUrl" defaultValue={banner?.linkUrl} placeholder="/colares ou https://..." className={inputClass} />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Ordem</label>
          <input type="number" name="sortOrder" defaultValue={banner?.sortOrder ?? 0} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer mt-5">
          <input type="checkbox" name="isActive" defaultChecked={banner ? banner.isActive : true} className="accent-gold w-4 h-4" />
          Ativo
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
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
    </form>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir este banner?")) return;
    setDeleting(true);
    const formData = new FormData();
    formData.set("id", banner.id.toString());
    const result = await deleteBannerAction(formData);
    if (result?.error) {
      alert(result.error);
      setDeleting(false);
    }
  }

  return (
    <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-[21/9] bg-cream-dark w-full">
        <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
      </div>
      {editing ? (
        <BannerForm banner={banner} onDone={() => setEditing(false)} />
      ) : (
        <>
          <div className="p-4 flex flex-col gap-2">
            <p className="text-sm text-ink-soft truncate">Link: {banner.linkUrl || "Nenhum"}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs tracking-widest uppercase text-ink-soft">Ordem: {banner.sortOrder}</span>
              <span className={banner.isActive ? "text-green-600 text-xs font-medium uppercase" : "text-gray-500 text-xs uppercase"}>
                {banner.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
          <div className="mt-auto border-t border-gold-light/30 flex divide-x divide-gold-light/30">
            <button onClick={() => setEditing(true)} className="flex-1 py-2 text-sm text-gold hover:bg-cream transition-colors">
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function BannersManager({ banners }: { banners: Banner[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-ink">Banners da Home</h1>
        <button
          onClick={() => setCreating(!creating)}
          className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors"
        >
          {creating ? "Fechar" : "+ Novo Banner"}
        </button>
      </div>

      {creating && (
        <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm max-w-lg">
          <div className="p-4 border-b border-gold-light/30">
            <h2 className="text-sm tracking-widest uppercase text-ink-soft">Novo Banner</h2>
          </div>
          <BannerForm onDone={() => setCreating(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.length === 0 ? (
          <p className="text-ink-soft">Nenhum banner cadastrado.</p>
        ) : (
          banners.map((b) => <BannerCard key={b.id} banner={b} />)
        )}
      </div>
    </div>
  );
}
