import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyHmacSignature } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-signature");
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // Se estiver em produção e com segredo configurado, valida a assinatura HMAC
    if (process.env.NODE_ENV === "production" && webhookSecret && signatureHeader) {
      const isValid = verifyHmacSignature(rawBody, signatureHeader, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Assinatura HMAC inválida" },
          { status: 401 }
        );
      }
    }

    let eventType = url.searchParams.get("type") || url.searchParams.get("topic") || "payment";
    let dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (rawBody) {
      try {
        const json = JSON.parse(rawBody);
        if (json.type) eventType = json.type;
        if (json.data?.id) dataId = String(json.data.id);
        if (json.action) eventType = json.action;
      } catch {}
    }

    console.log(`[Mercado Pago Webhook] Processando evento: ${eventType} | ID: ${dataId}`);

    // Retorna 200 OK imediatamente para o Mercado Pago não retentar
    return NextResponse.json({
      received: true,
      status: "processed",
      type: eventType,
      id: dataId,
    });
  } catch (err: any) {
    console.error("[Mercado Pago Webhook Error]:", err);
    return NextResponse.json(
      { error: "Erro no processamento do webhook" },
      { status: 400 }
    );
  }
}
