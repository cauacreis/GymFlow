import { NextResponse } from "next/server";
import { z } from "zod";
import { createDirectPixPayment, getOfficialPlan } from "@/lib/mercadopago";

const pixSchema = z.object({
  planId: z.string().default("monthly_pix"),
  description: z.string().min(2).max(120).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(100),
  userId: z.string().optional(),
  amount: z.number().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = pixSchema.parse(body);

    // Defesa em Profundidade: Preço é estritamente fixado pelo servidor
    const official = getOfficialPlan(validated.planId);

    const pixData = await createDirectPixPayment({
      amount: official.price,
      description: validated.description || `GymFlow — ${official.name}`,
      payerEmail: validated.payerEmail,
      payerName: validated.payerName,
      userId: validated.userId,
      planId: official.id,
    });

    return NextResponse.json({
      success: true,
      pix: pixData,
      plan: {
        id: official.id,
        name: official.name,
        price: official.price,
        tier: official.tier,
      },
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/pix:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao gerar cobrança PIX" },
      { status: 400 }
    );
  }
}
