import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Usa a variável se existir, ou uma string dummy apenas para evitar que o build quebre
// ao avaliar o arquivo. Em produção real sem URL, as queries falharão.
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL não definida. O build vai passar, mas queries falharão em runtime.");
}

// prepare: false é exigido pelo transaction pooler do Supabase (PgBouncer)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
