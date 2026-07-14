"use client";

import { useState } from "react";
import type { categories } from "@/db/schema";
import { saveCategoryAction, updateCategoryAction, deleteCategoryAction } from "./actions";

type Category = typeof categories.$inferSelect;

const inputClass =
  "w-full bg-transparent border border-gold-light/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold";

function CategoryForm({
  category,
  parents,
  onDone,
}: {
  category?: Category;
  parents: Category[];
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      let result;
      if (category) {
        formData.set("id", category.id.toString());
        result = await updateCategoryAction(formData);
      } else {
        result = await saveCategoryAction(formData);
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

  // Uma categoria não pode ser pai de si mesma
  const parentOptions = parents.filter((p) => p.id !== category?.id);

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded px-3 py-2 text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Nome</label>
          <input type="text" name="name" required defaultValue={category?.name} placeholder="Ex: Brincos" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Categoria pai</label>
          <select name="parentId" defaultValue={category?.parentId ?? ""} className={inputClass}>
            <option value="">Nenhuma (categoria principal)</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1">Ordem no menu</label>
          <input type="number" name="sortOrder" defaultValue={category?.sortOrder ?? 0} className={inputClass} />
        </div>
      </div>
      <p className="text-[11px] text-ink-soft">
        A URL (slug) é gerada automaticamente a partir do nome{category ? " e só muda se o nome mudar" : ""}.
      </p>
      <div className="flex justify-end gap-2">
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

export function CategoriasManager({
  categories: allCategories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<number, number>;
}) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formOpen = creating || editing !== null;
  const parents = allCategories.filter((c) => c.parentId === null);

  // Ordena: cada pai seguido das suas filhas
  const ordered: (Category & { isChild: boolean })[] = [];
  for (const parent of parents) {
    ordered.push({ ...parent, isChild: false });
    for (const child of allCategories.filter((c) => c.parentId === parent.id)) {
      ordered.push({ ...child, isChild: true });
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    setDeletingId(c.id);
    const formData = new FormData();
    formData.set("id", c.id.toString());
    const result = await deleteCategoryAction(formData);
    if (result?.error) alert(result.error);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-ink">Categorias</h1>
        <button
          onClick={() => { setCreating(!creating); setEditing(null); }}
          className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors"
        >
          {formOpen ? "Fechar" : "+ Nova Categoria"}
        </button>
      </div>

      {formOpen && (
        <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gold-light/30">
            <h2 className="text-sm tracking-widest uppercase text-ink-soft">
              {editing ? `Editar categoria ${editing.name}` : "Nova Categoria"}
            </h2>
          </div>
          <CategoryForm
            key={editing?.id ?? "new"}
            category={editing ?? undefined}
            parents={parents}
            onDone={() => { setEditing(null); setCreating(false); }}
          />
        </div>
      )}

      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Slug (URL)</th>
                <th className="py-3 px-4">Produtos</th>
                <th className="py-3 px-4">Ordem</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordered.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-ink-soft">Nenhuma categoria cadastrada.</td></tr>
              ) : ordered.map((c) => (
                <tr key={c.id} className="border-b border-gold-light/20 hover:bg-cream/50">
                  <td className="py-3 px-4 font-medium">
                    {c.isChild && <span className="text-ink-soft mr-2">└</span>}
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">/{c.slug}</td>
                  <td className="py-3 px-4 text-ink-soft">{productCounts[c.id] ?? 0}</td>
                  <td className="py-3 px-4 text-ink-soft">{c.sortOrder}</td>
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
