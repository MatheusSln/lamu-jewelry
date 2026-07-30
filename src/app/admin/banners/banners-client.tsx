"use client";

import { useState } from "react";
import Image from "next/image";
import type { banners } from "@/db/schema";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "../ui";
import { saveBannerAction, updateBannerAction, deleteBannerAction } from "./actions";

type Banner = typeof banners.$inferSelect;

function BannerForm({ banner, onDone }: { banner?: Banner; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idPrefix = banner ? `banner-${banner.id}` : "banner-new";

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
        <div className={ADMIN_ALERT_ERROR} role="alert">
          {error}
        </div>
      )}
      <div>
        <label htmlFor={`${idPrefix}-upload`} className={ADMIN_LABEL}>Imagem (upload)</label>
        <input
          id={`${idPrefix}-upload`}
          type="file"
          name="newImage"
          accept="image/*"
          className={`${ADMIN_INPUT} file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-cream cursor-pointer`}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-url`} className={ADMIN_LABEL}>ou URL da imagem</label>
        <input id={`${idPrefix}-url`} type="text" name="imageUrl" defaultValue={banner?.imageUrl} placeholder="https://..." className={ADMIN_INPUT} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-link`} className={ADMIN_LABEL}>Link ao clicar (opcional)</label>
        <input id={`${idPrefix}-link`} type="text" name="linkUrl" defaultValue={banner?.linkUrl} placeholder="/colares ou https://..." className={ADMIN_INPUT} />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor={`${idPrefix}-order`} className={ADMIN_LABEL}>Ordem</label>
          <input id={`${idPrefix}-order`} type="number" name="sortOrder" defaultValue={banner?.sortOrder ?? 0} className={ADMIN_INPUT} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer mt-5">
          <input type="checkbox" name="isActive" defaultChecked={banner ? banner.isActive : true} className="accent-gold w-4 h-4" />
          Ativo
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
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
    <div className={`${ADMIN_CARD} overflow-hidden flex flex-col`}>
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
              <span className={banner.isActive ? "text-success text-xs font-medium uppercase" : "text-ink-soft text-xs uppercase"}>
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
              className="flex-1 py-2 text-sm text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
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
        <h1 className="admin-title text-ink">Banners da Home</h1>
        <button
          onClick={() => setCreating(!creating)}
          className={ADMIN_BTN_PRIMARY}
        >
          {creating ? "Fechar" : "+ Novo Banner"}
        </button>
      </div>

      {creating && (
        <div className={`${ADMIN_CARD} max-w-lg`}>
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
