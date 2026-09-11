/**
 * Body Metrics & Bioimpedance Store — GymFlow
 * Gerenciamento do histórico periódico de peso corporal, percentual de gordura (% BF),
 * massa magra, circunferências e composição corporal ao longo do tempo.
 */

import { getCurrentUser, saveUserProfile } from "./auth-store";

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

const STORAGE_KEY_METRICS = "gymflow_body_metrics_v1";
const EVENT_BODY_METRICS = "gymflow:body-metrics-updated";

// Dados iniciais realistas para o aluno ter um histórico visual imediato
export const INITIAL_BODY_METRICS: BodyMetricEntry[] = [
  {
    id: "metric_1",
    date: "2026-05-15",
    dateFormatted: "Mai",
    weight: 82.5,
    bodyFat: 17.2,
    muscleMass: 36.8,
    fatMass: 14.2,
    waistCm: 86.0,
    armCm: 35.5,
    notes: "Avaliação inicial na academia",
    createdAt: "15/05/2026",
  },
  {
    id: "metric_2",
    date: "2026-06-15",
    dateFormatted: "Jun",
    weight: 81.2,
    bodyFat: 16.0,
    muscleMass: 37.2,
    fatMass: 13.0,
    waistCm: 84.5,
    armCm: 36.0,
    notes: "Primeiro mês de treino e dieta",
    createdAt: "15/06/2026",
  },
  {
    id: "metric_3",
    date: "2026-07-15",
    dateFormatted: "Jul",
    weight: 80.0,
    bodyFat: 15.1,
    muscleMass: 37.8,
    fatMass: 12.1,
    waistCm: 83.0,
    armCm: 36.5,
    notes: "Ajuste na carga dos treinos",
    createdAt: "15/07/2026",
  },
  {
    id: "metric_4",
    date: "2026-08-15",
    dateFormatted: "Ago",
    weight: 79.1,
    bodyFat: 14.4,
    muscleMass: 38.2,
    fatMass: 11.4,
    waistCm: 81.5,
    armCm: 37.0,
    notes: "Recomposição acelerada",
    createdAt: "15/08/2026",
  },
  {
    id: "metric_5",
    date: "2026-09-08",
    dateFormatted: "Set",
    weight: 78.4,
    bodyFat: 13.8,
    muscleMass: 38.6,
    fatMass: 10.8,
    waistCm: 80.0,
    armCm: 37.5,
    notes: "Medição atual em jejum",
    createdAt: "08/09/2026",
  },
];

/**
 * Retorna as medições cadastradas, ordenadas por data cronológica (da mais antiga para a mais recente)
 */
export function getStoredBodyMetrics(): BodyMetricEntry[] {
  if (typeof window === "undefined") return INITIAL_BODY_METRICS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_METRICS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(INITIAL_BODY_METRICS));
      return INITIAL_BODY_METRICS;
    }
    const parsed: BodyMetricEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(INITIAL_BODY_METRICS));
      return INITIAL_BODY_METRICS;
    }
    // Ordena da mais antiga para a mais recente (cronológico para gráficos)
    return parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch {
    return INITIAL_BODY_METRICS;
  }
}

/**
 * Adiciona uma nova medição periódica de peso e bioimpedância
 */
export function addBodyMetric(
  data: Omit<BodyMetricEntry, "id" | "createdAt" | "dateFormatted"> & { dateFormatted?: string }
): BodyMetricEntry {
  const current = getStoredBodyMetrics();
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
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(updated));

    // Sincroniza o peso e gordura mais recentes no perfil geral do usuário
    const latest = updated[updated.length - 1];
    if (latest) {
      saveUserProfile({
        weight: latest.weight,
        bodyFat: latest.bodyFat,
      });
    }

    window.dispatchEvent(new Event(EVENT_BODY_METRICS));
  }

  return newEntry;
}

/**
 * Atualiza uma medição existente
 */
export function updateBodyMetric(id: string, updates: Partial<BodyMetricEntry>): void {
  const current = getStoredBodyMetrics();
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(updated));

    const latest = updated[updated.length - 1];
    if (latest) {
      saveUserProfile({
        weight: latest.weight,
        bodyFat: latest.bodyFat,
      });
    }

    window.dispatchEvent(new Event(EVENT_BODY_METRICS));
  }
}

/**
 * Remove uma medição
 */
export function deleteBodyMetric(id: string): void {
  const current = getStoredBodyMetrics();
  const updated = current.filter((item) => item.id !== id);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(updated));

    const latest = updated[updated.length - 1];
    if (latest) {
      saveUserProfile({
        weight: latest.weight,
        bodyFat: latest.bodyFat,
      });
    }

    window.dispatchEvent(new Event(EVENT_BODY_METRICS));
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
