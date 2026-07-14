import { put, del } from "@vercel/blob";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB por arquivo

/**
 * Sobe arquivos de imagem vindos de um FormData para o Vercel Blob.
 * Retorna as URLs públicas ou uma mensagem de erro amigável.
 */
export async function uploadImages(
  entries: FormDataEntryValue[],
): Promise<{ urls: string[] } | { error: string }> {
  const files = entries.filter(
    (f): f is File => f instanceof File && f.size > 0,
  );
  if (files.length === 0) return { urls: [] };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "Upload de imagens não configurado neste ambiente: falta BLOB_READ_WRITE_TOKEN no .env.local " +
        "(copie de Vercel → Storage → Blob → .env.local). Enquanto isso, use o campo de URL.",
    };
  }

  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { error: `"${file.name}" não é uma imagem.` };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { error: `"${file.name}" passa de 8MB. Reduza a imagem e tente de novo.` };
    }
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    urls.push(blob.url);
  }
  return { urls };
}

/** Apaga do Vercel Blob as URLs que forem do Blob; ignora as demais e qualquer falha. */
export async function deleteBlobImages(urls: string[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const blobUrls = urls.filter((u) => u.includes(".blob.vercel-storage.com/"));
  if (blobUrls.length === 0) return;
  try {
    await del(blobUrls);
  } catch {
    // Falha ao limpar storage não deve travar a operação principal
  }
}
