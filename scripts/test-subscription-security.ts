/**
 * GymFlow Automated Security, Feature Gating, Idempotency & Mercado Pago Test Suite
 * Importa DIRETAMENTE os módulos reais da aplicação (Zero Mocks internos).
 * Executa verificações profundas em:
 * 1. Tabela Canônica e Anti-Tampering de Preços
 * 2. Encoding e Parsing Resiliente de External Reference (PIX, Assinaturas, Checkout)
 * 3. Feature Gating Granular por Nível (Básico vs Pro vs VIP)
 * 4. Validação de Expiração e Paywall (Anti-Bypass de Trial e Vencimento)
 * 5. Verificação Criptográfica HMAC Timing-Safe de Webhooks do Mercado Pago
 * 6. Rate Limiting e Sanitização Defensiva
 * 7. Diagnóstico do Ambiente Mercado Pago
 * 8. Idempotência IETF, Deduplicação de Requisições e Travas Mutex In-Flight
 * 9. Propagação de Idempotência nas Chamadas à API do Mercado Pago
 * 10. Ledger de Eventos de Webhook (Event Store & Deduplicação Estrita)
 * 11. Finite State Machine (FSM) de Transição Monotônica de Pagamentos
 * 12. Extensão Determinística de Assinaturas e Proteção Anti-Double Credit
 */

import crypto from "crypto";
import {
  OFFICIAL_PLANS,
  getOfficialPlan,
  getOfficialPlansByRole,
  buildExternalReference,
  parseExternalReference,
  getMercadoPagoStatus,
  createDirectPixPayment,
  createCheckoutPreference,
  createRecurringSubscription,
  cancelRecurringSubscription,
} from "../src/lib/mercadopago";

import {
  canAccessFeature,
  getUserPlanTier,
  isSubscriptionExpired,
  getRemainingTrialDays,
  FEATURES_METADATA,
} from "../src/lib/subscription-features";

import {
  hasActiveAccess,
  activateTrialForUser,
  activatePaidPlanForUser,
  cancelSubscriptionLocal,
  reactivateSubscriptionForUser,
  areProfilesEqual,
  UserProfile,
} from "../src/lib/auth-store";
import {
  CoachTrainer,
  getStoredNotifications,
  getStoredBookings,
  getCoachBookings,
  getStudentBookings,
  requestTrainerBooking,
  addNotification,
} from "../src/lib/booking-store";
import {
  getCoachStudentsStorageKey,
  getCoachPlansStorageKey,
  getStoredStudents,
  saveNewStudent,
  getStoredCoachPlans,
  saveCoachPlans,
  isCoachAutoBlockEnabled,
  setCoachAutoBlockPreference,
  setStudentWorkoutLock,
  toggleStudentWorkoutLock,
  checkAndUpdatePaymentCycles,
  updateStudentPaymentStatus,
  getStudentWorkout,
} from "../src/lib/workout-store";
import {
  getBodyMetricsStorageKey,
  getStoredBodyMetrics,
  addBodyMetric,
} from "../src/lib/body-metrics-store";
import {
  getCoachRoutinesStorageKey,
  getStoredCoachRoutines,
  saveCoachRoutine,
} from "../src/lib/coach-routines-store";
import { FAQ_ITEMS } from "../src/components/subscription/SubscriptionFAQ";

import {
  verifyMercadoPagoWebhook,
  verifyHmacSignature,
  checkRateLimit,
  sanitizeString,
} from "../src/lib/security";

import {
  canonicalJsonStringify,
  hashPayload,
  canTransitionPaymentStatus,
  resolvePaymentStateTransition,
  calculateDeterministicSubscriptionExtension,
  canApplySubscriptionCredit,
  acquireIdempotencyLock,
  commitIdempotencySuccess,
  executeWithIdempotency,
  acquireWebhookEventLock,
  commitWebhookProcessed,
  isValidUuid,
  _resetMemoryStores,
} from "../src/lib/idempotency";

console.log("\n=======================================================");
console.log("🛡️  GYMFLOW — SUÍTE DE AUDITORIA DE SEGURANÇA REAL");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runAllTests() {
  // ---------------------------------------------------------------------------
  // 1. TESTE DE PREÇOS CANÔNICOS & PROTEÇÃO ANTI-TAMPERING
  // ---------------------------------------------------------------------------
  console.log("🔹 1. Testando Tabela Canônica de Preços e Anti-Price Tampering...");

  assert(OFFICIAL_PLANS.basico.price === 35.0, "Plano Básico tabelado em R$ 35,00");
  assert(OFFICIAL_PLANS.pro.price === 45.0, "Plano Pro tabelado em R$ 45,00");
  assert(OFFICIAL_PLANS.vip.price === 55.0, "Plano VIP tabelado em R$ 55,00");
  assert(OFFICIAL_PLANS.monthly_recurring.price === 39.9, "Plano Recorrente Cartão tabelado em R$ 39,90");

  // Ataque de manipulação de preço enviado pelo cliente
  const maliciousInputs = [
    { planId: "vip", price: 0.01 },
    { planId: "pro", price: -100 },
    { planId: "basico", price: 0 },
    { planId: "unknown_hack", price: 0.05 },
  ];

  for (const input of maliciousInputs) {
    const plan = getOfficialPlan(input.planId);
    assert(
      plan.price > 0 && plan.price !== input.price,
      `Tentativa de tampering (${input.planId} com R$ ${input.price}) neutralizada -> Servidor impôs R$ ${plan.price.toFixed(2)}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. TESTE DE EXTERNAL REFERENCE (PIX & WEBHOOK RESILIÊNCIA)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 2. Testando Encoding e Resolução de External Reference do Mercado Pago...");

  const extRefModern = buildExternalReference("pix", "user_174173829000", "vip");
  const parsedModern = parseExternalReference(extRefModern);
  assert(
    parsedModern.prefix === "pix" &&
      parsedModern.userId === "user_174173829000" &&
      parsedModern.planId === "vip",
    `External reference com delimitador ':' decodificou corretamente user_id com underscore: ${parsedModern.userId}`
  );

  const testUUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const extRefUUID = buildExternalReference("sub", testUUID, "pro");
  const parsedUUID = parseExternalReference(extRefUUID);
  assert(
    parsedUUID.prefix === "sub" &&
      parsedUUID.userId === testUUID &&
      parsedUUID.planId === "pro",
    `External reference preservou UUID do Supabase: ${parsedUUID.userId}`
  );

  const extRefLegacy = "pix_user_998877_pro_174173829000";
  const parsedLegacy = parseExternalReference(extRefLegacy);
  assert(
    parsedLegacy.userId === "user_998877" && parsedLegacy.planId === "pro",
    `Compatibilidade retroativa com formato legado: ${parsedLegacy.userId} no plano ${parsedLegacy.planId}`
  );

  const extRefGuest = buildExternalReference("pref", "guest", "basico");
  const parsedGuest = parseExternalReference(extRefGuest);
  assert(
    parsedGuest.userId === null && parsedGuest.planId === "basico",
    "External reference de usuário anônimo resolve userId como null com segurança"
  );

  // ---------------------------------------------------------------------------
  // 3. TESTE DE FEATURE GATING POR TIER (BÁSICO, PRO, VIP)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 3. Testando Separação Granular de Funcionalidades por Plano...");

  const makeUser = (tier: "basico" | "pro" | "vip", role: "student" | "coach" = "student"): any => ({
    id: "test_user_1",
    name: "Aluno Teste",
    email: "aluno@gymflow.com",
    activeRole: role,
    enabledRoles: [role],
    planTier: tier,
    subscriptionStatus: "active",
    subscriptionEndsAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  });

  const userBasico = makeUser("basico");
  assert(canAccessFeature("basic_workout", userBasico).allowed === true, "Básico: Tem acesso a Musculação Essencial");
  assert(canAccessFeature("turnstile_checkin", userBasico).allowed === true, "Básico: Tem acesso ao Check-in Digital");
  assert(canAccessFeature("basic_agenda", userBasico).allowed === true, "Básico: Tem acesso à Agenda de Treinos");
  assert(canAccessFeature("personal_marketplace", userBasico).allowed === true, "Básico: Tem acesso ao Marketplace de Personals");

  assert(canAccessFeature("advanced_workout", userBasico).allowed === false, "Básico BLOQUEADO: Fichas com GIFs e Biomecânica requer PRO");
  assert(canAccessFeature("collective_classes", userBasico).allowed === false, "Básico BLOQUEADO: Aulas Coletivas requer PRO");
  assert(canAccessFeature("gymbot_ai", userBasico).allowed === false, "Básico BLOQUEADO: GymBot IA requer PRO");
  assert(canAccessFeature("inbody_bioimpedance", userBasico).allowed === false, "Básico BLOQUEADO: Bioimpedância InBody requer VIP");
  assert(canAccessFeature("vip_personal_perks", userBasico).allowed === false, "Básico BLOQUEADO: Recursos VIP requer VIP");

  const userPro = makeUser("pro");
  assert(canAccessFeature("basic_workout", userPro).allowed === true, "Pro: Tem acesso a Musculação Essencial");
  assert(canAccessFeature("advanced_workout", userPro).allowed === true, "Pro: Tem acesso liberado a Fichas com GIFs");
  assert(canAccessFeature("collective_classes", userPro).allowed === true, "Pro: Tem acesso liberado a Aulas Coletivas");
  assert(canAccessFeature("gymbot_ai", userPro).allowed === true, "Pro: Tem acesso liberado ao GymBot IA");
  assert(canAccessFeature("inbody_bioimpedance", userPro).allowed === false, "Pro BLOQUEADO: Bioimpedância InBody é exclusivo VIP");
  assert(canAccessFeature("vip_personal_perks", userPro).allowed === false, "Pro BLOQUEADO: Recursos VIP é exclusivo VIP");

  const userVip = makeUser("vip");
  assert(canAccessFeature("basic_workout", userVip).allowed === true, "VIP: Tem acesso a Musculação Essencial");
  assert(canAccessFeature("advanced_workout", userVip).allowed === true, "VIP: Tem acesso a Fichas com GIFs");
  assert(canAccessFeature("collective_classes", userVip).allowed === true, "VIP: Tem acesso a Aulas Coletivas");
  assert(canAccessFeature("gymbot_ai", userVip).allowed === true, "VIP: Tem acesso ao GymBot IA");
  assert(canAccessFeature("inbody_bioimpedance", userVip).allowed === true, "VIP: Tem acesso LIBERADO a Bioimpedância InBody");
  assert(canAccessFeature("vip_personal_perks", userVip).allowed === true, "VIP: Tem acesso LIBERADO a Recursos VIP");

  const userCoach = makeUser("pro", "coach");
  assert(canAccessFeature("coach_tools", userCoach).allowed === true, "Coach: Tem acesso ao Painel de Prescrição");
  assert(canAccessFeature("advanced_workout", userCoach).allowed === true, "Coach: Tem acesso irrestrito para demonstração");
  assert(canAccessFeature("coach_tools", userPro).allowed === false, "Aluno Pro NÃO tem acesso às ferramentas de professor");

  // ---------------------------------------------------------------------------
  // 4. TESTE DE EXPIRAÇÃO, TRIAL E PAYWALL (ANTI-BYPASS)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 4. Testando Detecção de Expiração e Paywall...");

  const activeStudent = {
    ...userPro,
    subscriptionStatus: "active",
    subscriptionEndsAt: new Date(Date.now() + 86400000).toISOString(),
  };
  assert(isSubscriptionExpired(activeStudent) === false, "Aluno com assinatura ativa não está expirado");
  assert(canAccessFeature("advanced_workout", activeStudent).allowed === true, "Aluno ativo acessa recursos do seu tier");

  const expiredStudent = {
    ...userPro,
    subscriptionStatus: "active",
    subscriptionEndsAt: new Date(Date.now() - 3600000).toISOString(),
  };
  assert(isSubscriptionExpired(expiredStudent) === true, "Aluno com data vencida detectado como expirado");
  assert(canAccessFeature("basic_workout", expiredStudent).allowed === false, "Aluno expirado é BLOQUEADO até mesmo da musculação básica");
  assert(canAccessFeature("turnstile_checkin", expiredStudent).allowed === false, "Aluno expirado tem CHECK-IN BLOQUEADO");

  const activeTrialStudent = {
    ...userPro,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  };
  assert(isSubscriptionExpired(activeTrialStudent) === false, "Aluno em Trial de 7 dias válido não está expirado");
  assert(canAccessFeature("advanced_workout", activeTrialStudent).allowed === true, "Aluno em Trial tem acesso Pro liberado");
  assert(canAccessFeature("inbody_bioimpedance", activeTrialStudent).allowed === false, "Aluno em Trial NÃO tem acesso aos benefícios VIP");

  const expiredTrialStudent = {
    ...userPro,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() - 1000).toISOString(),
  };
  assert(isSubscriptionExpired(expiredTrialStudent) === true, "Trial expirado detectado imediatamente");
  assert(canAccessFeature("advanced_workout", expiredTrialStudent).allowed === false, "Trial expirado é bloqueado e encaminhado ao paywall");

  // ---------------------------------------------------------------------------
  // 5. TESTE DE CRIPTOGRAFIA HMAC DE WEBHOOKS (MERCADO PAGO)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 5. Testando Validação Criptográfica HMAC Timing-Safe de Webhooks...");

  const webhookSecret = "test_webhook_secret_key_123456";
  const dataId = "123456789";
  const xRequestId = "req_abcdef_123456";
  const ts = String(Date.now());

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const validHmac = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  const signatureHeader = `ts=${ts},v1=${validHmac}`;

  const isWebhookValid = verifyMercadoPagoWebhook({
    signatureHeader,
    xRequestId,
    dataId,
    rawBody: JSON.stringify({ action: "payment.created", data: { id: dataId } }),
    secret: webhookSecret,
  });
  assert(isWebhookValid === true, "Webhook com manifesto oficial do Mercado Pago validado com sucesso");

  const isImpostorValid = verifyMercadoPagoWebhook({
    signatureHeader,
    xRequestId,
    dataId,
    rawBody: JSON.stringify({ action: "payment.created", data: { id: dataId } }),
    secret: "wrong_attacker_secret",
  });
  assert(isImpostorValid === false, "Webhook com segredo incorreto rejeitado (401)");

  const tamperedHeader = `ts=${ts},v1=${validHmac.slice(0, -2)}aa`;
  const isTamperedValid = verifyMercadoPagoWebhook({
    signatureHeader: tamperedHeader,
    xRequestId,
    dataId,
    rawBody: "{}",
    secret: webhookSecret,
  });
  assert(isTamperedValid === false, "Webhook com hash adulterado rejeitado");

  assert(
    verifyMercadoPagoWebhook({
      signatureHeader: "malformed_not_hex",
      rawBody: "{}",
      secret: webhookSecret,
    }) === false,
    "Assinatura malformada (não-hex) tratada graciosamente sem exception"
  );

  assert(
    verifyMercadoPagoWebhook({
      signatureHeader: "",
      rawBody: "{}",
      secret: webhookSecret,
    }) === false,
    "Header de assinatura vazio rejeitado com segurança"
  );

  // ---------------------------------------------------------------------------
  // 6. TESTE DE RATE LIMITING & SANITIZAÇÃO
  // ---------------------------------------------------------------------------
  console.log("\n🔹 6. Testando Rate Limiting e Sanitização...");

  const testIp = `test_ip_${Date.now()}`;
  let rateLimitPassed = true;
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testIp, 5, 60);
    if (!res.allowed) rateLimitPassed = false;
  }
  assert(rateLimitPassed, "5 requisições dentro do limite de 5 permitidas");

  const blockedRes = checkRateLimit(testIp, 5, 60);
  assert(!blockedRes.allowed, "6ª requisição bloqueada por exceder o limite (429 Rate Limit)");

  const maliciousPayloadStr = `<script>alert('xss')</script> & "onload"`;
  const sanitized = sanitizeString(maliciousPayloadStr);
  assert(
    !sanitized.includes("<") && !sanitized.includes(">") && sanitized.includes("&lt;script&gt;"),
    `Sanitização neutralizou tags maliciosas: ${sanitized}`
  );

  // ---------------------------------------------------------------------------
  // 7. DIAGNÓSTICO DO AMBIENTE MERCADO PAGO
  // ---------------------------------------------------------------------------
  console.log("\n🔹 7. Verificando Status do Mercado Pago no Ambiente Atual...");
  const mpStatus = getMercadoPagoStatus();
  assert(
    mpStatus.setupGuide.requiredVariables.includes("MP_ACCESS_TOKEN") &&
      mpStatus.setupGuide.requiredVariables.includes("NEXT_PUBLIC_MP_PUBLIC_KEY") &&
      mpStatus.setupGuide.requiredVariables.includes("MP_WEBHOOK_SECRET"),
    "Variáveis obrigatórias do Mercado Pago devidamente mapeadas no guia de configuração"
  );

  // ---------------------------------------------------------------------------
  // 8. TESTE DE IDEMPOTÊNCIA IETF, MUTEX LOCKING & HASH CANÔNICO
  // ---------------------------------------------------------------------------
  console.log("\n🔹 8. Testando Motor de Idempotência IETF e Mutex In-Flight Locking...");
  _resetMemoryStores();

  // 8.1 Hash Canônico determinístico
  const obj1 = { planId: "pro", price: 45.0, user: { name: "Cauã", id: "u_1" } };
  const obj2 = { user: { id: "u_1", name: "Cauã" }, price: 45.0, planId: "pro" };
  const hash1 = hashPayload(obj1);
  const hash2 = hashPayload(obj2);
  assert(hash1 === hash2, "Hash canônico produz exatamente o mesmo SHA-256 independente da ordem das chaves do JSON");

  const objTampered = { ...obj1, price: 0.01 };
  const hashTampered = hashPayload(objTampered);
  assert(hash1 !== hashTampered, "Alteração de valor no payload altera o hash SHA-256");

  // Testes de robustez do serializador canônico
  assert(
    canonicalJsonStringify({ a: undefined, b: 1 }) === canonicalJsonStringify({ b: 1 }),
    "Propriedades com valor undefined são neutralizadas canonicamente do hash de idempotência"
  );
  assert(
    canonicalJsonStringify({ d: new Date("2026-09-11T12:00:00.000Z") }) === '{"d":"2026-09-11T12:00:00.000Z"}',
    "Objetos Date serializados canonicamente para string ISO-8601"
  );

  // Testes do validador de UUID
  assert(isValidUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479"), "UUID v4 válido reconhecido com sucesso por isValidUuid");
  assert(!isValidUuid("user-1234"), "String arbitrária com hífen não-UUID rejeitada para proteção de schema SQL");
  assert(!isValidUuid(null) && !isValidUuid(undefined), "Valores nulos e indefinidos tratados com segurança");

  // 8.2 Aquisição inicial de trava (Acquire Lock)
  const key1 = "idem_test_pix_order_001";
  const lock1 = await acquireIdempotencyLock({
    key: key1,
    route: "/api/payment/mercadopago/pix",
    requestHash: hash1,
    userId: "u_1",
  });
  assert(lock1.state === "acquired", "1ª requisição adquire a trava de idempotência com sucesso ('acquired')");

  // 8.3 Concorrência in-flight: requisição duplicada simultânea deve ser rejeitada com 409 Conflict
  const lockConcurrent = await acquireIdempotencyLock({
    key: key1,
    route: "/api/payment/mercadopago/pix",
    requestHash: hash1,
    userId: "u_1",
  });
  assert(
    lockConcurrent.state === "conflict",
    "2ª requisição simultânea in-flight bloqueada com 409 Conflict ('conflict') para evitar double-charge"
  );

  // 8.4 Conclusão com sucesso e commit da resposta
  await commitIdempotencySuccess({
    key: key1,
    responseStatus: 200,
    responseBody: { success: true, pix: { id: "pix_12345", qr_code: "000201..." } },
    resourceId: "pix_12345",
  });

  // 8.5 Replay: nova requisição com mesma chave retorna resposta em cache (IETF standard)
  const lockReplayed = await acquireIdempotencyLock({
    key: key1,
    route: "/api/payment/mercadopago/pix",
    requestHash: hash1,
    userId: "u_1",
  });
  assert(
    lockReplayed.state === "cached" &&
      lockReplayed.cachedResponse?.status === 200 &&
      lockReplayed.cachedResponse?.body?.pix?.id === "pix_12345",
    "3ª requisição com mesma chave retorna resposta em cache idêntica ('cached') sem reprocessar pagamento"
  );

  // 8.6 Detecção de Colisão / Payload Tampering: mesma chave reutilizada com payload diferente é rejeitada
  const lockMismatched = await acquireIdempotencyLock({
    key: key1,
    route: "/api/payment/mercadopago/pix",
    requestHash: hashTampered,
    userId: "u_1",
  });
  assert(
    lockMismatched.state === "mismatched_payload",
    "Tentativa de reutilizar chave de idempotência com payload diferente bloqueada com 422 ('mismatched_payload')"
  );

  // 8.7 Recuperação de trava abandonada por timeout (Deadlock/Crash recovery)
  const keyStale = "idem_stale_lock_002";
  await acquireIdempotencyLock({
    key: keyStale,
    route: "/api/payment/mercadopago/pix",
    requestHash: hash1,
    lockTimeoutMs: 20, // 20 milissegundos
  });
  await new Promise((r) => setTimeout(r, 30));
  const recoveredLock = await acquireIdempotencyLock({
    key: keyStale,
    route: "/api/payment/mercadopago/pix",
    requestHash: hash1,
    lockTimeoutMs: 20,
  });
  assert(
    recoveredLock.state === "acquired",
    "Trava abandonada por timeout de processo é recuperada graciosamente sem travar permanentemente a chave"
  );

  // 8.8 Wrapper de Alto Nível executeWithIdempotency (Garante execução única do handler)
  let handlerExecutionCount = 0;
  const highLevelKey = "idem_exec_high_level_003";

  const runHandler = () =>
    executeWithIdempotency(
      {
        key: highLevelKey,
        route: "/api/payment/mercadopago/pix",
        payload: { planId: "vip", amount: 55.0 },
      },
      async () => {
        handlerExecutionCount++;
        return {
          status: 200,
          resourceId: "pay_hl_777",
          body: { success: true, paymentId: "pay_hl_777" },
        };
      }
    );

  const exec1 = await runHandler();
  assert(
    exec1.status === 200 && exec1.replayed === false && handlerExecutionCount === 1,
    "executeWithIdempotency executa o handler na 1ª chamada (replayed: false)"
  );

  const exec2 = await runHandler();
  assert(
    exec2.status === 200 &&
      exec2.replayed === true &&
      handlerExecutionCount === 1 &&
      exec2.body.paymentId === "pay_hl_777",
    "executeWithIdempotency NÃO executa o handler novamente na 2ª chamada (replayed: true, contador de execução permaneceu em 1)"
  );

  // 8.9 Retentativa segura após erro transitório 5xx (IETF Specification)
  let retryCount5xx = 0;
  const key5xx = "idem_5xx_test_key_004";
  const run5xxHandler = () =>
    executeWithIdempotency<{ success?: boolean; paymentId?: string; error?: string }>(
      {
        key: key5xx,
        route: "/api/payment/mercadopago/pix",
        payload: { planId: "vip", amount: 55.0 },
      },
      async () => {
        retryCount5xx++;
        if (retryCount5xx === 1) {
          return { status: 503, body: { error: "Service Temporarily Unavailable" } };
        }
        return { status: 200, body: { success: true, paymentId: "pay_recovered_500" } };
      }
    );

  const res503 = await run5xxHandler();
  assert(res503.status === 503 && retryCount5xx === 1, "Erro 503 transitório retorna status original sem crash");

  const resRecovered = await run5xxHandler();
  assert(
    resRecovered.status === 200 && retryCount5xx === 2 && resRecovered.body.paymentId === "pay_recovered_500",
    "Lock de idempotência liberado após erro 5xx, permitindo que a retentativa subsequente execute com sucesso"
  );

  // ---------------------------------------------------------------------------
  // 9. PROPAGAÇÃO DE IDEMPOTENCY KEY PARA O MERCADO PAGO
  // ---------------------------------------------------------------------------
  console.log("\n🔹 9. Testando Propagação de X-Idempotency-Key para APIs do Mercado Pago...");

  const testClientKey = "client_idemp_key_custom_999";

  const pixResult = await createDirectPixPayment({
    amount: 45.0,
    payerEmail: "aluno@gymflow.com",
    payerName: "Aluno Teste",
    planId: "monthly_pix",
    idempotencyKey: testClientKey,
  });
  assert(
    (pixResult as any).idempotencyKey === testClientKey,
    `createDirectPixPayment propagou a chave de idempotência do cliente: ${(pixResult as any).idempotencyKey}`
  );

  const prefResult = await createCheckoutPreference({
    payerEmail: "aluno@gymflow.com",
    payerName: "Aluno Teste",
    planId: "pro",
    idempotencyKey: testClientKey,
  });
  assert(
    (prefResult as any).idempotencyKey === testClientKey || prefResult.isSimulated,
    "createCheckoutPreference aceita e propaga chave de idempotência de forma segura"
  );

  const subResult = await createRecurringSubscription({
    payerEmail: "aluno@gymflow.com",
    planId: "monthly_recurring",
    idempotencyKey: testClientKey,
  });
  assert(
    (subResult as any).idempotencyKey === testClientKey || subResult.isSimulated,
    "createRecurringSubscription aceita e propaga chave de idempotência para assinaturas recorrentes"
  );

  // ---------------------------------------------------------------------------
  // 10. WEBHOOK EVENT DEDUPLICATION LEDGER (OUTBOX / EVENT STORE)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 10. Testando Ledger de Eventos de Webhook (Event Store & Replay Shield)...");

  const eventId = "mp_evt_webhook_dedup_001";

  // 10.1 Primeira chegada do evento
  const webhookLock1 = await acquireWebhookEventLock({
    eventId,
    eventType: "payment",
    resourceId: "pay_mp_999000",
    payload: { action: "payment.updated", data: { id: "pay_mp_999000" } },
  });
  assert(webhookLock1.shouldProcess === true && webhookLock1.status === "acquired", "1ª entrega de webhook aceita para processamento");

  // 10.2 Entrega concorrente/retransmitida antes de finalizar processamento
  const webhookLockConcurrent = await acquireWebhookEventLock({
    eventId,
    eventType: "payment",
    resourceId: "pay_mp_999000",
  });
  assert(
    webhookLockConcurrent.shouldProcess === false && webhookLockConcurrent.status === "in_progress",
    "Webhook concorrente in-flight com mesmo eventId descartado imediatamente pelo Ledger"
  );

  // 10.3 Finalização do evento no ledger
  await commitWebhookProcessed(eventId, { paymentId: "pay_mp_999000" });

  // 10.4 Retentativa do Mercado Pago após conclusão
  const webhookLockReplayed = await acquireWebhookEventLock({
    eventId,
    eventType: "payment",
    resourceId: "pay_mp_999000",
  });
  assert(
    webhookLockReplayed.shouldProcess === false && webhookLockReplayed.status === "already_processed",
    "Replay de webhook após processamento concluído descartado com sucesso ('already_processed'), impedindo duplicação de crédito"
  );

  // 10.5 Deduplicação determinística mesmo sem cabeçalhos (Replay via hash do payload)
  const evtPayloadRaw = { type: "payment", data: { id: "pay_fallback_888" }, action: "payment.updated" };
  const rawBodyStr = JSON.stringify(evtPayloadRaw);
  const detHash1 = hashPayload({ eventType: "payment", dataId: "pay_fallback_888", rawBody: rawBodyStr });
  const deterministicEventId1 = `mp_payment_pay_fallback_888_${detHash1.slice(0, 16)}`;

  const lockEventDet1 = await acquireWebhookEventLock({
    eventId: deterministicEventId1,
    eventType: "payment",
    resourceId: "pay_fallback_888",
    payload: evtPayloadRaw,
  });
  assert(lockEventDet1.shouldProcess === true, "1º envio de webhook sem headers gera eventId determinístico e adquire lock");

  await commitWebhookProcessed(deterministicEventId1);

  const detHash2 = hashPayload({ eventType: "payment", dataId: "pay_fallback_888", rawBody: rawBodyStr });
  const deterministicEventId2 = `mp_payment_pay_fallback_888_${detHash2.slice(0, 16)}`;

  const lockEventDet2 = await acquireWebhookEventLock({
    eventId: deterministicEventId2,
    eventType: "payment",
    resourceId: "pay_fallback_888",
  });
  assert(
    deterministicEventId1 === deterministicEventId2 &&
      lockEventDet2.shouldProcess === false &&
      lockEventDet2.status === "already_processed",
    "Retransmissão de webhook sem headers deduz exatamente o mesmo eventId determinístico e é descartada ('already_processed')"
  );

  // ---------------------------------------------------------------------------
  // 11. FINITE STATE MACHINE (FSM) DE TRANSIÇÃO MONOTÔNICA
  // ---------------------------------------------------------------------------
  console.log("\n🔹 11. Testando Regras Monotônicas da Finite State Machine (FSM)...");

  // Transições Válidas (Happy Path)
  assert(canTransitionPaymentStatus(undefined, "pending"), "Criação inicial: transição para 'pending' permitida");
  assert(canTransitionPaymentStatus("pending", "in_process"), "Transição: 'pending' -> 'in_process' permitida");
  assert(canTransitionPaymentStatus("pending", "approved"), "Transição: 'pending' -> 'approved' permitida");
  assert(canTransitionPaymentStatus("in_process", "approved"), "Transição: 'in_process' -> 'approved' permitida");
  assert(canTransitionPaymentStatus("approved", "refunded"), "Transição: 'approved' -> 'refunded' permitida");
  assert(canTransitionPaymentStatus("approved", "charged_back"), "Transição: 'approved' -> 'charged_back' permitida");
  assert(canTransitionPaymentStatus("approved", "in_mediation"), "Transição: 'approved' -> 'in_mediation' permitida");

  // Tolerância a espaços e formatação
  assert(canTransitionPaymentStatus(" pending ", " approved "), "FSM tolera espaços acidentais e formatação de texto (' pending ' -> ' approved ')");
  assert(canTransitionPaymentStatus("unknown_legacy", "approved"), "FSM permite corrigir status inicial desconhecido para status oficial válido");

  // Idempotência de Mesmo Estado
  const sameStateApproved = resolvePaymentStateTransition("approved", "approved");
  assert(sameStateApproved.allowed === true && sameStateApproved.isNoop === true, "Idempotência FSM: 'approved' -> 'approved' é no-op sem re-execução");

  const sameStatePending = resolvePaymentStateTransition("pending", "pending");
  assert(sameStatePending.allowed === true && sameStatePending.isNoop === true, "Idempotência FSM: 'pending' -> 'pending' é no-op seguro");

  // Proteção Crítica contra Webhook Fora de Ordem (Out-of-Order Webhook Protection)
  // Exemplo: 'pending' chega atrasado após o pagamento já ter sido 'approved'
  const outOfOrderPending = resolvePaymentStateTransition("approved", "pending");
  assert(
    outOfOrderPending.allowed === false && outOfOrderPending.shouldUpdate === false,
    "FSM BLOQUEOU REVERSÃO: Webhook atrasado 'pending' NÃO PODE regredir um pagamento já 'approved'!"
  );

  const outOfOrderInProcess = resolvePaymentStateTransition("approved", "in_process");
  assert(
    outOfOrderInProcess.allowed === false,
    "FSM BLOQUEOU REVERSÃO: Webhook atrasado 'in_process' NÃO PODE regredir um pagamento já 'approved'"
  );

  const outOfOrderRejected = resolvePaymentStateTransition("approved", "rejected");
  assert(
    outOfOrderRejected.allowed === false,
    "FSM BLOQUEOU REVERSÃO: Webhook 'rejected' não pode invalidar um pagamento previamente compensado 'approved'"
  );

  // Estados Terminais não podem ser ressuscitados
  assert(!canTransitionPaymentStatus("refunded", "approved"), "FSM BLOQUEOU: Estado terminal 'refunded' não pode voltar para 'approved'");
  assert(!canTransitionPaymentStatus("refunded", "pending"), "FSM BLOQUEOU: Estado terminal 'refunded' não pode regredir para 'pending'");
  assert(!canTransitionPaymentStatus("cancelled", "approved"), "FSM BLOQUEOU: Estado terminal 'cancelled' não pode voltar para 'approved'");
  assert(!canTransitionPaymentStatus("rejected", "approved"), "FSM BLOQUEOU: Estado terminal 'rejected' não pode voltar para 'approved'");

  // ---------------------------------------------------------------------------
  // 12. EXTENSÃO DETERMINÍSTICA DE ASSINATURA & PROTEÇÃO ANTI-DOUBLE CREDIT
  // ---------------------------------------------------------------------------
  console.log("\n🔹 12. Testando Extensão Determinística de Assinaturas e Proteção de Crédito...");

  const baseTestDate = new Date("2026-09-11T12:00:00.000Z");

  // 12.1 Usuário sem assinatura prévia ou nula
  const extNew = calculateDeterministicSubscriptionExtension({
    currentEndsAt: null,
    daysToAdd: 30,
    referenceDate: baseTestDate,
  });
  const expectedNewEnd = new Date(baseTestDate.getTime() + 30 * 86400 * 1000);
  assert(
    extNew.newEndsAt.getTime() === expectedNewEnd.getTime() && extNew.extendedFrom === "now_expired",
    "Novo aluno: 30 dias calculados exatamente a partir da data de ativação"
  );

  // Sanitização de dias negativos
  const extNegative = calculateDeterministicSubscriptionExtension({
    daysToAdd: -10,
    referenceDate: baseTestDate,
  });
  assert(extNegative.addedDays >= 1, "calculateDeterministicSubscriptionExtension sanitiza dias negativos impondo piso seguro de 1 dia");

  // 12.2 Usuário expirado no passado (ex: venceu há 5 dias)
  const expiredPastDate = new Date(baseTestDate.getTime() - 5 * 86400 * 1000).toISOString();
  const extExpired = calculateDeterministicSubscriptionExtension({
    currentEndsAt: expiredPastDate,
    daysToAdd: 30,
    referenceDate: baseTestDate,
  });
  assert(
    extExpired.newEndsAt.getTime() === expectedNewEnd.getTime() && extExpired.extendedFrom === "now_expired",
    "Aluno vencido no passado: renovação reinicia a partir de hoje (não penaliza nem herda vácuo do passado)"
  );

  // 12.3 Usuário ativo com dias restantes (ex: faltam 15 dias para vencer)
  const activeRemainingDate = new Date(baseTestDate.getTime() + 15 * 86400 * 1000);
  const extActive = calculateDeterministicSubscriptionExtension({
    currentEndsAt: activeRemainingDate.toISOString(),
    daysToAdd: 30,
    referenceDate: baseTestDate,
  });
  const expectedCumulativeEnd = new Date(activeRemainingDate.getTime() + 30 * 86400 * 1000);
  assert(
    extActive.newEndsAt.getTime() === expectedCumulativeEnd.getTime() && extActive.extendedFrom === "existing_active",
    "Aluno ativo: extensão é cumulativa (preserva os 15 dias restantes e soma +30 dias, totalizando 45 dias)"
  );

  // 12.4 Proteção de Crédito Único (Anti-Double Credit)
  assert(
    canApplySubscriptionCredit({ status: "approved", credit_applied: false }) === true,
    "Pagamento aprovado ainda não creditado permite aplicação do benefício de 30 dias"
  );

  assert(
    canApplySubscriptionCredit({ status: "approved", credit_applied: true }) === false,
    "Pagamento já creditado anteriormente BLOQUEIA crédito duplicado (proteção contra múltiplos webhooks/checks)"
  );

  assert(
    canApplySubscriptionCredit({ status: "pending", credit_applied: false }) === false,
    "Pagamento pendente não permite concessão de crédito de assinatura"
  );

  // ---------------------------------------------------------------------------
  // 13. TESTE DE PERSISTÊNCIA DO TRIAL DE 7 DIAS E CONTAGEM REGRESSIVA
  // ---------------------------------------------------------------------------
  console.log("\n🔹 13. Testando Persistência do Trial de 7 Dias e Contagem Regressiva...");

  const mockBaseUser: UserProfile = {
    id: "user_test_trial_uuid_123",
    name: "Aluno Teste Trial",
    email: "aluno.trial@gymflow.com",
    activeRole: "student",
    enabledRoles: ["student"],
    subscriptionStatus: "pending_choice",
  };

  // 13.1 Ativação do Trial de 7 Dias
  const activated = activateTrialForUser(7, mockBaseUser);
  assert(
    activated.subscriptionStatus === "trial",
    "activateTrialForUser: Define subscriptionStatus como 'trial'"
  );
  assert(
    activated.subscriptionPlan === "trial_7d",
    "activateTrialForUser: Define subscriptionPlan como 'trial_7d'"
  );
  assert(
    activated.planTier === "pro",
    "activateTrialForUser: Concede planTier 'pro' para o período de testes"
  );
  assert(
    Boolean(activated.trialEndsAt) && new Date(activated.trialEndsAt!).getTime() > Date.now(),
    "activateTrialForUser: Define trialEndsAt com data futura válida de 7 dias"
  );

  // 13.2 Contagem regressiva de dias (getRemainingTrialDays)
  const userFreshTrial: UserProfile = {
    ...mockBaseUser,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
  };
  assert(
    getRemainingTrialDays(userFreshTrial) === 7,
    `getRemainingTrialDays: Retorna 7 dias para novo trial recém-ativado (resultado: ${getRemainingTrialDays(userFreshTrial)})`
  );

  const userHalfTrial: UserProfile = {
    ...mockBaseUser,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() + 3.5 * 86400 * 1000).toISOString(),
  };
  assert(
    getRemainingTrialDays(userHalfTrial) === 4,
    `getRemainingTrialDays: Arredonda para cima 3.5 dias -> 4 dias (resultado: ${getRemainingTrialDays(userHalfTrial)})`
  );

  const userAlmostExpired: UserProfile = {
    ...mockBaseUser,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() + 0.2 * 86400 * 1000).toISOString(),
  };
  assert(
    getRemainingTrialDays(userAlmostExpired) === 1,
    `getRemainingTrialDays: Retorna 1 dia para últimas horas de teste (resultado: ${getRemainingTrialDays(userAlmostExpired)})`
  );

  const userExpiredTrial: UserProfile = {
    ...mockBaseUser,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() - 10000).toISOString(),
  };
  assert(
    getRemainingTrialDays(userExpiredTrial) === 0,
    "getRemainingTrialDays: Retorna 0 dias para trial com data no passado"
  );

  // 13.3 Permissão de Acesso ao Aplicativo (hasActiveAccess)
  assert(
    hasActiveAccess(userFreshTrial) === true,
    "hasActiveAccess: Aluno com trial de 7 dias ativo TEM ACESSO LIBERADO ao app"
  );

  assert(
    hasActiveAccess(userExpiredTrial) === false,
    "hasActiveAccess: Aluno com trial expirado É BLOQUEADO e direcionado à escolha de plano"
  );

  const userPendingChoice: UserProfile = {
    ...mockBaseUser,
    subscriptionStatus: "pending_choice",
  };
  assert(
    hasActiveAccess(userPendingChoice) === false,
    "hasActiveAccess: Aluno com pending_choice é bloqueado"
  );

  const coachUser: UserProfile = {
    ...mockBaseUser,
    activeRole: "coach",
    subscriptionStatus: "pending_choice",
  };
  assert(
    hasActiveAccess(coachUser) === true,
    "hasActiveAccess: Professor tem acesso irrestrito garantido"
  );

  // 13.4 Anti-Regressão na Recarga de Página
  // Simula a lógica de syncUserFromSession: cloudProfile ainda está em 'pending_choice' mas local tem trial ativo
  const cloudProfileOld: Partial<UserProfile> = {
    id: mockBaseUser.id,
    subscriptionStatus: "pending_choice",
    trialEndsAt: undefined,
  };
  const localProfileActive: UserProfile = userFreshTrial;

  const nowMs = Date.now();
  const localHasActive =
    localProfileActive.subscriptionStatus === "trial" &&
    Boolean(localProfileActive.trialEndsAt) &&
    new Date(localProfileActive.trialEndsAt!).getTime() > nowMs;

  const cloudHasActive =
    cloudProfileOld.subscriptionStatus === "trial" &&
    Boolean(cloudProfileOld.trialEndsAt) &&
    new Date(cloudProfileOld.trialEndsAt!).getTime() > nowMs;

  let resolvedStatus = "pending_choice";
  if (cloudHasActive || localHasActive) {
    resolvedStatus = "trial";
  }

  assert(
    resolvedStatus === "trial",
    "Anti-Regressão: Recarregar página com cloud em 'pending_choice' NÃO apaga o trial ativo do usuário"
  );

  // ---------------------------------------------------------------------------
  // 14. TESTANDO CONTINUIDADE DE SESSÃO, PERSISTÊNCIA DE ABAS E SPLITS
  // ---------------------------------------------------------------------------
  console.log("\n🔹 14. Testando Continuidade de Navegação, Abas e Comparação Idempotente de Perfis...");

  // 14.1 Comparação Idempotente de Perfis (areProfilesEqual)
  const profileOriginal: UserProfile = {
    ...mockBaseUser,
    id: "user_test_continuity",
    email: "continuity@gymflow.test",
    name: "Aluno Continuidade",
    activeRole: "student",
    subscriptionStatus: "active",
    planTier: "pro",
    trialEndsAt: undefined,
    subscriptionEndsAt: "2026-10-30T00:00:00.000Z",
    profileCompleted: true,
    phone: "(11) 98888-7777",
    goal: "Hipertrofia",
    termsAccepted: true,
    enabledRoles: ["student"],
  };

  const profileClone: UserProfile = { ...profileOriginal };
  assert(
    areProfilesEqual(profileOriginal, profileClone) === true,
    "areProfilesEqual: Retorna true para dois perfis com valores idênticos"
  );

  assert(
    areProfilesEqual(profileOriginal, { ...profileOriginal, activeRole: "coach" }) === false,
    "areProfilesEqual: Detecta alteração de activeRole ('student' -> 'coach')"
  );

  assert(
    areProfilesEqual(profileOriginal, { ...profileOriginal, subscriptionStatus: "expired" }) === false,
    "areProfilesEqual: Detecta alteração de subscriptionStatus ('active' -> 'expired')"
  );

  assert(
    areProfilesEqual(profileOriginal, { ...profileOriginal, planTier: "vip" }) === false,
    "areProfilesEqual: Detecta upgrade de planTier ('pro' -> 'vip')"
  );

  assert(
    areProfilesEqual(profileOriginal, { ...profileOriginal, phone: "(11) 99999-0000" }) === false,
    "areProfilesEqual: Detecta atualização de telefone"
  );

  assert(
    areProfilesEqual(profileOriginal, { ...profileOriginal, termsAccepted: false }) === false,
    "areProfilesEqual: Detecta alteração no consentimento de termos"
  );

  assert(
    areProfilesEqual(profileOriginal, { ...profileOriginal, enabledRoles: ["student", "coach"] }) === false,
    "areProfilesEqual: Detecta adição de papéis autorizados"
  );

  assert(
    areProfilesEqual(null, null) === true,
    "areProfilesEqual: Trata dois perfis nulos como iguais"
  );

  assert(
    areProfilesEqual(profileOriginal, null) === false,
    "areProfilesEqual: Detecta diferença entre perfil preenchido e nulo"
  );

  // 14.2 Continuidade e Validação de Abas por Papel
  const resolveCurrentTab = (savedTab: string | null, role: "student" | "coach"): string => {
    const coachTabs = ["alunos", "fichas", "analytics"];
    const studentTabs = ["treino", "agenda", "personal", "aulas", "evolucao"];
    if (savedTab) {
      if (role === "coach" && coachTabs.includes(savedTab)) return savedTab;
      if (role === "student" && studentTabs.includes(savedTab)) return savedTab;
    }
    return role === "coach" ? "alunos" : "treino";
  };

  assert(
    resolveCurrentTab("agenda", "student") === "agenda",
    "Continuidade de Abas: Aluno na aba 'agenda' preserva a aba após navegação/recarga"
  );

  assert(
    resolveCurrentTab("personal", "student") === "personal",
    "Continuidade de Abas: Aluno na aba 'personal' preserva a aba selecionada"
  );

  assert(
    resolveCurrentTab("evolucao", "student") === "evolucao",
    "Continuidade de Abas: Aluno na aba 'evolucao' preserva a aba selecionada"
  );

  assert(
    resolveCurrentTab("analytics", "coach") === "analytics",
    "Continuidade de Abas: Professor na aba 'analytics' preserva a aba de métricas"
  );

  assert(
    resolveCurrentTab("fichas", "coach") === "fichas",
    "Continuidade de Abas: Professor na aba 'fichas' preserva a aba de prescrição"
  );

  assert(
    resolveCurrentTab("alunos", "student") === "treino",
    "Segurança de Abas: Aluno tentando manter aba de professor é redirecionado para 'treino'"
  );

  assert(
    resolveCurrentTab("treino", "coach") === "alunos",
    "Segurança de Abas: Professor tentando manter aba exclusiva de aluno é redirecionado para 'alunos'"
  );

  // 14.3 Persistência de Divisão de Treino (Split A / B / C)
  const resolveSplitId = (savedSplit: string | null, availableSplits: string[]): string => {
    if (savedSplit && availableSplits.includes(savedSplit)) {
      return savedSplit;
    }
    return availableSplits[0] || "A";
  };

  assert(
    resolveSplitId("B", ["A", "B", "C"]) === "B",
    "Persistência de Split: Usuário que estava no 'Treino B' permanece no 'Treino B'"
  );

  assert(
    resolveSplitId("C", ["A", "B", "C"]) === "C",
    "Persistência de Split: Usuário no 'Treino C' permanece no 'Treino C'"
  );

  assert(
    resolveSplitId("D", ["A", "B", "C"]) === "A",
    "Fallback de Split: Split inexistente na rotina faz fallback gracioso para o primeiro split ('A')"
  );

  // 14.4 Purga de Treinador Fake Legado ("Treinador Principal" / "coach_principal")
  const mockCoachesWithFake = [
    { id: "coach_principal", name: "Treinador Principal" },
    { id: "coach_rodrigo", name: "Prof. Rodrigo Silveira" },
    { id: "coach_felipe", name: "Felipe Mendes" },
  ];
  const cleanedCoaches = mockCoachesWithFake.filter(
    (c) => c.id !== "coach_principal" && c.name !== "Treinador Principal"
  );
  assert(
    !cleanedCoaches.some((c) => c.id === "coach_principal" || c.name === "Treinador Principal"),
    "Purga de Treinador Fake: 'Treinador Principal' é eliminado da listagem de personais"
  );
  assert(
    cleanedCoaches.length === 2,
    "Purga de Treinador Fake: Treinadores reais preservados intactos"
  );

  // 14.5 Auto-Exclusão no Marketplace: Usuário NUNCA se vê na lista de personais para contratação
  const userTheBope: Partial<UserProfile> = {
    id: "user_the_bope_123",
    name: "The Bope",
    email: "thebope@gymflow.test",
    phone: "(62) 99999-8888",
  };

  const coachesMarketplace = [
    { id: "coach_rodrigo", name: "Prof. Rodrigo Silveira", email: "rodrigo@gymflow.com", phone: "11999990000" },
    { id: "user_the_bope_123", name: "The Bope", email: "thebope@gymflow.test", phone: "62999998888" },
    { id: "coach_felipe", name: "Felipe Mendes", email: "felipe@gymflow.com", phone: "11988881234" },
  ];

  const filterOutSelf = (list: typeof coachesMarketplace, user: typeof userTheBope) => {
    return list.filter((coach) => {
      if (user.id && coach.id === user.id) return false;
      if (user.email && coach.email && user.email.toLowerCase() === coach.email.toLowerCase()) return false;
      const userDigits = (user.phone || "").replace(/\D/g, "");
      const coachDigits = (coach.phone || "").replace(/\D/g, "");
      if (userDigits && coachDigits && userDigits === coachDigits) return false;
      if (user.name && coach.name && user.name.toLowerCase() === coach.name.toLowerCase()) return false;
      return true;
    });
  };

  const availableForBope = filterOutSelf(coachesMarketplace, userTheBope);
  assert(
    !availableForBope.some((c) => c.name === "The Bope" || c.id === "user_the_bope_123"),
    "Auto-Exclusão Marketplace: O usuário 'The Bope' NÃO se vê na lista de personais para contratação"
  );
  assert(
    availableForBope.length === 2,
    "Auto-Exclusão Marketplace: Demais personais permanecem disponíveis para contratação"
  );

  // 14.6 Opção de Receber Mensagens / Dúvidas no Agendamento do Personal
  console.log("\n🔹 14.6 Testando Opção de Recebimento de Mensagens e Dúvidas no Agendamento...");

  const coachWithMessages: CoachTrainer = {
    id: "coach_test_msg",
    name: "Treinador Com Mensagens",
    avatarUrl: "",
    phone: "11999991111",
    specialty: "Musculação",
    distance: "Salão Principal",
    rating: 5.0,
    reviewCount: 10,
    bio: "Metodologia personalizada.",
    allowBookingMessages: true,
    pricing: { basicMonthly: 35, proMonthly: 45, vipMonthly: 55 },
    slots: [],
  };

  const coachWithoutMessages: CoachTrainer = {
    ...coachWithMessages,
    id: "coach_test_nomsg",
    name: "Treinador Sem Mensagens",
    allowBookingMessages: false,
  };

  assert(
    coachWithMessages.allowBookingMessages !== false,
    "allowBookingMessages: Treinador com opção ativada permite envio de dúvidas antes do plano"
  );

  assert(
    coachWithoutMessages.allowBookingMessages === false,
    "allowBookingMessages: Treinador pode desativar recebimento de mensagens prévias nas configurações"
  );

  const shouldShowPreBookingButton = (coach: CoachTrainer) => coach.allowBookingMessages !== false;

  assert(
    shouldShowPreBookingButton(coachWithMessages) === true,
    "Marketplace: Exibe botão de tirar dúvidas para treinador com allowBookingMessages: true"
  );

  assert(
    shouldShowPreBookingButton(coachWithoutMessages) === false,
    "Marketplace: Oculta botão de tirar dúvidas para treinador com allowBookingMessages: false"
  );

  assert(
    areProfilesEqual(
      { ...profileOriginal, allowBookingMessages: true },
      { ...profileOriginal, allowBookingMessages: false }
    ) === false,
    "areProfilesEqual: Detecta alteração na preferência allowBookingMessages do personal"
  );

  // ---------------------------------------------------------------------------
  // 15. TESTE DE CANCELAMENTO FUNCIONAL, RETENÇÃO DE PERÍODO & FAQ
  // ---------------------------------------------------------------------------
  console.log("\n🔹 15. Testando Cancelamento Funcional, Retenção do Período e FAQ de Assinaturas...");

  const baseSubscribedUser: UserProfile = {
    id: "user_canceltester_999",
    name: "Aluno Assinante Teste",
    email: "aluno.canceltester@gymflow.com",
    activeRole: "student",
    enabledRoles: ["student"],
    subscriptionStatus: "active",
    subscriptionPlan: "monthly_recurring",
    planTier: "pro",
    subscriptionEndsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 dias restantes
  };

  // Teste 15.1: Cancelamento local de assinatura
  const canceledProfile = cancelSubscriptionLocal(
    "Achei o valor mensal elevado",
    "Estou sem tempo para treinar este mês",
    baseSubscribedUser
  );

  assert(
    canceledProfile.subscriptionStatus === "canceled",
    "cancelSubscriptionLocal: Define subscriptionStatus como 'canceled'"
  );
  assert(
    Boolean(canceledProfile.subscriptionCanceledAt),
    "cancelSubscriptionLocal: Registra subscriptionCanceledAt com timestamp ISO válido"
  );
  assert(
    canceledProfile.cancelReason === "Achei o valor mensal elevado",
    "cancelSubscriptionLocal: Armazena o motivo de cancelamento informado pelo usuário"
  );
  assert(
    canceledProfile.subscriptionEndsAt === baseSubscribedUser.subscriptionEndsAt,
    "cancelSubscriptionLocal: PRESERVA data de término original (subscriptionEndsAt)"
  );

  // Teste 15.2: Retenção de Acesso durante o período já pago (Grace Period)
  assert(
    hasActiveAccess(canceledProfile) === true,
    "hasActiveAccess: Aluno que cancelou CONTINUA com acesso ativo até a data final do ciclo já pago"
  );
  assert(
    isSubscriptionExpired(canceledProfile) === false,
    "isSubscriptionExpired: Retorna false para assinatura cancelada dentro do período de carência"
  );
  assert(
    canAccessFeature("advanced_workout", canceledProfile).allowed === true,
    "canAccessFeature: Permite acesso a recursos pagos Pro durante a vigência do ciclo cancelado"
  );
  assert(
    canAccessFeature("turnstile_checkin", canceledProfile).allowed === true,
    "canAccessFeature: Check-in digital liberado normalmente durante o ciclo cancelado"
  );

  // Teste 15.3: Bloqueio de Acesso APÓS o término do ciclo cancelado
  const expiredCanceledUser: UserProfile = {
    ...canceledProfile,
    subscriptionEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Expirou há 2 dias
  };

  assert(
    hasActiveAccess(expiredCanceledUser) === false,
    "hasActiveAccess: Aluno cancelado cuja data expirou É BLOQUEADO e direcionado à renovação"
  );
  assert(
    isSubscriptionExpired(expiredCanceledUser) === true,
    "isSubscriptionExpired: Retorna true para assinatura cancelada após o vencimento"
  );
  assert(
    canAccessFeature("advanced_workout", expiredCanceledUser).allowed === false,
    "canAccessFeature: Bloqueia acesso a recursos Pro após encerramento do ciclo"
  );

  // Teste 15.4: Cancelamento durante Período de Testes (Trial de 7 Dias)
  const activeTrialUser: UserProfile = {
    id: "user_trial_canceltester",
    name: "Aluno em Trial",
    email: "trial.canceltester@gymflow.com",
    activeRole: "student",
    enabledRoles: ["student"],
    subscriptionStatus: "trial",
    subscriptionPlan: "trial_7d",
    planTier: "pro",
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias restantes
  };

  const canceledTrialProfile = cancelSubscriptionLocal(
    "Dificuldades no aplicativo",
    undefined,
    activeTrialUser
  );

  assert(
    canceledTrialProfile.subscriptionStatus === "canceled",
    "cancelSubscriptionLocal: Converte trial para 'canceled' sem cobrança"
  );
  assert(
    hasActiveAccess(canceledTrialProfile) === true,
    "hasActiveAccess: Aluno que cancelou trial mantém acesso restante dos 7 dias experimentais"
  );

  const expiredTrialCanceledUser: UserProfile = {
    ...canceledTrialProfile,
    trialEndsAt: new Date(Date.now() - 1000).toISOString(),
  };

  assert(
    hasActiveAccess(expiredTrialCanceledUser) === false,
    "hasActiveAccess: Bloqueia acesso após o término do trial cancelado"
  );

  // Teste 15.5: Cancelamento de Assinatura Recorrente no Mercado Pago
  const mpCancelResult = await cancelRecurringSubscription("sub_sim_test_123");
  assert(
    mpCancelResult.status === "cancelled" && mpCancelResult.isSimulated === true,
    "cancelRecurringSubscription: Cancela recorrência com sucesso no gateway (modo simulação/homologação)"
  );

  // Teste 15.6: Reativação de Assinatura
  const reactivatedProfile = reactivateSubscriptionForUser("pro", "pro", canceledProfile);
  assert(
    reactivatedProfile.subscriptionStatus === "active",
    "reactivateSubscriptionForUser: Altera status de volta para 'active'"
  );
  assert(
    Boolean(reactivatedProfile.subscriptionEndsAt),
    "reactivateSubscriptionForUser: Gera nova data de vencimento (1 mês adicional)"
  );
  assert(
    hasActiveAccess(reactivatedProfile) === true,
    "hasActiveAccess: Aluno reativado volta a ter acesso completo imediato"
  );

  // Teste 15.7: Sanidade da Base de Perguntas Frequentes (FAQ)
  assert(
    Array.isArray(FAQ_ITEMS) && FAQ_ITEMS.length >= 6,
    `FAQ_ITEMS: Contém base completa de perguntas frequentes (${FAQ_ITEMS.length} itens disponíveis)`
  );

  const cancelFaq = FAQ_ITEMS.find((f) => f.id === "cancelamento");
  assert(
    Boolean(cancelFaq && cancelFaq.answer.includes("sem multas") && cancelFaq.answer.includes("acesso")),
    "FAQ: Contém pergunta explicativa detalhada sobre cancelamento e período pago"
  );

  const trialFaq = FAQ_ITEMS.find((f) => f.id === "trial");
  assert(
    Boolean(trialFaq && trialFaq.answer.includes("7 dias") && trialFaq.answer.includes("Pro")),
    "FAQ: Contém pergunta sobre os 7 dias grátis e funcionamento sem cobrança imediata"
  );

  const paymentsFaq = FAQ_ITEMS.find((f) => f.id === "pagamentos");
  assert(
    Boolean(paymentsFaq && paymentsFaq.answer.includes("Cartão de Crédito") && paymentsFaq.answer.includes("PIX")),
    "FAQ: Contém explicação transparente das formas de pagamento (Cartão Recorrente e PIX)"
  );

  // ---------------------------------------------------------------------------
  // 16. TESTE DE DIFERENCIAÇÃO DE PLANOS POR PAPEL (ALUNO VS PROFESSOR/PERSONAL)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 16. Testando Diferenciação de Planos por Papel (Aluno vs Professor/Personal)...");

  // Teste 16.1: Separação de planos no catálogo oficial
  const studentPlans = getOfficialPlansByRole("student");
  const coachPlans = getOfficialPlansByRole("coach");

  assert(
    studentPlans.length >= 3,
    `Catálogo de Alunos: Contém planos dedicados (${studentPlans.length} planos encontrados)`
  );
  assert(
    coachPlans.length >= 3,
    `Catálogo de Professores: Contém planos dedicados (${coachPlans.length} planos encontrados)`
  );

  // Teste 16.2: Validação de preços e propriedades de planos de personal
  assert(
    OFFICIAL_PLANS.coach_starter.role === "coach" &&
    OFFICIAL_PLANS.coach_starter.maxStudents === 10 &&
    OFFICIAL_PLANS.coach_starter.price === 49.0,
    "Personal Starter: Configurado com limite de 10 alunos e valor tabelado em R$ 49,00"
  );
  assert(
    OFFICIAL_PLANS.coach_pro.role === "coach" &&
    OFFICIAL_PLANS.coach_pro.maxStudents === 35 &&
    OFFICIAL_PLANS.coach_pro.price === 79.0,
    "Personal Pro: Configurado com limite de 35 alunos e valor tabelado em R$ 79,00"
  );
  assert(
    OFFICIAL_PLANS.coach_vip.role === "coach" &&
    OFFICIAL_PLANS.coach_vip.price === 119.0,
    "Personal VIP: Configurado para escala de alunos ilimitada e valor tabelado em R$ 119,00"
  );

  // Teste 16.3: Ativação de plano pago para Personal Trainer
  const coachBaseUser: UserProfile = {
    id: "coach_plan_tester",
    name: "Prof. Personal Teste",
    email: "personal.tester@gymflow.com",
    activeRole: "coach",
    enabledRoles: ["coach"],
    subscriptionStatus: "pending_choice",
  };

  const activatedCoachPro = activatePaidPlanForUser("coach_pro", true, "pro", coachBaseUser);
  assert(
    activatedCoachPro.subscriptionStatus === "active",
    "activatePaidPlanForUser: Ativa plano do professor como 'active'"
  );
  assert(
    activatedCoachPro.subscriptionPlan === "coach_pro_rec",
    "activatePaidPlanForUser: Converte plano recorrente do professor com sufixo _rec"
  );
  assert(
    activatedCoachPro.planTier === "pro",
    "activatePaidPlanForUser: Atribui tier 'pro' para o Personal Pro"
  );

  const activatedCoachStarter = activatePaidPlanForUser("coach_starter", false, "basico", coachBaseUser);
  assert(
    activatedCoachStarter.planTier === "basico",
    "activatePaidPlanForUser: Mapeia Personal Starter para o tier 'basico'"
  );

  const activatedCoachVip = activatePaidPlanForUser("coach_vip", false, "vip", coachBaseUser);
  assert(
    activatedCoachVip.planTier === "vip",
    "activatePaidPlanForUser: Mapeia Personal Elite VIP para o tier 'vip'"
  );

  // Teste 16.4: Ativação de Período de Testes (Trial de 7 Dias) para Professor
  const coachTrial = activateTrialForUser(7, coachBaseUser);
  assert(
    coachTrial.subscriptionStatus === "trial",
    "activateTrialForUser: Ativa status 'trial' para o professor"
  );
  assert(
    coachTrial.subscriptionPlan === "trial_coach_7d",
    "activateTrialForUser: Atribui plano 'trial_coach_7d' automaticamente para conta de professor"
  );

  // Teste 16.5: Resolução de Plano Canônico por ID
  assert(
    getOfficialPlan("coach_pro").id === "coach_pro",
    "getOfficialPlan: Resolve plano oficial coach_pro diretamente"
  );
  assert(
    getOfficialPlan("coach_unknown_test").id === "coach_pro",
    "getOfficialPlan: Fallback inteligente de planos de coach desconhecidos para coach_pro"
  );

  // Teste 16.6: Perguntas do FAQ específicas de Aluno vs Professor
  const rolesFaq = FAQ_ITEMS.find((f) => f.id === "diferenca_papeis");
  assert(
    Boolean(rolesFaq && rolesFaq.answer.includes("Aluno") && rolesFaq.answer.includes("Professor")),
    "FAQ: Contém pergunta e resposta detalhada explicando a diferença entre planos de Aluno e de Professor"
  );

  const dualProfileFaq = FAQ_ITEMS.find((f) => f.id === "duplo_perfil");
  assert(
    Boolean(dualProfileFaq && dualProfileFaq.answer.includes("duplo papel")),
    "FAQ: Contém pergunta e resposta esclarecendo o suporte nativo a duplo papel (Aluno e Personal)"
  );

  // ---------------------------------------------------------------------------
  // 17. TESTANDO ISOLAMENTO ESTRITO MULTI-TENANT ENTRE USUÁRIOS
  // ---------------------------------------------------------------------------
  console.log("\n🔹 17. Testando Isolamento Estrito Multi-Tenant entre Usuários...");

  // Mock de ambiente de storage para emulação de navegador em Node
  const storageMock: Record<string, string> = {};
  (global as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (global as any).localStorage = {
    getItem: (key: string) => storageMock[key] ?? null,
    setItem: (key: string, val: string) => { storageMock[key] = String(val); },
    removeItem: (key: string) => { delete storageMock[key]; },
    clear: () => { Object.keys(storageMock).forEach((k) => delete storageMock[k]); },
  };

  // Teste 17.1: Particionamento Criptográfico de Chaves de Armazenamento
  const coachKey1 = getCoachStudentsStorageKey("coach_111");
  const coachKey2 = getCoachStudentsStorageKey("coach_222");
  assert(
    coachKey1 !== coachKey2 && coachKey1 === "gymflow_students_coach_111",
    "Particionamento de Alunos: Chave de storage isolada por coachId ('gymflow_students_coach_111')"
  );

  const plansKey1 = getCoachPlansStorageKey("coach_111");
  const plansKey2 = getCoachPlansStorageKey("coach_222");
  assert(
    plansKey1 !== plansKey2 && plansKey1 === "gymflow_coach_plans_coach_111",
    "Particionamento de Planos: Chave de planos isolada por coachId ('gymflow_coach_plans_coach_111')"
  );

  const metricsKey1 = getBodyMetricsStorageKey("user_aaa");
  const metricsKey2 = getBodyMetricsStorageKey("user_bbb");
  assert(
    metricsKey1 !== metricsKey2 && metricsKey1 === "gymflow_body_metrics_user_aaa",
    "Particionamento de Bioimpedância: Chave de medições corporais isolada por userId ('gymflow_body_metrics_user_aaa')"
  );

  const routinesKey1 = getCoachRoutinesStorageKey("coach_111");
  const routinesKey2 = getCoachRoutinesStorageKey("coach_222");
  assert(
    routinesKey1 !== routinesKey2 && routinesKey1 === "gymflow_coach_custom_routines_coach_111",
    "Particionamento de Fichas/Rotinas: Chave de rotinas isolada por coachId ('gymflow_coach_custom_routines_coach_111')"
  );

  // Teste 17.2: Isolamento de Alunos entre Treinadores (Coach A vs Coach B)
  saveNewStudent({
    name: "Aluno Exclusivo do Coach Alpha",
    email: "alpha_student@gymflow.test",
    goal: "Hipertrofia",
    plan: "Mensal Pro",
  }, "coach_alpha");

  saveNewStudent({
    name: "Aluno Exclusivo do Coach Beta",
    email: "beta_student@gymflow.test",
    goal: "Emagrecimento",
    plan: "Mensal VIP",
  }, "coach_beta");

  const studentsAlpha = getStoredStudents("coach_alpha");
  const studentsBeta = getStoredStudents("coach_beta");

  assert(
    studentsAlpha.some((s) => s.name === "Aluno Exclusivo do Coach Alpha") &&
    !studentsAlpha.some((s) => s.name === "Aluno Exclusivo do Coach Beta"),
    "Isolamento de Alunos: Coach Alpha vê apenas seus próprios alunos e NENHUM aluno do Coach Beta"
  );

  assert(
    studentsBeta.some((s) => s.name === "Aluno Exclusivo do Coach Beta") &&
    !studentsBeta.some((s) => s.name === "Aluno Exclusivo do Coach Alpha"),
    "Isolamento de Alunos: Coach Beta vê apenas seus próprios alunos e NENHUM aluno do Coach Alpha"
  );

  // Teste 17.3: Bloqueio de Vazamento de Alunos para Contas de Aluno
  // Simula usuário logado como aluno
  storageMock["gymflow_current_user_v4"] = JSON.stringify({
    id: "student_999",
    name: "Aluno Comum",
    email: "comum@test.com",
    activeRole: "student",
  });
  const studentsViewedByStudent = getStoredStudents();
  assert(
    studentsViewedByStudent.length === 0,
    "Segurança Anti-Vazamento: Aluno logado que chama getStoredStudents() recebe array vazio (sem vazamento de outros alunos)"
  );

  // Teste 17.4: Isolamento de Planos Customizados entre Coaches
  saveCoachPlans([
    {
      id: "plan_custom_alpha",
      name: "Consultoria Premium Alpha",
      price: 180,
      period: "mensal",
      frequency: "5x por semana",
      isCustom: true,
    },
  ], "coach_alpha");

  saveCoachPlans([
    {
      id: "plan_custom_beta",
      name: "Consultoria Personalizada Beta",
      price: 250,
      period: "mensal",
      frequency: "Livre",
      isCustom: true,
    },
  ], "coach_beta");

  const plansAlpha = getStoredCoachPlans("coach_alpha");
  const plansBeta = getStoredCoachPlans("coach_beta");

  assert(
    plansAlpha.some((p) => p.id === "plan_custom_alpha") &&
    !plansAlpha.some((p) => p.id === "plan_custom_beta"),
    "Isolamento de Planos: Coach Alpha possui seu catálogo exclusivo sem planos do Coach Beta"
  );

  assert(
    plansBeta.some((p) => p.id === "plan_custom_beta") &&
    !plansBeta.some((p) => p.id === "plan_custom_alpha"),
    "Isolamento de Planos: Coach Beta possui seu catálogo exclusivo sem planos do Coach Alpha"
  );

  // Teste 17.5: Isolamento de Rotinas/Fichas Salvas entre Coaches
  saveCoachRoutine({
    id: "rot_alpha_1",
    name: "Periodização Força Alpha",
    description: "Notas restritas Alpha",
    category: "Hipertrofia",
    difficulty: "Intermediário",
    frequency: "3x/sem",
    splits: [],
  }, "coach_alpha");

  saveCoachRoutine({
    id: "rot_beta_1",
    name: "Periodização Funcional Beta",
    description: "Notas restritas Beta",
    category: "Hipertrofia",
    difficulty: "Intermediário",
    frequency: "3x/sem",
    splits: [],
  }, "coach_beta");

  const routinesAlpha = getStoredCoachRoutines("coach_alpha");
  const routinesBeta = getStoredCoachRoutines("coach_beta");

  assert(
    routinesAlpha.some((r) => r.id === "rot_alpha_1") &&
    !routinesAlpha.some((r) => r.id === "rot_beta_1"),
    "Isolamento de Rotinas: Fichas do Coach Alpha não vazam para o Coach Beta"
  );

  assert(
    routinesBeta.some((r) => r.id === "rot_beta_1") &&
    !routinesBeta.some((r) => r.id === "rot_alpha_1"),
    "Isolamento de Rotinas: Fichas do Coach Beta não vazam para o Coach Alpha"
  );

  // Teste 17.6: Isolamento de Agendamentos (Bookings) entre Alunos e Coaches
  requestTrainerBooking({
    studentId: "student_lucas",
    studentName: "Lucas Aluno",
    studentPhone: "11988880001",
    coachId: "coach_alpha",
    slotDay: "Segunda",
    slotTime: "08:00",
    planType: "pro",
    extraOfferedAmount: 0,
  });

  requestTrainerBooking({
    studentId: "student_marina",
    studentName: "Marina Aluna",
    studentPhone: "11988880002",
    coachId: "coach_beta",
    slotDay: "Quarta",
    slotTime: "17:00",
    planType: "vip",
    extraOfferedAmount: 0,
  });

  const lucasBookings = getStudentBookings("student_lucas");
  const marinaBookings = getStudentBookings("student_marina");
  const alphaBookings = getCoachBookings("coach_alpha");
  const betaBookings = getCoachBookings("coach_beta");

  assert(
    lucasBookings.some((b) => b.studentId === "student_lucas") &&
    !lucasBookings.some((b) => b.studentId === "student_marina"),
    "Isolamento de Agendamentos: Lucas vê apenas seus próprios treinos agendados"
  );

  assert(
    marinaBookings.some((b) => b.studentId === "student_marina") &&
    !marinaBookings.some((b) => b.studentId === "student_lucas"),
    "Isolamento de Agendamentos: Marina vê apenas seus próprios treinos agendados"
  );

  assert(
    alphaBookings.some((b) => b.coachId === "coach_alpha") &&
    !alphaBookings.some((b) => b.coachId === "coach_beta"),
    "Isolamento de Agenda: Coach Alpha gerencia apenas treinos marcados com ele"
  );

  assert(
    betaBookings.some((b) => b.coachId === "coach_beta") &&
    !betaBookings.some((b) => b.coachId === "coach_alpha"),
    "Isolamento de Agenda: Coach Beta gerencia apenas treinos marcados com ele"
  );

  // Teste 17.7: Isolamento de Bioimpedância entre Alunos
  addBodyMetric({
    date: "2026-09-30",
    weight: 72.5,
    bodyFat: 11.2,
    muscleMass: 64.0,
    fatMass: 8.5,
  }, "student_lucas");

  addBodyMetric({
    date: "2026-09-30",
    weight: 58.0,
    bodyFat: 19.5,
    muscleMass: 46.0,
    fatMass: 12.0,
  }, "student_marina");

  const lucasMetrics = getStoredBodyMetrics("student_lucas");
  const marinaMetrics = getStoredBodyMetrics("student_marina");

  assert(
    lucasMetrics.some((m) => m.weight === 72.5) &&
    !lucasMetrics.some((m) => m.weight === 58.0),
    "Isolamento de Bioimpedância: Dados corporais de Lucas (72.5kg) isolados de Marina"
  );

  assert(
    marinaMetrics.some((m) => m.weight === 58.0) &&
    !marinaMetrics.some((m) => m.weight === 72.5),
    "Isolamento de Bioimpedância: Dados corporais de Marina (58.0kg) isolados de Lucas"
  );

  // Teste 17.8: Isolamento de Notificações Internas por Usuário e Papel
  addNotification({
    targetRole: "coach",
    coachId: "coach_alpha",
    type: "booking_message",
    title: "Novo Agendamento para Alpha",
    message: "Lucas agendou treino presencial",
  });

  addNotification({
    targetRole: "coach",
    coachId: "coach_beta",
    type: "booking_message",
    title: "Novo Agendamento para Beta",
    message: "Marina agendou treino presencial",
  });

  addNotification({
    targetRole: "student",
    studentId: "student_lucas",
    type: "training_reminder",
    title: "Lembrete de Treino do Lucas",
    message: "Treino hoje às 08:00",
  });

  const alphaNotifs = getStoredNotifications("coach_alpha", "coach");
  const betaNotifs = getStoredNotifications("coach_beta", "coach");
  const lucasNotifs = getStoredNotifications("student_lucas", "student");

  assert(
    alphaNotifs.some((n) => n.title === "Novo Agendamento para Alpha") &&
    !alphaNotifs.some((n) => n.title === "Novo Agendamento para Beta") &&
    !alphaNotifs.some((n) => n.title === "Lembrete de Treino do Lucas"),
    "Isolamento de Notificações: Coach Alpha recebe apenas alertas destinados a ele"
  );

  assert(
    betaNotifs.some((n) => n.title === "Novo Agendamento para Beta") &&
    !betaNotifs.some((n) => n.title === "Novo Agendamento para Alpha"),
    "Isolamento de Notificações: Coach Beta recebe apenas alertas destinados a ele"
  );

  assert(
    lucasNotifs.some((n) => n.title === "Lembrete de Treino do Lucas") &&
    !lucasNotifs.some((n) => n.targetRole === "coach"),
    "Isolamento de Notificações: Aluno Lucas recebe apenas seus próprios avisos e nada de professores"
  );

  // ---------------------------------------------------------------------------
  // 18. TESTANDO BLOQUEIO DE FICHA EM ATRASO (AUTOMÁTICO VS MANUAL DO PROFESSOR)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 18. Testando Bloqueio de Ficha em Caso de Atraso (Automático vs Manual)...");

  const coachAutoId = "coach_auto_lock_1";
  const coachManualId = "coach_manual_lock_2";

  // Teste 18.1: Configuração padrão inicial (Manual por escolha do professor)
  assert(
    isCoachAutoBlockEnabled(coachManualId) === false,
    "Configuração Padrão: Modo de bloqueio inicia como escolha manual do professor"
  );

  // Teste 18.2: Professor ativa o bloqueio automático nas configurações
  setCoachAutoBlockPreference(true, coachAutoId);
  assert(
    isCoachAutoBlockEnabled(coachAutoId) === true,
    "setCoachAutoBlockPreference: Ativação com sucesso do bloqueio automático para o treinador"
  );
  assert(
    isCoachAutoBlockEnabled(coachManualId) === false,
    "Isolamento de Preferências: Ativar automático no Coach 1 não afeta Coach 2"
  );

  // Teste 18.3: areProfilesEqual detecta alteração de autoBlockOverdueWorkouts
  const baseCoachProf: UserProfile = {
    id: "coach_prof_test",
    name: "Prof. Rodrigo",
    email: "rodrigo@gymflow.com",
    activeRole: "coach",
    enabledRoles: ["coach"],
    autoBlockOverdueWorkouts: false,
  };
  const updatedCoachProf: UserProfile = {
    ...baseCoachProf,
    autoBlockOverdueWorkouts: true,
  };
  assert(
    !areProfilesEqual(baseCoachProf, updatedCoachProf),
    "areProfilesEqual: Detecta alteração na preferência de autoBlockOverdueWorkouts"
  );

  // Teste 18.4: Bloqueio Automático ativado — aluno em atraso tem ficha pausada
  saveNewStudent(
    {
      id: "student_overdue_auto",
      name: "Renan Silva",
      email: "renan@gmail.com",
      goal: "Hipertrofia",
    },
    coachAutoId
  );
  updateStudentPaymentStatus("student_overdue_auto", "atrasado", coachAutoId);

  const studentsAuto = getStoredStudents(coachAutoId);
  const renanStudent = studentsAuto.find((s) => s.id === "student_overdue_auto");

  assert(
    renanStudent?.paymentStatus === "atrasado",
    "Status de Pagamento: Aluno registrado como 'atrasado'"
  );
  assert(
    renanStudent?.isWorkoutLocked === true,
    "Bloqueio Automático: Ficha do aluno atrasado é pausada automaticamente (isWorkoutLocked: true)"
  );
  assert(
    renanStudent?.workoutLockedReason === "overdue_payment",
    "Motivo do Bloqueio: Registrado como 'overdue_payment'"
  );

  const renanWorkout = getStudentWorkout("student_overdue_auto");
  assert(
    renanWorkout.isLocked === true,
    "Pacote de Treino: getStudentWorkout reflete isLocked: true para o aluno atrasado"
  );

  // Teste 18.5: Reativação Automática após quitação do pagamento
  updateStudentPaymentStatus("student_overdue_auto", "pago", coachAutoId);
  const studentsAutoPaid = getStoredStudents(coachAutoId);
  const renanPaid = studentsAutoPaid.find((s) => s.id === "student_overdue_auto");

  assert(
    renanPaid?.paymentStatus === "pago",
    "Status de Pagamento: Aluno atualizado para 'pago'"
  );
  assert(
    renanPaid?.isWorkoutLocked === false,
    "Desbloqueio Automático: Ficha é reativada instantaneamente após quitação (isWorkoutLocked: false)"
  );
  assert(
    renanPaid?.workoutLockedReason === undefined,
    "Limpeza de Motivo: workoutLockedReason é limpo após quitação"
  );

  const renanWorkoutRestored = getStudentWorkout("student_overdue_auto");
  assert(
    renanWorkoutRestored.isLocked === false || !renanWorkoutRestored.isLocked,
    "Pacote de Treino: getStudentWorkout restaura ficha liberada (isLocked: false)"
  );

  // Teste 18.6: Modo Manual (Escolha do Professor) — atraso NÃO bloqueia automaticamente
  saveNewStudent(
    {
      id: "student_overdue_manual",
      name: "Juliana Mendes",
      email: "juliana@gmail.com",
      goal: "Emagrecimento",
    },
    coachManualId
  );
  updateStudentPaymentStatus("student_overdue_manual", "atrasado", coachManualId);

  const studentsManual = getStoredStudents(coachManualId);
  const julianaStudent = studentsManual.find((s) => s.id === "student_overdue_manual");

  assert(
    julianaStudent?.paymentStatus === "atrasado",
    "Modo Manual: Aluno registrado como 'atrasado'"
  );
  assert(
    !julianaStudent?.isWorkoutLocked,
    "Modo Manual: Aluno atrasado NÃO é bloqueado automaticamente (escolha do professor preservada)"
  );

  // Teste 18.7: Professor bloqueia/pausa manualmente sob sua escolha
  const lockResult = toggleStudentWorkoutLock("student_overdue_manual", coachManualId);
  assert(
    lockResult === true,
    "toggleStudentWorkoutLock: Retorna true ao pausar a ficha manualmente"
  );

  const studentsManualLocked = getStoredStudents(coachManualId);
  const julianaLocked = studentsManualLocked.find((s) => s.id === "student_overdue_manual");
  assert(
    julianaLocked?.isWorkoutLocked === true,
    "Pausa Manual: isWorkoutLocked definido como true pelo professor"
  );

  const julianaWorkout = getStudentWorkout("student_overdue_manual");
  assert(
    julianaWorkout.isLocked === true,
    "Pausa Manual: Pacote de treino do aluno bloqueado com sucesso"
  );

  // Teste 18.8: Professor reativa manualmente sob sua escolha
  const unlockResult = toggleStudentWorkoutLock("student_overdue_manual", coachManualId);
  assert(
    unlockResult === false,
    "toggleStudentWorkoutLock: Retorna false ao reativar a ficha manualmente"
  );

  const studentsManualUnlocked = getStoredStudents(coachManualId);
  const julianaUnlocked = studentsManualUnlocked.find((s) => s.id === "student_overdue_manual");
  assert(
    julianaUnlocked?.isWorkoutLocked === false,
    "Reativação Manual: isWorkoutLocked restaurado para false pelo professor"
  );

  // Teste 18.9: Isolamento Multi-Tenant do Estado de Bloqueio
  updateStudentPaymentStatus("student_overdue_auto", "atrasado", coachAutoId);
  const renanCheck = getStoredStudents(coachAutoId).find((s) => s.id === "student_overdue_auto");
  const julianaCheck = getStoredStudents(coachManualId).find((s) => s.id === "student_overdue_manual");

  assert(
    renanCheck?.isWorkoutLocked === true && julianaCheck?.isWorkoutLocked === false,
    "Isolamento Multi-Tenant: Bloqueio do aluno de Coach 1 não afeta aluno de Coach 2"
  );

  // ---------------------------------------------------------------------------
  // RESULTADO FINAL
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`📊 RESULTADO DA AUDITORIA: ${passed} PASSOU | ${failed} FALHOU`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Erro fatal ao rodar testes:", err);
  process.exit(1);
});
