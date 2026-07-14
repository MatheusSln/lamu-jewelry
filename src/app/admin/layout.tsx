"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-cream-dark">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-ink/20 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-card border-r border-gold-light/40 w-64 transform transition-transform z-50 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`}
      >
        <div className="p-6 border-b border-gold-light/30 flex justify-between items-center">
          <Link href="/admin" className="text-gold tracking-[0.15em] uppercase font-bold text-lg">
            Lámu Admin
          </Link>
          <button className="md:hidden text-ink" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-4 space-y-2 text-sm tracking-wide">
          <Link href="/admin" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/produtos" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Produtos
          </Link>
          <Link href="/admin/categorias" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Categorias
          </Link>
          <Link href="/admin/pedidos" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Pedidos
          </Link>
          <Link href="/admin/cupons" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Cupons
          </Link>
          <Link href="/admin/banners" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Banners
          </Link>
          <Link href="/admin/configuracoes" className="block px-4 py-2 text-ink hover:bg-cream hover:text-gold rounded transition-colors">
            Configurações
          </Link>
          <hr className="border-gold-light/30 my-4" />
          <Link href="/" className="block px-4 py-2 text-ink-soft hover:text-ink transition-colors">
            Ver Loja ↗
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-card border-b border-gold-light/30 h-16 flex items-center px-4 shrink-0 md:hidden">
          <button 
            className="text-ink p-2" 
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="ml-4 text-gold font-medium uppercase tracking-[0.15em] text-sm">Lámu Admin</span>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
