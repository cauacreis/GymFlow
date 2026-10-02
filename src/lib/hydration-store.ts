/**
 * GymFlow Hydration Store
 * Gerencia o registro diário de ingestão de água (ml), metas saudáveis
 * e acionamento automático da conquista "Hidratação de Titã" (hydro-titan).
 */

import { awardBadgeProgress } from "./gamification-service";
import { getLocalDateKey } from "./streak-service";

export interface DailyHydrationRecord {
  date: string; // YYYY-MM-DD
  totalMl: number;
  targetMl: number;
  logs: {
    id: string;
    amountMl: number;
    timestamp: string;
  }[];
  goalReached: boolean;
}

const STORAGE_KEY_HYDRATION = "gymflow_hydration_records_v1";
export const EVENT_HYDRATION_UPDATED = "gymflow:hydration-updated";
export const DAILY_WATER_TARGET_ML = 3000; // 3 Litros diários

/**
 * Retorna todos os registros de hidratação armazenados
 */
export function getStoredHydrationRecords(userId?: string): Record<string, DailyHydrationRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_HYDRATION}_${userId || "current"}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Retorna o registro de hidratação do dia especificado (ou de hoje)
 */
export function getTodayHydration(userId?: string, dateKey?: string): DailyHydrationRecord {
  const targetDate = dateKey || getLocalDateKey(new Date());
  const records = getStoredHydrationRecords(userId);

  if (records[targetDate]) {
    return records[targetDate];
  }

  return {
    date: targetDate,
    totalMl: 0,
    targetMl: DAILY_WATER_TARGET_ML,
    logs: [],
    goalReached: false,
  };
}

/**
 * Registra consumo de água (ex: +250ml, +500ml, +1000ml)
 */
export function addWaterIntake(
  amountMl: number,
  userId?: string,
  customDate?: string
): DailyHydrationRecord {
  if (typeof window === "undefined" || amountMl <= 0) {
    return getTodayHydration(userId, customDate);
  }

  const targetDate = customDate || getLocalDateKey(new Date());
  const records = getStoredHydrationRecords(userId);
  const current = records[targetDate] || {
    date: targetDate,
    totalMl: 0,
    targetMl: DAILY_WATER_TARGET_ML,
    logs: [],
    goalReached: false,
  };

  const wasGoalReachedBefore = current.goalReached;
  const newTotal = current.totalMl + amountMl;
  const isGoalReachedNow = newTotal >= current.targetMl;

  current.totalMl = newTotal;
  current.goalReached = isGoalReachedNow;
  current.logs.push({
    id: `water_${Date.now()}`,
    amountMl,
    timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  });

  records[targetDate] = current;

  try {
    localStorage.setItem(`${STORAGE_KEY_HYDRATION}_${userId || "current"}`, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(EVENT_HYDRATION_UPDATED, { detail: current }));
  } catch {}

  // Se bateu a meta de 3 Litros pela primeira vez hoje, avança a conquista "Hidratação de Titã"
  if (isGoalReachedNow && !wasGoalReachedBefore) {
    awardBadgeProgress("hydro-titan", 1, {
      reason: `ao atingir a meta diária de ${DAILY_WATER_TARGET_ML / 1000}L de água hoje`,
    });
  }

  return current;
}

/**
 * Reseta ou define a meta diária personalizada (ml)
 */
export function setDailyWaterTarget(targetMl: number, userId?: string): void {
  if (typeof window === "undefined" || targetMl < 500) return;
  const today = getTodayHydration(userId);
  today.targetMl = targetMl;
  today.goalReached = today.totalMl >= targetMl;

  const records = getStoredHydrationRecords(userId);
  records[today.date] = today;

  try {
    localStorage.setItem(`${STORAGE_KEY_HYDRATION}_${userId || "current"}`, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(EVENT_HYDRATION_UPDATED, { detail: today }));
  } catch {}
}
