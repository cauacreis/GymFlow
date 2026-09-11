import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting em memória por IP
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);

  // Limpeza de cache periódica
  if (rateLimits.size > 2000) {
    rateLimits.forEach((val, k) => {
      if (val.resetTime < now) {
        rateLimits.delete(k);
      }
    });
  }

  if (!entry || entry.resetTime < now) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count += 1;
  return false;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "127.0.0.1";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // 1. Rate Limiting em rotas sensíveis de Autenticação
  if (pathname.startsWith("/api/auth")) {
    if (isRateLimited(`auth:${ip}`, 15, 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas de autenticação. Aguarde 1 minuto." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // 2. Rate Limiting em rotas de Pagamento (Excluindo o Webhook do Mercado Pago para não descartar notificações)
  if (pathname.startsWith("/api/payment") && !pathname.startsWith("/api/payment/webhook")) {
    if (isRateLimited(`payment:${ip}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas requisições de pagamento. Aguarde alguns instantes." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // 3. Rate Limiting no Cofre de Administração
  if (pathname.startsWith("/api/vault")) {
    if (isRateLimited(`vault:${ip}`, 8, 60 * 1000)) {
      return NextResponse.json(
        { error: "Terminal administrativo em resfriamento. Aguarde 1 minuto." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/payment/:path*",
    "/api/vault/:path*",
  ],
};
