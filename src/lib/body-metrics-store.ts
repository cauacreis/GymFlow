/**
 * Body Metrics & Bioimpedance Store — GymFlow
 * Gerenciamento do histórico periódico de peso corporal, percentual de gordura (% BF),
 * massa magra, circunferências e composição corporal ao longo do tempo.
 */

import { getCurrentUser, saveUserProfile } from "./auth-store";
import {
  fetchBodyMetricsFromSupabase,
  upsertBodyMetricToSupabase,
  deleteBodyMetricFromSupabase,
} from "./supabase-service";

export interface BodyMetricEntry {
  id: string;
  date: string; // Formato YYYY-MM-DD (ex: "2026-09-11")
  dateFormatted: string; // Ex: "Set", "11/09"
  weight: number; // Peso total em kg (ex: 78.4)
  bodyFat: number; // % de Gordura corporal (ex: 13.8)
  muscleMass: number; // Massa magra em kg (ex: 38.6)
  fatMass?: number; // Massa gorda em kg (ex: 10.8)
  waistCm?: number; // Circunferência abdominal / cintura (cm)
  armCm?: number; // Braço contraído (cm)
  chestCm?: number; // Tórax (cm)
  thighCm?: number; // Coxa (cm)
  notes?: string; // Observações (ex: "Em jejum", "Avaliação InBody")
  createdAt: string;
}

export const STORAGE_KEY_METRICS = "gymflow_body_metrics_v1";
export const EVENT_BODY_METRICS = "gymflow:body-metrics-updated";

export const INITIAL_BODY_METRICS: BodyMetricEntry[] = [];

export function getBodyMetricsStorageKey(userId?: string): string {
  const resolved = userId || (typeof window !== "undefined" ? getCurrentUser()?.id : null);
  if (!resolved || resolved === "user_me") return STORAGE_KEY_METRICS;
  return `gymflow_body_metrics_${resolved}`;
}

/**
 * Retorna as medições cadastradas do usuário, ordenadas por data cronológica (da mais antiga para a mais recente)
 */
export function getStoredBodyMetrics(userId?: string): BodyMetricEntry[] {
  if (typeof window === "undefined") return INITIAL_BODY_METRICS;
  try {
    const storageKey = getBodyMetricsStorageKey(userId);
    let raw = localStorage.getItem(storageKey);
    if (!raw && storageKey !== STORAGE_KEY_METRICS) {
      // Verifica migração caso o usuário tenha dados no storage padrão
      const legacyRaw = localStorage.getItem(STORAGE_KEY_METRICS);
      if (legacyRaw) {
        raw = legacyRaw;
      }
    }
    if (!raw) {
      return [];
    }
    const parsed: BodyMetricEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const cleaned = parsed.filter((m) => !/^metric_[1-5]$/.test(m.id));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(storageKey, JSON.stringify(cleaned));
    }
    // Ordena da mais antiga para a mais recente (cronológico para gráficos)
    return cleaned.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch {
    return [];
  }
}

/**
 * Adiciona uma nova medição periódica de peso e bioimpedância
 */
export function addBodyMetric(
  data: Omit<BodyMetricEntry, "id" | "createdAt" | "dateFormatted"> & { dateFormatted?: string },
  userId?: string
): BodyMetricEntry {
  const current = getStoredBodyMetrics(userId);
  const storageKey = getBodyMetricsStorageKey(userId);
  const dateObj = new Date(data.date + "T12:00:00");
  const monthName = dateObj.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const dayNum = String(dateObj.getDate()).padStart(2, "0");
  const monthNum = String(dateObj.getMonth() + 1).padStart(2, "0");

  const formattedLabel = data.dateFormatted || `${dayNum}/${monthNum}`;

  // Calcula massas se não informadas
  const calculatedMuscleMass =
    data.muscleMass !== undefined && !isNaN(data.muscleMass) && data.muscleMass > 0
      ? data.muscleMass
      : Number((data.weight * (1 - data.bodyFat / 100)).toFixed(1));

  const calculatedFatMass =
    data.fatMass !== undefined && !isNaN(data.fatMass) && data.fatMass > 0
      ? data.fatMass
      : Number((data.weight * (data.bodyFat / 100)).toFixed(1));

  const newEntry: BodyMetricEntry = {
    ...data,
    id: `metric_${Date.now()}`,
    dateFormatted: formattedLabel,
    muscleMass: calculatedMuscleMass,
    fatMass: calculatedFatMass,
    createdAt: new Date().toLocaleDateString("pt-BR"),
  };

  const updated = [...current, newEntry].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Sincroniza o peso e gordura mais recentes no perfil geral do usuário
    const latest = updated[updated.length - 1];
    if (latest) {
      saveUserProfile({
        weight: latest.weight,
        bodyFat: latest.bodyFat,
      });
    }

    window.dispatchEvent(new Event(EVENT_BODY_METRICS));

    // Sincronização remota em background com o Supabase
    upsertBodyMetricToSupabase(newEntry, userId).catch(() => {});
  }

  return newEntry;
}

/**
 * Atualiza uma medição existente
 */
export function updateBodyMetric(id: string, updates: Partial<BodyMetricEntry>, userId?: string): void {
  const current = getStoredBodyMetrics(userId);
  const storageKey = getBodyMetricsStorageKey(userId);
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  const updatedItem = updated.find((it) => it.id === id);

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(updated));

    const latest = updated[updated.length - 1];
    if (latest) {
      saveUserProfile({
        weight: latest.weight,
        bodyFat: latest.bodyFat,
      });
    }

    window.dispatchEvent(new Event(EVENT_BODY_METRICS));

    if (updatedItem) {
      upsertBodyMetricToSupabase(updatedItem, userId).catch(() => {});
    }
  }
}

/**
 * Remove uma medição
 */
export function deleteBodyMetric(id: string, userId?: string): void {
  const current = getStoredBodyMetrics(userId);
  const storageKey = getBodyMetricsStorageKey(userId);
  const updated = current.filter((item) => item.id !== id);

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(updated));

    const latest = updated[updated.length - 1];
    if (latest) {
      saveUserProfile({
        weight: latest.weight,
        bodyFat: latest.bodyFat,
      });
    }

    window.dispatchEvent(new Event(EVENT_BODY_METRICS));

    deleteBodyMetricFromSupabase(id).catch(() => {});
  }
}

/**
 * Calcula o IMC e retorna o valor e a classificação
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: "Abaixo do peso" | "Normal / Saudável" | "Sobrepeso" | "Obesidade";
  color: string;
} {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return { bmi: 0, category: "Normal / Saudável", color: "text-emerald-400" };
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 18.5) {
    return { bmi, category: "Abaixo do peso", color: "text-amber-400" };
  } else if (bmi < 25.0) {
    return { bmi, category: "Normal / Saudável", color: "text-emerald-400" };
  } else if (bmi < 30.0) {
    return { bmi, category: "Sobrepeso", color: "text-amber-400" };
  } else {
    return { bmi, category: "Obesidade", color: "text-rose-400" };
  }
}

/**
 * Escuta reativa de mudanças nas medições corporais
 */
export function subscribeToBodyMetrics(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_BODY_METRICS, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_BODY_METRICS, callback);
    window.removeEventListener("storage", callback);
  };
}
