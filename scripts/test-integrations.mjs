import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testMelhorEnvio() {
  console.log("\n--- TESTANDO MELHOR ENVIO ---");
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const originCep = process.env.STORE_CEP || "71919180";
  console.log("Token presente:", !!token, "Tamanho:", token?.length);
  console.log("CEP Origem:", originCep);

  // Testa tanto Sandbox quanto Produção para saber em qual ambiente o token foi gerado
  for (const envName of ["sandbox", "producao"]) {
    const url = envName === "sandbox" 
      ? "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate"
      : "https://melhorenvio.com.br/api/v2/me/shipment/calculate";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Lamu (contato@lamu.com.br)",
        },
        body: JSON.stringify({
          from: { postal_code: originCep.replace(/\D/g, "") },
          to: { postal_code: "01001000" }, // Praça da Sé, SP
          products: [
            {
              id: "teste_anel",
              width: 11,
              height: 2,
              length: 16,
              weight: 0.3,
              insurance_value: 0,
              quantity: 1,
            },
          ],
        }),
      });

      console.log(`[${envName.toUpperCase()}] Status:`, res.status, res.statusText);
      if (res.ok) {
        const data = await res.json();
        const validOptions = data.filter((o) => !o.error);
        console.log(`[${envName.toUpperCase()}] SUCESSO! Cotações retornadas:`, validOptions.length);
        validOptions.forEach((o) => console.log(`  - ${o.name}: R$ ${o.custom_price} (Prazo: ${o.custom_delivery_time} dias)`));
        return { success: true, env: envName };
      } else {
        const err = await res.text();
        console.log(`[${envName.toUpperCase()}] Resposta:`, err.slice(0, 200));
      }
    } catch (e) {
      console.log(`[${envName.toUpperCase()}] Erro de requisição:`, e.message);
    }
  }
}

async function testMercadoPago() {
  console.log("\n--- TESTANDO MERCADO PAGO ---");
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  console.log("Token presente:", !!token, "Prefixo:", token?.slice(0, 10));

  try {
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: "teste_1",
            title: "Anel Solitário Ouro 18k (Teste de Integração)",
            quantity: 1,
            unit_price: 150.0,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: "https://lamu-semijoias.vercel.app/pedido/LM-TESTE?status=success",
          failure: "https://lamu-semijoias.vercel.app/pedido/LM-TESTE?status=failure",
          pending: "https://lamu-semijoias.vercel.app/pedido/LM-TESTE?status=pending",
        },
        auto_return: "approved",
      }),
    });

    console.log("Status Preference:", res.status, res.statusText);
    if (res.ok) {
      const data = await res.json();
      console.log("SUCESSO! Preferência criada com ID:", data.id);
      console.log("Init Point (Sandbox):", data.sandbox_init_point);
      console.log("Init Point (Produção):", data.init_point);
      return { success: true, id: data.id };
    } else {
      const err = await res.text();
      console.log("Erro Mercado Pago:", err);
    }
  } catch (e) {
    console.error("Erro MP:", e.message);
  }
}

async function testDatabase() {
  console.log("\n--- TESTANDO BANCO SUPABASE ---");
  const dbUrl = process.env.DATABASE_URL;
  console.log("DATABASE_URL presente:", !!dbUrl);
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(dbUrl, { max: 1 });
    await sql.unsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_url text;`);
    await sql.unsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_days integer;`);
    const result = await sql`SELECT 1 as connected, current_database() as db`;
    console.log("SUCESSO! Banco conectado e colunas migradas:", result[0]);
    await sql.end();
    return { success: true };
  } catch (e) {
    console.error("Erro DB:", e.message);
  }
}

async function testCheckoutRoute() {
  console.log("\n--- TESTANDO ENDPOINT /api/checkout LOCAL (DF) ---");
  try {
    const res = await fetch("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ variantId: 1, quantity: 1 }],
        customer: {
          name: "Cliente Brasília",
          email: "brasilia@lamu.com.br",
          whatsapp: "61999998888",
        },
        address: {
          cep: "71919-180",
          street: "Rua das Figueiras",
          number: "100",
          neighborhood: "Águas Claras",
          city: "Brasília",
          state: "DF",
        },
        shippingOption: {
          name: "PAC",
          custom_price: "24.74",
          custom_delivery_time: 6,
        },
      }),
    });

    console.log("Status Checkout:", res.status);
    const data = await res.json();
    console.log("Resposta Checkout:", data);

    if (data.orderId) {
      const pageRes = await fetch(`http://localhost:3000/pedido/${data.orderId}`);
      const html = await pageRes.text();
      console.log("Página do Pedido Renderizada (HTTP 200):", pageRes.status === 200);
      console.log("Possui 'Aguardando Pagamento':", html.includes("Aguardando Pagamento"));
      console.log("Possui link do Mercado Pago:", html.includes("Pagar com Mercado Pago"));
    }
  } catch (e) {
    console.error("Erro Checkout:", e.message);
  }
}

async function runAll() {
  await testDatabase();
  await testMelhorEnvio();
  await testMercadoPago();
  await testCheckoutRoute();
  console.log("\n--- FIM DOS TESTES ---");
}

runAll();

