/**
 * Admin Vault Security Service (Client & Integration Layer)
 * Gerenciamento seguro de sessão do cofre, comunicação com endpoint server-side
 * com proteção estrita de segredos (NENHUMA chave fica exposta no código front-end).
 */

const STORAGE_KEY_VAULT_SESSION = "gymflow_vault_session_v1";
const STORAGE_KEY_VAULT_ATTEMPTS = "gymflow_vault_lockout_v1";
const MAX_FAILED_ATTEMPTS = 4;

export interface VaultLockoutState {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

export interface VerifyVaultResult {
  success: boolean;
  error?: string;
  isLocked?: boolean;
  remainingSeconds?: number;
  attemptsLeft?: number;
}

/**
 * Validação segura da chave mestra via Server-Side API Route (/api/vault/verify)
 * Garante que a chave mestra NUNCA trafegue compilada em bundles JS do navegador.
 */
export async function verifyMasterKeyAsync(inputKey: string): Promise<VerifyVaultResult> {
  if (!inputKey || !inputKey.trim()) {
    return { success: false, error: "Insira a chave mestra de segurança." };
  }

  try {
    const res = await fetch("/api/vault/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: inputKey.trim() }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      if (data.token) {
        establishVaultSession(data.token, data.expiresAt);
      }
      clearVaultLockout();
      return { success: true };
    }

    // Se houve erro ou bloqueio
    if (data.isLocked) {
      recordServerLockout(data.remainingSeconds || 180);
    }

    return {
      success: false,
      error: data.error || "Chave mestra inválida.",
      isLocked: Boolean(data.isLocked),
      remainingSeconds: data.remainingSeconds || 0,
      attemptsLeft: data.attemptsLeft,
    };
  } catch (err) {
    console.error("Falha ao comunicar com o cofre de segurança:", err);
    return {
      success: false,
      error: "Falha de conexão com o servidor de segurança do cofre.",
    };
  }
}

/**
 * Retorna o status de bloqueio local por tentativas excessivas (Anti-Brute Force)
 */
export function getVaultLockoutState(): VaultLockoutState {
  if (typeof window === "undefined") {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_VAULT_ATTEMPTS);
    if (!raw) {
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && data.lockedUntil > now) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
    }

    if (data.lockedUntil && data.lockedUntil <= now) {
      localStorage.removeItem(STORAGE_KEY_VAULT_ATTEMPTS);
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }

    const attemptsUsed = Number(data.attempts) || 0;
    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - attemptsUsed);

    return { isLocked: false, remainingSeconds: 0, attemptsLeft };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }
}

/**
 * Registra bloqueio imposto pelo servidor
 */
export function recordServerLockout(seconds: number): void {
  if (typeof window === "undefined") return;
  try {
    const lockedUntil = Date.now() + seconds * 1000;
    localStorage.setItem(
      STORAGE_KEY_VAULT_ATTEMPTS,
      JSON.stringify({ attempts: MAX_FAILED_ATTEMPTS, lockedUntil })
    );
  } catch {}
}

/**
 * Limpa o histórico de bloqueio após autenticação bem-sucedida
 */
export function clearVaultLockout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_VAULT_ATTEMPTS);
  }
}

/**
 * Inicializa a sessão master autenticada
 */
export function establishVaultSession(token?: string, expiresAtMs?: number): void {
  if (typeof window === "undefined") return;

  const validToken = token || `vault_auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const sessionData = {
    token: validToken,
    establishedAt: Date.now(),
    expiresAt: expiresAtMs || Date.now() + 60 * 60 * 1000, // 1 hora de validade
  };

  try {
    sessionStorage.setItem(STORAGE_KEY_VAULT_SESSION, JSON.stringify(sessionData));
    document.cookie = `gymflow_vault_auth=${sessionData.token}; path=/; max-age=3600; SameSite=Strict`;
    clearVaultLockout();
  } catch (err) {
    console.warn("⚠️ [AdminVault] Falha ao persistir sessão:", err);
  }
}

/**
 * Verifica se a sessão do Super Admin está válida e ativa no navegador
 */
export function isVaultSessionActive(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_VAULT_SESSION);
    if (!raw) {
      // Tenta fallback com cookie
      const hasCookie = document.cookie.includes("gymflow_vault_auth=");
      return hasCookie;
    }

    const session = JSON.parse(raw);
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      destroyVaultSession();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Destrói a sessão e bloqueia o painel imediatamente
 */
export function destroyVaultSession(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(STORAGE_KEY_VAULT_SESSION);
    document.cookie = "gymflow_vault_auth=; path=/; max-age=0; SameSite=Strict";
  } catch (err) {
    console.warn("⚠️ [AdminVault] Erro ao destruir sessão:", err);
  }
}
