/**
 * GymFlow Mercado Pago Integration Service
 * Suporta:
 * 1. Assinaturas Recorrentes (Preapproval com ou sem 7 dias grátis de Trial no cartão)
 * 2. Checkout Sem Recorrência (Preferência avulsa com PIX, Cartão de Crédito e Boleto)
 * 3. Pagamento Direto PIX (Geração de QR Code e Copia e Cola instantâneo)
 * 4. Fallback Seguro / Modo Simulação caso chaves de produção ainda não estejam no .env
 * 5. Preços Canônicos Invioláveis (Anti-Tampering)
 */

const MP_API_BASE = "https://api.mercadopago.com";

export interface OfficialPlan {
  id: string;
  name: string;
  tier: "basico" | "pro" | "vip";
  price: number;
  billingPeriod: string;
  isRecurring: boolean;
  freeTrialDays?: number;
  description: string;
}

/**
 * Tabela Oficial de Preços do Servidor (Fonte Única da Verdade)
 * Impede que usuários maliciosos manipulem os valores no payload das requisições.
 */
export const OFFICIAL_PLANS: Record<string, OfficialPlan> = {
  basico: {
    id: "basico",
    name: "Plano Básico",
    tier: "basico",
    price: 35.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Musculação, aeróbico, catraca digital e fichas essenciais",
  },
  pro: {
    id: "pro",
    name: "Plano Pro",
    tier: "pro",
    price: 45.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Fichas completas com animações, todas as aulas coletivas e GymBot IA",
  },
  vip: {
    id: "vip",
    name: "Plano VIP",
    tier: "vip",
    price: 55.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Acesso VIP total, acompanhamento com Personal Trainer e Bioimpedância InBody",
  },
  monthly_recurring: {
    id: "monthly_recurring",
    name: "GymFlow Pro Recorrente",
    tier: "pro",
    price: 39.9,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Assinatura mensal recorrente com débito automático no cartão via Mercado Pago",
  },
  monthly_pix: {
    id: "monthly_pix",
    name: "GymFlow Mensal Sem Recorrência (PIX)",
    tier: "pro",
    price: 45.0,
    billingPeriod: "avulso",
    isRecurring: false,
    description: "30 dias de acesso Pro avulso liberado instantaneamente via PIX",
  },
  trial_7d: {
    id: "trial_7d",
    name: "GymFlow Pro 7 Dias Grátis",
    tier: "pro",
    price: 39.9,
    billingPeriod: "/mês",
    isRecurring: true,
    freeTrialDays: 7,
    description: "7 dias gratuitos com cobrança automática recorrente a partir do 8º dia",
  },
};

export function getOfficialPlan(planId?: string): OfficialPlan {
  if (planId && OFFICIAL_PLANS[planId]) {
    return OFFICIAL_PLANS[planId];
  }
  return OFFICIAL_PLANS.pro;
}

/**
 * Resolução resiliente do Access Token do Mercado Pago
 * Lê tanto os nomes de Sandbox/Produção quanto os nomes unificados.
 */
export function getMercadoPagoAccessToken(): string {
  // 1. Variável direta unificada
  const directToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (directToken && directToken.length > 20 && !directToken.includes("placeholder")) {
    return directToken;
  }

  // 2. Produção se NODE_ENV for production
  const prodToken = process.env.MP_ACCESS_TOKEN_PRODUCTION?.trim();
  if (process.env.NODE_ENV === "production" && prodToken && !prodToken.includes("APP_USR-xxxx")) {
    return prodToken;
  }

  // 3. Sandbox
  const sandboxToken = process.env.MP_ACCESS_TOKEN_SANDBOX?.trim();
  if (sandboxToken && !sandboxToken.includes("0000000000000000")) {
    return sandboxToken;
  }

  // 4. Produção mesmo fora de production (se configurado)
  if (prodToken && !prodToken.includes("APP_USR-xxxx")) {
    return prodToken;
  }

  // 5. Nome alternativo comum em SDKs
  const altToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (altToken && altToken.length > 20) {
    return altToken;
  }

  return "";
}

/**
 * Resolução resiliente da Public Key do Mercado Pago (para o frontend)
 */
export function getMercadoPagoPublicKey(): string {
  const direct = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim();
  if (direct && !direct.includes("00000000")) return direct;

  if (process.env.NODE_ENV === "production") {
    const prod = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PRODUCTION?.trim();
    if (prod && !prod.includes("APP_USR-xxxx")) return prod;
  }

  const sandbox = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_SANDBOX?.trim();
  if (sandbox && !sandbox.includes("00000000-0000")) return sandbox;

  const prodFallback = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PRODUCTION?.trim();
  if (prodFallback && !prodFallback.includes("APP_USR-xxxx")) return prodFallback;

  return "";
}

export function getMercadoPagoEnvironment(): "sandbox" | "production" | "unconfigured" {
  const token = getMercadoPagoAccessToken();
  if (!token || token.length < 15) return "unconfigured";
  if (token.startsWith("APP_USR-")) return "production";
  if (token.startsWith("TEST-")) return "sandbox";
  return "sandbox";
}

export function isMercadoPagoConfigured(): boolean {
  const token = getMercadoPagoAccessToken();
  return Boolean(
    token &&
      token.length > 20 &&
      !token.includes("placeholder") &&
      !token.includes("0000000000000000")
  );
}

export function buildExternalReference(prefix: string, userId: string = "guest", planId: string): string {
  // Delimitador ':' evita colisão com underscores em user IDs (ex: user_174173829) ou hífens em UUIDs
  return `${prefix}:${userId}:${planId}:${Date.now()}`;
}

export function parseExternalReference(extRef?: string | null): {
  prefix: string;
  userId: string | null;
  planId: string | null;
} {
  if (!extRef) return { prefix: "", userId: null, planId: null };

  // 1. Formato moderno com delimitador ':' (ex: pix:user_123:vip:174173829000)
  if (extRef.includes(":")) {
    const parts = extRef.split(":");
    return {
      prefix: parts[0] || "",
      userId: parts[1] && parts[1] !== "guest" && parts[1] !== "user" ? parts[1] : null,
      planId: parts[2] || null,
    };
  }

  // 2. Formato legado com delimitador '_' (ex: pix_user_123_vip_174173829000 ou pix_uuid_vip_174173829000)
  const parts = extRef.split("_");
  if (parts.length >= 4) {
    if (parts[1] === "user" && parts.length >= 5) {
      // Caso de ID prefixado: pix_user_12345_pro_timestamp
      return {
        prefix: parts[0],
        userId: `user_${parts[2]}`,
        planId: parts[3],
      };
    }
    return {
      prefix: parts[0],
      userId: parts[1] && parts[1] !== "guest" && parts[1] !== "user" ? parts[1] : null,
      planId: parts[2],
    };
  }

  return { prefix: "", userId: null, planId: null };
}

export function getMercadoPagoStatus() {
  const token = getMercadoPagoAccessToken();
  const publicKey = getMercadoPagoPublicKey();
  const env = getMercadoPagoEnvironment();
  const configured = isMercadoPagoConfigured();
  const hasWebhookSecret = Boolean(process.env.MP_WEBHOOK_SECRET);

  return {
    configured,
    environment: env,
    hasAccessToken: Boolean(token),
    tokenPrefix: token ? `${token.slice(0, 8)}...` : null,
    hasPublicKey: Boolean(publicKey),
    publicKeyPrefix: publicKey ? `${publicKey.slice(0, 8)}...` : null,
    hasWebhookSecret,
    setupGuide: {
      locationLocal: ".env.local",
      locationProduction: "Vercel > Project Settings > Environment Variables",
      portalUrl: "https://www.mercadopago.com.br/developers/panel/app",
      requiredVariables: ["MP_ACCESS_TOKEN", "NEXT_PUBLIC_MP_PUBLIC_KEY", "MP_WEBHOOK_SECRET"],
      modeActive: configured ? (env === "production" ? "Produção Real (APP_USR-)" : "Sandbox / Testes (TEST-)") : "Simulação / Homologação Local",
    },
  };
}

export interface CreatePreferenceParams {
  title?: string;
  price?: number;
  payerEmail: string;
  payerName: string;
  planId: string;
  userId?: string;
  backUrl?: string;
}

export interface CreateSubscriptionParams {
  reason?: string;
  price?: number;
  payerEmail: string;
  freeTrialDays?: number;
  backUrl?: string;
  userId?: string;
  planId?: string;
}

export interface CreatePixParams {
  amount?: number;
  description?: string;
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
 * O valor é OBRIGATORIAMENTE validado contra a tabela oficial OFFICIAL_PLANS.
 */
export async function createCheckoutPreference(params: CreatePreferenceParams) {
  const token = getMercadoPagoAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
  const officialPlan = getOfficialPlan(params.planId);
  const validatedPrice = officialPlan.price;
  const planTitle = params.title || officialPlan.name;
  const backUrl = params.backUrl || `${appUrl}/?payment=success&plan=${officialPlan.id}`;

  // Se não houver token real configurado, retorna modo simulação
  if (!isMercadoPagoConfigured()) {
    console.warn("⚠️ [Mercado Pago] Token não configurado no .env.local. Usando modo de homologação/simulação.");
    return {
      id: `pref_sim_${Date.now()}`,
      init_point: `${appUrl}/?payment=simulated&plan=${officialPlan.id}`,
      sandbox_init_point: `${appUrl}/?payment=simulated&plan=${officialPlan.id}`,
      isSimulated: true,
      price: validatedPrice,
    };
  }

  const payload = {
    items: [
      {
        id: officialPlan.id,
        title: planTitle,
        description: `GymFlow — ${officialPlan.name}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: validatedPrice,
      },
    ],
    payer: {
      email: params.payerEmail,
      name: params.payerName,
    },
    back_urls: {
      success: `${appUrl}/?payment=approved&plan=${officialPlan.id}`,
      pending: `${appUrl}/?payment=pending&plan=${officialPlan.id}`,
      failure: `${appUrl}/?payment=failure&plan=${officialPlan.id}`,
    },
    auto_return: "approved",
    statement_descriptor: "GYMFLOW",
    external_reference: buildExternalReference("pref", params.userId || "guest", officialPlan.id),
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

  const data = await res.json();
  return {
    ...data,
    isSimulated: false,
    price: validatedPrice,
  };
}

/**
 * 2. Cria uma Assinatura Recorrente no Mercado Pago (/preapproval) com suporte a 7 Dias Grátis
 * O valor é OBRIGATORIAMENTE validado contra a tabela oficial OFFICIAL_PLANS.
 */
export async function createRecurringSubscription(params: CreateSubscriptionParams) {
  const token = getMercadoPagoAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
  const officialPlan = getOfficialPlan(params.planId);
  const validatedPrice = officialPlan.price;
  const trialDays =
    params.freeTrialDays !== undefined
      ? Math.min(params.freeTrialDays, officialPlan.freeTrialDays ?? 7)
      : (officialPlan.freeTrialDays ?? 0);
  const backUrl = params.backUrl || `${appUrl}/?subscription=active&plan=${officialPlan.id}`;

  if (!isMercadoPagoConfigured()) {
    console.warn("⚠️ [Mercado Pago] Token não configurado. Gerando link simulado de assinatura.");
    return {
      id: `sub_sim_${Date.now()}`,
      init_point: `${appUrl}/?subscription=simulated&trial=${trialDays}&plan=${officialPlan.id}`,
      status: "pending",
      isSimulated: true,
      price: validatedPrice,
    };
  }

  const payload: any = {
    reason: params.reason || officialPlan.name,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: validatedPrice,
      currency_id: "BRL",
    },
    back_url: backUrl,
    payer_email: params.payerEmail,
    status: "authorized",
    external_reference: buildExternalReference("sub", params.userId || "user", officialPlan.id),
  };

  // Adiciona período de trial gratuito se solicitado
  if (trialDays > 0) {
    payload.auto_recurring.free_trial = {
      frequency: trialDays,
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

  const data = await res.json();
  return {
    ...data,
    isSimulated: false,
    price: validatedPrice,
  };
}

/**
 * 3. Cria Pagamento Direto com PIX via API Oficial do Mercado Pago (/v1/payments)
 * O valor é OBRIGATORIAMENTE validado contra a tabela oficial OFFICIAL_PLANS.
 */
export async function createDirectPixPayment(params: CreatePixParams) {
  const token = getMercadoPagoAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
  const officialPlan = getOfficialPlan(params.planId);
  const validatedAmount = officialPlan.price;
  const description = params.description || `GymFlow — ${officialPlan.name}`;

  if (!isMercadoPagoConfigured()) {
    // Retorna payload de PIX simulado funcional
    const mockPixKey =
      "00020126580014br.gov.bcb.pix0136gymflow-assinaturas-financeiro-2026520400005303986540545.005802BR5920GYMFLOW TREINAMENTOS6009SAO PAULO62070503***6304E8A2";
    return {
      id: `pix_sim_${Date.now()}`,
      status: "pending",
      payment_method_id: "pix",
      qr_code: mockPixKey,
      qr_code_base64: "", // O cliente gerará visualmente com a lib qrcode
      ticket_url: `${appUrl}/?payment=pix_pending`,
      isSimulated: true,
      amount: validatedAmount,
    };
  }

  const payload = {
    transaction_amount: validatedAmount,
    description,
    payment_method_id: "pix",
    payer: {
      email: params.payerEmail,
      first_name: params.payerName.split(" ")[0] || "Aluno",
      last_name: params.payerName.split(" ").slice(1).join(" ") || "GymFlow",
    },
    notification_url: `${appUrl}/api/payment/webhook`,
    external_reference: buildExternalReference("pix", params.userId || "user", officialPlan.id),
  };

  const res = await fetch(`${MP_API_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `pix_${params.userId || "user"}_${Date.now()}`,
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
    amount: data.transaction_amount || validatedAmount,
  };
}

/**
 * 4. Consulta detalhes de um pagamento na API do Mercado Pago
 */
export async function fetchPaymentDetails(paymentId: string) {
  const token = getMercadoPagoAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Erro ao buscar detalhes de pagamento:", err);
    return null;
  }
}

/**
 * 5. Consulta detalhes de uma assinatura recorrente no Mercado Pago
 */
export async function fetchPreapprovalDetails(preapprovalId: string) {
  const token = getMercadoPagoAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Erro ao buscar detalhes de assinatura:", err);
    return null;
  }
}
