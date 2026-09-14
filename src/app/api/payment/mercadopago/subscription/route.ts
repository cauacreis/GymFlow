import { NextResponse } from "next/server";
import { z } from "zod";
import { createRecurringSubscription, getOfficialPlan } from "@/lib/mercadopago";
import { executeWithIdempotency } from "@/lib/idempotency";

const subscriptionSchema = z.object({
  planId: z.string().default("monthly_recurring"),
  reason: z.string().min(2).max(100).optional(),
  price: z.number().positive().optional(),
  payerEmail: z.string().email(),
  freeTrialDays: z.number().int().min(0).max(30).optional(),
  userId: z.string().optional(),
  backUrl: z.string().url().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const rawIdempotencyHeader = req.headers.get("x-idempotency-key");
    const body = await req.json();
    const validated = subscriptionSchema.parse(body);

    const official = getOfficialPlan(validated.planId);
    const trialDays =
      validated.freeTrialDays !== undefined
        ? Math.min(validated.freeTrialDays, official.freeTrialDays ?? 7)
        : (official.freeTrialDays ?? 0);

    const key =
      rawIdempotencyHeader ||
      validated.idempotencyKey ||
      `sub_${validated.userId || "guest"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const result = await executeWithIdempotency(
      {
        key,
        route: "/api/payment/mercadopago/subscription",
        payload: {
          planId: official.id,
          payerEmail: validated.payerEmail,
          userId: validated.userId,
          price: official.price,
          freeTrialDays: trialDays,
        },
        userId: validated.userId,
      },
      async () => {
        const subscription = await createRecurringSubscription({
          reason: validated.reason || official.name,
          price: official.price,
          payerEmail: validated.payerEmail,
          freeTrialDays: trialDays,
          userId: validated.userId,
          planId: official.id,
          backUrl: validated.backUrl,
          idempotencyKey: key,
        });

        return {
          status: 200,
          resourceId: subscription.id ? String(subscription.id) : undefined,
          body: {
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
          },
        };
      }
    );

    const responseHeaders: Record<string, string> = {
      "X-Idempotency-Key": key,
      "Idempotency-Replayed": result.replayed ? "true" : "false",
      ...(result.headers || {}),
    };

    return NextResponse.json(result.body, {
      status: result.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/subscription:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao criar assinatura recorrente" },
      { status: 400 }
    );
  }
}
