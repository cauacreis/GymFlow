import { NextResponse } from "next/server";
import { verifyMercadoPagoWebhook } from "@/lib/security";
import {
  fetchPaymentDetails,
  fetchPreapprovalDetails,
  getOfficialPlan,
  parseExternalReference,
} from "@/lib/mercadopago";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

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

    // 1. Validação de Assinatura HMAC Timing-Safe com suporte a manifesto oficial do Mercado Pago
    if (webhookSecret && signatureHeader) {
      const isValid = verifyMercadoPagoWebhook({
        signatureHeader,
        xRequestId,
        dataId,
        rawBody,
        secret: webhookSecret,
      });
      if (!isValid) {
        console.warn("⚠️ [Mercado Pago Webhook] Assinatura HMAC rejeitada.");
        return NextResponse.json(
          { error: "Assinatura HMAC inválida" },
          { status: 401 }
        );
      }
    }

    console.log(`[Mercado Pago Webhook] Evento recebido: ${eventType} | ID: ${dataId}`);

    const supabase = getSupabaseAdmin() || getSupabase();

    // 2. Processamento Seguro de Pagamento Aprovado (PIX ou Cartão Avulso)
    if (dataId && (eventType === "payment" || eventType.includes("payment"))) {
      const paymentDetails = await fetchPaymentDetails(dataId);

      if (paymentDetails && paymentDetails.status === "approved") {
        console.log(`✅ [Mercado Pago Webhook] Pagamento aprovado confirmado: ID ${dataId}`);

        const extRef = paymentDetails.external_reference || "";
        const parsedRef = parseExternalReference(extRef);
        const planId = parsedRef.planId || "pro";
        const official = getOfficialPlan(planId);
        const refUserId = parsedRef.userId;

        if (supabase) {
          const now = new Date();
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + 30);

          // Registra o pagamento para auditoria e prevenção de replay
          await supabase.from("payments").upsert(
            {
              id: `pay_${dataId}`,
              payment_id: String(dataId),
              status: "approved",
              payment_method: paymentDetails.payment_method_id || "mercadopago",
              amount: paymentDetails.transaction_amount || official.price,
              plan_id: official.id,
              user_id: refUserId && refUserId.includes("-") ? refUserId : null,
              user_email: paymentDetails.payer?.email || null,
              external_reference: extRef,
              updated_at: now.toISOString(),
            },
            { onConflict: "id" }
          );

          // Se tiver userId UUID ou se puder buscar por email
          let targetUserId = refUserId && refUserId.includes("-") ? refUserId : null;

          if (!targetUserId && paymentDetails.payer?.email) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", paymentDetails.payer.email)
              .maybeSingle();

            if (profile) {
              targetUserId = profile.id;
            }
          }

          if (targetUserId) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "active",
                subscription_plan: official.id,
                plan_tier: official.tier,
                subscription_ends_at: endsAt.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", targetUserId);

            console.log(`🎉 [Mercado Pago Webhook] Acesso ativado para usuário ${targetUserId} no plano ${official.name}!`);
          }
        }
      }
    }

    // 3. Processamento de Assinatura Recorrente (Preapproval)
    if (dataId && (eventType === "preapproval" || eventType.includes("subscription"))) {
      const preapproval = await fetchPreapprovalDetails(dataId);
      if (preapproval && preapproval.status === "authorized") {
        console.log(`✅ [Mercado Pago Webhook] Assinatura recorrente autorizada: ID ${dataId}`);

        if (supabase && preapproval.payer_email) {
          const now = new Date();
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + 35); // Período com margem de segurança de renovação

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", preapproval.payer_email)
            .maybeSingle();

          if (profile) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "active",
                subscription_plan: "monthly_recurring",
                plan_tier: "pro",
                subscription_ends_at: endsAt.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", profile.id);
          }
        }
      }
    }

    // Retorna 200 OK imediatamente para o Mercado Pago não retentar desnecessariamente
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
