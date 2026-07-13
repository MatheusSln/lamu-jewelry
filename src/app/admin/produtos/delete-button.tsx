"use client";

import { useTransition } from "react";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      startTransition(() => {
        const formData = new FormData();
        formData.append("id", id.toString());
        deleteProductAction(formData);
      });
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-500 hover:text-red-700 text-sm tracking-wide disabled:opacity-50 ml-4"
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
