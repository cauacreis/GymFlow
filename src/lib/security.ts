import crypto from "crypto";

/**
 * Utilitários de Segurança do GymFlow
 * Inclui: Rate Limiting, Validação de Webhook HMAC, Idempotência e Sanitização.
 */

// Rate Limiter em memória com limpeza periódica (para servidor/Next.js)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Verifica se uma chave (ex: IP) excedeu o limite dentro de uma janela em segundos.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Limpeza de registros antigos expirados ocasionalmente
  if (rateLimitStore.size > 1000) {
    rateLimitStore.forEach((rec, k) => {
      if (rec.resetTime < now) {
        rateLimitStore.delete(k);
      }
    });
  }

  if (!record || record.resetTime < now) {
    const resetTime = now + windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

export interface VerifyMpWebhookParams {
  signatureHeader: string | null;
  xRequestId?: string | null;
  dataId?: string | null;
  rawBody: string;
  secret: string;
}

/**
 * Validação de webhook do Mercado Pago com suporte ao manifesto oficial:
 * id:[data.id_url];request-id:[x-request-id_header];ts:[ts_from_x_signature];
 * E fallback seguro para validação direta de payload.
 */
export function verifyMercadoPagoWebhook({
  signatureHeader,
  xRequestId,
  dataId,
  rawBody,
  secret,
}: VerifyMpWebhookParams): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    let hashToVerify = signatureHeader;
    let ts = "";

    if (signatureHeader.includes("v1=")) {
      const parts = signatureHeader.split(",");
      const v1Part = parts.find((p) => p.trim().startsWith("v1="));
      const tsPart = parts.find((p) => p.trim().startsWith("ts="));
      if (v1Part) hashToVerify = v1Part.split("=")[1].trim();
      if (tsPart) ts = tsPart.split("=")[1].trim();
    }

    // Hash SHA-256 em hex deve conter exatamente 64 caracteres (32 bytes)
    if (!hashToVerify || hashToVerify.length !== 64 || !/^[0-9a-f]{64}$/i.test(hashToVerify)) {
      return false;
    }

    const verifyBuffer = Buffer.from(hashToVerify, "hex");

    // 1. Tenta validar via manifesto oficial do Mercado Pago
    if (ts && (dataId || xRequestId)) {
      const manifest = `id:${dataId || ""};request-id:${xRequestId || ""};ts:${ts};`;
      const expectedManifestHash = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");
      const manifestBuffer = Buffer.from(expectedManifestHash, "hex");

      if (
        verifyBuffer.length === manifestBuffer.length &&
        crypto.timingSafeEqual(verifyBuffer, manifestBuffer)
      ) {
        return true;
      }
    }

    // 2. Tenta validar via payload bruto (rawBody)
    if (rawBody) {
      const expectedPayloadHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
      const payloadBuffer = Buffer.from(expectedPayloadHash, "hex");

      if (
        verifyBuffer.length === payloadBuffer.length &&
        crypto.timingSafeEqual(verifyBuffer, payloadBuffer)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Validação genérica de assinatura HMAC SHA-256 para Webhooks (Timing-Safe)
 */
export function verifyHmacSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  return verifyMercadoPagoWebhook({
    signatureHeader,
    rawBody: payload,
    secret,
  });
}

/**
 * Gerador de Idempotency Key (UUID v4) para pagamentos e pedidos
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Sanitiza strings para exibição segura
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}
