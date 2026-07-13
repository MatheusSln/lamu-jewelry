import { db } from "@/db";
import { banners } from "@/db/schema";
import { asc } from "drizzle-orm";
import Image from "next/image";

export default async function AdminBannersPage() {
  const allBanners = await db.select().from(banners).orderBy(asc(banners.sortOrder));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-ink">Banners da Home</h1>
        <button className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors">
          + Novo Banner
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allBanners.length === 0 ? (
          <p className="text-ink-soft">Nenhum banner cadastrado.</p>
        ) : allBanners.map((b) => (
          <div key={b.id} className="bg-card border border-gold-light/40 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="relative aspect-[21/9] bg-cream-dark w-full">
              <Image src={b.imageUrl} alt="Banner" fill className="object-cover" />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <p className="text-sm text-ink-soft truncate">Link: {b.linkUrl || "Nenhum"}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs tracking-widest uppercase text-ink-soft">Ordem: {b.sortOrder}</span>
                <span className={b.isActive ? "text-green-600 text-xs font-medium uppercase" : "text-gray-500 text-xs uppercase"}>
                  {b.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
            <div className="mt-auto border-t border-gold-light/30 flex divide-x divide-gold-light/30">
              <button className="flex-1 py-2 text-sm text-gold hover:bg-cream transition-colors">Editar</button>
              <button className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
