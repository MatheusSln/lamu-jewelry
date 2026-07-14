/** Campos editáveis da tabela settings, com rótulo e dica para o formulário do admin. */
export type SettingField = {
  key: string;
  label: string;
  hint: string;
  numeric: boolean;
  multiline?: boolean;
};

export const SETTING_FIELDS: SettingField[] = [
  { key: "promo_bar_text", label: "Texto da barra de promoção", hint: "Aparece no topo da loja.", numeric: false },
  { key: "whatsapp_number", label: "WhatsApp da loja", hint: "Com DDI e DDD, só números. Ex.: 5511999998888", numeric: false },
  { key: "instagram_handle", label: "Instagram", hint: "Sem @. Ex.: lamu.semijoias", numeric: false },
  { key: "origin_cep", label: "CEP de origem (frete)", hint: "CEP de onde os pedidos são enviados, só números.", numeric: false },
  { key: "free_shipping_threshold_cents", label: "Frete grátis a partir de (centavos)", hint: "Ex.: 19900 = R$ 199,00. Vazio desativa.", numeric: true },
  { key: "fallback_shipping_cents", label: "Frete padrão (centavos)", hint: "Usado quando o cálculo por CEP falhar. Ex.: 1500 = R$ 15,00", numeric: true },
  { key: "low_stock_threshold", label: "Alerta de estoque baixo (unidades)", hint: "Mostra aviso 'últimas unidades' na loja.", numeric: true },
  { key: "exchange_policy", label: "Política de trocas", hint: "Texto exibido nas páginas de produto.", numeric: false, multiline: true },
];
