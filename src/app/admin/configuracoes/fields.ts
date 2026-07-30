/** Campos editáveis da tabela settings, agrupados em seções para o formulário do admin. */

export type SettingKind = "text" | "longtext" | "money" | "integer";

/** Largura do campo na grade de 6 colunas da seção: full = 6, half = 3, third = 2. */
export type SettingWidth = "full" | "half" | "third";

export type SettingField = {
  key: string;
  label: string;
  hint: string;
  kind: SettingKind;
  width: SettingWidth;
  /** Texto fixo dentro do campo, à esquerda. Ex.: "+55", "@". Não faz parte do valor salvo. */
  prefix?: string;
  /** Texto fixo dentro do campo, à direita. Ex.: "un.". */
  suffix?: string;
  placeholder?: string;
  /** Só para kind === "longtext". */
  rows?: number;
  /** Só para kind === "money": frase de conferência, com {valor} no lugar do valor formatado. */
  preview?: string;
  /** Só para kind === "money": frase mostrada quando o campo está vazio. */
  previewEmpty?: string;
};

export type SettingSection = {
  id: string;
  title: string;
  description: string;
  fields: SettingField[];
};

export const SETTING_SECTIONS: SettingSection[] = [
  {
    id: "identidade",
    title: "Identidade e contato",
    description: "O que aparece no topo da loja e como as clientes falam com você.",
    fields: [
      {
        key: "promo_bar_text",
        label: "Texto da barra de promoção",
        hint: "Frase da faixa no topo de todas as páginas. A loja exibe em letras maiúsculas.",
        kind: "longtext",
        width: "full",
        rows: 2,
        placeholder: "PIX NA LOJA TODA • ENVIAMOS PARA TODO O BRASIL",
      },
      {
        key: "whatsapp_number",
        label: "WhatsApp da loja",
        hint: "DDD + número, só dígitos. O +55 já está incluído.",
        kind: "text",
        width: "half",
        prefix: "+55",
        placeholder: "11999998888",
      },
      {
        key: "instagram_handle",
        label: "Instagram",
        hint: "Só o nome do perfil, sem o @.",
        kind: "text",
        width: "half",
        prefix: "@",
        placeholder: "lamu.semijoias",
      },
    ],
  },
  {
    id: "frete",
    title: "Frete",
    description: "Quanto custa a entrega e quando ela sai de graça.",
    fields: [
      {
        key: "free_shipping_threshold_cents",
        label: "Frete grátis a partir de",
        hint: "Deixe vazio para não oferecer frete grátis.",
        kind: "money",
        width: "third",
        preview: "Frete grátis em compras de {valor} ou mais.",
        previewEmpty: "Frete grátis desativado.",
      },
      {
        key: "fallback_shipping_cents",
        label: "Frete padrão",
        hint: "Valor cobrado na entrega padrão.",
        kind: "money",
        width: "third",
        preview: "A loja vai cobrar {valor} de frete.",
        previewEmpty: "Sem valor: a loja vai cobrar R$ 0,00 de frete.",
      },
      {
        key: "origin_cep",
        label: "CEP de origem",
        hint: "CEP de onde você despacha os pedidos. Ainda não é usado no cálculo do frete.",
        kind: "text",
        width: "third",
        placeholder: "01001000",
      },
    ],
  },
  {
    id: "estoque",
    title: "Estoque e políticas",
    description: "Avisos de estoque baixo e o texto de trocas exibido na loja.",
    fields: [
      {
        key: "low_stock_threshold",
        label: "Alerta de estoque baixo",
        hint: "Peças com esta quantidade ou menos aparecem como \"últimas unidades\" na loja e contam no alerta do painel.",
        kind: "integer",
        width: "third",
        suffix: "un.",
        placeholder: "2",
      },
      {
        key: "exchange_policy",
        label: "Política de trocas",
        hint: "Texto exibido no rodapé da loja.",
        kind: "longtext",
        width: "full",
        rows: 4,
      },
    ],
  },
];

/** Lista plana — a server action valida e grava a partir daqui. */
export const SETTING_FIELDS: SettingField[] = SETTING_SECTIONS.flatMap((s) => s.fields);
