"use client";

import { useTransition } from "react";
import { deleteProductAction } from "./actions";
import { ADMIN_LINK_DANGER } from "../ui";

export function DeleteProductButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("id", id.toString());
        const result = await deleteProductAction(formData);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`${ADMIN_LINK_DANGER} ml-4`}
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
