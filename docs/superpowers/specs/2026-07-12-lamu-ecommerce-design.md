# Lámu — E-commerce de Semijoias e Prata 925

**Data:** 2026-07-12
**Status:** Aprovado
**Referência visual:** morana.com.br

## Visão geral

Loja virtual para a marca **Lámu** (semijoias e prata 925), com vitrine pública no estilo Morana e painel admin completo para a dona gerenciar produtos, estoque, pedidos, cupons, banners e configurações. Compra sem cadastro de cliente, com pagamento online (AbacatePay) ou fechamento via WhatsApp.

**Marca:** nome grafado **Lámu** (com acento). Tagline: **"Semijoias e Prata 925"**. Logo dourado sobre fundo creme/champanhe (arquivo fornecido pelo usuário; salvar em `public/brand/`). Paleta derivada do logo: fundo creme/champanhe, acentos dourados, tipografia serifada elegante em títulos e sans-serif limpa no corpo.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) — vitrine + admin no mesmo projeto |
| Estilo | Tailwind CSS, tokens de cor centralizados |
| Banco | Postgres (Supabase) + Drizzle ORM |
| Arquivos | Supabase Storage (fotos de produtos e banners) |
| Hospedagem | Vercel (plano gratuito) |
| Pagamento | AbacatePay — Pix, cartão de crédito e boleto, via API + webhook |
| Frete | SuperFrete (cotação por CEP: PAC/SEDEX/Mini Envios); ViaCEP para autocompletar endereço |

Decisões descartadas: Firebase/Firestore (domínio relacional, filtros compostos limitados, Storage exige plano Blaze); CMS pronto (admin de loja exigiria customização demais); plataformas SaaS (mensalidade e sem integração AbacatePay).

## Modelo de dados

- `categories` — nome, slug, categoria-pai opcional (subcategorias, ex: Brincos → Argola), ordem de exibição.
- `products` — nome, slug, descrição, preço, preço promocional opcional, categoria, material (`semijoia` | `prata925`), fotos (array ordenado), flags `is_launch`, `is_bestseller`, `is_active`, timestamps.
- `product_variants` — produto, rótulo (ex: "Tam. 16", "Dourado"), ajuste de preço opcional, **estoque próprio**, ativo. Produto sem variação recebe uma variação "padrão" oculta na interface.
- `orders` — código público curto (ex: `LM-8F3K2`), dados do cliente (nome, WhatsApp, e-mail, endereço completo), frete escolhido (nome + valor), cupom aplicado, subtotal/desconto/total, status, código de rastreio, origem (`site` | `whatsapp`), id de cobrança AbacatePay, timestamps.
  - Status: `aguardando_pagamento → pago → separando → enviado → entregue`, além de `cancelado` e `aguardando_confirmacao` (pedidos vindos do WhatsApp).
- `order_items` — pedido, variação, quantidade, nome e preço **congelados** no momento da compra.
- `stock_reservations` — variação, quantidade, expiração (30 min), pedido associado. Criada ao iniciar pagamento; convertida em baixa definitiva na confirmação; expirada é ignorada/limpa.
- `coupons` — código, tipo (`percent` | `fixed`), valor, validade, limite de usos, usos atuais, pedido mínimo, ativo.
- `banners` — imagem, link de destino, ordem, ativo.
- `settings` — chave/valor: texto da barra de promoção, WhatsApp da loja, Instagram, CEP de origem, limiar de frete grátis, frete fixo de contingência, limiar de alerta de estoque baixo, políticas de troca.
- `admin_users` — e-mail, hash de senha (bcrypt). Sessão via cookie assinado.

**Regras de estoque:**
- Estoque disponível = estoque da variação − reservas ativas.
- Reserva de 30 min criada ao gerar a cobrança; baixa definitiva no webhook de pagamento confirmado.
- Pedido pago sem estoque suficiente (corrida extrema): pedido é criado com flag "atenção: conferir estoque" para resolução manual.

## Vitrine (público)

**Home:** barra de promoção (texto do admin) → header (logo centrado, busca, carrinho, menu de categorias com dropdown de subcategorias) → carrossel de banners → vitrine "Lançamentos" → cards de presente por faixa de preço → vitrine "Mais Vendidos" → vitrine "Promoções" (produtos com preço promocional) → rodapé (WhatsApp, Instagram, formas de pagamento, políticas).

**Categoria e busca** (`/[categoria]`, `/busca?q=`): grade de cards com filtros laterais (subcategoria, material, faixa de preço) e ordenação (lançamento, menor/maior preço, mais vendidos). Paginação. Card de produto: primeira foto com troca para a segunda no hover, nome, preço (promocional com original riscado), botão de adicionar ao carrinho.

**Produto** (`/produto/[slug]`): galeria de fotos, preço, seletor de variações (esgotadas visíveis porém desabilitadas), quantidade, "Adicionar ao carrinho" + "Comprar pelo WhatsApp", cálculo de frete por CEP na página, descrição, vitrine "Você também vai gostar" (mesma categoria).

**Carrinho:** drawer lateral + página `/carrinho`. Itens com quantidade editável, campo de cupom, cálculo de frete por CEP, barra de progresso para frete grátis. Botões "Finalizar compra" e "Fechar pedido no WhatsApp". O fluxo WhatsApp monta mensagem com itens + total e abre `wa.me/<numero da loja>`; o pedido é registrado com status `aguardando_confirmacao`. Carrinho persistido em `localStorage`.

**Checkout** (`/checkout`): etapas em página única — dados pessoais → endereço (autocompletar por CEP via ViaCEP) → escolha de frete (opções SuperFrete) → pagamento (Pix com QR Code e confirmação automática em tempo real; cartão; boleto). Cupom aplicável. Ao confirmar pagamento, redireciona para a página do pedido.

**Acompanhar pedido** (`/pedido/[codigo]`): linha do tempo visual do status, itens, endereço, código de rastreio com link dos Correios. Acesso apenas pelo código único (sem login).

## Admin (`/admin`)

Login com e-mail/senha (sessão em cookie). Uma administradora inicialmente; estrutura permite adicionar mais.

- **Dashboard:** pedidos novos, faturamento do dia/mês, alerta de produtos com estoque baixo.
- **Produtos:** listagem com busca/filtros e ajuste rápido de estoque; formulário com upload múltiplo de fotos (ordenável por arrastar), variações com estoque individual, flags de vitrine, ativo/inativo.
- **Pedidos:** lista filtrável por status; detalhe com dados do cliente, itens, status do pagamento (sincronizado via AbacatePay), avanço manual de status, campo de rastreio, botão "chamar no WhatsApp".
- **Cupons:** CRUD com código, tipo, valor, validade, limite de usos, pedido mínimo.
- **Banners:** upload, link, ordem, ativar/desativar.
- **Configurações:** todos os valores da tabela `settings`, incluindo chaves de API (AbacatePay, SuperFrete).

## Integrações

- **AbacatePay:** criação de cobrança no checkout (Pix/cartão/boleto); webhook (`/api/webhooks/abacatepay`) valida assinatura/segredo e confirma pagamento → baixa estoque, atualiza pedido. Redundância: a página do pedido reconsulta o status da cobrança na API se ainda constar pendente.
- **SuperFrete:** cotação de frete por CEP + dimensões/peso padrão de pacote de semijoias (configurável). Falha na API → oferece frete fixo de contingência (valor do admin) em vez de bloquear a venda.
- **ViaCEP:** autocompletar endereço no checkout.
- **Imagens:** upload no admin redimensiona/comprime automaticamente (via `sharp`) antes de enviar ao Supabase Storage.

## Tratamento de erros

- Webhook perdido → reconsulta ativa do status na API da AbacatePay quando o cliente abre a página do pedido.
- Corrida de estoque → reservas de 30 min; caso extremo gera flag de conferência manual no pedido.
- SuperFrete indisponível → frete fixo de contingência.
- Cupom inválido/expirado/esgotado → mensagem clara no carrinho/checkout, sem travar o fluxo.
- Falhas de pagamento (cartão recusado) → cliente pode tentar outro meio sem perder o carrinho.

## Testes

- **Automatizados (unidade/integração):** cálculo de totais (subtotal, cupom percentual/fixo, frete, frete grátis), validação de cupom (validade, limite, mínimo), reserva/baixa/liberação de estoque, handler do webhook (pagamento confirmado, duplicado, assinatura inválida), disponibilidade de variação.
- **Manuais (checklist):** compra completa com Pix de teste, pedido via WhatsApp, CRUD de produto com fotos e variações, avanço de status do pedido, aplicação de banner e configurações.

## Fora de escopo (possíveis evoluções)

Contas de cliente com histórico, avaliações de produtos, cashback, e-mails transacionais, relatórios avançados, multiadmin com permissões.
