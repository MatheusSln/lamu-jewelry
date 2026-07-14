import { db } from "@/db";
import { coupons } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CuponsManager } from "./cupons-client";

export const dynamic = "force-dynamic";

export default async function AdminCuponsPage() {
  const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.id));
  return <CuponsManager coupons={allCoupons} />;
}
