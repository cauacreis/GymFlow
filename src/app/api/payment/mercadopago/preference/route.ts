import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutPreference, getOfficialPlan } from "@/lib/mercadopago";
import { executeWithIdempotency } from "@/lib/idempotency";

const preferenceSchema = z.object({
  planId: z.string().min(1).max(50),
  title: z.string().min(2).max(100).optional(),
  price: z.number().positive().optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(100),
  userId: z.string().optional(),
  backUrl: z.string().url().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const rawIdempotencyHeader = req.headers.get("x-idempotency-key");
    const body = await req.json();
    const validated = preferenceSchema.parse(body);

    const official = getOfficialPlan(validated.planId);
    const key =
      rawIdempotencyHeader ||
      validated.idempotencyKey ||
      `pref_${validated.userId || "guest"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const result = await executeWithIdempotency(
      {
        key,
        route: "/api/payment/mercadopago/preference",
        payload: {
          planId: official.id,
          payerEmail: validated.payerEmail,
          userId: validated.userId,
          price: official.price,
        },
        userId: validated.userId,
      },
      async () => {
        const preference = await createCheckoutPreference({
          title: validated.title || official.name,
          price: official.price,
          payerEmail: validated.payerEmail,
          payerName: validated.payerName,
          planId: official.id,
          userId: validated.userId,
          backUrl: validated.backUrl,
          idempotencyKey: key,
        });

        return {
          status: 200,
          resourceId: preference.id ? String(preference.id) : undefined,
          body: {
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
    console.error("Erro na rota /api/payment/mercadopago/preference:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao criar preferência de checkout" },
      { status: 400 }
    );
  }
}
