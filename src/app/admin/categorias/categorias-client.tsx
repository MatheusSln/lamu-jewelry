"use client";

import { useState } from "react";
import type { categories } from "@/db/schema";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_LINK,
  ADMIN_LINK_DANGER,
} from "../ui";
import { saveCategoryAction, updateCategoryAction, deleteCategoryAction } from "./actions";

type Category = typeof categories.$inferSelect;

function CategoryForm({
  category,
  parents,
  defaultParentId,
  onDone,
}: {
  category?: Category;
  parents: Category[];
  /** Pré-seleciona a categoria pai ao criar (botão "+ Subcategoria" do bloco). */
  defaultParentId?: number | null;
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
  const idName = category ? `cat-${category.id}-name` : "cat-new-name";
  const idParent = category ? `cat-${category.id}-parent` : "cat-new-parent";
  const idSort = category ? `cat-${category.id}-sort` : "cat-new-sort";

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {error && (
        <div className={ADMIN_ALERT_ERROR} role="alert">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor={idName} className={ADMIN_LABEL}>Nome</label>
          <input id={idName} type="text" name="name" required defaultValue={category?.name} placeholder="Ex: Brincos" className={ADMIN_INPUT} />
        </div>
        <div>
          <label htmlFor={idParent} className={ADMIN_LABEL}>Categoria pai</label>
          <select id={idParent} name="parentId" defaultValue={category?.parentId ?? defaultParentId ?? ""} className={ADMIN_INPUT}>
            <option value="">Nenhuma (categoria principal)</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={idSort} className={ADMIN_LABEL}>Ordem no menu</label>
          <input id={idSort} type="number" name="sortOrder" defaultValue={category?.sortOrder ?? 0} className={ADMIN_INPUT} />
        </div>
      </div>
      <p className="text-xs text-ink-soft">
        A URL (slug) é gerada automaticamente a partir do nome{category ? " e só muda se o nome mudar" : ""}.
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={ADMIN_BTN_GHOST}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={ADMIN_BTN_PRIMARY}>
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

/** Linha de metadado da categoria: no desktop é só o valor; no mobile ganha um rótulo inline. */
function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 text-sm text-ink-soft">
      <span className="mr-1.5 text-[10px] uppercase tracking-[0.15em] text-ink-soft/70 md:hidden">
        {label}
      </span>
      <span className="break-all md:break-normal">{children}</span>
    </div>
  );
}

function productLabel(n: number): string {
  if (n === 0) return "Nenhum produto";
  return n === 1 ? "1 produto" : `${n} produtos`;
}

// Colunas fixas à direita (Slug/Produtos/Ordem/Ações); a coluna do nome absorve
// toda a folga, então pai e filha ficam alinhados mesmo com o nome da filha
// recuado pelo trilho da árvore.
const ROW_GRID = "md:grid md:grid-cols-[minmax(0,1fr)_10rem_11rem_5rem_9rem] md:items-center gap-x-4 gap-y-1";

export function CategoriasManager({
  categories: allCategories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<number, number>;
}) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  /** Categoria pai escolhida pelo botão "+ Subcategoria" de um bloco. */
  const [creatingUnder, setCreatingUnder] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formOpen = creating || creatingUnder !== null || editing !== null;

  function closeForm() {
    setEditing(null);
    setCreating(false);
    setCreatingUnder(null);
  }

  function startSubcategory(parent: Category) {
    setEditing(null);
    setCreating(false);
    setCreatingUnder(parent);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const parents = allCategories.filter((c) => c.parentId === null);
  const blocks = parents.map((parent) => ({
    parent,
    children: allCategories.filter((c) => c.parentId === parent.id),
  }));

  async function handleDelete(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    setDeletingId(c.id);
    const formData = new FormData();
    formData.set("id", c.id.toString());
    const result = await deleteCategoryAction(formData);
    if (result?.error) alert(result.error);
    setDeletingId(null);
  }

  function startEdit(c: Category) {
    setEditing(c);
    setCreating(false);
    setCreatingUnder(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function RowActions({ category }: { category: Category }) {
    return (
      <div className="flex gap-4 whitespace-nowrap pt-1.5 md:justify-end md:pt-0">
        <button onClick={() => startEdit(category)} className={ADMIN_LINK}>
          Editar
        </button>
        <button
          onClick={() => handleDelete(category)}
          disabled={deletingId === category.id}
          className={ADMIN_LINK_DANGER}
        >
          {deletingId === category.id ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="admin-title text-ink">Categorias</h1>
        <button
          onClick={() => (formOpen ? closeForm() : setCreating(true))}
          className={ADMIN_BTN_PRIMARY}
        >
          {formOpen ? "Fechar" : "+ Nova Categoria"}
        </button>
      </div>

      {formOpen && (
        <div className={ADMIN_CARD}>
          <div className="p-4 border-b border-gold-light/30">
            <h2 className="text-sm tracking-widest uppercase text-ink-soft">
              {editing
                ? `Editar categoria ${editing.name}`
                : creatingUnder
                  ? `Nova subcategoria de ${creatingUnder.name}`
                  : "Nova Categoria"}
            </h2>
          </div>
          <CategoryForm
            key={editing?.id ?? (creatingUnder ? `sub-${creatingUnder.id}` : "new")}
            category={editing ?? undefined}
            parents={parents}
            defaultParentId={creatingUnder?.id}
            onDone={closeForm}
          />
        </div>
      )}

      <div className={ADMIN_CARD}>
        {/* Cabeçalho de colunas — só no desktop; no mobile cada linha traz o rótulo embutido */}
        <div className={`${ROW_GRID} hidden border-b border-gold-light/30 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-ink-soft md:grid`}>
          <span>Categoria</span>
          <span>Slug (URL)</span>
          <span>Produtos</span>
          <span>Ordem</span>
          <span className="text-right">Ações</span>
        </div>

        {blocks.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">Nenhuma categoria cadastrada.</p>
        ) : (
          blocks.map(({ parent, children }) => {
            const childProducts = children.reduce((s, c) => s + (productCounts[c.id] ?? 0), 0);

            return (
              <section key={parent.id} className="border-b border-gold-light/30 last:border-b-0">
                {/* Categoria principal */}
                <div className={`${ROW_GRID} bg-cream/45 px-5 py-4`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5">
                      <span className="admin-cat-name text-lg text-ink">{parent.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                        Categoria principal
                      </span>
                    </div>
                    {children.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-ink-soft">
                        {children.length === 1 ? "1 subcategoria" : `${children.length} subcategorias`}
                      </p>
                    )}
                  </div>
                  <Meta label="Slug">/{parent.slug}</Meta>
                  <Meta label="Produtos">
                    {productLabel(productCounts[parent.id] ?? 0)}
                    {childProducts > 0 && (
                      <span className="block text-[11px] text-ink-soft/80">
                        + {childProducts} nas subcategorias
                      </span>
                    )}
                  </Meta>
                  <Meta label="Ordem">{parent.sortOrder}</Meta>
                  <RowActions category={parent} />
                </div>

                {/* Subcategorias */}
                {children.length > 0 ? (
                  <>
                    <p className="cat-branch-head pb-1 pt-3 text-[10px] uppercase tracking-[0.18em] text-gold-dark">
                      Subcategorias de {parent.name}
                    </p>
                    <ul>
                      {children.map((c) => (
                        <li key={c.id} className={`${ROW_GRID} cat-branch-item py-2.5 pr-5 hover:bg-cream/60 transition-colors`}>
                          <span className="min-w-0 text-sm text-ink">{c.name}</span>
                          <Meta label="Slug">/{c.slug}</Meta>
                          <Meta label="Produtos">{productLabel(productCounts[c.id] ?? 0)}</Meta>
                          <Meta label="Ordem">{c.sortOrder}</Meta>
                          <RowActions category={c} />
                        </li>
                      ))}
                    </ul>
                    <div className="pl-10 pr-5 pb-4 pt-2">
                      <button onClick={() => startSubcategory(parent)} className="text-xs text-gold hover:text-gold-dark uppercase tracking-wider">
                        + Adicionar subcategoria em {parent.name}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-5 pb-4 pt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[11px] italic text-ink-soft">Nenhuma subcategoria.</span>
                    <button onClick={() => startSubcategory(parent)} className="text-xs text-gold hover:text-gold-dark uppercase tracking-wider">
                      + Adicionar subcategoria em {parent.name}
                    </button>
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
