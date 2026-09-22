import { MercadoPagoConfig, Preference } from "mercadopago";

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn("MERCADOPAGO_ACCESS_TOKEN is not set.");
}

export const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  options: { timeout: 5000, idempotencyKey: crypto.randomUUID() },
});

export const preference = new Preference(mpConfig);
