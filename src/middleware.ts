import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting simplificado para o Edge/Node Middleware
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  return false;
}

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "127.0.0.1";
  const path = request.nextUrl.pathname;

  // Rate Limiting para rotas de autenticação (mitigação de brute-force)
  if (path.startsWith("/api/auth")) {
    const authKey = `rl:auth:${ip}`;
    if (isRateLimited(authKey, 5, 15 * 60 * 1000)) {
      return new NextResponse(
        JSON.stringify({
          error: "Muitas tentativas. Por favor, aguarde 15 minutos.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Rate Limiting geral para endpoints de API
  if (path.startsWith("/api/")) {
    const apiKey = `rl:api:${ip}`;
    if (isRateLimited(apiKey, 100, 60 * 1000)) {
      return new NextResponse(
        JSON.stringify({
          error: "Limite de requisições excedido. Tente novamente em breve.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Proteção de rotas autenticadas (Ex: /profile, /orders)
  const protectedRoutes = ["/profile", "/orders"];
  if (protectedRoutes.some((route) => path.startsWith(route))) {
    const sessionToken = request.cookies.get("gymflow_session");
    if (!sessionToken?.value) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/profile/:path*",
    "/orders/:path*",
  ],
};
