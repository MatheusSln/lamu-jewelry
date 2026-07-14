/** Rótulos e cores por status de pedido, compartilhados entre listagem e detalhe. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  aguardando_confirmacao: "Aguardando confirmação",
  pago: "Pago",
  separando: "Separando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_STYLES: Record<string, string> = {
  aguardando_pagamento: "bg-yellow-100 text-yellow-800",
  aguardando_confirmacao: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  separando: "bg-blue-100 text-blue-800",
  enviado: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-gray-200 text-gray-700",
};
