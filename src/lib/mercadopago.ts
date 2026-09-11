/**
 * GymFlow Mercado Pago Integration Service
 * Suporta:
 * 1. Assinaturas Recorrentes (Preapproval com ou sem 7 dias grátis de Trial no cartão)
 * 2. Checkout Sem Recorrência (Preferência avulsa com PIX, Cartão de Crédito e Boleto)
 * 3. Pagamento Direto PIX (Geração de QR Code e Copia e Cola instantâneo)
 * 4. Fallback Seguro / Modo Simulação caso chaves de produção ainda não estejam no .env
 */

const MP_API_BASE = "https://api.mercadopago.com";

export function getMercadoPagoAccessToken(): string {
  return (
    process.env.MP_ACCESS_TOKEN ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    ""
  );
}

export function isMercadoPagoConfigured(): boolean {
  const token = getMercadoPagoAccessToken();
  return Boolean(token && token.length > 20 && !token.includes("placeholder"));
}

export interface CreatePreferenceParams {
  title: string;
  price: number;
  payerEmail: string;
  payerName: string;
  planId: string;
  userId?: string;
  backUrl?: string;
}

export interface CreateSubscriptionParams {
  reason: string;
  price: number;
  payerEmail: string;
  freeTrialDays?: number;
  backUrl?: string;
  userId?: string;
  planId?: string;
}

export interface CreatePixParams {
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  userId?: string;
  planId?: string;
}

export interface PaymentResult {
  id: string;
  status: "approved" | "pending" | "rejected";
  paymentMethod: "pix" | "credit_card";
  amount: number;
}

export async function createSandboxPayment(
  amount: number,
  method: "pix" | "credit_card" = "pix"
): Promise<PaymentResult> {
  return {
    id: `pay_sandbox_${Date.now()}`,
    status: "approved",
    paymentMethod: method,
    amount,
  };
}

/**
 * 1. Cria uma Preferência de Checkout Pro do Mercado Pago (Pagamentos Avulsos: PIX, Cartão e Boleto)
 */
export async function createCheckoutPreference(params: CreatePreferenceParams) {
  const token = getMercadoPagoAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
  const backUrl = params.backUrl || `${appUrl}/?payment=success&plan=${params.planId}`;

  // Se não houver token real configurado, retorna modo simulação
  if (!isMercadoPagoConfigured()) {
    console.warn("⚠️ [Mercado Pago] Token não configurado no .env.local. Usando modo de homologação/simulação.");
    return {
      id: `pref_sim_${Date.now()}`,
      init_point: `${appUrl}/?payment=simulated&plan=${params.planId}`,
      sandbox_init_point: `${appUrl}/?payment=simulated&plan=${params.planId}`,
      isSimulated: true,
    };
  }

  const payload = {
    items: [
      {
        id: params.planId,
        title: params.title,
        description: `GymFlow — ${params.title}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(params.price),
      },
    ],
    payer: {
      email: params.payerEmail,
      name: params.payerName,
    },
    back_urls: {
      success: `${appUrl}/?payment=approved&plan=${params.planId}`,
      pending: `${appUrl}/?payment=pending&plan=${params.planId}`,
      failure: `${appUrl}/?payment=failure&plan=${params.planId}`,
    },
    auto_return: "approved",
    statement_descriptor: "GYMFLOW",
    external_reference: `user_${params.userId || "guest"}_${params.planId}_${Date.now()}`,
    notification_url: `${appUrl}/api/payment/webhook`,
    payment_methods: {
      excluded_payment_types: [],
      installments: 12,
    },
  };

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Erro ao criar preferência no Mercado Pago:", errText);
    throw new Error(`Falha no Mercado Pago: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * 2. Cria uma Assinatura Recorrente no Mercado Pago (/preapproval) com suporte a 7 Dias Grátis
 */
export async function createRecurringSubscription(params: CreateSubscriptionParams) {
  const token = getMercadoPagoAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
  const backUrl = params.backUrl || `${appUrl}/?subscription=active&plan=${params.planId || "pro"}`;

  if (!isMercadoPagoConfigured()) {
    console.warn("⚠️ [Mercado Pago] Token não configurado. Gerando link simulado de assinatura.");
    return {
      id: `sub_sim_${Date.now()}`,
      init_point: `${appUrl}/?subscription=simulated&trial=${params.freeTrialDays || 0}`,
      status: "pending",
      isSimulated: true,
    };
  }

  const payload: any = {
    reason: params.reason,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(params.price),
      currency_id: "BRL",
    },
    back_url: backUrl,
    payer_email: params.payerEmail,
    status: "authorized",
    external_reference: `sub_${params.userId || "user"}_${Date.now()}`,
  };

  // Adiciona período de trial gratuito se solicitado
  if (params.freeTrialDays && params.freeTrialDays > 0) {
    payload.auto_recurring.free_trial = {
      frequency: params.freeTrialDays,
      frequency_type: "days",
    };
  }

  const res = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Erro ao criar assinatura recorrente no Mercado Pago:", errText);
    throw new Error(`Falha na criação de assinatura: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * 3. Cria Pagamento Direto com PIX via API Oficial do Mercado Pago (/v1/payments)
 */
export async function createDirectPixPayment(params: CreatePixParams) {
  const token = getMercadoPagoAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";

  if (!isMercadoPagoConfigured()) {
    // Retorna payload de PIX simulado funcional
    const mockPixKey = "00020126580014br.gov.bcb.pix0136gymflow-assinaturas-financeiro-2026520400005303986540545.005802BR5920GYMFLOW TREINAMENTOS6009SAO PAULO62070503***6304E8A2";
    return {
      id: `pix_sim_${Date.now()}`,
      status: "pending",
      payment_method_id: "pix",
      qr_code: mockPixKey,
      qr_code_base64: "", // O cliente gerará visualmente com a lib qrcode
      ticket_url: `${appUrl}/?payment=pix_pending`,
      isSimulated: true,
      amount: params.amount,
    };
  }

  const payload = {
    transaction_amount: Number(params.amount),
    description: params.description,
    payment_method_id: "pix",
    payer: {
      email: params.payerEmail,
      first_name: params.payerName.split(" ")[0] || "Aluno",
      last_name: params.payerName.split(" ").slice(1).join(" ") || "GymFlow",
    },
    notification_url: `${appUrl}/api/payment/webhook`,
    external_reference: `pix_${params.userId || "user"}_${Date.now()}`,
  };

  const res = await fetch(`${MP_API_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `pix_${params.userId}_${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Erro ao gerar PIX no Mercado Pago:", errText);
    throw new Error(`Falha ao gerar PIX: ${res.statusText}`);
  }

  const data = await res.json();
  const poi = data.point_of_interaction?.transaction_data;

  return {
    id: data.id,
    status: data.status,
    payment_method_id: "pix",
    qr_code: poi?.qr_code || "",
    qr_code_base64: poi?.qr_code_base64 || "",
    ticket_url: poi?.ticket_url || "",
    isSimulated: false,
    amount: data.transaction_amount,
  };
}
