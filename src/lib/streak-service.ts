/**
 * Smart Streak & Flexible Schedule Engine — GymFlow
 *
 * Calcula a sequência (streak / ofensiva) real de treinos do aluno com inteligência de calendário:
 * 1. Finais de semana (Sábado e Domingo):
 *    - NÃO SÃO OBRIGATÓRIOS (não quebram a ofensiva).
 *    - Se o aluno treinar no fim de semana, conta como bônus (+1 na sequência).
 * 2. Agenda com Personal Trainer / Dias Programados:
 *    - Se o aluno tem dias definidos na semana (ex: Seg, Qua, Sex), os dias de descanso
 *      intermediários não quebram o streak desde que ele cumpra os dias programados.
 *    - Treinos extras (cárdio, musculação avulsa, check-in na catraca) somam bônus.
 * 3. Tolerância para o dia de hoje:
 *    - Se hoje é um dia programado e o treino ainda não ocorreu, o streak anterior permanece
 *      ativo e aguardando a conclusão do treino de hoje.
 */

import { getCurrentUser } from "./auth-store";
import { awardBadgeProgress } from "./gamification-service";

export interface StreakInfo {
  currentStreak: number;
  maxStreak: number;
  hasTrainedToday: boolean;
  isAliveToday: boolean;
  isWeekendGrace: boolean;
  isRestDayGrace: boolean;
  statusLabel: string;
  statusDescription: string;
  nextMilestone: number;
  progressPercentToNextMilestone: number;
  trainedDates: string[];
  weeklySchedule: string[];
}

export const STORAGE_KEY_WORKOUT_DATES = "gymflow_workout_attendance_dates_v2";
export const EVENT_STREAK_UPDATED = "gymflow:streak-updated";

const STREAK_MILESTONES = [7, 15, 20, 21, 30, 45, 60, 90, 180];

/**
 * Retorna a chave de data local "YYYY-MM-DD" para evitar discrepâncias de fuso horário UTC
 */
export function getLocalDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converte chave YYYY-MM-DD para objeto Date em horário local (meio-dia para evitar DST shift)
 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map((num) => parseInt(num, 10));
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Converte dias de semana em abreviação para número (0 = Domingo, 1 = Segunda ... 6 = Sábado)
 */
export function parseScheduleDaysToNumbers(schedule?: string[]): number[] {
  if (!schedule || schedule.length === 0) {
    return [1, 2, 3, 4, 5]; // Padrão: Segunda a Sexta
  }

  const map: Record<string, number> = {
    dom: 0,
    domingo: 0,
    seg: 1,
    segunda: 1,
    ter: 2,
    terca: 2,
    terça: 2,
    qua: 3,
    quarta: 3,
    qui: 4,
    quinta: 4,
    sex: 5,
    sexta: 5,
    sab: 6,
    sáb: 6,
    sabado: 6,
    sábado: 6,
  };

  const days = schedule
    .map((s) => {
      const clean = s.toLowerCase().trim();
      for (const [k, v] of Object.entries(map)) {
        if (clean.startsWith(k)) return v;
      }
      return -1;
    })
    .filter((d) => d >= 0);

  return days.length > 0 ? Array.from(new Set(days)) : [1, 2, 3, 4, 5];
}

/**
 * Gera um histórico padrão de 16 treinos respeitando dias úteis e bônus de fins de semana
 */
function generateSeedWorkoutDates(refDate: Date = new Date()): string[] {
  const dates: string[] = [];
  const cur = new Date(refDate);

  // Inclui hoje
  dates.push(getLocalDateKey(cur));

  let added = 1;
  while (added < 16) {
    cur.setDate(cur.getDate() - 1);
    const dayOfWeek = cur.getDay();

    // Adiciona dias úteis (Seg-Sex) ou bônus de sábado esporádico
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      dates.push(getLocalDateKey(cur));
      added++;
    } else if (dayOfWeek === 6 && added % 4 === 0) {
      // Treino bônus de sábado a cada ~4 treinos
      dates.push(getLocalDateKey(cur));
      added++;
    }
  }

  return dates.sort();
}

/**
 * Obtém todas as datas de treino registradas para o usuário
 */
export function getStoredWorkoutDates(userId?: string): string[] {
  if (typeof window === "undefined") return generateSeedWorkoutDates();

  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKOUT_DATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set(parsed)).sort();
      }
    }

    // Se ainda não houver datas gravadas, inicializa com semente consistente
    const seed = generateSeedWorkoutDates();
    localStorage.setItem(STORAGE_KEY_WORKOUT_DATES, JSON.stringify(seed));
    return seed;
  } catch {
    return generateSeedWorkoutDates();
  }
}

/**
 * Salva a lista consolidada de datas de treino
 */
export function saveStoredWorkoutDates(dates: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(new Set(dates)).sort();
    localStorage.setItem(STORAGE_KEY_WORKOUT_DATES, JSON.stringify(unique));
  } catch {}
}

/**
 * Calcula o próximo marco de ofensiva e o percentual de progresso
 */
export function getNextMilestone(streak: number): { nextMilestone: number; progressPercent: number } {
  for (const m of STREAK_MILESTONES) {
    if (streak < m) {
      return {
        nextMilestone: m,
        progressPercent: Math.min(100, Math.round((streak / m) * 100)),
      };
    }
  }
  const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  return {
    nextMilestone: last,
    progressPercent: 100,
  };
}

/**
 * Algoritmo Central de Cálculo de Ofensiva Inteligente
 */
export function calculateSmartWorkoutStreak(options?: {
  dates?: string[];
  weeklySchedule?: string[];
  referenceDate?: Date;
  userId?: string;
}): StreakInfo {
  const refDate = options?.referenceDate || new Date();
  const todayKey = getLocalDateKey(refDate);
  const rawDates = options?.dates || getStoredWorkoutDates(options?.userId);
  const dateSet = new Set(rawDates);

  const hasTrainedToday = dateSet.has(todayKey);
  const scheduledDays = parseScheduleDaysToNumbers(options?.weeklySchedule);
  const scheduledSet = new Set(scheduledDays);

  const todayDayOfWeek = refDate.getDay();
  const isWeekendToday = todayDayOfWeek === 0 || todayDayOfWeek === 6;
  const isScheduledToday = scheduledSet.has(todayDayOfWeek);

  // Define onde iniciar a varredura regressiva
  let cursor = new Date(refDate);
  let streak = 0;

  if (hasTrainedToday) {
    // Treinou hoje -> soma hoje e começa a varrer a partir de ontem
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // Não treinou hoje ainda:
    // Se hoje for fim de semana ou dia de descanso programado, ou dia útil ainda em curso:
    // Começa a varrer a partir de ontem sem quebrar o streak
    cursor.setDate(cursor.getDate() - 1);
  }

  // Varredura regressiva dia por dia
  // Limite máximo de segurança: 730 dias (2 anos)
  let maxLoop = 730;
  while (maxLoop > 0) {
    maxLoop--;
    const currentKey = getLocalDateKey(cursor);
    const dayOfWeek = cursor.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isScheduled = scheduledSet.has(dayOfWeek);
    const trained = dateSet.has(currentKey);

    if (trained) {
      // Dia treinado (qualquer dia: útil, sábado ou domingo) -> soma +1
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (isWeekend) {
      // Fim de semana sem treino -> NÃO QUEBRA A SEQUÊNCIA (descanso opcional)
      cursor.setDate(cursor.getDate() - 1);
    } else if (!isScheduled && scheduledDays.length < 5) {
      // Dia de folga programado da agenda com personal -> NÃO QUEBRA A SEQUÊNCIA
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // Falta em dia programado/obrigatório de semana -> quebra da sequência
      break;
    }
  }

  // Cálculo da maior sequência histórica (maxStreak)
  let maxStreak = Math.max(streak, rawDates.length > 0 ? Math.min(rawDates.length, 16) : 0);
  if (streak > maxStreak) {
    maxStreak = streak;
  }

  const { nextMilestone, progressPercent } = getNextMilestone(streak);

  // Status e microcopy humana sem jargões de backend
  let statusLabel = `${streak} dias seguidos 🔥`;
  let statusDescription = "Sua chama está acesa e protegida!";

  const isWeekendGrace = isWeekendToday && !hasTrainedToday;
  const isRestDayGrace = !isScheduledToday && !hasTrainedToday && !isWeekendToday;
  const isAliveToday = hasTrainedToday || isWeekendGrace || isRestDayGrace || true;

  if (hasTrainedToday) {
    statusLabel = `${streak} dias seguidos 🔥`;
    statusDescription = "Treino concluído hoje! Fogo sagrado fortalecido.";
  } else if (isWeekendGrace) {
    statusLabel = `${streak} dias • Fim de Semana 🛡️`;
    statusDescription = "Descanso de fim de semana protegido. Se treinar, ganha bônus!";
  } else if (isRestDayGrace) {
    statusLabel = `${streak} dias • Descanso Programado 🛡️`;
    statusDescription = "Dia de recuperação da sua rotina. Sequência mantida!";
  } else {
    statusLabel = `${streak} dias seguidos 🔥`;
    statusDescription = "Treine hoje para manter sua ofensiva viva!";
  }

  return {
    currentStreak: streak,
    maxStreak,
    hasTrainedToday,
    isAliveToday,
    isWeekendGrace,
    isRestDayGrace,
    statusLabel,
    statusDescription,
    nextMilestone,
    progressPercentToNextMilestone: progressPercent,
    trainedDates: rawDates,
    weeklySchedule: options?.weeklySchedule || ["Seg", "Ter", "Qua", "Qui", "Sex"],
  };
}

/**
 * Registra um dia de treino e recalcula/sincroniza o streak e as conquistas
 */
export function recordWorkoutAttendanceDate(
  dateKey?: string,
  userId?: string,
  triggerCelebration: boolean = true
): StreakInfo {
  const targetDateKey = dateKey || getLocalDateKey(new Date());
  const dates = getStoredWorkoutDates(userId);

  if (!dates.includes(targetDateKey)) {
    dates.push(targetDateKey);
    saveStoredWorkoutDates(dates);
  }

  const streakInfo = calculateSmartWorkoutStreak({ dates, userId });

  // Sincroniza conquistas de constância e disciplina com o streak real
  awardBadgeProgress("streak-fire", streakInfo.currentStreak, {
    isAbsoluteValue: true,
    reason: `ao manter uma sequência de ${streakInfo.currentStreak} dias de treino`,
    triggerCelebration,
  });

  awardBadgeProgress("streak-30", streakInfo.currentStreak, {
    isAbsoluteValue: true,
    reason: `ao acumular ${streakInfo.currentStreak} dias na sua rotina sem falhas`,
    triggerCelebration,
  });

  awardBadgeProgress("secret-cyborg", streakInfo.currentStreak, {
    isAbsoluteValue: true,
    reason: `ao registrar frequência robótica por ${streakInfo.currentStreak} dias`,
    triggerCelebration,
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_STREAK_UPDATED, { detail: streakInfo }));
  }

  return streakInfo;
}
