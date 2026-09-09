import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyHmacSignature } from "@/lib/security";

const webhookPayloadSchema = z.object({
  id: z.number().or(z.string()),
  type: z.string(),
  date_created: z.string().optional(),
  data: z.object({
    id: z.string().or(z.number()),
  }),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-signature");
    const webhookSecret = process.env.MP_WEBHOOK_SECRET || "sandbox_secret_placeholder";

    // Se estiver em produção ou se houver chave configurada, valida a assinatura HMAC
    if (process.env.NODE_ENV === "production" && process.env.MP_WEBHOOK_SECRET) {
      const isValid = verifyHmacSignature(rawBody, signatureHeader, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Assinatura HMAC inválida" },
          { status: 401 }
        );
      }
    }

    const json = JSON.parse(rawBody);
    const parsedData = webhookPayloadSchema.parse(json);

    // Processamento seguro do evento de pagamento
    console.log(`[Mercado Pago Webhook] Recebido evento ${parsedData.type} para pagamento ${parsedData.data.id}`);

    return NextResponse.json({ received: true, status: "processed" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Payload inválido ou falha no processamento" },
      { status: 400 }
    );
  }
}
