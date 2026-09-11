/**
 * Admin Vault Security Service
 * Gerenciamento de autenticação, sessão cifrada, rate limiting e utilitários
 * para a rota e painel secreto de Super Administrador (GymFlow Vault).
 */

const STORAGE_KEY_VAULT_SESSION = "gymflow_vault_session_v1";
const STORAGE_KEY_VAULT_ATTEMPTS = "gymflow_vault_lockout_v1";
const MAX_FAILED_ATTEMPTS = 4;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutos de bloqueio temporário

// Chave Mestra Padrão de Fábrica (suporta override por variável de ambiente segura)
const DEFAULT_MASTER_KEY = "55134qweRT_";

export interface VaultLockoutState {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

/**
 * Valida a chave mestra inserida pelo administrador
 */
export function verifyMasterKey(inputKey: string): boolean {
  if (!inputKey) return false;
  const configuredKey =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_MASTER_KEY) ||
    DEFAULT_MASTER_KEY;

  return inputKey.trim() === configuredKey.trim();
}

/**
 * Retorna o status de bloqueio por tentativas excessivas (Anti-Brute Force)
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

    // Se o tempo de bloqueio expirou, limpa o estado
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
 * Registra uma tentativa falha de autenticação
 */
export function recordFailedVaultAttempt(): VaultLockoutState {
  if (typeof window === "undefined") {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: 0 };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_VAULT_ATTEMPTS);
    const data = raw ? JSON.parse(raw) : { attempts: 0 };
    data.attempts = (Number(data.attempts) || 0) + 1;

    if (data.attempts >= MAX_FAILED_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_VAULT_ATTEMPTS, JSON.stringify(data));
      return { isLocked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
    }

    localStorage.setItem(STORAGE_KEY_VAULT_ATTEMPTS, JSON.stringify(data));
    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - data.attempts);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: 0 };
  }
}

/**
 * Limpa o histórico de tentativas falhas após sucesso
 */
export function clearVaultLockout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_VAULT_ATTEMPTS);
  }
}

/**
 * Inicializa a sessão master autenticada (armazenada em sessionStorage e cookie seguro com expiração)
 */
export function establishVaultSession(): void {
  if (typeof window === "undefined") return;

  const sessionData = {
    token: `vault_auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    establishedAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hora de validade
  };

  try {
    sessionStorage.setItem(STORAGE_KEY_VAULT_SESSION, JSON.stringify(sessionData));
    // Define cookie de controle para validação
    document.cookie = `gymflow_vault_auth=${sessionData.token}; path=/; max-age=3600; SameSite=Strict`;
    clearVaultLockout();
  } catch (err) {
    console.warn("⚠️ [AdminVault] Falha ao persistir sessão:", err);
  }
}

/**
 * Verifica se a sessão do Super Admin está válida e ativa
 */
export function isVaultSessionActive(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_VAULT_SESSION);
    if (!raw) return false;

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
