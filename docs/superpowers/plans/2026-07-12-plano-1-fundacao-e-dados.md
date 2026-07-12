# Lámu — Plano 1: Fundação e Camada de Dados

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Projeto Next.js de pé com identidade visual da Lámu, banco Postgres (Supabase) com schema completo do e-commerce, helpers de dinheiro/slug testados e seed com categorias, configurações, admin e produtos de exemplo.

**Architecture:** App único Next.js (App Router, TypeScript) que servirá vitrine e admin. Drizzle ORM contra Postgres do Supabase. Preços sempre em **centavos (inteiros)**. Este plano não cria páginas além da home placeholder — planos 2–4 constroem vitrine, checkout e admin sobre esta base.

**Tech Stack:** Next.js (App Router, TS), Tailwind CSS, Drizzle ORM + postgres.js, Supabase (Postgres), Vitest, bcryptjs, tsx.

**Sequência de planos:** 1) Fundação e dados (este) → 2) Vitrine → 3) Carrinho/checkout/pagamentos → 4) Admin.

**Spec:** `docs/superpowers/specs/2026-07-12-lamu-ecommerce-design.md`

**Pré-requisito (usuário):** criar projeto gratuito em https://supabase.com e copiar a *connection string* (Database → Connect → URI, modo "Transaction pooler"). Será usada na Task 4.

---

### Task 1: Scaffold do projeto Next.js

**Files:**
- Create: projeto Next.js na raiz do repo (via pasta temporária `lamu-web/`)
- Modify: `.gitignore` (raiz)

- [ ] **Step 1: Gerar o projeto em pasta temporária**

Run (PowerShell, na raiz do repo):
```powershell
npx create-next-app@latest lamu-web --typescript --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm
```
Expected: pasta `lamu-web/` criada sem prompts interativos.

- [ ] **Step 2: Mover conteúdo para a raiz e remover a pasta temporária**

```powershell
Get-ChildItem -Force lamu-web | Move-Item -Destination .
Remove-Item lamu-web
```
Expected: `package.json`, `src/`, `next.config.ts` etc. na raiz, junto de `docs/` e `images/`.

- [ ] **Step 3: Completar o .gitignore**

Adicionar ao final de `.gitignore`:
```gitignore
.firecrawl/
.env*.local
```

- [ ] **Step 4: Verificar que o dev server sobe**

Run: `npm run dev` (parar com Ctrl+C após confirmar)
Expected: `Ready` e página padrão em http://localhost:3000.

- [ ] **Step 5: Commit**

```powershell
git add -A; git commit -m "chore: scaffold Next.js com TypeScript e Tailwind"
```

---

### Task 2: Identidade visual base (tokens, fontes, logo)

**Files:**
- Create: `public/brand/logo.jpeg`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Copiar o logo**

```powershell
New-Item -ItemType Directory -Force public/brand | Out-Null
Copy-Item images/logo.jpeg public/brand/logo.jpeg
```

- [ ] **Step 2: Definir tokens de cor e fontes**

Substituir o conteúdo de `src/app/globals.css` por:

```css
@import "tailwindcss";

:root {
  /* Paleta Lámu — derivada do logo (dourado sobre creme/champanhe) */
  --cream: #f7eee2;        /* fundo principal */
  --cream-dark: #efe1cd;   /* fundos de seção/hover */
  --gold: #b08d3e;         /* dourado principal (botões, links, acentos) */
  --gold-dark: #8f7130;    /* hover de botões */
  --gold-light: #d4bc84;   /* bordas e detalhes */
  --ink: #3e3428;          /* texto principal (marrom-escuro quente) */
  --ink-soft: #7a6d5c;     /* texto secundário */
  --white: #fffdf9;        /* cards */
  --danger: #a33a3a;       /* erros e esgotado */
  --success: #4a7c59;      /* confirmações */
}

@theme inline {
  --color-cream: var(--cream);
  --color-cream-dark: var(--cream-dark);
  --color-gold: var(--gold);
  --color-gold-dark: var(--gold-dark);
  --color-gold-light: var(--gold-light);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-card: var(--white);
  --color-danger: var(--danger);
  --color-success: var(--success);
  --font-heading: var(--font-cormorant);
  --font-body: var(--font-montserrat);
}

body {
  background: var(--cream);
  color: var(--ink);
  font-family: var(--font-body), sans-serif;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading), serif;
}
```

- [ ] **Step 3: Carregar fontes no layout raiz**

Substituir o conteúdo de `src/app/layout.tsx` por:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Lámu — Semijoias e Prata 925",
  description:
    "Semijoias e prata 925 com design delicado. Conjuntos, brincos, colares, pulseiras, anéis e tornozeleiras.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${cormorant.variable} ${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Home placeholder com a marca**

Substituir o conteúdo de `src/app/page.tsx` por:

```tsx
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Image
        src="/brand/logo.jpeg"
        alt="Lámu — Semijoias e Prata 925"
        width={280}
        height={280}
        priority
        className="rounded-full"
      />
      <h1 className="text-4xl text-gold">Em breve</h1>
      <p className="text-ink-soft">Semijoias e Prata 925</p>
    </main>
  );
}
```

- [ ] **Step 5: Verificar visual**

Run: `npm run dev`
Expected: home com fundo creme, logo, título "Em breve" em dourado com fonte serifada.

- [ ] **Step 6: Commit**

```powershell
git add -A; git commit -m "feat: identidade visual base da Lamu (tokens, fontes, logo)"
```

---

### Task 3: Vitest + helpers de dinheiro e slug (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/lib/money.ts`, `src/lib/slug.ts`
- Test: `src/lib/money.test.ts`, `src/lib/slug.test.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Instalar e configurar o Vitest**

```powershell
npm install -D vitest
```

Criar `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Adicionar em `package.json`, dentro de `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 2: Escrever testes que falham (dinheiro)**

Criar `src/lib/money.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatBRL } from "./money";

describe("formatBRL", () => {
  it("formata centavos como reais pt-BR", () => {
    expect(formatBRL(16990)).toBe("R$ 169,90");
  });

  it("formata valores baixos", () => {
    expect(formatBRL(80)).toBe("R$ 0,80");
  });

  it("formata zero", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("formata milhares com separador", () => {
    expect(formatBRL(123456789)).toBe("R$ 1.234.567,89");
  });
});
```

- [ ] **Step 3: Escrever testes que falham (slug)**

Criar `src/lib/slug.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("remove acentos e coloca em minúsculas", () => {
    expect(slugify("Anéis")).toBe("aneis");
  });

  it("troca espaços por hífens", () => {
    expect(slugify("Conjunto Gota Zircônia")).toBe("conjunto-gota-zirconia");
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Brinco 2º Furo!")).toBe("brinco-2-furo");
  });

  it("colapsa hífens repetidos e das pontas", () => {
    expect(slugify("  Colar -- Longo  ")).toBe("colar-longo");
  });
});
```

- [ ] **Step 4: Rodar e confirmar que falham**

Run: `npm test`
Expected: FAIL — módulos `./money` e `./slug` não existem.

- [ ] **Step 5: Implementar os helpers**

Criar `src/lib/money.ts`:
```ts
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos (inteiro) como moeda pt-BR. Ex.: 16990 → "R$ 169,90" */
export function formatBRL(cents: number): string {
  // Intl usa espaço não separável (U+00A0) após "R$"; normalizamos para espaço comum
  return brl.format(cents / 100).replace(/\u00A0/g, " ");
}
```

Criar `src/lib/slug.ts`:
```ts
/** Gera slug de URL: sem acentos, minúsculas, hífens. Ex.: "Anéis" → "aneis" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 6: Rodar e confirmar que passam**

Run: `npm test`
Expected: PASS (8 testes).

- [ ] **Step 7: Commit**

```powershell
git add -A; git commit -m "feat: helpers de moeda e slug com testes"
```

---

### Task 4: Drizzle ORM + conexão com o Supabase

**Files:**
- Create: `drizzle.config.ts`, `src/db/index.ts`, `.env.local` (não commitado), `.env.example`
- Modify: `package.json` (scripts `db:push`, `db:studio`)

- [ ] **Step 1: Instalar dependências**

```powershell
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx dotenv
```

- [ ] **Step 2: Criar .env.example (commitado) e .env.local (real)**

Criar `.env.example`:
```env
# Connection string do Supabase (Database → Connect → URI, Transaction pooler)
DATABASE_URL="postgresql://usuario:senha@host:6543/postgres"

# Admin inicial criado pelo seed
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="troque-esta-senha"
```

Criar `.env.local` copiando o exemplo e preenchendo com a connection string real do Supabase e o e-mail/senha reais da administradora. **Pedir os valores ao usuário se ainda não fornecidos. Nunca commitar `.env.local`.**

- [ ] **Step 3: Configurar o drizzle-kit**

Criar `drizzle.config.ts`:
```ts
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Criar o cliente de banco**

Criar `src/db/index.ts`:
```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida (confira o .env.local)");
}

// prepare: false é exigido pelo transaction pooler do Supabase (PgBouncer)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

- [ ] **Step 5: Adicionar scripts**

Em `package.json`, dentro de `"scripts"`:
```json
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 6: Commit**

```powershell
git add -A; git commit -m "feat: drizzle orm configurado com supabase"
```
Expected: `.env.local` NÃO aparece no commit (ignorado pelo .gitignore).

---

### Task 5: Schema completo do banco

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Escrever o schema**

Criar `src/db/schema.ts`:
```ts
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const materialEnum = pgEnum("material", ["semijoia", "prata925"]);

export const orderStatusEnum = pgEnum("order_status", [
  "aguardando_pagamento",
  "aguardando_confirmacao", // pedidos vindos do WhatsApp
  "pago",
  "separando",
  "enviado",
  "entregue",
  "cancelado",
]);

export const orderOriginEnum = pgEnum("order_origin", ["site", "whatsapp"]);

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  promoPriceCents: integer("promo_price_cents"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  material: materialEnum("material").notNull().default("semijoia"),
  /** URLs das fotos, em ordem de exibição */
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  isLaunch: boolean("is_launch").notNull().default(false),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  /** Ex.: "Tam. 16", "Dourado". Variação padrão oculta usa "" */
  label: text("label").notNull().default(""),
  priceDeltaCents: integer("price_delta_cents").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

export type OrderAddress = {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /** Código curto público, ex.: "LM-8F3K2" — usado na URL de acompanhamento */
  publicCode: text("public_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerWhatsapp: text("customer_whatsapp").notNull(),
  customerEmail: text("customer_email").notNull().default(""),
  address: jsonb("address").$type<OrderAddress | null>(),
  shippingName: text("shipping_name").notNull().default(""),
  shippingCents: integer("shipping_cents").notNull().default(0),
  couponId: integer("coupon_id").references(() => coupons.id),
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  status: orderStatusEnum("status").notNull().default("aguardando_pagamento"),
  /** true quando pagamento confirmou sem estoque suficiente (corrida) */
  needsStockReview: boolean("needs_stock_review").notNull().default(false),
  trackingCode: text("tracking_code"),
  origin: orderOriginEnum("origin").notNull().default("site"),
  abacatepayChargeId: text("abacatepay_charge_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  /** Nome e preço congelados no momento da compra */
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label").notNull().default(""),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

export const stockReservations = pgTable("stock_reservations", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  /** percent: pontos percentuais (10 = 10%); fixed: centavos */
  value: integer("value").notNull(),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  minOrderCents: integer("min_order_cents").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Aplicar o schema no Supabase**

Run: `npm run db:push`
Expected: tabelas criadas sem erro (saída lista as tabelas novas).

- [ ] **Step 3: Verificar no banco**

Run: `npm run db:studio` e abrir a URL exibida (parar depois).
Expected: as 10 tabelas visíveis (categories, products, product_variants, orders, order_items, stock_reservations, coupons, banners, settings, admin_users).

- [ ] **Step 4: Commit**

```powershell
git add -A; git commit -m "feat: schema completo do banco (produtos, pedidos, estoque, cupons)"
```

---

### Task 6: Seed — categorias, settings, admin e produtos de exemplo

**Files:**
- Create: `src/db/seed.ts`, `public/products/` (fotos copiadas de `images/products/`)
- Modify: `package.json` (script `db:seed`)

- [ ] **Step 1: Instalar bcryptjs**

```powershell
npm install bcryptjs
```

- [ ] **Step 2: Copiar fotos de exemplo para public/**

```powershell
New-Item -ItemType Directory -Force public/products | Out-Null
Copy-Item images/products/*.jpeg public/products/
```

- [ ] **Step 3: Escrever o seed**

Criar `src/db/seed.ts`:
```ts
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { readdirSync } from "node:fs";
import { db } from "./index";
import {
  adminUsers,
  categories,
  products,
  productVariants,
  settings,
} from "./schema";
import { slugify } from "../lib/slug";

async function seed() {
  // --- Categorias (pais e filhas) ---
  const parents = [
    "Conjuntos",
    "Brincos",
    "Colares",
    "Pulseiras",
    "Anéis",
    "Tornozeleiras",
    "Berloques",
  ];
  const children: Record<string, string[]> = {
    Brincos: ["Argola", "Pequeno e 2º Furo", "Ear Cuff", "Festa"],
    Colares: ["Curto", "Longo", "Gargantilha e Choker"],
    Pulseiras: ["Bracelete", "Berloque"],
  };

  const parentIds: Record<string, number> = {};
  for (const [i, name] of parents.entries()) {
    const [row] = await db
      .insert(categories)
      .values({ name, slug: slugify(name), sortOrder: i })
      .onConflictDoNothing()
      .returning();
    if (row) parentIds[name] = row.id;
  }

  for (const [parent, subs] of Object.entries(children)) {
    const parentId = parentIds[parent];
    if (!parentId) continue;
    for (const [i, name] of subs.entries()) {
      await db
        .insert(categories)
        .values({
          name,
          slug: slugify(`${parent} ${name}`),
          parentId,
          sortOrder: i,
        })
        .onConflictDoNothing();
    }
  }

  // --- Settings padrão ---
  const defaults: Record<string, string> = {
    promo_bar_text: "PIX NA LOJA TODA • ENVIAMOS PARA TODO O BRASIL",
    whatsapp_number: "",
    instagram_handle: "",
    origin_cep: "",
    free_shipping_threshold_cents: "19900",
    fallback_shipping_cents: "1500",
    low_stock_threshold: "2",
    exchange_policy: "Trocas em até 7 dias após o recebimento.",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing();
  }

  // --- Admin ---
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env.local");
  }
  await db
    .insert(adminUsers)
    .values({ email, passwordHash: bcrypt.hashSync(password, 10) })
    .onConflictDoNothing();

  // --- Produtos de exemplo (um por foto; a administradora edita depois) ---
  const photos = readdirSync("public/products").filter((f) =>
    f.endsWith(".jpeg"),
  );
  const sampleCategories = [
    "Conjuntos",
    "Brincos",
    "Colares",
    "Pulseiras",
    "Anéis",
  ];
  for (const [i, photo] of photos.entries()) {
    const catName = sampleCategories[i % sampleCategories.length];
    const name = `Peça Exemplo ${i + 1} (${catName})`;
    const [product] = await db
      .insert(products)
      .values({
        name,
        slug: slugify(name),
        description: "Produto de exemplo criado pelo seed. Edite no admin.",
        priceCents: 4990 + i * 2000,
        promoPriceCents: i % 3 === 0 ? 3990 + i * 2000 : null,
        categoryId: parentIds[catName],
        material: i % 2 === 0 ? "semijoia" : "prata925",
        photos: [`/products/${photo}`],
        isLaunch: i < 4,
        isBestseller: i >= 4 && i < 8,
      })
      .onConflictDoNothing()
      .returning();
    if (!product) continue;

    if (catName === "Anéis") {
      // Anéis: variações de tamanho com estoque individual
      for (const size of ["16", "18", "20"]) {
        await db.insert(productVariants).values({
          productId: product.id,
          label: `Tam. ${size}`,
          stock: 3,
        });
      }
    } else {
      // Demais: variação padrão oculta
      await db.insert(productVariants).values({
        productId: product.id,
        isDefault: true,
        stock: 5,
      });
    }
  }

  console.log("Seed concluído.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Adicionar script e rodar**

Em `package.json`, dentro de `"scripts"`:
```json
"db:seed": "tsx src/db/seed.ts"
```

Run: `npm run db:seed`
Expected: `Seed concluído.`

- [ ] **Step 5: Verificar dados**

Run: `npm run db:studio`
Expected: categorias com subcategorias, ~10 produtos com fotos, anéis com 3 variações de tamanho, 1 admin, settings preenchidas.

- [ ] **Step 6: Commit**

```powershell
git add -A; git commit -m "feat: seed com categorias, settings, admin e produtos de exemplo"
```

---

## Verificação final do plano

- [ ] `npm test` → todos os testes passam
- [ ] `npm run dev` → home com identidade Lámu
- [ ] `npm run db:studio` → 10 tabelas populadas
- [ ] `git log --oneline` → ~6 commits pequenos e descritivos
