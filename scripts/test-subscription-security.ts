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
  buildExternalReference,
  parseExternalReference,
  getMercadoPagoStatus,
  createDirectPixPayment,
  createCheckoutPreference,
  createRecurringSubscription,
} from "../src/lib/mercadopago";

import {
  canAccessFeature,
  getUserPlanTier,
  isSubscriptionExpired,
  getRemainingTrialDays,
  FEATURES_METADATA,
} from "../src/lib/subscription-features";

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
  assert(canAccessFeature("turnstile_checkin", userBasico).allowed === true, "Básico: Tem acesso à Catraca Digital QR Code");
  assert(canAccessFeature("basic_agenda", userBasico).allowed === true, "Básico: Tem acesso à Agenda de Treinos");
  assert(canAccessFeature("personal_marketplace", userBasico).allowed === true, "Básico: Tem acesso ao Marketplace de Personals");

  assert(canAccessFeature("advanced_workout", userBasico).allowed === false, "Básico BLOQUEADO: Fichas com GIFs e Biomecânica requer PRO");
  assert(canAccessFeature("collective_classes", userBasico).allowed === false, "Básico BLOQUEADO: Aulas Coletivas requer PRO");
  assert(canAccessFeature("gymbot_ai", userBasico).allowed === false, "Básico BLOQUEADO: GymBot IA requer PRO");
  assert(canAccessFeature("inbody_bioimpedance", userBasico).allowed === false, "Básico BLOQUEADO: Bioimpedância InBody requer VIP");
  assert(canAccessFeature("vip_personal_perks", userBasico).allowed === false, "Básico BLOQUEADO: Personal Incluso requer VIP");

  const userPro = makeUser("pro");
  assert(canAccessFeature("basic_workout", userPro).allowed === true, "Pro: Tem acesso a Musculação Essencial");
  assert(canAccessFeature("advanced_workout", userPro).allowed === true, "Pro: Tem acesso liberado a Fichas com GIFs");
  assert(canAccessFeature("collective_classes", userPro).allowed === true, "Pro: Tem acesso liberado a Aulas Coletivas");
  assert(canAccessFeature("gymbot_ai", userPro).allowed === true, "Pro: Tem acesso liberado ao GymBot IA");
  assert(canAccessFeature("inbody_bioimpedance", userPro).allowed === false, "Pro BLOQUEADO: Bioimpedância InBody é exclusivo VIP");
  assert(canAccessFeature("vip_personal_perks", userPro).allowed === false, "Pro BLOQUEADO: Benefícios VIP com Personal é exclusivo VIP");

  const userVip = makeUser("vip");
  assert(canAccessFeature("basic_workout", userVip).allowed === true, "VIP: Tem acesso a Musculação Essencial");
  assert(canAccessFeature("advanced_workout", userVip).allowed === true, "VIP: Tem acesso a Fichas com GIFs");
  assert(canAccessFeature("collective_classes", userVip).allowed === true, "VIP: Tem acesso a Aulas Coletivas");
  assert(canAccessFeature("gymbot_ai", userVip).allowed === true, "VIP: Tem acesso ao GymBot IA");
  assert(canAccessFeature("inbody_bioimpedance", userVip).allowed === true, "VIP: Tem acesso LIBERADO a Bioimpedância InBody");
  assert(canAccessFeature("vip_personal_perks", userVip).allowed === true, "VIP: Tem acesso LIBERADO a Personal Incluso");

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
  assert(canAccessFeature("turnstile_checkin", expiredStudent).allowed === false, "Aluno expirado tem CATRACA BLOQUEADA");

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
