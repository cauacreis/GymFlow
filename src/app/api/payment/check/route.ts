import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fetchPaymentDetails,
  getOfficialPlan,
  isMercadoPagoConfigured,
  parseExternalReference,
} from "@/lib/mercadopago";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

const checkSchema = z.object({
  paymentId: z.string().min(1).max(120),
  userId: z.string().optional(),
});

/**
 * Endpoint de Verificação e Sincronização de Pagamento (PIX / Cartão)
 * Permite ao frontend validar se um pagamento já foi compensado no Mercado Pago
 * sem depender exclusivamente de webhook quando o usuário está aguardando na tela.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get("id") || url.searchParams.get("paymentId");
    const userId = url.searchParams.get("userId") || undefined;

    const validated = checkSchema.parse({ paymentId, userId });

    // 1. Modo Simulação / Homologação (quando MP não está com credenciais reais)
    if (
      !isMercadoPagoConfigured() ||
      validated.paymentId.startsWith("pix_sim_") ||
      validated.paymentId.startsWith("pay_sandbox_")
    ) {
      return NextResponse.json({
        success: true,
        status: "approved",
        isSimulated: true,
        message: "Pagamento aprovado em modo de simulação/homologação.",
        plan: {
          id: "pro",
          name: "Plano Pro (Simulado)",
          tier: "pro",
          price: 45.0,
        },
      });
    }

    // 2. Consulta API Oficial do Mercado Pago
    const payment = await fetchPaymentDetails(validated.paymentId);
    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          status: "not_found",
          message: "Pagamento não localizado no Mercado Pago. Verifique o identificador.",
        },
        { status: 404 }
      );
    }

    const extRef = payment.external_reference;
    const parsedRef = parseExternalReference(extRef);
    const planId = parsedRef.planId || "pro";
    const official = getOfficialPlan(planId);
    const targetUserId = validated.userId || parsedRef.userId;

    // Se o pagamento estiver aprovado, sincroniza com o banco de dados
    if (payment.status === "approved") {
      const supabase = getSupabaseAdmin() || getSupabase();
      if (supabase) {
        const now = new Date();
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        // Registro de auditoria financeira
        await supabase.from("payments").upsert(
          {
            id: `pay_${payment.id}`,
            payment_id: String(payment.id),
            status: "approved",
            payment_method: payment.payment_method_id || "pix",
            amount: payment.transaction_amount || official.price,
            plan_id: official.id,
            user_id: targetUserId && targetUserId.includes("-") ? targetUserId : null,
            user_email: payment.payer?.email || null,
            external_reference: extRef || null,
            updated_at: now.toISOString(),
          },
          { onConflict: "id" }
        );

        // Ativação do perfil
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
        }
      }

      return NextResponse.json({
        success: true,
        status: "approved",
        isSimulated: false,
        paymentDetails: {
          id: payment.id,
          status: payment.status,
          amount: payment.transaction_amount,
          paymentMethod: payment.payment_method_id,
        },
        plan: {
          id: official.id,
          name: official.name,
          tier: official.tier,
          price: official.price,
        },
      });
    }

    // Status pendente ou em análise
    return NextResponse.json({
      success: true,
      status: payment.status,
      isSimulated: false,
      message:
        payment.status === "pending" || payment.status === "in_process"
          ? "Aguardando confirmação do pagamento bancário via PIX..."
          : `Status do pagamento: ${payment.status}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao consultar status do pagamento." },
      { status: 400 }
    );
  }
}
