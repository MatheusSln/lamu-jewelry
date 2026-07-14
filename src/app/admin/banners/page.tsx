import { db } from "@/db";
import { banners } from "@/db/schema";
import { asc } from "drizzle-orm";
import { BannersManager } from "./banners-client";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const allBanners = await db.select().from(banners).orderBy(asc(banners.sortOrder));
  return <BannersManager banners={allBanners} />;
}
