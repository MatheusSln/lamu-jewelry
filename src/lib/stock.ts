/**
 * Limite de "estoque baixo" configurado pela loja (settings.low_stock_threshold),
 * com fallback seguro quando a configuração estiver vazia ou inválida.
 * Usado pela loja (aviso "últimas unidades") e pelo admin (alerta do painel e filtro de produtos).
 */
export function getLowStockThreshold(settings: Record<string, string>): number {
  const n = parseInt(settings.low_stock_threshold ?? "", 10);
  return Number.isInteger(n) && n >= 0 ? n : 3;
}
