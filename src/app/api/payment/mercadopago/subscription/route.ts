import { NextResponse } from "next/server";
import { z } from "zod";
import { createRecurringSubscription, getOfficialPlan } from "@/lib/mercadopago";

const subscriptionSchema = z.object({
  planId: z.string().default("monthly_recurring"),
  reason: z.string().min(2).max(100).optional(),
  price: z.number().positive().optional(),
  payerEmail: z.string().email(),
  freeTrialDays: z.number().int().min(0).max(30).optional(),
  userId: z.string().optional(),
  backUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = subscriptionSchema.parse(body);

    // Defesa em Profundidade: Preço e período de trial determinados no backend
    const official = getOfficialPlan(validated.planId);
    const trialDays =
      validated.freeTrialDays !== undefined
        ? Math.min(validated.freeTrialDays, official.freeTrialDays ?? 7)
        : (official.freeTrialDays ?? 0);

    const subscription = await createRecurringSubscription({
      reason: validated.reason || official.name,
      price: official.price,
      payerEmail: validated.payerEmail,
      freeTrialDays: trialDays,
      userId: validated.userId,
      planId: official.id,
      backUrl: validated.backUrl,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      initPoint: subscription.init_point,
      status: subscription.status,
      isSimulated: subscription.isSimulated || false,
      price: official.price,
      freeTrialDays: trialDays,
      plan: {
        id: official.id,
        name: official.name,
        price: official.price,
        tier: official.tier,
      },
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/subscription:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao criar assinatura recorrente" },
      { status: 400 }
    );
  }
}
