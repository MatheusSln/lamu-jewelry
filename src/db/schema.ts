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
