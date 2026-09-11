import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutPreference } from "@/lib/mercadopago";

const preferenceSchema = z.object({
  title: z.string().min(2).max(100),
  price: z.number().positive(),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(100),
  planId: z.string().min(1).max(50),
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = preferenceSchema.parse(body);

    const preference = await createCheckoutPreference({
      title: validated.title,
      price: validated.price,
      payerEmail: validated.payerEmail,
      payerName: validated.payerName,
      planId: validated.planId,
      userId: validated.userId,
    });

    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      isSimulated: preference.isSimulated || false,
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/preference:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao criar preferência de checkout" },
      { status: 400 }
    );
  }
}
