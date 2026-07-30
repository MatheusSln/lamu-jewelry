import { getNavTree, getSettingsMap } from "@/lib/catalog";
import { PromoBar } from "@/components/promo-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [nav, settings] = await Promise.all([getNavTree(), getSettingsMap()]);
  const freeShippingThresholdCents = parseInt(settings.free_shipping_threshold_cents || "0", 10) || 0;
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <PromoBar text={settings.promo_bar_text ?? ""} />
        <SiteHeader nav={nav} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </div>
      <CartDrawer freeShippingThresholdCents={freeShippingThresholdCents} />
    </CartProvider>
  );
}
