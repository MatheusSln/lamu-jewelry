import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SECRET_KEY = process.env.SESSION_SECRET || "lamu_fallback_secret_key_change_me_in_prod";
const ENCODER = new TextEncoder();

async function getCryptoKey() {
  return await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signSessionId(userId: number): Promise<string> {
  const timestamp = Date.now();
  const payload = `${userId}.${timestamp}`;
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, ENCODER.encode(payload));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${payload}.${signatureHex}`;
}

export async function verifyAuth(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session")?.value;
  
  if (!sessionCookie) return null;

  const [userIdStr, timestampStr, signature] = sessionCookie.split(".");
  if (!userIdStr || !timestampStr || !signature) return null;

  // Validate expiry (e.g. 7 days)
  const timestamp = parseInt(timestampStr, 10);
  if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return null;

  const payload = `${userIdStr}.${timestampStr}`;
  const key = await getCryptoKey();
  const expectedSignatureBuffer = await crypto.subtle.sign("HMAC", key, ENCODER.encode(payload));
  const expectedSignatureArray = Array.from(new Uint8Array(expectedSignatureBuffer));
  const expectedSignatureHex = expectedSignatureArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Timing-safe-ish comparison for our simple usecase
  if (expectedSignatureHex !== signature) return null;

  return parseInt(userIdStr, 10);
}

export async function createSession(userId: number) {
  const sessionValue = await signSessionId(userId);
  const cookieStore = await cookies();
  cookieStore.set("admin_session", sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

export async function checkPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
