import { NextResponse } from "next/server";
import { z } from "zod";
import { createDirectPixPayment, getOfficialPlan } from "@/lib/mercadopago";
import { executeWithIdempotency } from "@/lib/idempotency";

const pixSchema = z.object({
  planId: z.string().default("monthly_pix"),
  description: z.string().min(2).max(120).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(100),
  userId: z.string().optional(),
  amount: z.number().positive().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const rawIdempotencyHeader = req.headers.get("x-idempotency-key");
    const body = await req.json();
    const validated = pixSchema.parse(body);

    const official = getOfficialPlan(validated.planId);
    const key =
      rawIdempotencyHeader ||
      validated.idempotencyKey ||
      `pix_${validated.userId || "guest"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const result = await executeWithIdempotency(
      {
        key,
        route: "/api/payment/mercadopago/pix",
        payload: {
          planId: official.id,
          payerEmail: validated.payerEmail,
          userId: validated.userId,
          price: official.price,
        },
        userId: validated.userId,
      },
      async () => {
        const pixData = await createDirectPixPayment({
          amount: official.price,
          description: validated.description || `GymFlow — ${official.name}`,
          payerEmail: validated.payerEmail,
          payerName: validated.payerName,
          userId: validated.userId,
          planId: official.id,
          idempotencyKey: key,
        });

        return {
          status: 200,
          resourceId: pixData.id ? String(pixData.id) : undefined,
          body: {
            success: true,
            pix: pixData,
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
    console.error("Erro na rota /api/payment/mercadopago/pix:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao gerar cobrança PIX" },
      { status: 400 }
    );
  }
}
