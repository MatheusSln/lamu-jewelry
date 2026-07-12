export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-dark p-4">
      <div className="w-full max-w-sm bg-card p-8 border border-gold-light/40 shadow-xl rounded-lg text-center">
        <h1 className="text-2xl font-serif text-ink mb-1">Lámu Admin</h1>
        <p className="text-sm text-ink-soft mb-8">Acesse o painel de controle</p>
        
        <form className="space-y-4 text-left" action="/api/auth/login" method="POST">
          <div>
            <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1" htmlFor="email">
              E-mail
            </label>
            <input 
              type="email" 
              id="email"
              name="email"
              required
              className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
              placeholder="contato@lamu.com.br"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-ink-soft mb-1" htmlFor="password">
              Senha
            </label>
            <input 
              type="password" 
              id="password"
              name="password"
              required
              className="w-full bg-transparent border border-gold-light/50 rounded px-4 py-2 text-sm focus:outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-gold hover:bg-gold-dark text-cream font-medium tracking-wider uppercase text-sm py-3 mt-4 transition-colors rounded"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
