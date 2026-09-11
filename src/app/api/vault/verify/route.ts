import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// Salt fixo do cofre para hash HMAC determinístico (seguro no ambiente server-side)
const VAULT_SALT = "gymflow_vault_salt_2026";

// Hash HMAC-SHA256 da chave padrão (nenhuma chave em texto plano fica no código!)
const EXPECTED_HMAC_HASH = "3c3d605e2c41285dc6439eacc6e8c7fbdbdf80f67d05851408033550fa6b73b0";

// Armazenamento em memória para Rate Limiting anti-brute force no servidor
interface AttemptRecord {
  attempts: number;
  lockedUntil: number;
}

const memoryLockouts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 4;
const LOCKOUT_MS = 3 * 60 * 1000; // 3 minutos de bloqueio

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = memoryLockouts.get(ip) || { attempts: 0, lockedUntil: 0 };

  // Verifica bloqueio ativo
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        isLocked: true,
        remainingSeconds,
        error: `Terminal temporariamente bloqueado. Aguarde ${remainingSeconds} segundos.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const inputKey = typeof body.key === "string" ? body.key.trim() : "";

    if (!inputKey) {
      return NextResponse.json(
        {
          success: false,
          isLocked: false,
          error: "Chave mestra não informada.",
        },
        { status: 400 }
      );
    }

    // Calcula hash HMAC do input
    const inputHash = crypto
      .createHmac("sha256", VAULT_SALT)
      .update(inputKey)
      .digest("hex");

    let isMatch = false;

    // 1. Comparação segura com hash HMAC esperado
    if (inputHash.length === EXPECTED_HMAC_HASH.length) {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(inputHash, "hex"),
        Buffer.from(EXPECTED_HMAC_HASH, "hex")
      );
    }

    // 2. Override opcional via variável de ambiente no servidor
    const envMasterKey = process.env.ADMIN_MASTER_KEY;
    if (!isMatch && envMasterKey && envMasterKey.trim() === inputKey) {
      isMatch = true;
    }

    if (!isMatch) {
      record.attempts += 1;
      const isNowLocked = record.attempts >= MAX_ATTEMPTS;

      if (isNowLocked) {
        record.lockedUntil = now + LOCKOUT_MS;
      }
      memoryLockouts.set(ip, record);

      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - record.attempts);
      const remainingSeconds = isNowLocked ? Math.ceil(LOCKOUT_MS / 1000) : 0;

      return NextResponse.json(
        {
          success: false,
          isLocked: isNowLocked,
          attemptsLeft,
          remainingSeconds,
          error: isNowLocked
            ? `Chave incorreta. Limite excedido! Bloqueio ativado por ${remainingSeconds}s.`
            : `Chave mestra inválida! Restam ${attemptsLeft} tentativa(s).`,
        },
        { status: 401 }
      );
    }

    // Sucesso na validação! Limpa histórico de tentativas do IP
    memoryLockouts.delete(ip);

    // Gera token de sessão criptograficamente seguro com assinatura HMAC
    const randomBytes = crypto.randomBytes(24).toString("hex");
    const expiresAt = now + 60 * 60 * 1000; // 1 hora de validade
    const payload = `${randomBytes}:${expiresAt}:vault_admin`;
    const signature = crypto
      .createHmac("sha256", VAULT_SALT)
      .update(payload)
      .digest("hex");
    const sessionToken = `${payload}.${signature}`;

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      expiresAt,
      message: "Acesso mestre concedido.",
    });

    // Define cookie seguro de sessão
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("gymflow_vault_auth", sessionToken, {
      httpOnly: false, // Disponível para validação rápida no client
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 3600,
    });

    return response;
  } catch (err) {
    console.error("Erro ao validar chave do cofre:", err);
    return NextResponse.json(
      { success: false, error: "Falha interna ao processar requisição de autenticação." },
      { status: 500 }
    );
  }
}
