import { NextResponse } from "next/server";
import { z } from "zod";
import { createRecurringSubscription } from "@/lib/mercadopago";

const subscriptionSchema = z.object({
  reason: z.string().min(2).max(100),
  price: z.number().positive(),
  payerEmail: z.string().email(),
  freeTrialDays: z.number().int().min(0).max(30).optional(),
  userId: z.string().optional(),
  planId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = subscriptionSchema.parse(body);

    const subscription = await createRecurringSubscription({
      reason: validated.reason,
      price: validated.price,
      payerEmail: validated.payerEmail,
      freeTrialDays: validated.freeTrialDays ?? 0,
      userId: validated.userId,
      planId: validated.planId,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      initPoint: subscription.init_point,
      status: subscription.status,
      isSimulated: subscription.isSimulated || false,
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/subscription:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao criar assinatura recorrente" },
      { status: 400 }
    );
  }
}
