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
