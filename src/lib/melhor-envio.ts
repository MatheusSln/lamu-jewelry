export type ShippingOption = {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  custom_delivery_time: number;
  error?: string;
};

const MELHOR_ENVIO_API = "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate";
const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const ORIGIN_CEP = process.env.STORE_CEP || "01001000"; // Fallback to Praça da Sé, SP

export async function calculateShipping(
  destinationCep: string,
  weightInKg: number = 0.5,
  dimensions = { width: 11, height: 2, length: 16 } // Minimum dimensions for Correios/Transportadoras
): Promise<ShippingOption[]> {
  if (!MELHOR_ENVIO_TOKEN) {
    console.warn("Melhor Envio token is not set. Returning mock data.");
    return [
      {
        id: 1,
        name: "Correios PAC (Mock)",
        price: "25.90",
        custom_price: "25.90",
        discount: "0",
        currency: "BRL",
        delivery_time: 7,
        custom_delivery_time: 7,
      },
      {
        id: 2,
        name: "Correios SEDEX (Mock)",
        price: "45.90",
        custom_price: "45.90",
        discount: "0",
        currency: "BRL",
        delivery_time: 2,
        custom_delivery_time: 2,
      },
    ];
  }

  const response = await fetch(MELHOR_ENVIO_API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
      "User-Agent": "Lamu (contato@lamu.com.br)",
    },
    body: JSON.stringify({
      from: { postal_code: ORIGIN_CEP },
      to: { postal_code: destinationCep.replace(/\D/g, "") },
      products: [
        {
          id: "produto_padrao",
          width: dimensions.width,
          height: dimensions.height,
          length: dimensions.length,
          weight: weightInKg,
          insurance_value: 0,
          quantity: 1,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Melhor Envio calculation failed:", errorText);
    throw new Error("Failed to calculate shipping.");
  }

  const data: ShippingOption[] = await response.json();
  
  // Filter out options with errors and sort by price
  return data
    .filter((opt) => !opt.error)
    .sort((a, b) => parseFloat(a.custom_price) - parseFloat(b.custom_price));
}
