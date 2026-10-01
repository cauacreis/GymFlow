/**
 * Workout Store & Teacher/Student State Synchronization
 * Permite que o professor cadastre alunos, prescreva fichas e reflita em tempo real no app do aluno
 */

import { WorkoutSplitTemplate, PREFORMED_ROUTINES } from "./exercisedb";
import {
  fetchStudentsFromSupabase,
  upsertStudentToSupabase,
  deleteStudentFromSupabase,
  fetchWorkoutFromSupabase,
  saveWorkoutToSupabase,
  fetchCoachPlansFromSupabase,
  saveCoachPlanToSupabase,
} from "./supabase-service";
import { isSlotToday } from "./booking-store";
import { getCurrentUser, saveUserProfile } from "./auth-store";

export interface StudentProfile {
  id: string;
  coachId?: string; // ID do treinador responsável (multi-tenant isolation)
  name: string;
  email: string;
  phone?: string;
  matricula: string;
  goal: "Hipertrofia" | "Emagrecimento" | "Força & Performance" | "Condicionamento Geral" | (string & {});
  currentRoutineTitle: string;
  prescribedBy: string;
  prescribedAt: string;
  notesFromCoach?: string;
  avatarUrl?: string;
  plan?: string;
  status?: "ativo" | "inativo" | "pendente";
  monthlyPresence?: number;
  monthlyAbsences?: number;
  monthlyDelays?: number;
  totalClasses?: number;
  hasWorkoutSheet?: boolean;
  isOfflineStudent?: boolean;
  emergencyContact?: string;
  age?: number;
  lastPresence?: string;
  todayAttendanceStatus?: "presente" | "falta" | "atraso" | "agendado";
  delayMinutes?: number;
  scheduledTimeToday?: string;
  notes?: string;
  registeredSince?: string;
  weeklySchedule?: string[];
  paymentStatus?: "pago" | "atrasado" | "pendente" | "cancelado";
  paymentDueDate?: string;
  lastPaymentDate?: string;
  isWorkoutLocked?: boolean;
  workoutLockedReason?: "overdue_payment" | "manual_coach_block" | string;
  workoutLockedAt?: string;
}

export interface CoachPlanOption {
  id: string;
  name: string;
  price: number;
  period?: "mensal" | "semanal" | "diario" | "trimestral" | "personalizado";
  frequency?: string; // ex: "3x por semana", "2x por semana", "Livre / 5x"
  duration?: string;  // ex: "1h por dia", "45 min", "1h30"
  modalities?: string[]; // ex: ["Musculação", "Corrida", "Funcional"]
  description?: string;
  isCustom?: boolean;
}

export interface StudentWorkoutPackage {
  studentId: string;
  routineTitle: string;
  prescribedBy: string;
  prescribedAt: string;
  coachNotes?: string;
  splits: WorkoutSplitTemplate[];
  isLocked?: boolean;
  lockedReason?: "overdue_payment" | "manual_coach_block" | string;
  lockedAt?: string;
}

export const STORAGE_KEY_STUDENTS = "gymflow_students_v3";
export const STORAGE_KEY_WORKOUTS = "gymflow_student_workouts_v2";
export const STORAGE_KEY_COACH_PLANS = "gymflow_coach_plans_v2";
export const STORAGE_KEY_DEFAULT_DUE_DAY = "gymflow_coach_default_due_day";
export const EVENT_NAME = "gymflow:workout-updated";

// ============================================================================
// PARTIÇÃO MULTI-TENANT DE CHAVES DE STORAGE POR TREINADOR
// ============================================================================

export function getCoachStudentsStorageKey(coachId?: string): string {
  const resolved = coachId || (typeof window !== "undefined" ? getCurrentUser()?.id : null);
  if (!resolved || resolved === "user_me") return STORAGE_KEY_STUDENTS;
  return `gymflow_students_${resolved}`;
}

export function getCoachPlansStorageKey(coachId?: string): string {
  const resolved = coachId || (typeof window !== "undefined" ? getCurrentUser()?.id : null);
  if (!resolved || resolved === "user_me") return STORAGE_KEY_COACH_PLANS;
  return `gymflow_coach_plans_${resolved}`;
}

export function getCoachDueDayStorageKey(coachId?: string): string {
  const resolved = coachId || (typeof window !== "undefined" ? getCurrentUser()?.id : null);
  if (!resolved || resolved === "user_me") return STORAGE_KEY_DEFAULT_DUE_DAY;
  return `gymflow_coach_default_due_day_${resolved}`;
}

export const STORAGE_KEY_COACH_AUTOBLOCK = "gymflow_coach_autoblock";

export function getCoachAutoBlockStorageKey(coachId?: string): string {
  const resolved = coachId || (typeof window !== "undefined" ? getCurrentUser()?.id : null);
  if (!resolved || resolved === "user_me") return STORAGE_KEY_COACH_AUTOBLOCK;
  return `gymflow_coach_autoblock_${resolved}`;
}

export function isCoachAutoBlockEnabled(coachId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const user = getCurrentUser();
    if (user && (!coachId || user.id === coachId)) {
      if (typeof user.autoBlockOverdueWorkouts === "boolean") {
        return user.autoBlockOverdueWorkouts;
      }
    }
    const key = getCoachAutoBlockStorageKey(coachId);
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return stored === "true";
    }
    return false;
  } catch {
    return false;
  }
}

export function setCoachAutoBlockPreference(enabled: boolean, coachId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCoachAutoBlockStorageKey(coachId);
    localStorage.setItem(key, String(enabled));
    const user = getCurrentUser();
    if (user && (!coachId || user.id === coachId)) {
      saveUserProfile({ autoBlockOverdueWorkouts: enabled });
    }
  } catch {}
}

export function parseDueDay(dueDateStr?: string, defaultDay: number = 10): number {
  if (!dueDateStr) return defaultDay;
  const match = dueDateStr.match(/(\d{1,2})/);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (val >= 1 && val <= 31) return val;
  }
  return defaultDay;
}

export function formatDueDayString(day: number): string {
  const clamped = Math.min(31, Math.max(1, Math.round(day) || 10));
  return `Dia ${String(clamped).padStart(2, "0")}`;
}

export function parseDateSafe(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
    const parts = trimmed.split("/");
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m - 1, d);
    }
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function getCoachDefaultDueDay(coachId?: string): number {
  if (typeof window === "undefined") return 10;
  try {
    const key = getCoachDueDayStorageKey(coachId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 31) return parsed;
    }
    const user = getCurrentUser();
    if (user?.defaultPaymentDueDay && user.defaultPaymentDueDay >= 1 && user.defaultPaymentDueDay <= 31) {
      return user.defaultPaymentDueDay;
    }
    const legacy = localStorage.getItem(STORAGE_KEY_DEFAULT_DUE_DAY);
    if (legacy) {
      const parsed = parseInt(legacy, 10);
      if (parsed >= 1 && parsed <= 31) return parsed;
    }
  } catch {}
  return 10;
}

export function setCoachDefaultDueDay(
  day: number,
  applyToAllExistingStudents: boolean = false,
  coachId?: string
): { updatedCount: number; newDay: number } {
  const validDay = Math.min(31, Math.max(1, Math.round(day) || 10));
  const key = getCoachDueDayStorageKey(coachId);
  if (typeof window !== "undefined") {
    localStorage.setItem(key, String(validDay));
  }
  
  saveUserProfile({ defaultPaymentDueDay: validDay });

  let updatedCount = 0;
  if (applyToAllExistingStudents) {
    const formatted = formatDueDayString(validDay);
    const students = getStoredStudentsRaw(coachId);
    const updated = students.map((s) => {
      updatedCount++;
      return {
        ...s,
        paymentDueDate: formatted,
      };
    });
    if (typeof window !== "undefined") {
      const studentsKey = getCoachStudentsStorageKey(coachId);
      localStorage.setItem(studentsKey, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_NAME));
    }
    const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
    updated.forEach((st) => upsertStudentToSupabase(st, targetCoachId).catch(() => {}));
  }

  return { updatedCount, newDay: validDay };
}

function getStoredStudentsRaw(coachId?: string): StudentProfile[] {
  if (typeof window === "undefined") return INITIAL_STUDENTS;
  try {
    const storageKey = getCoachStudentsStorageKey(coachId);
    let raw = localStorage.getItem(storageKey);
    if (!raw && storageKey !== STORAGE_KEY_STUDENTS) {
      raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const legacyMockIds = new Set([
      "student_beatriz",
      "student_lucas",
      "student_ana",
      "student_camila",
      "student_mariana",
      "student_diego",
      "student_pedro",
      "student_carlos",
    ]);
    return parsed.filter((s) => !legacyMockIds.has(s.id));
  } catch {
    return [];
  }
}

/**
 * Verifica e atualiza automaticamente o ciclo de faturamento e vencimento das mensalidades de cada aluno.
 */
export function checkAndUpdatePaymentCycles(studentsList?: StudentProfile[], coachId?: string): {
  students: StudentProfile[];
  hasChanges: boolean;
  changedCount: number;
} {
  const students = studentsList || getStoredStudentsRaw(coachId);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const defaultDueDay = getCoachDefaultDueDay(coachId);

  let changedCount = 0;

  const updatedStudents = students.map((student) => {
    if (student.paymentStatus === "cancelado") {
      return student;
    }

    const dueDay = parseDueDay(student.paymentDueDate, defaultDueDay);
    const lastPayDate = parseDateSafe(student.lastPaymentDate);

    let nextStatus = student.paymentStatus || "pendente";

    if (student.paymentStatus === "pago") {
      if (lastPayDate) {
        // Início do ciclo de cobrança do mês corrente (com margem de 2 dias de antecedência)
        const startOfCurrentBillingCycle = new Date(currentYear, currentMonth, Math.max(1, dueDay - 2), 0, 0, 0);

        if (currentDay > dueDay) {
          // O dia do vencimento deste mês já passou sem quitação para o ciclo atual
          if (lastPayDate < startOfCurrentBillingCycle) {
            nextStatus = "atrasado";
          }
        } else if (currentDay === dueDay) {
          // Hoje é o dia de vencimento e não há quitação registrada neste mês
          if (lastPayDate < startOfCurrentBillingCycle) {
            nextStatus = "pendente";
          }
        }
      }
    } else if (student.paymentStatus === "pendente") {
      // Se a fatura está pendente e o dia de hoje já ultrapassou o vencimento, vira atrasado!
      if (currentDay > dueDay) {
        nextStatus = "atrasado";
      }
    }

    let isWorkoutLocked = student.isWorkoutLocked;
    let workoutLockedReason = student.workoutLockedReason;
    let workoutLockedAt = student.workoutLockedAt;
    let lockChanged = false;

    // Regra de Bloqueio Automático em caso de atraso
    const autoBlock = isCoachAutoBlockEnabled(coachId);
    if (autoBlock) {
      if (nextStatus === "atrasado" && !isWorkoutLocked) {
        isWorkoutLocked = true;
        workoutLockedReason = "overdue_payment";
        workoutLockedAt = new Date().toISOString();
        lockChanged = true;
      } else if (nextStatus === "pago" && isWorkoutLocked && workoutLockedReason === "overdue_payment") {
        isWorkoutLocked = false;
        workoutLockedReason = undefined;
        workoutLockedAt = undefined;
        lockChanged = true;
      }
    }

    if (nextStatus !== student.paymentStatus || lockChanged) {
      changedCount++;
      return {
        ...student,
        paymentStatus: nextStatus,
        isWorkoutLocked,
        workoutLockedReason,
        workoutLockedAt,
      };
    }

    return student;
  });

  return {
    students: updatedStudents,
    hasChanges: changedCount > 0,
    changedCount,
  };
}

export function refreshStudentPaymentCycles(coachId?: string): { updatedCount: number } {
  if (typeof window === "undefined") return { updatedCount: 0 };
  const current = getStoredStudentsRaw(coachId);
  const { students: updated, hasChanges, changedCount } = checkAndUpdatePaymentCycles(current, coachId);
  if (hasChanges) {
    const key = getCoachStudentsStorageKey(coachId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
    const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
    
    // Atualiza também pacotes de treino salvos se o lock mudou
    try {
      const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
      const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};
      let workoutsChanged = false;
      updated.forEach((st) => {
        if (workoutsMap[st.id] && workoutsMap[st.id].isLocked !== st.isWorkoutLocked) {
          workoutsMap[st.id].isLocked = st.isWorkoutLocked;
          workoutsMap[st.id].lockedReason = st.workoutLockedReason;
          workoutsMap[st.id].lockedAt = st.workoutLockedAt;
          workoutsChanged = true;
        }
      });
      if (workoutsChanged) {
        localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));
      }
    } catch {}

    updated.forEach((st) => upsertStudentToSupabase(st, targetCoachId).catch(() => {}));
  }
  return { updatedCount: changedCount };
}

export const DEFAULT_COACH_PLANS: CoachPlanOption[] = [
  {
    id: "plan_basico",
    name: "Mensal Básico",
    price: 35,
    period: "mensal",
    frequency: "2x na semana",
    duration: "45 min / aula",
    modalities: ["Musculação", "Treinamento Funcional"],
    description: "Treino essencial e correção biomecânica",
  },
  {
    id: "plan_pro",
    name: "Mensal Pro",
    price: 45,
    period: "mensal",
    frequency: "3x na semana",
    duration: "1h / aula",
    modalities: ["Musculação", "Corrida / Cardio", "Treinamento Funcional", "Acompanhamento WhatsApp"],
    description: "Fichas completas com catálogo de exercícios e acompanhamento semanal",
  },
  {
    id: "plan_vip",
    name: "Mensal VIP",
    price: 55,
    period: "mensal",
    frequency: "5x na semana / Livre",
    duration: "1h15 / aula",
    modalities: [
      "Musculação",
      "Corrida / Cardio",
      "Treinamento Funcional",
      "Mobilidade & Alongamento",
      "Orientação Nutricional",
      "Acompanhamento WhatsApp",
      "Avaliação Física",
    ],
    description: "Acompanhamento VIP livre e remanejamento flexível prioritário",
  },
];

const syncedCoachPlans = new Set<string>();

export function getStoredCoachPlans(coachId?: string): CoachPlanOption[] {
  if (typeof window === "undefined") return DEFAULT_COACH_PLANS;
  const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
  const key = getCoachPlansStorageKey(targetCoachId);

  if (!syncedCoachPlans.has(targetCoachId)) {
    syncedCoachPlans.add(targetCoachId);
    fetchCoachPlansFromSupabase(targetCoachId).then((remotePlans) => {
      if (remotePlans && remotePlans.length > 0) {
        localStorage.setItem(key, JSON.stringify(remotePlans));
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    }).catch(() => {});
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY_COACH_PLANS);
      if (legacyRaw && (targetCoachId === "coach_default" || targetCoachId === "coach_rodrigo")) {
        localStorage.setItem(key, legacyRaw);
        return JSON.parse(legacyRaw);
      }
      localStorage.setItem(key, JSON.stringify(DEFAULT_COACH_PLANS));
      return DEFAULT_COACH_PLANS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COACH_PLANS;
  }
}

export function saveCoachPlans(plans: CoachPlanOption[], coachId?: string): void {
  if (typeof window === "undefined") return;
  const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
  const key = getCoachPlansStorageKey(targetCoachId);
  localStorage.setItem(key, JSON.stringify(plans));
  window.dispatchEvent(new Event(EVENT_NAME));

  plans.forEach((p) => saveCoachPlanToSupabase(p, targetCoachId).catch(() => {}));
}

export function addCustomCoachPlan(plan: Omit<CoachPlanOption, "id">, coachId?: string): CoachPlanOption {
  const current = getStoredCoachPlans(coachId);
  const newPlan: CoachPlanOption = {
    ...plan,
    id: `plan_${Date.now()}`,
    isCustom: true,
  };
  const updated = [...current, newPlan];
  saveCoachPlans(updated, coachId);
  return newPlan;
}

export function updateCoachPlan(id: string, updates: Partial<CoachPlanOption>, coachId?: string): void {
  const current = getStoredCoachPlans(coachId);
  const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveCoachPlans(updated, coachId);
}

export function deleteCoachPlan(id: string, coachId?: string): void {
  const current = getStoredCoachPlans(coachId);
  const updated = current.filter((p) => p.id !== id);
  saveCoachPlans(updated, coachId);
}

export const INITIAL_STUDENTS: StudentProfile[] = [];

// Flag e registro de sincronização de treinadores em memória
const syncedCoaches = new Set<string>();

export function getStoredStudents(coachId?: string): StudentProfile[] {
  if (typeof window === "undefined") return INITIAL_STUDENTS;

  const currentUser = getCurrentUser();
  const targetCoachId = coachId || (currentUser?.activeRole === "coach" ? currentUser.id : null);

  // Se não houver coachId fornecido e o usuário logado for aluno, o aluno não tem acesso à lista de alunos de nenhum treinador
  if (!targetCoachId) {
    return [];
  }

  const storageKey = getCoachStudentsStorageKey(targetCoachId);

  // Sincronização assíncrona transparente com o Supabase apenas para o treinador específico
  if (!syncedCoaches.has(targetCoachId)) {
    syncedCoaches.add(targetCoachId);
    fetchStudentsFromSupabase(targetCoachId).then((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        const { students: cycleUpdated } = checkAndUpdatePaymentCycles(remoteStudents, targetCoachId);
        localStorage.setItem(storageKey, JSON.stringify(cycleUpdated));
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    }).catch(() => {});
  }

  try {
    let raw = localStorage.getItem(storageKey);
    let list: StudentProfile[] = [];

    if (raw) {
      list = JSON.parse(raw);
    } else {
      // Migração seletiva: verifica se no legacy existem alunos vinculados a este coach
      const legacyRaw = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed)) {
          const matching = legacyParsed.filter(
            (s: StudentProfile) =>
              s.coachId === targetCoachId ||
              (!s.coachId && (targetCoachId === "coach_rodrigo" || targetCoachId === "coach_default"))
          );
          if (matching.length > 0) {
            list = matching.map((s) => ({ ...s, coachId: targetCoachId }));
            localStorage.setItem(storageKey, JSON.stringify(list));
          }
        }
      }
    }

    if (!Array.isArray(list)) return [];

    const legacyMockIds = new Set([
      "student_beatriz",
      "student_lucas",
      "student_ana",
      "student_camila",
      "student_mariana",
      "student_diego",
      "student_pedro",
      "student_carlos",
    ]);
    const cleaned = list.filter((s) => !legacyMockIds.has(s.id));
    const { students: cycleUpdated, hasChanges } = checkAndUpdatePaymentCycles(cleaned, targetCoachId);
    if (hasChanges || cleaned.length !== list.length) {
      localStorage.setItem(storageKey, JSON.stringify(cycleUpdated));
      if (hasChanges) {
        cycleUpdated.forEach((st) => upsertStudentToSupabase(st, targetCoachId).catch(() => {}));
      }
    }
    return cycleUpdated;
  } catch (e) {
    return [];
  }
}

export function saveNewStudent(
  studentData: {
    id?: string;
    coachId?: string;
    name: string;
    email?: string;
    goal: StudentProfile["goal"];
    phone?: string;
    plan?: string;
    age?: number;
    emergencyContact?: string;
    avatarUrl?: string;
    isOfflineStudent?: boolean;
    paymentDueDate?: string;
  },
  coachId?: string
): StudentProfile {
  const targetCoachId = coachId || studentData.coachId || (typeof window !== "undefined" ? getCurrentUser()?.id : "coach_default") || "coach_default";
  const storageKey = getCoachStudentsStorageKey(targetCoachId);
  const students = getStoredStudents(targetCoachId);

  const existingIndex = students.findIndex(
    (s) => (studentData.id && s.id === studentData.id) || (studentData.email && s.email === studentData.email)
  );

  let targetStudent: StudentProfile;

  if (existingIndex >= 0) {
    const existing = students[existingIndex];
    targetStudent = {
      ...existing,
      id: studentData.id || existing.id,
      coachId: targetCoachId,
      name: studentData.name || existing.name,
      email: studentData.email || existing.email,
      phone: studentData.phone !== undefined ? studentData.phone : existing.phone,
      goal: studentData.goal || existing.goal,
      plan: studentData.plan || existing.plan,
      age: studentData.age || existing.age,
      emergencyContact: studentData.emergencyContact !== undefined ? studentData.emergencyContact : existing.emergencyContact,
      avatarUrl: studentData.avatarUrl !== undefined ? studentData.avatarUrl : existing.avatarUrl,
      isOfflineStudent: studentData.isOfflineStudent !== undefined ? studentData.isOfflineStudent : existing.isOfflineStudent,
      paymentDueDate: studentData.paymentDueDate !== undefined ? studentData.paymentDueDate : existing.paymentDueDate,
    };
    students[existingIndex] = targetStudent;
  } else {
    targetStudent = {
      id: studentData.id || `student_${Date.now()}`,
      coachId: targetCoachId,
      name: studentData.name,
      email: studentData.email || "",
      phone: studentData.phone || "",
      matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
      goal: studentData.goal,
      plan: studentData.plan || "App GymFlow Pro",
      status: "ativo",
      paymentStatus: "pago",
      paymentDueDate: studentData.paymentDueDate || formatDueDayString(getCoachDefaultDueDay(targetCoachId)),
      monthlyPresence: 0,
      monthlyAbsences: 0,
      totalClasses: 0,
      hasWorkoutSheet: true,
      isOfflineStudent: studentData.isOfflineStudent ?? false,
      age: studentData.age || 25,
      emergencyContact: studentData.emergencyContact || "",
      avatarUrl: studentData.avatarUrl || "",
      currentRoutineTitle: "Treino Personalizado",
      prescribedBy: "",
      prescribedAt: "Sem Personal Vinculado",
    };
    students.unshift(targetStudent);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(students));
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  // Sincroniza em segundo plano com Supabase associado ao treinador
  upsertStudentToSupabase(targetStudent, targetCoachId).catch(() => {});

  return targetStudent;
}

export function updateStudentProfile(
  studentId: string,
  updates: Partial<StudentProfile>,
  coachId?: string
): void {
  if (typeof window === "undefined") return;
  const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
  const storageKey = getCoachStudentsStorageKey(targetCoachId);
  const students = getStoredStudents(targetCoachId);
  let updatedStudent: StudentProfile | null = null;
  const updated = students.map((s) => {
    if (s.id === studentId) {
      updatedStudent = { ...s, ...updates, coachId: s.coachId || targetCoachId };
      return updatedStudent;
    }
    return s;
  });
  localStorage.setItem(storageKey, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));

  // Se nome ou telefone mudaram, sincroniza também na lista de agendamentos da agenda
  if (updates.name || updates.phone) {
    try {
      const rawBookings = localStorage.getItem("gymflow_bookings_v3");
      if (rawBookings) {
        const bookingsList = JSON.parse(rawBookings);
        if (Array.isArray(bookingsList)) {
          const updatedBookings = bookingsList.map((b: any) => {
            if (b.studentId === studentId) {
              return {
                ...b,
                ...(updates.name ? { studentName: updates.name } : {}),
                ...(updates.phone ? { studentPhone: updates.phone } : {}),
              };
            }
            return b;
          });
          localStorage.setItem("gymflow_bookings_v3", JSON.stringify(updatedBookings));
          window.dispatchEvent(new Event("gymflow:booking-updated"));
        }
      }
    } catch {}
  }

  if (updatedStudent) {
    upsertStudentToSupabase(updatedStudent, targetCoachId).catch(() => {});
  }
}

export function deleteStudent(studentId: string, coachId?: string): void {
  if (typeof window === "undefined") return;
  const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
  const storageKey = getCoachStudentsStorageKey(targetCoachId);
  const students = getStoredStudents(targetCoachId);
  const updated = students.filter((s) => s.id !== studentId);
  localStorage.setItem(storageKey, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));

  deleteStudentFromSupabase(studentId).catch(() => {});
}

export function setStudentWorkoutLock(
  studentId: string,
  locked: boolean,
  reason?: "overdue_payment" | "manual_coach_block" | string,
  coachId?: string
): void {
  const targetCoachId = coachId || (typeof window !== "undefined" ? getCurrentUser()?.id : null) || "coach_default";
  const storageKey = getCoachStudentsStorageKey(targetCoachId);
  const students = getStoredStudentsRaw(targetCoachId);
  const nowIso = new Date().toISOString();
  let updatedStudent: StudentProfile | null = null;

  const updated = students.map((s) => {
    if (s.id === studentId) {
      updatedStudent = {
        ...s,
        isWorkoutLocked: locked,
        workoutLockedReason: locked ? (reason || "manual_coach_block") : undefined,
        workoutLockedAt: locked ? nowIso : undefined,
      };
      return updatedStudent;
    }
    return s;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Atualiza também no STORAGE_KEY_WORKOUTS
    try {
      const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
      const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};
      if (workoutsMap[studentId]) {
        workoutsMap[studentId] = {
          ...workoutsMap[studentId],
          isLocked: locked,
          lockedReason: locked ? (reason || "manual_coach_block") : undefined,
          lockedAt: locked ? nowIso : undefined,
        };
      } else {
        const defaultRoutine = PREFORMED_ROUTINES[0];
        workoutsMap[studentId] = {
          studentId,
          routineTitle: defaultRoutine.name,
          prescribedBy: "",
          prescribedAt: "Ficha Inicial",
          splits: defaultRoutine.splits,
          isLocked: locked,
          lockedReason: locked ? (reason || "manual_coach_block") : undefined,
          lockedAt: locked ? nowIso : undefined,
        };
      }
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));
      saveWorkoutToSupabase(workoutsMap[studentId]).catch(() => {});
    } catch {}

    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { studentId, isLocked: locked } }));
  }

  if (updatedStudent) {
    upsertStudentToSupabase(updatedStudent, targetCoachId).catch(() => {});
  }
}

export function toggleStudentWorkoutLock(studentId: string, coachId?: string): boolean {
  const students = getStoredStudentsRaw(coachId);
  const student = students.find((s) => s.id === studentId);
  const currentLocked = Boolean(student?.isWorkoutLocked);
  const nextLocked = !currentLocked;
  setStudentWorkoutLock(
    studentId,
    nextLocked,
    nextLocked ? (student?.paymentStatus === "atrasado" ? "overdue_payment" : "manual_coach_block") : undefined,
    coachId
  );
  return nextLocked;
}

export function updateStudentPaymentStatus(
  studentId: string,
  paymentStatus: "pago" | "atrasado" | "pendente" | "cancelado",
  coachId?: string
): void {
  const updates: Partial<StudentProfile> = { paymentStatus };
  if (paymentStatus === "pago") {
    const todayStr = new Date().toLocaleDateString("pt-BR");
    updates.lastPaymentDate = todayStr;

    // Se estava pausado por atraso no pagamento, reativa automaticamente
    const currentStudents = getStoredStudentsRaw(coachId);
    const st = currentStudents.find((s) => s.id === studentId);
    if (st && st.isWorkoutLocked && st.workoutLockedReason === "overdue_payment") {
      updates.isWorkoutLocked = false;
      updates.workoutLockedReason = undefined;
      updates.workoutLockedAt = undefined;
      setStudentWorkoutLock(studentId, false, undefined, coachId);
    }
  } else if (paymentStatus === "atrasado") {
    if (isCoachAutoBlockEnabled(coachId)) {
      updates.isWorkoutLocked = true;
      updates.workoutLockedReason = "overdue_payment";
      updates.workoutLockedAt = new Date().toISOString();
      setStudentWorkoutLock(studentId, true, "overdue_payment", coachId);
    }
  }
  updateStudentProfile(studentId, updates, coachId);
}

export function inactivateStudentAndReleaseAgenda(
  studentId: string,
  releaseAgendaSlots: boolean = true,
  coachId?: string
): void {
  updateStudentProfile(
    studentId,
    {
      status: "inativo",
      paymentStatus: "cancelado",
      todayAttendanceStatus: undefined,
      scheduledTimeToday: undefined,
    },
    coachId
  );

  if (releaseAgendaSlots && typeof window !== "undefined") {
    try {
      const rawBookings = localStorage.getItem("gymflow_bookings_v3");
      if (rawBookings) {
        const list = JSON.parse(rawBookings);
        if (Array.isArray(list)) {
          // Remove os agendamentos da grade deste aluno, liberando os horários para outros alunos
          const filtered = list.filter((b: any) => b.studentId !== studentId);
          localStorage.setItem("gymflow_bookings_v3", JSON.stringify(filtered));
          window.dispatchEvent(new Event("gymflow:booking-updated"));
        }
      }
    } catch {}
  }
}

/**
 * Aluno desvincula o personal trainer por iniciativa própria
 * Atualiza o plano para Treino Livre, limpa agendamento do dia e grade semanal
 */
export function studentUnlinkCoach(studentId: string, coachId?: string): void {
  if (typeof window === "undefined") return;
  const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
  const storageKey = getCoachStudentsStorageKey(targetCoachId);
  const students = getStoredStudents(targetCoachId);
  const updated = students.map((s) => {
    if (s.id === studentId) {
      return {
        ...s,
        plan: "Treino Livre (Sem Personal)",
        paymentStatus: "cancelado" as const,
        scheduledTimeToday: undefined,
        todayAttendanceStatus: undefined,
        weeklySchedule: [],
      };
    }
    return s;
  });
  localStorage.setItem(storageKey, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function recordStudentAttendance(
  studentId: string,
  type: "presence" | "absence" | "delay",
  delayMinutes: number = 15,
  coachId?: string
): void {
  if (typeof window === "undefined") return;
  const currentUser = getCurrentUser();
  const targetCoachId = coachId || currentUser?.id || "coach_default";
  const storageKey = getCoachStudentsStorageKey(targetCoachId);
  const students = getStoredStudents(targetCoachId);
  const updated = students.map((s) => {
    if (s.id === studentId) {
      if (type === "presence") {
        return {
          ...s,
          todayAttendanceStatus: "presente" as const,
          monthlyPresence: (s.monthlyPresence || 0) + 1,
          totalClasses: (s.totalClasses || 0) + 1,
          lastPresence: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          delayMinutes: undefined,
        };
      } else if (type === "absence") {
        return {
          ...s,
          todayAttendanceStatus: "falta" as const,
          monthlyAbsences: (s.monthlyAbsences || 0) + 1,
          delayMinutes: undefined,
        };
      } else {
        return {
          ...s,
          todayAttendanceStatus: "atraso" as const,
          monthlyDelays: (s.monthlyDelays || 0) + 1,
          delayMinutes,
          lastPresence: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${delayMinutes}m atraso)`,
        };
      }
    }
    return s;
  });
  localStorage.setItem(storageKey, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));

  const updatedStudent = updated.find((st) => st.id === studentId);
  if (updatedStudent) {
    upsertStudentToSupabase(updatedStudent, targetCoachId).catch(() => {});
  }

  // 1. Sincroniza com o booking-store (gymflow_bookings_v3)
  try {
    const rawBookings = localStorage.getItem("gymflow_bookings_v3");
    const bookingsList: any[] = rawBookings ? JSON.parse(rawBookings) : [];
    let changedBooking = false;
    const targetStatus = type === "presence" ? "attended" : type === "absence" ? "missed" : "delayed";

    const updatedBookings = bookingsList.map((b) => {
      if (b.studentId === studentId && isSlotToday(b.slotDay)) {
        changedBooking = true;
        return {
          ...b,
          attendanceStatus: targetStatus,
        };
      }
      return b;
    });

    // Se o aluno não tinha reserva criada para hoje na grade, cria uma automaticamente associada ao treinador real
    if (!changedBooking && updatedStudent) {
      const now = new Date();
      const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const dayShort = shortDays[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, "0");
      const monthNum = String(now.getMonth() + 1).padStart(2, "0");
      const timeNow = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const resolvedCoachName = currentUser?.name
        ? `Prof. ${currentUser.name}`
        : (updatedStudent.prescribedBy || "Personal Trainer");

      const newBooking = {
        id: `b_today_${updatedStudent.id}_${Date.now()}`,
        studentId: updatedStudent.id,
        studentName: updatedStudent.name,
        studentPhone: updatedStudent.phone || "",
        coachId: targetCoachId,
        coachName: resolvedCoachName,
        coachPhone: currentUser?.phone || "",
        slotDay: `${dayShort} (${dayNum}/${monthNum})`,
        slotTime: updatedStudent.scheduledTimeToday || "08:00",
        planType: updatedStudent.plan?.toLowerCase().includes("vip")
          ? ("vip" as const)
          : updatedStudent.plan?.toLowerCase().includes("pro")
          ? ("pro" as const)
          : ("basico" as const),
        basePrice: 45,
        extraOfferedAmount: 0,
        totalPrice: 45,
        status: "accepted" as const,
        paymentStatus: "paid" as const,
        attendanceStatus: targetStatus,
        createdAt: `Hoje às ${timeNow}`,
      };
      updatedBookings.unshift(newBooking);
      changedBooking = true;
    }

    if (changedBooking) {
      localStorage.setItem("gymflow_bookings_v3", JSON.stringify(updatedBookings));
      window.dispatchEvent(new Event("gymflow:booking-updated"));
    }
  } catch (err) {
    console.error("Erro ao sincronizar reserva:", err);
  }

  // 2. Envia notificação instantânea para o aluno no aplicativo (gymflow_notifications_v3)
  try {
    const targetStudent = updated.find((st) => st.id === studentId);
    const rawNotifs = localStorage.getItem("gymflow_notifications_v3");
    const notifsList: any[] = rawNotifs ? JSON.parse(rawNotifs) : [];
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let notifTitle = "Presença Confirmada! 🔥";
    let notifMsg = `Seu treinador confirmou sua presença no treino de hoje às ${timeNow}. Bom treino!`;
    let notifType: any = "training_reminder";

    if (type === "absence") {
      notifTitle = "Falta Registrada ❌";
      notifMsg = `Seu treinador registrou ausência no treino de hoje. Acesse sua agenda caso precise remanejar.`;
      notifType = "missed_class";
    } else if (type === "delay") {
      notifTitle = "Aviso de Atraso ⚠️";
      notifMsg = `Seu treinador registrou atraso de ${delayMinutes} min no treino de hoje. Chegue o quanto antes para aproveitar a sessão!`;
      notifType = "delay_warning";
    }

    notifsList.unshift({
      id: `notif_${Date.now()}`,
      targetRole: "student",
      studentId,
      coachId: targetCoachId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      timestamp: `Hoje às ${timeNow}`,
      read: false,
    });

    localStorage.setItem("gymflow_notifications_v3", JSON.stringify(notifsList.slice(0, 40)));
    window.dispatchEvent(new Event("gymflow:notifications-updated"));
  } catch (err) {
    console.error("Erro ao enviar notificação de presença:", err);
  }
}

export function getStudentWorkout(studentId: string): StudentWorkoutPackage {
  const defaultRoutine = PREFORMED_ROUTINES[0];
  const currentUser = getCurrentUser();

  if (typeof window === "undefined") {
    return {
      studentId,
      routineTitle: defaultRoutine.name,
      prescribedBy: "",
      prescribedAt: "Ficha Inicial",
      coachNotes: "Mantenha a postura e execute as repetições com boa técnica.",
      splits: defaultRoutine.splits,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = raw ? JSON.parse(raw) : {};

    let matchedStudent: StudentProfile | undefined;
    if (typeof window !== "undefined") {
      const rawStudents = getStoredStudentsRaw();
      matchedStudent = rawStudents.find((s) => s.id === studentId);
      if (!matchedStudent) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key === STORAGE_KEY_STUDENTS || key.startsWith("gymflow_students_"))) {
              const val = localStorage.getItem(key);
              if (val) {
                const list = JSON.parse(val);
                if (Array.isArray(list)) {
                  const found = list.find((s: StudentProfile) => s.id === studentId);
                  if (found) {
                    matchedStudent = found;
                    break;
                  }
                }
              }
            }
          }
        } catch {}
      }
    }

    if (workoutsMap[studentId]) {
      const pkg = workoutsMap[studentId];
      if (matchedStudent?.isWorkoutLocked !== undefined) {
        pkg.isLocked = matchedStudent.isWorkoutLocked;
        pkg.lockedReason = matchedStudent.workoutLockedReason;
        pkg.lockedAt = matchedStudent.workoutLockedAt;
      }
      return pkg;
    }

    // Se ainda não tiver ficha salva para esse aluno, associa de acordo com seu objetivo individual
    const userGoal = currentUser?.id === studentId ? currentUser.goal : "Hipertrofia";

    let matchedRoutine = PREFORMED_ROUTINES[0];
    if (userGoal === "Emagrecimento") {
      matchedRoutine = PREFORMED_ROUTINES[1] || PREFORMED_ROUTINES[0];
    } else if (userGoal === "Força & Performance") {
      matchedRoutine = PREFORMED_ROUTINES[2] || PREFORMED_ROUTINES[0];
    }

    const initialPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: matchedRoutine.name,
      prescribedBy: "",
      prescribedAt: "Ficha Inicial",
      coachNotes: "Foco na postura, cadência controlada e respiração correta.",
      splits: matchedRoutine.splits,
      isLocked: matchedStudent?.isWorkoutLocked,
      lockedReason: matchedStudent?.workoutLockedReason,
      lockedAt: matchedStudent?.workoutLockedAt,
    };

    workoutsMap[studentId] = initialPackage;
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));
    return initialPackage;
  } catch (e) {
    return {
      studentId,
      routineTitle: defaultRoutine.name,
      prescribedBy: "",
      prescribedAt: "Ficha Inicial",
      splits: defaultRoutine.splits,
    };
  }
}

export function assignWorkoutToStudent(
  studentId: string,
  data: {
    routineTitle: string;
    coachNotes?: string;
    splits: WorkoutSplitTemplate[];
    prescribedBy?: string;
  },
  coachId?: string
): void {
  if (typeof window === "undefined") return;

  try {
    const currentUser = getCurrentUser();
    const defaultCoachName = currentUser?.name
      ? `Prof. ${currentUser.name}${currentUser.cref ? ` (CREF ${currentUser.cref})` : ""}`
      : "Personal Trainer";

    const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};

    const workoutPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: data.routineTitle,
      prescribedBy: data.prescribedBy || defaultCoachName,
      prescribedAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      coachNotes: data.coachNotes || "Prescrição individualizada com foco em resultados progressivos.",
      splits: data.splits,
    };

    workoutsMap[studentId] = workoutPackage;
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));

    // Sincroniza ficha com Supabase
    saveWorkoutToSupabase(workoutPackage).catch(() => {});

    // Atualiza também o status na lista de alunos do treinador
    const targetCoachId = coachId || currentUser?.id || "coach_default";
    const storageKey = getCoachStudentsStorageKey(targetCoachId);
    const students = getStoredStudents(targetCoachId);
    const updatedStudents = students.map((st) => {
      if (st.id === studentId) {
        return {
          ...st,
          hasWorkoutSheet: true,
          currentRoutineTitle: data.routineTitle,
          prescribedBy: workoutPackage.prescribedBy,
          prescribedAt: workoutPackage.prescribedAt,
          notesFromCoach: workoutPackage.coachNotes,
        };
      }
      return st;
    });
    localStorage.setItem(storageKey, JSON.stringify(updatedStudents));

    // Notifica o aluno instantaneamente no aplicativo (gymflow_notifications_v3)
    try {
      const rawNotifs = localStorage.getItem("gymflow_notifications_v3");
      const notifsList: any[] = rawNotifs ? JSON.parse(rawNotifs) : [];
      notifsList.unshift({
        id: `notif_${Date.now()}`,
        targetRole: "student",
        studentId,
        coachId: targetCoachId,
        type: "workout_updated",
        title: "Ficha de Treino Atualizada! 📋",
        message: `${workoutPackage.prescribedBy} atualizou sua ficha de treino: "${data.routineTitle}". Abra a aba Treino para conferir!`,
        timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        read: false,
      });
      localStorage.setItem("gymflow_notifications_v3", JSON.stringify(notifsList.slice(0, 40)));
      window.dispatchEvent(new Event("gymflow:notifications-updated"));
    } catch (notifErr) {
      console.error("Erro ao enviar notificação de treino:", notifErr);
    }

    // Dispara evento para reatividade instantânea
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { studentId } }));
  } catch (e) {
    console.error("Erro ao salvar ficha do aluno:", e);
  }
}

export function detachWorkoutFromStudent(studentId: string, coachId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const targetCoachId = coachId || getCurrentUser()?.id || "coach_default";
    const storageKey = getCoachStudentsStorageKey(targetCoachId);

    const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};
    delete workoutsMap[studentId];
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));

    const students = getStoredStudents(targetCoachId);
    const updatedStudents = students.map((st) => {
      if (st.id === studentId) {
        return {
          ...st,
          hasWorkoutSheet: false,
          currentRoutineTitle: "Acompanhamento Presencial Livre",
          prescribedAt: "Sem Ficha Fixa",
          notesFromCoach: undefined,
        };
      }
      return st;
    });
    localStorage.setItem(storageKey, JSON.stringify(updatedStudents));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { studentId } }));
  } catch (e) {
    console.error("Erro ao desvincular ficha:", e);
  }
}

export function subscribeToWorkoutChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function addExerciseToStudentSplit(
  studentId: string,
  splitId: "A" | "B" | "C" | "D" | string,
  exercise: import("./exercisedb").ExerciseInWorkout
): void {
  if (typeof window === "undefined") return;
  const currentWorkout = getStudentWorkout(studentId);
  const updatedSplits = currentWorkout.splits.map((split) => {
    if (split.id === splitId) {
      return {
        ...split,
        exercises: [...split.exercises, exercise],
      };
    }
    return split;
  });

  assignWorkoutToStudent(studentId, {
    routineTitle: currentWorkout.routineTitle,
    coachNotes: currentWorkout.coachNotes,
    splits: updatedSplits,
    prescribedBy: currentWorkout.prescribedBy,
  });
}

export function removeExerciseFromStudentSplit(
  studentId: string,
  splitId: "A" | "B" | "C" | "D" | string,
  exerciseId: string
): void {
  if (typeof window === "undefined") return;
  const currentWorkout = getStudentWorkout(studentId);
  const updatedSplits = currentWorkout.splits.map((split) => {
    if (split.id === splitId) {
      return {
        ...split,
        exercises: split.exercises.filter((ex) => ex.id !== exerciseId),
      };
    }
    return split;
  });

  assignWorkoutToStudent(studentId, {
    routineTitle: currentWorkout.routineTitle,
    coachNotes: currentWorkout.coachNotes,
    splits: updatedSplits,
    prescribedBy: currentWorkout.prescribedBy,
  });
}

export function updateStudentSplitExercises(
  studentId: string,
  splitId: "A" | "B" | "C" | "D" | string,
  exercises: import("./exercisedb").ExerciseInWorkout[]
): void {
  if (typeof window === "undefined") return;
  const currentWorkout = getStudentWorkout(studentId);
  const updatedSplits = currentWorkout.splits.map((split) => {
    if (split.id === splitId) {
      return {
        ...split,
        exercises,
      };
    }
    return split;
  });

  assignWorkoutToStudent(studentId, {
    routineTitle: currentWorkout.routineTitle,
    coachNotes: currentWorkout.coachNotes,
    splits: updatedSplits,
    prescribedBy: currentWorkout.prescribedBy,
  });
}

