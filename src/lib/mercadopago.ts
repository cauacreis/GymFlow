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
  role?: "student" | "coach";
  tier: "basico" | "pro" | "vip";
  price: number;
  billingPeriod: string;
  isRecurring: boolean;
  freeTrialDays?: number;
  description: string;
  maxStudents?: number;
}

/**
 * Tabela Oficial de Preços do Servidor (Fonte Única da Verdade)
 * Impede que usuários maliciosos manipulem os valores no payload das requisições.
 * Suporta separação completa de planos para Alunos e Professores (Personais).
 */
export const OFFICIAL_PLANS: Record<string, OfficialPlan> = {
  // --- PLANOS UNIFICADOS GYMFLOW (ABRANGEM TREINO DE ALUNO + ATENDIMENTO DE PROFESSOR) ---
  basico: {
    id: "basico",
    name: "GymFlow Básico",
    tier: "basico",
    price: 35.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 10,
    description: "Musculação, aeróbico, fichas essenciais e cargas + Gestão de até 10 alunos particulares e recebimento PIX",
  },
  pro: {
    id: "pro",
    name: "GymFlow Pro",
    tier: "pro",
    price: 45.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 35,
    description: "Biomecânica 3D, GymBot IA, histórico de PRs + Gestão de até 35 alunos, catálogo de fichas e selo no marketplace",
  },
  vip: {
    id: "vip",
    name: "GymFlow VIP Black",
    tier: "vip",
    price: 55.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Bioimpedância InBody, análise metabólica, suporte VIP + Alunos ilimitados e topo no Marketplace de Personais",
  },
  monthly_recurring: {
    id: "monthly_recurring",
    name: "GymFlow Pro Recorrente",
    tier: "pro",
    price: 39.9,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 35,
    description: "Assinatura mensal recorrente com débito automático no cartão via Mercado Pago",
  },
  monthly_pix: {
    id: "monthly_pix",
    name: "GymFlow Pro Mensal Sem Recorrência (PIX)",
    tier: "pro",
    price: 45.0,
    billingPeriod: "avulso",
    isRecurring: false,
    maxStudents: 35,
    description: "30 dias de acesso Pro unificado liberado instantaneamente via PIX",
  },
  trial_7d: {
    id: "trial_7d",
    name: "GymFlow Pro 7 Dias Grátis",
    tier: "pro",
    price: 39.9,
    billingPeriod: "/mês",
    isRecurring: true,
    freeTrialDays: 7,
    maxStudents: 35,
    description: "7 dias gratuitos com cobrança automática recorrente a partir do 8º dia",
  },

  // --- ALIASES DEFENSIVOS PARA COMPATIBILIDADE RETROATIVA ---
  student_basico: {
    id: "student_basico",
    name: "GymFlow Básico",
    tier: "basico",
    price: 35.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 10,
    description: "Musculação, aeróbico, fichas essenciais e cargas + Gestão de até 10 alunos particulares",
  },
  student_pro: {
    id: "student_pro",
    name: "GymFlow Pro",
    tier: "pro",
    price: 45.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 35,
    description: "Biomecânica 3D, GymBot IA, histórico de PRs + Gestão de até 35 alunos",
  },
  student_vip: {
    id: "student_vip",
    name: "GymFlow VIP Black",
    tier: "vip",
    price: 55.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Bioimpedância InBody, análise metabólica + Alunos ilimitados no roster",
  },
  coach_starter: {
    id: "coach_starter",
    name: "GymFlow Básico (Personal Starter)",
    tier: "basico",
    price: 35.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 10,
    description: "Gestão de até 10 alunos particulares + Treino completo de musculação",
  },
  coach_starter_rec: {
    id: "coach_starter_rec",
    name: "GymFlow Básico Recorrente",
    tier: "basico",
    price: 35.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 10,
    description: "Gestão de até 10 alunos + Treino completo de musculação",
  },
  coach_pro: {
    id: "coach_pro",
    name: "GymFlow Pro (Personal Pro)",
    tier: "pro",
    price: 45.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 35,
    description: "Gestão de até 35 alunos, Selo Verificado + Biomecânica 3D e GymBot IA",
  },
  coach_pro_rec: {
    id: "coach_pro_rec",
    name: "GymFlow Pro Recorrente",
    tier: "pro",
    price: 45.0,
    billingPeriod: "/mês",
    isRecurring: true,
    maxStudents: 35,
    description: "Gestão de até 35 alunos, Selo Verificado + Biomecânica 3D e GymBot IA",
  },
  coach_vip: {
    id: "coach_vip",
    name: "GymFlow VIP Black (Personal Elite)",
    tier: "vip",
    price: 55.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Alunos ilimitados, Topo no Marketplace + Bioimpedância InBody e suporte VIP",
  },
  coach_vip_rec: {
    id: "coach_vip_rec",
    name: "GymFlow VIP Black Recorrente",
    tier: "vip",
    price: 55.0,
    billingPeriod: "/mês",
    isRecurring: true,
    description: "Alunos ilimitados, Topo no Marketplace + Bioimpedância InBody e suporte VIP",
  },
  trial_coach_7d: {
    id: "trial_coach_7d",
    name: "GymFlow Pro 7 Dias Grátis",
    tier: "pro",
    price: 39.9,
    billingPeriod: "/mês",
    isRecurring: true,
    freeTrialDays: 7,
    maxStudents: 35,
    description: "7 dias grátis de GymFlow Pro unificado para treinar e atender alunos",
  },
};

export function getOfficialPlan(planId?: string): OfficialPlan {
  if (planId && OFFICIAL_PLANS[planId]) {
    return OFFICIAL_PLANS[planId];
  }
  return OFFICIAL_PLANS.pro;
}

/**
 * Retorna os planos unificados que abrangem tanto o lado Aluno quanto o lado Professor
 */
export function getOfficialPlansByRole(_role?: "student" | "coach"): OfficialPlan[] {
  return [OFFICIAL_PLANS.basico, OFFICIAL_PLANS.pro, OFFICIAL_PLANS.vip];
}

export function getOfficialUnifiedPlans(): OfficialPlan[] {
  return [OFFICIAL_PLANS.basico, OFFICIAL_PLANS.pro, OFFICIAL_PLANS.vip];
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
  idempotencyKey?: string;
}

export interface CreateSubscriptionParams {
  reason?: string;
  price?: number;
  payerEmail: string;
  freeTrialDays?: number;
  backUrl?: string;
  userId?: string;
  planId?: string;
  idempotencyKey?: string;
}

export interface CreatePixParams {
  amount?: number;
  description?: string;
  payerEmail: string;
  payerName: string;
  userId?: string;
  planId?: string;
  idempotencyKey?: string;
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

  const idempotencyKey =
    params.idempotencyKey ||
    `pref_${params.userId || "guest"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
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
    idempotencyKey,
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

  const idempotencyKey =
    params.idempotencyKey ||
    `sub_${params.userId || "guest"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const res = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
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
    idempotencyKey,
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

  const idempotencyKey =
    params.idempotencyKey ||
    `pix_${params.userId || "guest"}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
      idempotencyKey,
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
      "X-Idempotency-Key": idempotencyKey,
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
    idempotencyKey,
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

/**
 * 6. Cancela uma Assinatura Recorrente no Mercado Pago (/preapproval/{id})
 * Permite ao usuário cancelar futuras cobranças a qualquer momento.
 */
export async function cancelRecurringSubscription(preapprovalId: string) {
  const token = getMercadoPagoAccessToken();

  if (!isMercadoPagoConfigured() || preapprovalId.startsWith("sub_sim_")) {
    return {
      id: preapprovalId,
      status: "cancelled",
      isSimulated: true,
      message: "Assinatura cancelada com sucesso (modo simulação/homologação).",
    };
  }

  if (!token) {
    throw new Error("Token de acesso do Mercado Pago não configurado.");
  }

  const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "cancelled",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Erro ao cancelar assinatura no Mercado Pago:", errText);
    throw new Error(`Falha ao cancelar assinatura no Mercado Pago: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    ...data,
    isSimulated: false,
  };
}

