import { db } from "../src/db";
import { adminUsers } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const email = "admin@lamu.com";
  const password = "admin";
  
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (existing.length > 0) {
    console.log("Admin user already exists!");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  await db.insert(adminUsers).values({
    name: "Admin Local",
    email,
    passwordHash
  });
  
  console.log("Admin user created! (admin@lamu.com / admin)");
  process.exit(0);
}

main().catch(console.error);
