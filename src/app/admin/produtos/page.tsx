import Link from "next/link";

export default function AdminProdutosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-serif text-ink">Produtos</h1>
        <button className="bg-gold hover:bg-gold-dark text-cream px-4 py-2 text-sm tracking-widest uppercase transition-colors">
          + Novo Produto
        </button>
      </div>

      <div className="bg-card border border-gold-light/40 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gold-light/30 flex gap-4">
          <input 
            type="search" 
            placeholder="Buscar produtos..." 
            className="flex-1 max-w-sm bg-transparent border border-gold-light/50 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gold"
          />
          <select className="bg-transparent border border-gold-light/50 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gold">
            <option value="">Todas as categorias</option>
            <option value="brincos">Brincos</option>
            <option value="colares">Colares</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4 w-12"></th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Preço</th>
                <th className="py-3 px-4">Estoque</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Fake data for now */}
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gold-light/20 hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 bg-cream-dark rounded"></div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-ink">Argola Dourada Média {i}</p>
                    <p className="text-xs text-ink-soft">SKU: ARG-M-{i}</p>
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    R$ 89,90
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    12 un.
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Ativo</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-gold hover:text-gold-dark text-sm tracking-wide">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gold-light/30 flex justify-between items-center text-sm text-ink-soft">
          <span>Mostrando 1 a 3 de 24 produtos</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gold-light/50 rounded hover:bg-cream disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 border border-gold-light/50 rounded hover:bg-cream">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
