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
    // A mensagem muda por ambiente: na Vercel o .env.local não existe, então
    // mandar o admin editar arquivo local seria instrução errada.
    const naVercel = Boolean(process.env.VERCEL);
    return {
      error: naVercel
        ? "Upload de imagens não configurado neste site: falta a variável BLOB_READ_WRITE_TOKEN. " +
          "No painel da Vercel, abra Storage, crie ou selecione um Blob Store, use \"Connect Project\" " +
          "para ligá-lo a este projeto (marcando Production) e faça um novo deploy. " +
          "Enquanto isso, dá para cadastrar a foto pelo campo de URL."
        : "Upload de imagens não configurado neste ambiente: falta BLOB_READ_WRITE_TOKEN no .env.local " +
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
    try {
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      });
      urls.push(blob.url);
    } catch (err) {
      // Token inválido/expirado ou falha de rede caem aqui. Sem este catch o
      // erro sobe como exceção e o formulário mostra só "erro inesperado".
      console.error("Falha ao enviar imagem para o Vercel Blob:", err);
      const detalhe = err instanceof Error ? err.message : "erro desconhecido";

      // Caso específico e recorrente: store criado com acesso privado. As fotos
      // da loja precisam ser públicas — são exibidas para qualquer visitante.
      if (/private store|private access/i.test(detalhe)) {
        return {
          error:
            "O Blob Store da Vercel está configurado como privado, e as fotos da loja " +
            "precisam ser públicas para aparecerem para as clientes. No painel da Vercel, " +
            "em Storage, crie um Blob Store com acesso Public (ou troque o acesso do atual), " +
            "conecte-o a este projeto e faça um novo deploy. " +
            "Enquanto isso, dá para cadastrar a foto pelo campo de URL.",
        };
      }

      return {
        error:
          `Não foi possível enviar "${file.name}" (${detalhe}). ` +
          "Se o problema persistir, confira o Blob Store no painel da Vercel. " +
          "Enquanto isso, dá para cadastrar a foto pelo campo de URL.",
      };
    }
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
