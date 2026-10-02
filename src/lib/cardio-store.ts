/**
 * Cardio Activity & Aerobic Evolution Store — GymFlow
 * Gerenciamento 100% real e reativo do histórico de treinos cardiovasculares,
 * queima calórica acumulada, distribuição de modalidades e cálculos semanais.
 */

import { getCurrentUser } from "./auth-store";
import { CardioType, CARDIO_TYPES_METADATA } from "./exercisedb";
import {
  awardBadgeProgress,
  getAllGamificationBadges,
  recordWorkoutAttendanceDate,
} from "./gamification-service";
import {
  fetchCardioSessionsFromSupabase,
  upsertCardioSessionToSupabase,
  deleteCardioSessionFromSupabase,
} from "./supabase-service";

export interface CardioSessionLog {
  id: string;
  studentId: string;
  title: string;
  modality: CardioType | string;
  modalityLabel: string;
  durationMinutes: number;
  actualSeconds?: number;
  actualCalories: number;
  intensity?: "leve" | "moderada" | "alta" | "hiit";
  source?: "workout_sheet" | "timer" | "on_demand_class" | "manual";
  completedAt: string; // ISO string
  speedKmh?: number;
  inclinePercent?: number;
  notes?: string;
}

export interface CardioDayStat {
  day: string; // "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"
  dateKey: string; // YYYY-MM-DD
  formattedDate: string; // DD/MM
  minutos: number;
  calorias: number;
  modalidades: string[];
}

export interface ModalityDistributionItem {
  name: string;
  key: string;
  percent: number;
  calorias: number;
  minutos: number;
  color: string;
}

export interface WeeklyCardioStats {
  days: CardioDayStat[];
  totalMinutesThisWeek: number;
  totalCaloriesThisWeek: number;
  targetWeeklyMinutes: number;
  weeklyGoalPercent: number;
  totalLifetimeCalories: number;
  totalLifetimeMinutes: number;
  totalSessionsCount: number;
  modalitiesDistribution: ModalityDistributionItem[];
  aerobicLevel: {
    title: string;
    description: string;
    tier: "bronze" | "prata" | "ouro" | "diamante";
    color: string;
  };
  cardioBadgeInfo: {
    currentTier: string;
    nextTierName: string;
    neededKcal: number;
    progressPercent: number;
    currentProgress: number;
    targetProgress: number;
  };
}

export const STORAGE_KEY_CARDIO = "gymflow_cardio_sessions_history_v2";
export const EVENT_CARDIO_UPDATED = "gymflow:cardio-history-updated";

const MODALITY_COLORS: Record<string, string> = {
  esteira_corrida: "#10b981", // Esmeralda
  esteira_inclinada: "#f97316", // Laranja
  bicicleta: "#06b6d4", // Ciano
  eliptico: "#6366f1", // Índigo
  escada: "#f59e0b", // Âmbar
  corda: "#ef4444", // Vermelho
  hiit: "#a855f7", // Roxo
  remo: "#0ea5e9", // Sky
  caminhada: "#14b8a6", // Teal
  aula_coletiva: "#f43f5e", // Rosa
  outro: "#71717a", // Cinza
};

export function getCardioStorageKey(userId?: string): string {
  const resolved = userId || (typeof window !== "undefined" ? getCurrentUser()?.id : null);
  if (!resolved || resolved === "user_me") return STORAGE_KEY_CARDIO;
  return `gymflow_cardio_sessions_${resolved}`;
}

/**
 * Retorna as sessões de cardio reais gravadas para o usuário
 */
export function getStoredCardioSessions(userId?: string): CardioSessionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getCardioStorageKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw && key !== STORAGE_KEY_CARDIO) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY_CARDIO);
      if (legacyRaw) {
        raw = legacyRaw;
      }
    }
    if (!raw) {
      return [];
    }
    const parsed: CardioSessionLog[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  } catch {
    return [];
  }
}

export type SaveCardioSessionInput = Partial<CardioSessionLog> & {
  title?: string;
  modality?: CardioType | string;
  modalityLabel?: string;
  durationMinutes?: number;
  actualCalories?: number;
};

/**
 * Salva uma nova sessão de cardio real e atualiza o progresso de gamificação
 */
export function saveCardioSession(
  session: SaveCardioSessionInput,
  userId?: string
): CardioSessionLog {
  const currentUserId = userId || session.studentId || (typeof window !== "undefined" ? getCurrentUser()?.id : "student_carlos") || "student_carlos";
  const finalId = session.id || `cardio_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const meta = CARDIO_TYPES_METADATA[session.modality as CardioType];
  const resolvedLabel = session.modalityLabel || meta?.label || session.title || "Cárdio";

  const durMin = Math.max(1, Math.round(session.durationMinutes || (session.actualSeconds ? session.actualSeconds / 60 : 15)));
  const actualSec = session.actualSeconds || durMin * 60;

  const newLog: CardioSessionLog = {
    id: finalId,
    studentId: session.studentId || currentUserId,
    title: session.title || resolvedLabel,
    modality: session.modality || "esteira_corrida",
    modalityLabel: resolvedLabel,
    durationMinutes: durMin,
    actualSeconds: actualSec,
    actualCalories: Math.max(1, Math.round(session.actualCalories || 100)),
    intensity: session.intensity || "moderada",
    source: session.source || "manual",
    completedAt: session.completedAt || new Date().toISOString(),
    speedKmh: session.speedKmh,
    inclinePercent: session.inclinePercent,
    notes: session.notes,
  };

  if (typeof window !== "undefined") {
    try {
      const key = getCardioStorageKey(currentUserId);
      const existing = getStoredCardioSessions(currentUserId);
      const filtered = existing.filter((s) => s.id !== newLog.id);
      const updated = [newLog, ...filtered];
      localStorage.setItem(key, JSON.stringify(updated));

      // Dispara evento reativo para todos os componentes ouvintes
      window.dispatchEvent(new CustomEvent(EVENT_CARDIO_UPDATED, { detail: newLog }));

      // Sincronização remota em background no Supabase
      upsertCardioSessionToSupabase(newLog, currentUserId).catch(() => {});
    } catch {}

    // Sincroniza com a insígnia Mestre do Cárdio, Centurião e Ofensiva de Treino
    try {
      awardBadgeProgress("cardio-master", newLog.actualCalories, {
        reason: `ao completar ${newLog.durationMinutes} min de ${newLog.modalityLabel} (${newLog.actualCalories} kcal)`,
      });
      awardBadgeProgress("century-club", 1, {
        reason: `ao concluir sessão de ${newLog.modalityLabel}`,
      });
      recordWorkoutAttendanceDate(undefined, currentUserId, false);
    } catch {}
  }

  return newLog;
}

/**
 * Remove uma sessão de cardio gravada
 */
export function deleteCardioSession(sessionId: string, userId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const currentUserId = userId || getCurrentUser()?.id;
    const key = getCardioStorageKey(currentUserId);
    const existing = getStoredCardioSessions(currentUserId);
    const updated = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_CARDIO_UPDATED));

    deleteCardioSessionFromSupabase(sessionId).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Formata data no formato YYYY-MM-DD
 */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calcula todas as estatísticas consolidadas e 100% dinâmicas da semana e all-time
 */
export function calculateRealWeeklyCardioStats(userId?: string): WeeklyCardioStats {
  const sessions = getStoredCardioSessions(userId);
  const now = new Date();

  // Encontra o início da semana atual (Segunda-feira)
  const currentDayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sáb
  const distanceToMonday = (currentDayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const days: CardioDayStat[] = [];
  const weekDateKeys = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + i);
    const dateKey = toDateKey(targetDate);
    weekDateKeys.add(dateKey);

    const formattedDate = `${String(targetDate.getDate()).padStart(2, "0")}/${String(
      targetDate.getMonth() + 1
    ).padStart(2, "0")}`;

    // Filtra sessões deste dia
    const daySessions = sessions.filter((s) => {
      const sDate = new Date(s.completedAt);
      return toDateKey(sDate) === dateKey;
    });

    const minutos = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const calorias = daySessions.reduce((acc, s) => acc + (s.actualCalories || 0), 0);
    const modalidades = Array.from(new Set(daySessions.map((s) => s.modalityLabel || s.title)));

    days.push({
      day: dayNames[i],
      dateKey,
      formattedDate,
      minutos,
      calorias,
      modalidades,
    });
  }

  // Sessões da semana corrente
  const thisWeekSessions = sessions.filter((s) => {
    const sDate = new Date(s.completedAt);
    return weekDateKeys.has(toDateKey(sDate));
  });

  const totalMinutesThisWeek = thisWeekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalCaloriesThisWeek = thisWeekSessions.reduce((acc, s) => acc + (s.actualCalories || 0), 0);
  const targetWeeklyMinutes = 150; // Padrão OMS
  const weeklyGoalPercent = Math.min(100, Math.round((totalMinutesThisWeek / targetWeeklyMinutes) * 100));

  const totalLifetimeCalories = sessions.reduce((acc, s) => acc + (s.actualCalories || 0), 0);
  const totalLifetimeMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalSessionsCount = sessions.length;

  // Distribuição por modalidades (utiliza semana ou todo histórico se a semana tiver poucas)
  const distributionSource = thisWeekSessions.length > 0 ? thisWeekSessions : sessions;
  const modalityGroupMap: Record<string, { calorias: number; minutos: number; name: string }> = {};

  distributionSource.forEach((s) => {
    const key = (s.modality || "outro").toLowerCase();
    const meta = CARDIO_TYPES_METADATA[key as CardioType];
    const name = meta?.label || s.modalityLabel || s.title || "Outro";

    if (!modalityGroupMap[key]) {
      modalityGroupMap[key] = { calorias: 0, minutos: 0, name };
    }
    modalityGroupMap[key].calorias += s.actualCalories || 0;
    modalityGroupMap[key].minutos += s.durationMinutes || 0;
  });

  const totalDistCalories = Object.values(modalityGroupMap).reduce((acc, m) => acc + m.calorias, 0);

  let modalitiesDistribution: ModalityDistributionItem[] = Object.entries(modalityGroupMap).map(
    ([key, val]) => ({
      key,
      name: val.name,
      calorias: val.calorias,
      minutos: val.minutos,
      percent: totalDistCalories > 0 ? Math.round((val.calorias / totalDistCalories) * 100) : 0,
      color: MODALITY_COLORS[key] || "#71717a",
    })
  );

  // Ordena por calorias decrescente
  modalitiesDistribution.sort((a, b) => b.calorias - a.calorias);

  // Se vazio, entrega modalidades padrão com 0% para layout impecável
  if (modalitiesDistribution.length === 0) {
    modalitiesDistribution = [
      { name: "Esteira (Corrida)", key: "esteira_corrida", percent: 0, calorias: 0, minutos: 0, color: "#10b981" },
      { name: "Simulador de Escada", key: "escada", percent: 0, calorias: 0, minutos: 0, color: "#f59e0b" },
      { name: "Bicicleta Ergométrica", key: "bicicleta", percent: 0, calorias: 0, minutos: 0, color: "#06b6d4" },
      { name: "HIIT & Corda", key: "hiit", percent: 0, calorias: 0, minutos: 0, color: "#a855f7" },
    ];
  }

  // Nível Aeróbico Dinâmico
  let aerobicLevel: WeeklyCardioStats["aerobicLevel"];
  if (totalLifetimeCalories < 500) {
    aerobicLevel = {
      title: "Iniciante Aeróbico",
      description: "Construindo base cardiovascular e adaptação mitocondrial.",
      tier: "bronze",
      color: "#d97706",
    };
  } else if (totalLifetimeCalories < 1500) {
    aerobicLevel = {
      title: "Ritmo Constante",
      description: "Excelente regularidade aeróbica e otimização do VO2.",
      tier: "bronze",
      color: "#d97706",
    };
  } else if (totalLifetimeCalories < 3000) {
    aerobicLevel = {
      title: "Coração de Ferro",
      description: "Resistência avançada com recuperação muscular acelerada.",
      tier: "prata",
      color: "#94a3b8",
    };
  } else if (totalLifetimeCalories < 6000) {
    aerobicLevel = {
      title: "Pulmões de Aço",
      description: "Capacidade cardiorrespiratória de alta performance atlética.",
      tier: "ouro",
      color: "#eab308",
    };
  } else {
    aerobicLevel = {
      title: "Titã Cardiovascular",
      description: "Nível lendário de eficiência energética e condicionamento.",
      tier: "diamante",
      color: "#38bdf8",
    };
  }

  // Busca dados reais da badge Mestre do Cárdio
  const allBadges = getAllGamificationBadges("student");
  const cardioBadge = allBadges.find((b) => b.id === "cardio-master");

  let currentTier = "Bronze 🥉";
  let nextTierName = "Nível 1 • Bronze";
  let currentProgress = totalLifetimeCalories;
  let targetProgress = 1000;
  let neededKcal = 1000;
  let progressPercent = 0;

  if (cardioBadge) {
    currentProgress = cardioBadge.currentProgress;
    targetProgress = cardioBadge.targetProgress || 1000;
    neededKcal = Math.max(0, targetProgress - currentProgress);
    progressPercent = Math.min(100, Math.round((currentProgress / targetProgress) * 100));

    const nextLevelNum = (cardioBadge.currentLevel || 0) + 1;
    const nextLevelInfo = cardioBadge.levels.find((l) => l.level === nextLevelNum) || cardioBadge.levels[0];
    if (nextLevelInfo) {
      nextTierName = `Nível ${nextLevelInfo.level} • ${nextLevelInfo.tier.charAt(0).toUpperCase() + nextLevelInfo.tier.slice(1)}`;
    }
    const curLevelInfo = cardioBadge.levels.find((l) => l.level === cardioBadge.currentLevel);
    if (curLevelInfo) {
      currentTier = `${curLevelInfo.title} (${curLevelInfo.tier.toUpperCase()})`;
    }
  }

  return {
    days,
    totalMinutesThisWeek,
    totalCaloriesThisWeek,
    targetWeeklyMinutes,
    weeklyGoalPercent,
    totalLifetimeCalories,
    totalLifetimeMinutes,
    totalSessionsCount,
    modalitiesDistribution,
    aerobicLevel,
    cardioBadgeInfo: {
      currentTier,
      nextTierName,
      neededKcal,
      progressPercent,
      currentProgress,
      targetProgress,
    },
  };
}

/**
 * Escuta atualizações no histórico de cárdio
 */
export function subscribeToCardioHistory(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_CARDIO_UPDATED, callback);
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.includes("gymflow_cardio_sessions")) {
      callback();
    }
  });
  return () => {
    window.removeEventListener(EVENT_CARDIO_UPDATED, callback);
  };
}
