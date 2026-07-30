import { getSettingsMap } from "@/lib/catalog";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Finalizar compra — Lámu" };

export default async function CheckoutPage() {
  const settings = await getSettingsMap();
  return (
    <CheckoutClient
      freeShippingThresholdCents={parseInt(settings.free_shipping_threshold_cents || "0", 10) || 0}
      fallbackShippingCents={parseInt(settings.fallback_shipping_cents || "0", 10) || 0}
    />
  );
}
