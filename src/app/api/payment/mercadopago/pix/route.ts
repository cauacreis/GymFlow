import { NextResponse } from "next/server";
import { z } from "zod";
import { createDirectPixPayment } from "@/lib/mercadopago";

const pixSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(2).max(100),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(100),
  userId: z.string().optional(),
  planId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = pixSchema.parse(body);

    const pixData = await createDirectPixPayment({
      amount: validated.amount,
      description: validated.description,
      payerEmail: validated.payerEmail,
      payerName: validated.payerName,
      userId: validated.userId,
      planId: validated.planId,
    });

    return NextResponse.json({
      success: true,
      pix: pixData,
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/pix:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao gerar cobrança PIX" },
      { status: 400 }
    );
  }
}
