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
}

const STORAGE_KEY_STUDENTS = "gymflow_students_v3";
const STORAGE_KEY_WORKOUTS = "gymflow_student_workouts_v2";
const STORAGE_KEY_COACH_PLANS = "gymflow_coach_plans_v2";
const STORAGE_KEY_DEFAULT_DUE_DAY = "gymflow_coach_default_due_day";
const EVENT_NAME = "gymflow:workout-updated";

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

export function getCoachDefaultDueDay(): number {
  if (typeof window === "undefined") return 10;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DEFAULT_DUE_DAY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 31) return parsed;
    }
    const user = getCurrentUser();
    if (user?.defaultPaymentDueDay && user.defaultPaymentDueDay >= 1 && user.defaultPaymentDueDay <= 31) {
      return user.defaultPaymentDueDay;
    }
  } catch {}
  return 10;
}

export function setCoachDefaultDueDay(
  day: number,
  applyToAllExistingStudents: boolean = false
): { updatedCount: number; newDay: number } {
  const validDay = Math.min(31, Math.max(1, Math.round(day) || 10));
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_DEFAULT_DUE_DAY, String(validDay));
  }
  
  saveUserProfile({ defaultPaymentDueDay: validDay });

  let updatedCount = 0;
  if (applyToAllExistingStudents) {
    const formatted = formatDueDayString(validDay);
    const students = getStoredStudentsRaw();
    const updated = students.map((s) => {
      updatedCount++;
      return {
        ...s,
        paymentDueDate: formatted,
      };
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_NAME));
    }
    updated.forEach((st) => upsertStudentToSupabase(st).catch(() => {}));
  }

  return { updatedCount, newDay: validDay };
}

function getStoredStudentsRaw(): StudentProfile[] {
  if (typeof window === "undefined") return INITIAL_STUDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
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
export function checkAndUpdatePaymentCycles(studentsList?: StudentProfile[]): {
  students: StudentProfile[];
  hasChanges: boolean;
  changedCount: number;
} {
  const students = studentsList || getStoredStudentsRaw();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const defaultDueDay = getCoachDefaultDueDay();

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

    if (nextStatus !== student.paymentStatus) {
      changedCount++;
      return {
        ...student,
        paymentStatus: nextStatus,
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

export function refreshStudentPaymentCycles(): { updatedCount: number } {
  if (typeof window === "undefined") return { updatedCount: 0 };
  const current = getStoredStudentsRaw();
  const { students: updated, hasChanges, changedCount } = checkAndUpdatePaymentCycles(current);
  if (hasChanges) {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
    updated.forEach((st) => upsertStudentToSupabase(st).catch(() => {}));
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

export function getStoredCoachPlans(): CoachPlanOption[] {
  if (typeof window === "undefined") return DEFAULT_COACH_PLANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COACH_PLANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COACH_PLANS, JSON.stringify(DEFAULT_COACH_PLANS));
      return DEFAULT_COACH_PLANS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COACH_PLANS;
  }
}

export function saveCoachPlans(plans: CoachPlanOption[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_COACH_PLANS, JSON.stringify(plans));
  window.dispatchEvent(new Event(EVENT_NAME));

  plans.forEach((p) => saveCoachPlanToSupabase(p).catch(() => {}));
}

export function addCustomCoachPlan(plan: Omit<CoachPlanOption, "id">): CoachPlanOption {
  const current = getStoredCoachPlans();
  const newPlan: CoachPlanOption = {
    ...plan,
    id: `plan_${Date.now()}`,
    isCustom: true,
  };
  const updated = [...current, newPlan];
  saveCoachPlans(updated);
  return newPlan;
}

export function updateCoachPlan(id: string, updates: Partial<CoachPlanOption>): void {
  const current = getStoredCoachPlans();
  const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveCoachPlans(updated);
}

export function deleteCoachPlan(id: string): void {
  const current = getStoredCoachPlans();
  const updated = current.filter((p) => p.id !== id);
  saveCoachPlans(updated);
}

export const INITIAL_STUDENTS: StudentProfile[] = [];

// Flag de sincronização inicial em memória
let hasTriggeredInitialSupabaseSync = false;

export function getStoredStudents(): StudentProfile[] {
  if (typeof window === "undefined") return INITIAL_STUDENTS;

  // Sincronização assíncrona transparente com o Supabase (executada uma vez por sessão no client)
  if (!hasTriggeredInitialSupabaseSync) {
    hasTriggeredInitialSupabaseSync = true;
    fetchStudentsFromSupabase().then((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        const { students: cycleUpdated } = checkAndUpdatePaymentCycles(remoteStudents);
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(cycleUpdated));
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    }).catch(() => {});
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
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
    const cleaned = parsed.filter((s) => !legacyMockIds.has(s.id));
    const { students: cycleUpdated, hasChanges } = checkAndUpdatePaymentCycles(cleaned);
    if (hasChanges || cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(cycleUpdated));
      if (hasChanges) {
        cycleUpdated.forEach((st) => upsertStudentToSupabase(st).catch(() => {}));
      }
    }
    return cycleUpdated;
  } catch (e) {
    return [];
  }
}

export function saveNewStudent(studentData: {
  id?: string;
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
}): StudentProfile {
  const students = getStoredStudents();
  const existingIndex = students.findIndex(
    (s) => (studentData.id && s.id === studentData.id) || (studentData.email && s.email === studentData.email)
  );

  let targetStudent: StudentProfile;

  if (existingIndex >= 0) {
    const existing = students[existingIndex];
    targetStudent = {
      ...existing,
      id: studentData.id || existing.id,
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
      name: studentData.name,
      email: studentData.email || "",
      phone: studentData.phone || "",
      matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
      goal: studentData.goal,
      plan: studentData.plan || "App GymFlow Pro",
      status: "ativo",
      paymentStatus: "pago",
      paymentDueDate: studentData.paymentDueDate || formatDueDayString(getCoachDefaultDueDay()),
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
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  // Sincroniza em segundo plano com Supabase
  upsertStudentToSupabase(targetStudent).catch(() => {});

  return targetStudent;
}

export function updateStudentProfile(
  studentId: string,
  updates: Partial<StudentProfile>
): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
  let updatedStudent: StudentProfile | null = null;
  const updated = students.map((s) => {
    if (s.id === studentId) {
      updatedStudent = { ...s, ...updates };
      return updatedStudent;
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
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
    upsertStudentToSupabase(updatedStudent).catch(() => {});
  }
}

export function deleteStudent(studentId: string): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
  const updated = students.filter((s) => s.id !== studentId);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));

  deleteStudentFromSupabase(studentId).catch(() => {});
}

export function updateStudentPaymentStatus(
  studentId: string,
  paymentStatus: "pago" | "atrasado" | "pendente" | "cancelado"
): void {
  const updates: Partial<StudentProfile> = { paymentStatus };
  if (paymentStatus === "pago") {
    const todayStr = new Date().toLocaleDateString("pt-BR");
    updates.lastPaymentDate = todayStr;
  }
  updateStudentProfile(studentId, updates);
}

export function inactivateStudentAndReleaseAgenda(
  studentId: string,
  releaseAgendaSlots: boolean = true
): void {
  updateStudentProfile(studentId, {
    status: "inativo",
    paymentStatus: "cancelado",
    todayAttendanceStatus: undefined,
    scheduledTimeToday: undefined,
  });

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
export function studentUnlinkCoach(studentId: string): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
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
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function recordStudentAttendance(
  studentId: string,
  type: "presence" | "absence" | "delay",
  delayMinutes: number = 15
): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
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
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));

  const updatedStudent = updated.find((st) => st.id === studentId);
  if (updatedStudent) {
    upsertStudentToSupabase(updatedStudent).catch(() => {});
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

    // Se o aluno não tinha reserva criada para hoje na grade, cria uma automaticamente para aparecer na Agenda
    if (!changedBooking && updatedStudent) {
      const now = new Date();
      const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const dayShort = shortDays[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, "0");
      const monthNum = String(now.getMonth() + 1).padStart(2, "0");
      const timeNow = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const newBooking = {
        id: `b_today_${updatedStudent.id}_${Date.now()}`,
        studentId: updatedStudent.id,
        studentName: updatedStudent.name,
        studentPhone: updatedStudent.phone || "",
        coachId: "coach_rodrigo",
        coachName: "Prof. Rodrigo",
        coachPhone: "11999990000",
        slotDay: `${dayShort} (${dayNum}/${monthNum})`,
        slotTime: updatedStudent.scheduledTimeToday || "08:00",
        planType: updatedStudent.plan?.toLowerCase().includes("vip")
          ? "vip"
          : updatedStudent.plan?.toLowerCase().includes("pro")
          ? "pro"
          : "basico",
        basePrice: 45,
        extraOfferedAmount: 0,
        totalPrice: 45,
        status: "accepted",
        paymentStatus: "paid",
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

  // 2. Envia notificação instantânea para o aluno no aplicativo (gymflow_notifications_v2)
  try {
    const targetStudent = updated.find((st) => st.id === studentId);
    const studentName = targetStudent?.name || "Aluno";
    const rawNotifs = localStorage.getItem("gymflow_notifications_v2");
    const notifsList: any[] = rawNotifs ? JSON.parse(rawNotifs) : [];
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let notifTitle = "Presença Confirmada! 🔥";
    let notifMsg = `Seu treinador confirmou sua presença no treino de hoje às ${timeNow}. Bom treino!`;
    let notifType = "training_reminder";

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
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      timestamp: `Hoje às ${timeNow}`,
      read: false,
    });

    localStorage.setItem("gymflow_notifications_v2", JSON.stringify(notifsList.slice(0, 40)));
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

    if (workoutsMap[studentId]) {
      return workoutsMap[studentId];
    }

    // Se o aluno ainda não tiver ficha salva com este ID (por exemplo, após login ou sincronização de usuário),
    // mas houver uma rotina configurada em "student_me" ou "user_me", preserva os dados personalizados do usuário
    if (studentId !== "student_me" && studentId !== "user_me") {
      const fallbackPkg = workoutsMap["student_me"] || workoutsMap["user_me"];
      if (fallbackPkg && fallbackPkg.splits && fallbackPkg.splits.length > 0) {
        const migratedPackage: StudentWorkoutPackage = {
          ...fallbackPkg,
          studentId,
        };
        workoutsMap[studentId] = migratedPackage;
        localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));
        return migratedPackage;
      }
    }

    // Se ainda não tiver ficha salva para esse aluno, associa de acordo com seu objetivo real
    const student = getStoredStudents().find((s) => s.id === studentId);
    const userGoal = student?.goal || (currentUser?.id === studentId ? currentUser.goal : "Hipertrofia");

    let matchedRoutine = PREFORMED_ROUTINES[0];
    if (userGoal === "Emagrecimento" || student?.currentRoutineTitle?.includes("Glúteos")) {
      matchedRoutine = PREFORMED_ROUTINES[1] || PREFORMED_ROUTINES[0];
    } else if (userGoal === "Força & Performance" || student?.currentRoutineTitle?.includes("Força")) {
      matchedRoutine = PREFORMED_ROUTINES[2] || PREFORMED_ROUTINES[0];
    }

    const initialPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: student?.currentRoutineTitle && student.currentRoutineTitle !== "Acompanhamento Presencial Livre"
        ? student.currentRoutineTitle
        : matchedRoutine.name,
      prescribedBy: student?.prescribedBy || "",
      prescribedAt: student?.prescribedAt || "Ficha Inicial",
      coachNotes: student?.notesFromCoach || "Foco na postura, cadência controlada e respiração correta.",
      splits: matchedRoutine.splits,
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
  }
): void {
  if (typeof window === "undefined") return;

  try {
    const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};

    const workoutPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: data.routineTitle,
      prescribedBy: data.prescribedBy || "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      coachNotes: data.coachNotes || "Prescrição individualizada com foco em resultados progressivos.",
      splits: data.splits,
    };

    workoutsMap[studentId] = workoutPackage;
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));

    // Sincroniza ficha com Supabase
    saveWorkoutToSupabase(workoutPackage).catch(() => {});

    // Atualiza também o status na lista de alunos
    const students = getStoredStudents();
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
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));

    // Notifica o aluno instantaneamente no aplicativo (gymflow_notifications_v2)
    try {
      const rawNotifs = localStorage.getItem("gymflow_notifications_v2");
      const notifsList: any[] = rawNotifs ? JSON.parse(rawNotifs) : [];
      notifsList.unshift({
        id: `notif_${Date.now()}`,
        targetRole: "student",
        studentId,
        type: "workout_updated",
        title: "Ficha de Treino Atualizada! 📋",
        message: `${workoutPackage.prescribedBy} atualizou sua ficha de treino: "${data.routineTitle}". Abra a aba Treino para conferir!`,
        timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        read: false,
      });
      localStorage.setItem("gymflow_notifications_v2", JSON.stringify(notifsList.slice(0, 40)));
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

export function detachWorkoutFromStudent(studentId: string): void {
  if (typeof window === "undefined") return;
  try {
    const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};
    delete workoutsMap[studentId];
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));

    const students = getStoredStudents();
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
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
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

