import { getSettingsMap } from "@/lib/catalog";
import { CartPageClient } from "./cart-page-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Carrinho — Lámu" };

export default async function CarrinhoPage() {
  const settings = await getSettingsMap();
  return (
    <CartPageClient
      freeShippingThresholdCents={parseInt(settings.free_shipping_threshold_cents || "0", 10) || 0}
      fallbackShippingCents={parseInt(settings.fallback_shipping_cents || "0", 10) || 0}
      storeWhatsapp={settings.whatsapp_number || ""}
    />
  );
}
