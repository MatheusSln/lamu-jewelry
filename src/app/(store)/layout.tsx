import { getNavTree, getSettingsMap } from "@/lib/catalog";
import { PromoBar } from "@/components/promo-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [nav, settings] = await Promise.all([getNavTree(), getSettingsMap()]);
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBar text={settings.promo_bar_text ?? ""} />
      <SiteHeader nav={nav} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
