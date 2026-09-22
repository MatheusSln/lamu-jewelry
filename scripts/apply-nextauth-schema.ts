import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function main() {
  console.log("Applying NextAuth schema manually to bypass drizzle-kit bug...");

  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text,
      "email" text NOT NULL,
      "emailVerified" timestamp,
      "image" text
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "userId" text NOT NULL,
      "type" text NOT NULL,
      "provider" text NOT NULL,
      "providerAccountId" text NOT NULL,
      "refresh_token" text,
      "access_token" text,
      "expires_at" integer,
      "token_type" text,
      "scope" text,
      "id_token" text,
      "session_state" text,
      CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sessionToken" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "expires" timestamp NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "verificationToken" (
      "identifier" text NOT NULL,
      "token" text NOT NULL,
      "expires" timestamp NOT NULL,
      CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
    );
  `;

  await sql`
    ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_user_id_fk";
  `;
  await sql`
    ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  `;

  await sql`
    ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_user_id_fk";
  `;
  await sql`
    ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  `;

  await sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "user_id" text;
  `;

  console.log("Successfully applied NextAuth schema!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
