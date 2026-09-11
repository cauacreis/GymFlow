/**
 * GymFlow Device Lockout & Anti-Abuse System
 * - Impede criação de mais de uma conta por dispositivo físico
 * - Impede múltiplos resgates de 7 dias grátis (Trial) no mesmo aparelho
 * - Garante integridade de e-mails únicos
 */

import { getDeviceFingerprint } from "./device-fingerprint";
import { getSupabase } from "./supabase";

export interface DeviceRecord {
  deviceId: string;
  registeredEmail: string;
  registeredUserId?: string;
  accountCreatedAt: string;
  trialUsed: boolean;
  trialUsedAt?: string;
  subscriptionPlan?: string;
  lastLoginAt: string;
}

const STORAGE_KEY_REGISTRY = "gymflow_device_registry_v2";

// Recupera a lista de registros de dispositivos
export function getStoredDeviceRecords(): Record<string, DeviceRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Salva registros de dispositivos
function saveStoredDeviceRecords(records: Record<string, DeviceRecord>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(records));
  } catch (err) {
    console.error("Erro ao salvar registros de dispositivos:", err);
  }
}

/**
 * Verifica se um novo cadastro é permitido neste dispositivo e com este e-mail.
 * Retorna { allowed: true } ou { allowed: false, reason: string, registeredEmail?: string }
 */
export async function canRegisterAccountOnDevice(
  email: string
): Promise<{ allowed: boolean; reason?: string; registeredEmail?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const deviceId = await getDeviceFingerprint();
  const records = getStoredDeviceRecords();

  // 1. Checagem de e-mail duplicado
  const existingWithEmail = Object.values(records).find(
    (r) => r.registeredEmail.toLowerCase() === normalizedEmail
  );
  if (existingWithEmail) {
    return {
      allowed: false,
      reason: "Este e-mail já possui uma conta cadastrada no GymFlow. Por favor, faça login com suas credenciais.",
      registeredEmail: existingWithEmail.registeredEmail,
    };
  }

  // 2. Checagem de dispositivo já registrado
  const existingDeviceRecord = records[deviceId];
  if (existingDeviceRecord && existingDeviceRecord.registeredEmail) {
    const emailParts = existingDeviceRecord.registeredEmail.split("@");
    const maskedUser =
      emailParts[0].length > 3
        ? `${emailParts[0].slice(0, 3)}***`
        : `${emailParts[0].slice(0, 1)}***`;
    const maskedEmail = `${maskedUser}@${emailParts[1] || ""}`;

    return {
      allowed: false,
      reason: `Este dispositivo já possui uma conta cadastrada (${maskedEmail}). Por políticas de segurança e prevenção de fraudes, permitimos apenas 1 conta por aparelho.`,
      registeredEmail: existingDeviceRecord.registeredEmail,
    };
  }

  // 3. Checagem remota no Supabase (se configurado)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("device_registrations")
        .select("device_id, registered_email")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (!error && data && data.registered_email) {
        return {
          allowed: false,
          reason: `Este dispositivo já está vinculado a outra conta. Faça login para continuar.`,
          registeredEmail: data.registered_email,
        };
      }
    } catch {
      // Falha de rede não impede o fluxo se o cache local estiver limpo
    }
  }

  return { allowed: true };
}

/**
 * Registra formalmente o vínculo do dispositivo à nova conta criada
 */
export async function registerDeviceAccount(params: {
  email: string;
  userId: string;
  trialUsed?: boolean;
  plan?: string;
}): Promise<void> {
  const deviceId = await getDeviceFingerprint();
  const records = getStoredDeviceRecords();
  const now = new Date().toISOString();

  const record: DeviceRecord = {
    deviceId,
    registeredEmail: params.email.trim().toLowerCase(),
    registeredUserId: params.userId,
    accountCreatedAt: now,
    trialUsed: Boolean(params.trialUsed),
    trialUsedAt: params.trialUsed ? now : undefined,
    subscriptionPlan: params.plan || "pending_choice",
    lastLoginAt: now,
  };

  records[deviceId] = record;
  saveStoredDeviceRecords(records);

  // Tenta sincronizar com Supabase se a tabela existir
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("device_registrations").upsert({
        device_id: deviceId,
        registered_email: record.registeredEmail,
        user_id: params.userId,
        trial_used: record.trialUsed,
        subscription_plan: record.subscriptionPlan,
        updated_at: now,
      });
    } catch {
      // Ignora silenciosamente se offline ou tabela ainda não migrada
    }
  }
}

/**
 * Checa se o dispositivo atual tem direito ao teste de 7 dias grátis (Trial).
 * Se o aparelho já resgatou o trial antes, retorna false.
 */
export async function isTrialAvailableForDevice(): Promise<boolean> {
  const deviceId = await getDeviceFingerprint();
  const records = getStoredDeviceRecords();
  const record = records[deviceId];

  if (record && record.trialUsed) {
    return false;
  }

  // Verifica Supabase se disponível
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("device_registrations")
        .select("trial_used")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (!error && data && data.trial_used) {
        return false;
      }
    } catch {}
  }

  return true;
}

/**
 * Marca o trial de 7 dias como resgatado pelo dispositivo atual
 */
export async function markTrialAsUsedOnDevice(): Promise<void> {
  const deviceId = await getDeviceFingerprint();
  const records = getStoredDeviceRecords();
  const now = new Date().toISOString();

  if (records[deviceId]) {
    records[deviceId].trialUsed = true;
    records[deviceId].trialUsedAt = now;
  } else {
    records[deviceId] = {
      deviceId,
      registeredEmail: "",
      accountCreatedAt: now,
      trialUsed: true,
      trialUsedAt: now,
      lastLoginAt: now,
    };
  }

  saveStoredDeviceRecords(records);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from("device_registrations")
        .update({ trial_used: true, updated_at: now })
        .eq("device_id", deviceId);
    } catch {}
  }
}
