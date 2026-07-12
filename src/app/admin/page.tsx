export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-ink mb-2">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm">
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Vendas do Mês</h2>
          <p className="text-3xl font-serif text-gold">R$ 15.240,00</p>
          <p className="text-xs text-ink-soft mt-2">+12% em relação ao mês anterior</p>
        </div>
        <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm">
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Pedidos Pendentes</h2>
          <p className="text-3xl font-serif text-gold">8</p>
          <p className="text-xs text-ink-soft mt-2">Aguardando envio</p>
        </div>
        <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm">
          <h2 className="text-sm tracking-widest uppercase text-ink-soft mb-2">Estoque Baixo</h2>
          <p className="text-3xl font-serif text-gold">3</p>
          <p className="text-xs text-ink-soft mt-2">Produtos precisam de reposição</p>
        </div>
      </div>
      
      <div className="bg-card p-6 border border-gold-light/40 rounded-lg shadow-sm mt-8">
        <h2 className="text-lg font-serif text-ink mb-4">Últimos Pedidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gold-light/30 text-xs tracking-widest uppercase text-ink-soft">
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Fake data for now */}
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gold-light/20 hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">LM-8F3K{i}</td>
                  <td className="py-3 px-4 text-ink-soft">Maria Oliveira</td>
                  <td className="py-3 px-4">
                    <span className="bg-gold-light/30 text-gold-dark px-2 py-1 rounded text-xs uppercase tracking-wider">Pago</span>
                  </td>
                  <td className="py-3 px-4 text-ink-soft">R$ 149,90</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
