import crypto from "crypto";
import { getSupabase, getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

/**
 * ==============================================================================
 * GYMFLOW ENTERPRISE IDEMPOTENCY & TRANSACTION INTEGRITY ENGINE
 * ==============================================================================
 * 
 * Padrões Arquiteturais Implementados:
 * 1. IETF Idempotency-Key Standard (Request deduplication, in-flight mutex locking)
 * 2. Canonical Payload Hashing (Anti-payload tampering / collision detection)
 * 3. Finite State Machine (FSM) com transições monotônicas para pagamentos
 * 4. Webhook Event Ledger (Outbox/Event Store deduplication contra replays)
 * 5. Deterministic Subscription Date Extension (Extensão imutável e idempotente)
 * 6. Credit Protection (Garantia de que um payment_id nunca é creditado mais de 1x)
 */

export type PaymentStatus =
  | "pending"
  | "in_process"
  | "authorized"
  | "approved"
  | "in_mediation"
  | "cancelled"
  | "rejected"
  | "refunded"
  | "charged_back";

export interface IdempotencyRecord {
  key: string;
  userId?: string | null;
  route: string;
  requestHash: string;
  status: "processing" | "completed" | "failed";
  responseStatus?: number;
  responseBody?: any;
  resourceId?: string;
  createdAt: number;
  lockedAt: number;
  expiresAt: number;
}

export interface WebhookEventRecord {
  id: string;
  provider: string;
  eventType: string;
  resourceId: string;
  status: "received" | "processing" | "processed" | "failed" | "ignored";
  idempotencyKey?: string;
  payload?: any;
  errorMessage?: string;
  processedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

// ---------------------------------------------------------------------------
// 1. CANONICAL PAYLOAD HASHING (SHA-256)
// ---------------------------------------------------------------------------

/**
 * Serializa objetos de forma determinística ordenando todas as chaves recursivamente.
 * Garante que `{ a: 1, b: 2 }` e `{ b: 2, a: 1 }` produzam exatamente o mesmo hash.
 * Trata Dates, objetos com toJSON, campos undefined e valores não numéricos.
 */
export function canonicalJsonStringify(obj: any): string {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "function" || typeof obj === "symbol") return "";

  // Date objects para ISO string determinística
  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }

  // Suporte a toJSON() personalizado
  if (typeof obj === "object" && typeof obj.toJSON === "function") {
    return canonicalJsonStringify(obj.toJSON());
  }

  if (typeof obj !== "object") {
    if (typeof obj === "number" && (!isFinite(obj) || isNaN(obj))) {
      return "null";
    }
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalJsonStringify(item) || "null").join(",") + "]";
  }

  const sortedKeys = Object.keys(obj)
    .filter((key) => obj[key] !== undefined && typeof obj[key] !== "function" && typeof obj[key] !== "symbol")
    .sort();

  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJsonStringify(obj[key])}`
  );
  return "{" + pairs.join(",") + "}";
}

/**
 * Gera hash SHA-256 do payload canônico para integridade da requisição.
 */
export function hashPayload(payload: any): string {
  const canonical = canonicalJsonStringify(payload);
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

// ---------------------------------------------------------------------------
// 2. FINITE STATE MACHINE (FSM) DE TRANSIÇÃO DE PAGAMENTOS
// ---------------------------------------------------------------------------

/**
 * Grafo de Transições Válidas (Monotonic State Machine)
 * Impede regressão de estados terminais ou estados de maior maturidade.
 * Exemplo: Uma notificação atrasada 'pending' NÃO PODE reverter um status 'approved'.
 */
const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["in_process", "authorized", "approved", "cancelled", "rejected"],
  in_process: ["authorized", "approved", "cancelled", "rejected"],
  authorized: ["approved", "cancelled"],
  approved: ["refunded", "charged_back", "in_mediation"],
  in_mediation: ["approved", "refunded", "charged_back"],
  cancelled: [], // Estado terminal
  rejected: [], // Estado terminal
  refunded: [], // Estado terminal
  charged_back: [], // Estado terminal
};

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  if (!status || typeof status !== "string") return false;
  return status.trim().toLowerCase() in ALLOWED_PAYMENT_TRANSITIONS;
}

/**
 * Verifica se a transição entre dois status de pagamento é matematicamente válida.
 */
export function canTransitionPaymentStatus(
  currentStatus: string | null | undefined,
  nextStatus: string
): boolean {
  if (!nextStatus || typeof nextStatus !== "string") return false;
  if (!currentStatus) return true; // Criação inicial

  const cur = currentStatus.trim().toLowerCase() as PaymentStatus;
  const next = nextStatus.trim().toLowerCase() as PaymentStatus;

  if (cur === next) return true; // Idempotente (no-op)

  if (!ALLOWED_PAYMENT_TRANSITIONS[cur]) {
    // Se o status atual não está mapeado, mas o próximo é válido, permite corrigir
    return isValidPaymentStatus(next);
  }

  return ALLOWED_PAYMENT_TRANSITIONS[cur].includes(next);
}

/**
 * Resolve o resultado de uma transição de estado da FSM
 */
export function resolvePaymentStateTransition(
  currentStatus: string | null | undefined,
  nextStatus: string
): {
  allowed: boolean;
  isNoop: boolean;
  shouldUpdate: boolean;
  reason?: string;
} {
  if (!currentStatus) {
    return { allowed: true, isNoop: false, shouldUpdate: true };
  }

  const curClean = currentStatus.trim().toLowerCase();
  const nextClean = (nextStatus || "").trim().toLowerCase();

  if (curClean === nextClean) {
    return {
      allowed: true,
      isNoop: true,
      shouldUpdate: false,
      reason: `Idempotente: o pagamento já se encontra no status '${currentStatus}'.`,
    };
  }

  const allowed = canTransitionPaymentStatus(currentStatus, nextStatus);

  if (!allowed) {
    return {
      allowed: false,
      isNoop: false,
      shouldUpdate: false,
      reason: `Transição FSM inválida rejeitada: não é permitido transitar de '${currentStatus}' para '${nextStatus}'.`,
    };
  }

  return { allowed: true, isNoop: false, shouldUpdate: true };
}

// ---------------------------------------------------------------------------
// 3. DETERMINISTIC SUBSCRIPTION EXTENSION (DATAS IMUTÁVEIS)
// ---------------------------------------------------------------------------

/**
 * Calcula determinística e cumulativamente a nova data de expiração da assinatura.
 * Se o aluno já tem assinatura ativa no futuro, adiciona os dias ao final atual.
 * Se o aluno está sem plano ou vencido no passado, adiciona os dias a partir de 'now'.
 */
export function calculateDeterministicSubscriptionExtension(params: {
  currentEndsAt?: string | null;
  daysToAdd?: number;
  referenceDate?: Date;
}): {
  newEndsAt: Date;
  extendedFrom: "existing_active" | "now_expired";
  addedDays: number;
} {
  const days = Math.max(1, params.daysToAdd ?? 30);
  const now = params.referenceDate ? new Date(params.referenceDate) : new Date();

  let baseDate: Date;
  let extendedFrom: "existing_active" | "now_expired";

  if (params.currentEndsAt) {
    const existingDate = new Date(params.currentEndsAt);
    if (!isNaN(existingDate.getTime()) && existingDate.getTime() > now.getTime()) {
      // Usuário ainda ativo: preserva os dias restantes e estende cumulativamente
      baseDate = existingDate;
      extendedFrom = "existing_active";
    } else {
      // Vencido no passado ou data inválida: reinicia a partir de agora
      baseDate = now;
      extendedFrom = "now_expired";
    }
  } else {
    // Primeiro acesso
    baseDate = now;
    extendedFrom = "now_expired";
  }

  const newEndsAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  return {
    newEndsAt,
    extendedFrom,
    addedDays: days,
  };
}

/**
 * Verifica se um pagamento já teve seus dias creditados ao usuário
 */
export function canApplySubscriptionCredit(paymentRecord?: {
  credit_applied?: boolean;
  status: string;
} | null): boolean {
  if (!paymentRecord) return false;
  if (paymentRecord.status !== "approved") return false;
  return paymentRecord.credit_applied !== true;
}

// ---------------------------------------------------------------------------
// 4. MEMORY STORE DE ALTA PERFORMANCE (FALLBACK RESILIENTE & TEST SUITE)
// ---------------------------------------------------------------------------

const memoryIdempotencyStore = new Map<string, IdempotencyRecord>();
const memoryWebhookLedger = new Map<string, WebhookEventRecord>();

// Exportado para fins de teste
export function _resetMemoryStores(): void {
  memoryIdempotencyStore.clear();
  memoryWebhookLedger.clear();
}

export function _getMemoryIdempotencyRecord(key: string): IdempotencyRecord | undefined {
  return memoryIdempotencyStore.get(key);
}

export function _getMemoryWebhookRecord(id: string): WebhookEventRecord | undefined {
  return memoryWebhookLedger.get(id);
}

// ---------------------------------------------------------------------------
// 5. DISTRIBUTED MUTEX & IDEMPOTENCY KEY ENGINE
// ---------------------------------------------------------------------------

export interface AcquireLockResult {
  state: "acquired" | "cached" | "conflict" | "mismatched_payload";
  record?: IdempotencyRecord;
  cachedResponse?: {
    status: number;
    body: any;
  };
  message?: string;
  retryAfterSeconds?: number;
}

const DEFAULT_LOCK_TIMEOUT_MS = 30_000; // 30 segundos de trava in-flight
const DEFAULT_KEY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas de cache IETF

/**
 * Tenta adquirir a trava de idempotência para uma chave e requisição.
 */
export async function acquireIdempotencyLock(params: {
  key: string;
  route: string;
  requestHash: string;
  userId?: string | null;
  lockTimeoutMs?: number;
  expiryMs?: number;
}): Promise<AcquireLockResult> {
  const { key, route, requestHash, userId } = params;
  const lockTimeout = params.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS;
  const expiry = params.expiryMs ?? DEFAULT_KEY_EXPIRY_MS;
  const now = Date.now();

  const supabase = getSupabaseAdmin() || getSupabase();

  // 1. Caminho com Banco de Dados Supabase Real
  if (supabase && isSupabaseConfigured()) {
    try {
      const validUserId = isValidUuid(userId) ? userId : null;

      // 1.1 Tentativa atômica de inserção (Garante exclusão mútua contra race conditions no Postgres)
      const { data: inserted, error: insertErr } = await supabase
        .from("idempotency_keys")
        .insert({
          key,
          user_id: validUserId,
          route,
          request_hash: requestHash,
          status: "processing",
          locked_at: new Date(now).toISOString(),
          expires_at: new Date(now + expiry).toISOString(),
        })
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        return { state: "acquired" };
      }

      // 1.2 Conflito: Chave já existe, inspeciona o estado existente
      const { data: existing, error } = await supabase
        .from("idempotency_keys")
        .select("*")
        .eq("key", key)
        .maybeSingle();

      if (!error && existing) {
        // Validação anti-colisão / tampering de payload
        if (existing.request_hash !== requestHash) {
          return {
            state: "mismatched_payload",
            message: `Chave de idempotência '${key}' já foi utilizada para uma requisição diferente.`,
          };
        }

        // Se já concluído, retorna imediatamente o cache
        if (existing.status === "completed") {
          return {
            state: "cached",
            cachedResponse: {
              status: existing.response_status || 200,
              body: existing.response_body,
            },
          };
        }

        // Se em processamento: checa se a trava é recente ou abandonada (crash)
        if (existing.status === "processing") {
          const lockedAt = new Date(existing.locked_at).getTime();
          if (now - lockedAt < lockTimeout) {
            return {
              state: "conflict",
              message: "Uma requisição idêntica já está sendo processada neste instante. Aguarde.",
              retryAfterSeconds: 2,
            };
          }
          // Lock expirado/abandonado por timeout: permite recuperação
        }

        // Recupera lock abandonado ou permite retentativa após falha
        const { error: updateErr } = await supabase
          .from("idempotency_keys")
          .update({
            status: "processing",
            locked_at: new Date(now).toISOString(),
            expires_at: new Date(now + expiry).toISOString(),
            route,
            user_id: validUserId || existing.user_id,
          })
          .eq("key", key);

        if (!updateErr) {
          return { state: "acquired" };
        }
      }
    } catch (err) {
      console.warn("⚠️ Falha ao acessar Supabase para idempotency lock. Usando fallback em memória:", err);
    }
  }

  // 2. Caminho em Memória (Fallback resiliente e Execuções de Teste)
  const existing = memoryIdempotencyStore.get(key);

  if (existing) {
    // Checa se o payload é idêntico
    if (existing.requestHash !== requestHash) {
      return {
        state: "mismatched_payload",
        message: `Chave de idempotência '${key}' já foi utilizada para uma requisição diferente.`,
      };
    }

    if (existing.status === "completed") {
      return {
        state: "cached",
        cachedResponse: {
          status: existing.responseStatus || 200,
          body: existing.responseBody,
        },
      };
    }

    if (existing.status === "processing") {
      if (now - existing.lockedAt < lockTimeout) {
        return {
          state: "conflict",
          message: "Uma requisição idêntica já está sendo processada neste instante. Aguarde.",
          retryAfterSeconds: 2,
        };
      }
      // Lock abandonado: renova
    }
  }

  const record: IdempotencyRecord = {
    key,
    userId,
    route,
    requestHash,
    status: "processing",
    createdAt: existing ? existing.createdAt : now,
    lockedAt: now,
    expiresAt: now + expiry,
  };

  memoryIdempotencyStore.set(key, record);
  return { state: "acquired", record };
}

/**
 * Salva com sucesso a resposta final de uma requisição idempotente.
 */
export async function commitIdempotencySuccess(params: {
  key: string;
  responseStatus: number;
  responseBody: any;
  resourceId?: string;
}): Promise<void> {
  const { key, responseStatus, responseBody, resourceId } = params;
  const now = Date.now();

  const supabase = getSupabaseAdmin() || getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from("idempotency_keys")
        .update({
          status: "completed",
          response_status: responseStatus,
          response_body: responseBody,
          resource_id: resourceId || null,
        })
        .eq("key", key);
    } catch (err) {
      console.warn("Falha ao persistir sucesso da idempotência no Supabase:", err);
    }
  }

  const record = memoryIdempotencyStore.get(key);
  if (record) {
    record.status = "completed";
    record.responseStatus = responseStatus;
    record.responseBody = responseBody;
    record.resourceId = resourceId;
  }
}

/**
 * Libera a trava em caso de erro no handler para permitir re-tentativas imediatas.
 */
export async function releaseIdempotencyLock(key: string, error?: any): Promise<void> {
  const supabase = getSupabaseAdmin() || getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from("idempotency_keys")
        .update({
          status: "failed",
          response_body: { error: error?.message || "Internal error" },
        })
        .eq("key", key);
    } catch {}
  }

  const record = memoryIdempotencyStore.get(key);
  if (record) {
    record.status = "failed";
  }
}

/**
 * Executa uma operação garantindo 100% de integridade idempotente.
 * Retorna { status, body, replayed: boolean }.
 */
export async function executeWithIdempotency<T = any>(
  params: {
    key: string;
    route: string;
    payload: any;
    userId?: string | null;
    lockTimeoutMs?: number;
  },
  handler: () => Promise<{ status: number; body: T; resourceId?: string }>
): Promise<{
  status: number;
  body: T;
  replayed: boolean;
  error?: string;
  headers?: Record<string, string>;
}> {
  const requestHash = hashPayload(params.payload);

  const lock = await acquireIdempotencyLock({
    key: params.key,
    route: params.route,
    requestHash,
    userId: params.userId,
    lockTimeoutMs: params.lockTimeoutMs,
  });

  if (lock.state === "cached" && lock.cachedResponse) {
    return {
      status: lock.cachedResponse.status,
      body: lock.cachedResponse.body,
      replayed: true,
      headers: {
        "Idempotency-Replayed": "true",
        "X-Idempotency-Key": params.key,
      },
    };
  }

  if (lock.state === "mismatched_payload") {
    return {
      status: 422,
      body: {
        error: lock.message || "Chave de idempotência reutilizada com payload diferente.",
      } as unknown as T,
      replayed: false,
      headers: { "X-Idempotency-Key": params.key },
    };
  }

  if (lock.state === "conflict") {
    return {
      status: 409,
      body: {
        error: lock.message || "Requisição concorrente em andamento. Tente novamente em instantes.",
      } as unknown as T,
      replayed: false,
      headers: {
        "Retry-After": String(lock.retryAfterSeconds || 2),
        "X-Idempotency-Key": params.key,
      },
    };
  }

  // Trava adquirida: executa o handler
  try {
    const result = await handler();

    // Especificação IETF: Erros transitórios de servidor (5xx) NÃO devem ser cacheados como sucesso,
    // permitindo que retentativas imediatas ou futuras do cliente possam reexecutar a transação.
    if (result.status >= 500) {
      await releaseIdempotencyLock(params.key, result.body);
      return {
        status: result.status,
        body: result.body,
        replayed: false,
        headers: {
          "Idempotency-Replayed": "false",
          "X-Idempotency-Key": params.key,
        },
      };
    }

    await commitIdempotencySuccess({
      key: params.key,
      responseStatus: result.status,
      responseBody: result.body,
      resourceId: result.resourceId,
    });

    return {
      status: result.status,
      body: result.body,
      replayed: false,
      headers: {
        "Idempotency-Replayed": "false",
        "X-Idempotency-Key": params.key,
      },
    };
  } catch (err: any) {
    await releaseIdempotencyLock(params.key, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 6. WEBHOOK EVENT DEDUPLICATION LEDGER (OUTBOX / EVENT STORE)
// ---------------------------------------------------------------------------

export interface WebhookLockResult {
  shouldProcess: boolean;
  status: "acquired" | "already_processed" | "in_progress";
  eventRecord?: WebhookEventRecord;
}

/**
 * Registra a chegada de um evento de webhook e verifica se já foi consumido.
 * Implementa padrão Outbox/Event Store com inserção atômica no banco de dados.
 */
export async function acquireWebhookEventLock(params: {
  eventId: string;
  provider?: string;
  eventType: string;
  resourceId: string;
  payload?: any;
}): Promise<WebhookLockResult> {
  const { eventId, eventType, resourceId, payload } = params;
  const provider = params.provider || "mercadopago";
  const now = Date.now();

  const supabase = getSupabaseAdmin() || getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      // 1. Inserção atômica inicial no Postgres
      const { data: inserted, error: insertErr } = await supabase
        .from("webhook_events")
        .insert({
          id: eventId,
          provider,
          event_type: eventType,
          resource_id: resourceId,
          status: "processing",
          payload,
          updated_at: new Date(now).toISOString(),
        })
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        return { shouldProcess: true, status: "acquired" };
      }

      // 2. Conflito de chave única: evento já recebido anteriormente
      const { data: existing } = await supabase
        .from("webhook_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (existing) {
        if (existing.status === "processed") {
          return { shouldProcess: false, status: "already_processed" };
        }
        if (existing.status === "processing") {
          return { shouldProcess: false, status: "in_progress" };
        }
        if (existing.status === "failed") {
          // Permite que uma nova tentativa do webhook re-processe caso a anterior tenha falhado
          await supabase
            .from("webhook_events")
            .update({
              status: "processing",
              updated_at: new Date(now).toISOString(),
            })
            .eq("id", eventId);
          return { shouldProcess: true, status: "acquired" };
        }
      }
    } catch (err) {
      console.warn("Falha no ledger de webhook no Supabase:", err);
    }
  }

  // Fallback em memória
  const existing = memoryWebhookLedger.get(eventId);
  if (existing) {
    if (existing.status === "processed") {
      return { shouldProcess: false, status: "already_processed", eventRecord: existing };
    }
    if (existing.status === "processing") {
      return { shouldProcess: false, status: "in_progress", eventRecord: existing };
    }
  }

  const record: WebhookEventRecord = {
    id: eventId,
    provider,
    eventType,
    resourceId,
    status: "processing",
    payload,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };

  memoryWebhookLedger.set(eventId, record);
  return { shouldProcess: true, status: "acquired", eventRecord: record };
}

/**
 * Marca um evento de webhook como processado no ledger.
 */
export async function commitWebhookProcessed(
  eventId: string,
  meta?: { paymentId?: string; userId?: string }
): Promise<void> {
  const now = Date.now();
  const supabase = getSupabaseAdmin() || getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", eventId);
    } catch {}
  }

  const record = memoryWebhookLedger.get(eventId);
  if (record) {
    record.status = "processed";
    record.processedAt = now;
    record.updatedAt = now;
  }
}

/**
 * Marca falha no webhook para permitir reprocessamento caso o Mercado Pago tente novamente.
 */
export async function commitWebhookFailed(
  eventId: string,
  errorMessage: string
): Promise<void> {
  const now = Date.now();
  const supabase = getSupabaseAdmin() || getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from("webhook_events")
        .update({
          status: "failed",
          error_message: errorMessage,
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", eventId);
    } catch {}
  }

  const record = memoryWebhookLedger.get(eventId);
  if (record) {
    record.status = "failed";
    record.errorMessage = errorMessage;
    record.updatedAt = now;
  }
}
