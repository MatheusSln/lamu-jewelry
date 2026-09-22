import { calculateShipping } from "@/lib/melhor-envio";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cep, weight, dimensions } = await request.json();

    if (!cep) {
      return NextResponse.json({ error: "CEP é obrigatório." }, { status: 400 });
    }

    const options = await calculateShipping(cep, weight, dimensions);

    return NextResponse.json(options);
  } catch (error) {
    console.error("Erro na API de frete:", error);
    return NextResponse.json(
      { error: "Não foi possível calcular o frete no momento." },
      { status: 500 }
    );
  }
}
