import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutPreference, getOfficialPlan } from "@/lib/mercadopago";

const preferenceSchema = z.object({
  planId: z.string().min(1).max(50),
  title: z.string().min(2).max(100).optional(),
  price: z.number().positive().optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(100),
  userId: z.string().optional(),
  backUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = preferenceSchema.parse(body);

    // Defesa em Profundidade: Preço é sempre obtido do catálogo oficial do servidor
    const official = getOfficialPlan(validated.planId);

    const preference = await createCheckoutPreference({
      title: validated.title || official.name,
      price: official.price,
      payerEmail: validated.payerEmail,
      payerName: validated.payerName,
      planId: official.id,
      userId: validated.userId,
      backUrl: validated.backUrl,
    });

    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      isSimulated: preference.isSimulated || false,
      price: official.price,
      plan: {
        id: official.id,
        name: official.name,
        price: official.price,
        tier: official.tier,
      },
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/preference:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao criar preferência de checkout" },
      { status: 400 }
    );
  }
}
