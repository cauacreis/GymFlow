import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelRecurringSubscription, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import { sanitizeInput } from "@/lib/security";

const cancelSchema = z.object({
  userId: z.string().min(1).max(100).optional(),
  preapprovalId: z.string().max(120).optional(),
  reason: z.string().max(200).optional(),
  feedback: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = cancelSchema.parse(body);

    const supabase = getSupabaseAdmin() || getSupabase();
    const now = new Date().toISOString();
    const sanitizedReason = validated.reason ? sanitizeInput(validated.reason) : null;
    const sanitizedFeedback = validated.feedback ? sanitizeInput(validated.feedback) : null;

    let targetPreapprovalId = validated.preapprovalId;

    // 1. Se userId foi fornecido e temos Supabase configurado
    if (validated.userId && supabase) {
      // Busca o perfil do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, subscription_status, subscription_ends_at, trial_ends_at, mercadopago_subscription_id")
        .eq("id", validated.userId)
        .maybeSingle();

      if (profile?.mercadopago_subscription_id && !targetPreapprovalId) {
        targetPreapprovalId = profile.mercadopago_subscription_id;
      }

      // Atualiza o perfil para 'canceled'
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_canceled_at: now,
          cancel_reason: sanitizedReason,
          cancel_feedback: sanitizedFeedback,
          updated_at: now,
        })
        .eq("id", validated.userId);

      if (updateError) {
        console.warn("⚠️ [API Cancel] Aviso ao atualizar perfil no Supabase:", updateError.message);
      }
    }

    // 2. Se houver preapprovalId (no Mercado Pago), cancela a recorrência no gateway
    let mpResult: any = null;
    if (targetPreapprovalId) {
      try {
        mpResult = await cancelRecurringSubscription(targetPreapprovalId);
      } catch (err: any) {
        console.warn("⚠️ [API Cancel] Aviso ao cancelar no Mercado Pago:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      status: "canceled",
      message: "Assinatura cancelada com sucesso. Você continua com acesso até o encerramento do seu ciclo atual.",
      canceledAt: now,
      mpResult,
    });
  } catch (err: any) {
    console.error("Erro na rota /api/payment/mercadopago/cancel:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Falha ao processar cancelamento de assinatura" },
      { status: 400 }
    );
  }
}
