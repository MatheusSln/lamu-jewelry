"use server";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkPassword, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (!user) {
    return { error: "Credenciais inválidas." };
  }

  const isValid = await checkPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Credenciais inválidas." };
  }

  await createSession(user.id);
  
  redirect("/admin");
}
