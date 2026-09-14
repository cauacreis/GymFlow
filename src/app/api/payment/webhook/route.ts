import { NextResponse } from "next/server";
import { verifyMercadoPagoWebhook } from "@/lib/security";
import {
  fetchPaymentDetails,
  fetchPreapprovalDetails,
  getOfficialPlan,
  parseExternalReference,
} from "@/lib/mercadopago";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import {
  acquireWebhookEventLock,
  commitWebhookProcessed,
  commitWebhookFailed,
  resolvePaymentStateTransition,
  calculateDeterministicSubscriptionExtension,
  canApplySubscriptionCredit,
  isValidUuid,
  hashPayload,
} from "@/lib/idempotency";

export async function POST(request: Request) {
  let eventId = "";
  try {
    const url = new URL(request.url);
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    let eventType = url.searchParams.get("type") || url.searchParams.get("topic") || "payment";
    let dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

    let notificationId = "";
    if (rawBody) {
      try {
        const json = JSON.parse(rawBody);
        if (json.id) notificationId = String(json.id);
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

    // 2. Criação de Event ID Determinístico para Deduplicação no Ledger
    let v1Hash = "";
    if (signatureHeader && signatureHeader.includes("v1=")) {
      const parts = signatureHeader.split(",");
      const v1Part = parts.find((p) => p.trim().startsWith("v1="));
      if (v1Part) v1Hash = v1Part.split("=")[1]?.trim() || "";
    }

    if (notificationId) {
      eventId = `mp_evt_${notificationId}`;
    } else if (xRequestId) {
      eventId = `mp_req_${xRequestId}`;
    } else if (v1Hash) {
      eventId = `mp_sig_${v1Hash.slice(0, 32)}`;
    } else {
      // Fallback determinístico (SHA-256 do payload canônico) em vez de Date.now()
      const fallbackHash = hashPayload({ eventType, dataId, rawBody });
      eventId = `mp_${eventType}_${dataId}_${fallbackHash.slice(0, 16)}`;
    }

    console.log(`[Mercado Pago Webhook] Evento: ${eventType} | ID: ${dataId} | EventId: ${eventId}`);

    // 3. Ledger de Deduplicação de Webhooks (Prevenção de Replays e Entregas Concorrentes)
    const ledgerLock = await acquireWebhookEventLock({
      eventId,
      provider: "mercadopago",
      eventType,
      resourceId: String(dataId || "unknown"),
      payload: { eventType, dataId, xRequestId },
    });

    if (!ledgerLock.shouldProcess) {
      console.log(`ℹ️ [Mercado Pago Webhook] Evento ignorado pelo Ledger (${ledgerLock.status}): ${eventId}`);
      return NextResponse.json({
        received: true,
        deduplicated: true,
        status: ledgerLock.status,
        id: dataId,
      });
    }

    const supabase = getSupabaseAdmin() || getSupabase();

    // 4. Processamento Seguro de Pagamento (PIX ou Cartão Avulso) com FSM e Crédito Determinístico
    if (dataId && (eventType === "payment" || eventType.includes("payment"))) {
      const paymentDetails = await fetchPaymentDetails(dataId);

      if (paymentDetails) {
        const newStatus = paymentDetails.status;
        const extRef = paymentDetails.external_reference || "";
        const parsedRef = parseExternalReference(extRef);
        const planId = parsedRef.planId || "pro";
        const official = getOfficialPlan(planId);
        const refUserId = parsedRef.userId;
        const now = new Date();

        if (supabase) {
          // Busca registro existente para validação da FSM
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("*")
            .eq("id", `pay_${dataId}`)
            .maybeSingle();

          // Validação Monotônica da FSM (impede que 'pending' atrase e reverta 'approved')
          const fsmCheck = resolvePaymentStateTransition(existingPayment?.status, newStatus);

          if (!fsmCheck.allowed) {
            console.warn(`⚠️ [Mercado Pago Webhook] Transição FSM rejeitada: ${fsmCheck.reason}`);
            await commitWebhookProcessed(eventId, { paymentId: String(dataId) });
            return NextResponse.json({
              received: true,
              status: "fsm_rejected",
              reason: fsmCheck.reason,
              id: dataId,
            });
          }

          const alreadyCredited = existingPayment?.credit_applied === true;
          const shouldCredit = canApplySubscriptionCredit({
            status: newStatus,
            credit_applied: alreadyCredited,
          });

          // Histórico de auditoria de estados
          const statusHistory = Array.isArray(existingPayment?.status_history)
            ? [...existingPayment.status_history]
            : [];
          if (!fsmCheck.isNoop) {
            statusHistory.push({
              from: existingPayment?.status || null,
              to: newStatus,
              timestamp: now.toISOString(),
            });
          }

          let creditSuccessfullyApplied = alreadyCredited;
          const validUserId = isValidUuid(refUserId)
            ? refUserId
            : (isValidUuid(existingPayment?.user_id) ? existingPayment.user_id : null);

          // Se deve creditar acesso de 30 dias (aplica no perfil ANTES de marcar credit_applied)
          if (shouldCredit) {
            let targetUserId = validUserId;
            let currentProfile: any = null;

            if (targetUserId) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("id, subscription_ends_at, email")
                .eq("id", targetUserId)
                .maybeSingle();
              currentProfile = prof;
            } else if (paymentDetails.payer?.email) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("id, subscription_ends_at, email")
                .eq("email", paymentDetails.payer.email)
                .maybeSingle();
              currentProfile = prof;
              if (prof && isValidUuid(prof.id)) targetUserId = prof.id;
            }

            if (targetUserId) {
              // Extensão Determinística (preserva dias se o usuário já estiver ativo no futuro)
              const { newEndsAt } = calculateDeterministicSubscriptionExtension({
                currentEndsAt: currentProfile?.subscription_ends_at,
                daysToAdd: 30,
              });

              const { error: profileErr } = await supabase
                .from("profiles")
                .update({
                  subscription_status: "active",
                  subscription_plan: official.id,
                  plan_tier: official.tier,
                  subscription_ends_at: newEndsAt.toISOString(),
                  updated_at: now.toISOString(),
                })
                .eq("id", targetUserId);

              if (!profileErr) {
                creditSuccessfullyApplied = true;
                console.log(
                  `🎉 [Mercado Pago Webhook] Acesso ativado deterministicamente até ${newEndsAt.toISOString()} para usuário ${targetUserId}!`
                );
              } else {
                console.error("❌ Falha ao atualizar perfil do usuário:", profileErr);
              }
            }
          }

          // Se status for estorno ou chargeback, revoga o plano ativo do usuário
          if (newStatus === "refunded" || newStatus === "charged_back") {
            const targetUserId = validUserId;
            if (targetUserId) {
              await supabase
                .from("profiles")
                .update({
                  subscription_status: "cancelled",
                  subscription_ends_at: now.toISOString(),
                  updated_at: now.toISOString(),
                })
                .eq("id", targetUserId);
              console.log(`⚠️ [Mercado Pago Webhook] Assinatura cancelada por reembolso/chargeback para usuário ${targetUserId}.`);
            }
          }

          // Registra ou atualiza o pagamento com auditoria financeira
          // Note: credit_applied é setado como TRUE SOMENTE se o crédito foi realmente aplicado com sucesso
          await supabase.from("payments").upsert(
            {
              id: `pay_${dataId}`,
              payment_id: String(dataId),
              status: newStatus,
              payment_method: paymentDetails.payment_method_id || "mercadopago",
              amount: paymentDetails.transaction_amount || official.price,
              plan_id: official.id,
              user_id: validUserId,
              user_email: paymentDetails.payer?.email || existingPayment?.user_email || null,
              external_reference: extRef || existingPayment?.external_reference || null,
              credit_applied: creditSuccessfullyApplied,
              status_history: statusHistory,
              updated_at: now.toISOString(),
            },
            { onConflict: "id" }
          );
        }
      }
    }

    // 5. Processamento de Assinatura Recorrente (Preapproval) com Deduplicação e Ledger
    if (dataId && (eventType === "preapproval" || eventType.includes("subscription"))) {
      const preapproval = await fetchPreapprovalDetails(dataId);
      if (preapproval && supabase) {
        const now = new Date();
        const preapprovalPaymentId = `preapproval_${dataId}`;

        const { data: existingSub } = await supabase
          .from("payments")
          .select("*")
          .eq("id", preapprovalPaymentId)
          .maybeSingle();

        if (preapproval.status === "authorized") {
          console.log(`✅ [Mercado Pago Webhook] Assinatura recorrente autorizada: ID ${dataId}`);

          const alreadyCredited = existingSub?.credit_applied === true;
          let creditApplied = alreadyCredited;

          if (preapproval.payer_email && !alreadyCredited) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, subscription_ends_at")
              .eq("email", preapproval.payer_email)
              .maybeSingle();

            if (profile) {
              const { newEndsAt } = calculateDeterministicSubscriptionExtension({
                currentEndsAt: profile.subscription_ends_at,
                daysToAdd: 35, // Margem de segurança de renovação
              });

              const { error: profErr } = await supabase
                .from("profiles")
                .update({
                  subscription_status: "active",
                  subscription_plan: "monthly_recurring",
                  plan_tier: "pro",
                  subscription_ends_at: newEndsAt.toISOString(),
                  updated_at: now.toISOString(),
                })
                .eq("id", profile.id);

              if (!profErr) {
                creditApplied = true;
              }
            }
          }

          await supabase.from("payments").upsert(
            {
              id: preapprovalPaymentId,
              payment_id: String(dataId),
              status: "authorized",
              payment_method: "preapproval",
              amount: 39.9,
              plan_id: "monthly_recurring",
              user_email: preapproval.payer_email || null,
              credit_applied: creditApplied,
              updated_at: now.toISOString(),
            },
            { onConflict: "id" }
          );
        } else if (preapproval.status === "cancelled") {
          if (preapproval.payer_email) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "cancelled",
                updated_at: now.toISOString(),
              })
              .eq("email", preapproval.payer_email);
          }
        }
      }
    }

    // Marca o evento como devidamente processado no Ledger
    await commitWebhookProcessed(eventId, { paymentId: String(dataId) });

    return NextResponse.json({
      received: true,
      status: "processed",
      type: eventType,
      id: dataId,
    });
  } catch (err: any) {
    console.error("[Mercado Pago Webhook Error]:", err);
    if (eventId) {
      await commitWebhookFailed(eventId, err.message || "Erro no processamento");
    }
    return NextResponse.json(
      { error: "Erro no processamento do webhook" },
      { status: 400 }
    );
  }
}
