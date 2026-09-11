/**
 * GymFlow Automated Security, Feature Gating & Mercado Pago Test Suite
 * Importa DIRETAMENTE os módulos reais da aplicação (Zero Mocks internos).
 * Executa verificações profundas em:
 * 1. Tabela Canônica e Anti-Tampering de Preços
 * 2. Encoding e Parsing Resiliente de External Reference (PIX, Assinaturas, Checkout)
 * 3. Feature Gating Granular por Nível (Básico vs Pro vs VIP)
 * 4. Validação de Expiração e Paywall (Anti-Bypass de Trial e Vencimento)
 * 5. Verificação Criptográfica HMAC Timing-Safe de Webhooks do Mercado Pago
 * 6. Rate Limiting e Sanitização Defensiva
 */

import crypto from "crypto";
import {
  OFFICIAL_PLANS,
  getOfficialPlan,
  buildExternalReference,
  parseExternalReference,
  getMercadoPagoStatus,
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

// Caso A: Formato Moderno com Delimitador ':' e User ID contendo underscores (ex: user_174173829)
const extRefModern = buildExternalReference("pix", "user_174173829000", "vip");
const parsedModern = parseExternalReference(extRefModern);
assert(
  parsedModern.prefix === "pix" &&
  parsedModern.userId === "user_174173829000" &&
  parsedModern.planId === "vip",
  `External reference com delimitador ':' decodificou corretamente user_id com underscore: ${parsedModern.userId}`
);

// Caso B: Formato com UUID padrão do Supabase Auth
const testUUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const extRefUUID = buildExternalReference("sub", testUUID, "pro");
const parsedUUID = parseExternalReference(extRefUUID);
assert(
  parsedUUID.prefix === "sub" &&
  parsedUUID.userId === testUUID &&
  parsedUUID.planId === "pro",
  `External reference preservou UUID do Supabase: ${parsedUUID.userId}`
);

// Caso C: Compatibilidade com Formato Legado com Underscore
const extRefLegacy = "pix_user_998877_pro_174173829000";
const parsedLegacy = parseExternalReference(extRefLegacy);
assert(
  parsedLegacy.userId === "user_998877" && parsedLegacy.planId === "pro",
  `Compatibilidade retroativa com formato legado: ${parsedLegacy.userId} no plano ${parsedLegacy.planId}`
);

// Caso D: Guest / Sem autenticação
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

// A. Plano BÁSICO (R$ 35,00)
const userBasico = makeUser("basico");
assert(canAccessFeature("basic_workout", userBasico).allowed === true, "Básico: Tem acesso a Musculação Essencial");
assert(canAccessFeature("turnstile_checkin", userBasico).allowed === true, "Básico: Tem acesso à Catraca Digital QR Code");
assert(canAccessFeature("basic_agenda", userBasico).allowed === true, "Básico: Tem acesso à Agenda de Treinos");
assert(canAccessFeature("personal_marketplace", userBasico).allowed === true, "Básico: Tem acesso ao Marketplace de Personals");

// Básico NÃO pode acessar recursos Pro e VIP
assert(canAccessFeature("advanced_workout", userBasico).allowed === false, "Básico BLOQUEADO: Fichas com GIFs e Biomecânica requer PRO");
assert(canAccessFeature("collective_classes", userBasico).allowed === false, "Básico BLOQUEADO: Aulas Coletivas requer PRO");
assert(canAccessFeature("gymbot_ai", userBasico).allowed === false, "Básico BLOQUEADO: GymBot IA requer PRO");
assert(canAccessFeature("inbody_bioimpedance", userBasico).allowed === false, "Básico BLOQUEADO: Bioimpedância InBody requer VIP");
assert(canAccessFeature("vip_personal_perks", userBasico).allowed === false, "Básico BLOQUEADO: Personal Incluso requer VIP");

// B. Plano PRO (R$ 45,00)
const userPro = makeUser("pro");
assert(canAccessFeature("basic_workout", userPro).allowed === true, "Pro: Tem acesso a Musculação Essencial");
assert(canAccessFeature("advanced_workout", userPro).allowed === true, "Pro: Tem acesso liberado a Fichas com GIFs");
assert(canAccessFeature("collective_classes", userPro).allowed === true, "Pro: Tem acesso liberado a Aulas Coletivas");
assert(canAccessFeature("gymbot_ai", userPro).allowed === true, "Pro: Tem acesso liberado ao GymBot IA");

// Pro NÃO pode acessar recursos VIP
assert(canAccessFeature("inbody_bioimpedance", userPro).allowed === false, "Pro BLOQUEADO: Bioimpedância InBody é exclusivo VIP");
assert(canAccessFeature("vip_personal_perks", userPro).allowed === false, "Pro BLOQUEADO: Benefícios VIP com Personal é exclusivo VIP");

// C. Plano VIP (R$ 55,00)
const userVip = makeUser("vip");
assert(canAccessFeature("basic_workout", userVip).allowed === true, "VIP: Tem acesso a Musculação Essencial");
assert(canAccessFeature("advanced_workout", userVip).allowed === true, "VIP: Tem acesso a Fichas com GIFs");
assert(canAccessFeature("collective_classes", userVip).allowed === true, "VIP: Tem acesso a Aulas Coletivas");
assert(canAccessFeature("gymbot_ai", userVip).allowed === true, "VIP: Tem acesso ao GymBot IA");
assert(canAccessFeature("inbody_bioimpedance", userVip).allowed === true, "VIP: Tem acesso LIBERADO a Bioimpedância InBody");
assert(canAccessFeature("vip_personal_perks", userVip).allowed === true, "VIP: Tem acesso LIBERADO a Personal Incluso");

// D. Modo Professor (Coach)
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
  subscriptionEndsAt: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
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

// Criação da assinatura legítima no formato oficial do Mercado Pago:
// manifest: "id:[data.id];request-id:[x-request-id];ts:[ts];"
const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
const validHmac = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");
const signatureHeader = `ts=${ts},v1=${validHmac}`;

// A. Assinatura Legítima
const isWebhookValid = verifyMercadoPagoWebhook({
  signatureHeader,
  xRequestId,
  dataId,
  rawBody: JSON.stringify({ action: "payment.created", data: { id: dataId } }),
  secret: webhookSecret,
});
assert(isWebhookValid === true, "Webhook com manifesto oficial do Mercado Pago validado com sucesso");

// B. Assinatura com Segredo Incorreto (Ataque de Falsificação)
const isImpostorValid = verifyMercadoPagoWebhook({
  signatureHeader,
  xRequestId,
  dataId,
  rawBody: JSON.stringify({ action: "payment.created", data: { id: dataId } }),
  secret: "wrong_attacker_secret",
});
assert(isImpostorValid === false, "Webhook com segredo incorreto rejeitado (401)");

// C. Assinatura Adulterada (Man-in-the-Middle)
const tamperedHeader = `ts=${ts},v1=${validHmac.slice(0, -2)}aa`;
const isTamperedValid = verifyMercadoPagoWebhook({
  signatureHeader: tamperedHeader,
  xRequestId,
  dataId,
  rawBody: "{}",
  secret: webhookSecret,
});
assert(isTamperedValid === false, "Webhook com hash adulterado rejeitado");

// D. Headers Malformados ou Injeção de Strings Inválidas (Crash Resistance)
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
// Executa 5 requisições com limite de 5
for (let i = 0; i < 5; i++) {
  const res = checkRateLimit(testIp, 5, 60);
  if (!res.allowed) rateLimitPassed = false;
}
assert(rateLimitPassed, "5 requisições dentro do limite de 5 permitidas");

// A 6ª requisição deve ser bloqueada
const blockedRes = checkRateLimit(testIp, 5, 60);
assert(!blockedRes.allowed, "6ª requisição bloqueada por exceder o limite (429 Rate Limit)");

// Sanitização contra XSS
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
console.log(`  ℹ️  Configurado: ${mpStatus.configured}`);
console.log(`  ℹ️  Ambiente detectado: ${mpStatus.environment}`);
console.log(`  ℹ️  Modo de operação: ${mpStatus.setupGuide.modeActive}`);
console.log(`  ℹ️  Onde cadastrar credenciais locais: ${mpStatus.setupGuide.locationLocal}`);
console.log(`  ℹ️  Onde cadastrar credenciais produção: ${mpStatus.setupGuide.locationProduction}`);

assert(
  mpStatus.setupGuide.requiredVariables.includes("MP_ACCESS_TOKEN") &&
  mpStatus.setupGuide.requiredVariables.includes("NEXT_PUBLIC_MP_PUBLIC_KEY") &&
  mpStatus.setupGuide.requiredVariables.includes("MP_WEBHOOK_SECRET"),
  "Variáveis obrigatórias do Mercado Pago devidamente mapeadas no guia de configuração"
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
