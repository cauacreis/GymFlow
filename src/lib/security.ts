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

/**
 * Validação de assinatura HMAC SHA-256 para Webhooks (Mercado Pago / Provedores)
 */
export function verifyHmacSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  try {
    // Mercado Pago pode enviar: ts=...,v1=...
    let hashToVerify = signatureHeader;
    if (signatureHeader.includes("v1=")) {
      const parts = signatureHeader.split(",");
      const v1Part = parts.find((p) => p.trim().startsWith("v1="));
      if (v1Part) {
        hashToVerify = v1Part.split("=")[1].trim();
      }
    }

    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Comparação de tempo constante para prevenir timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hashToVerify, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch (err) {
    return false;
  }
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
