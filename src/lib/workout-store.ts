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

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  matricula: string;
  goal: "Hipertrofia" | "Emagrecimento" | "Força & Performance" | "Condicionamento Geral";
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
  frequency?: string;
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
const EVENT_NAME = "gymflow:workout-updated";

export const DEFAULT_COACH_PLANS: CoachPlanOption[] = [
  {
    id: "plan_basico",
    name: "Mensal Básico",
    price: 35,
    period: "mensal",
    frequency: "2x por semana presencial",
    description: "Treino essencial e correção biomecânica",
  },
  {
    id: "plan_pro",
    name: "Mensal Pro",
    price: 45,
    period: "mensal",
    frequency: "3x por semana presencial",
    description: "Fichas completas com catálogo de exercícios e acompanhamento semanal",
  },
  {
    id: "plan_vip",
    name: "Mensal VIP",
    price: 55,
    period: "mensal",
    frequency: "Acompanhamento livre / 5x na semana",
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

export const INITIAL_STUDENTS: StudentProfile[] = [
  {
    id: "student_beatriz",
    name: "Beatriz Santos",
    email: "beatriz.santos@email.com",
    phone: "11987654321",
    matricula: "GF-88412",
    goal: "Hipertrofia",
    currentRoutineTitle: "Treino Inferiores & Glúteo 4x",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "10/09/2026",
    notesFromCoach: "Foco em cadência no agachamento e elevação pélvica.",
    plan: "Mensal VIP (R$ 55/mês)",
    status: "ativo",
    paymentStatus: "pago",
    paymentDueDate: "Dia 10",
    lastPaymentDate: "10/09/2026",
    monthlyPresence: 16,
    monthlyAbsences: 1,
    monthlyDelays: 0,
    totalClasses: 17,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    age: 26,
    lastPresence: "Hoje às 06:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "06:00",
    registeredSince: "09/02/2024",
    weeklySchedule: ["Segunda · 06:00", "Quarta · 06:00", "Sexta · 06:00"],
    notes: "Aluna exemplar, foco em progressão de cargas nos exercícios de glúteos e posteriores. Sempre pontual.",
  },
  {
    id: "student_lucas",
    name: "Lucas Alves",
    email: "lucas.alves@email.com",
    phone: "11988887777",
    matricula: "GF-77219",
    goal: "Força & Performance",
    currentRoutineTitle: "Push / Pull / Legs Avançado",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "08/09/2026",
    notesFromCoach: "Cargas progressivas no supino reto e terra.",
    plan: "Mensal Pro (R$ 45/mês)",
    status: "ativo",
    paymentStatus: "pago",
    paymentDueDate: "Dia 05",
    lastPaymentDate: "05/09/2026",
    monthlyPresence: 14,
    monthlyAbsences: 2,
    monthlyDelays: 1,
    totalClasses: 17,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    age: 29,
    lastPresence: "Hoje às 07:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "07:00",
    registeredSince: "15/01/2024",
    weeklySchedule: ["Segunda · 07:00", "Quarta · 07:00", "Sexta · 07:00"],
    notes: "Meta de supino 100kg até o fim do semestre. Cuidar alinhamento da coluna no levantamento terra.",
  },
  {
    id: "student_ana",
    name: "Ana Clara",
    email: "ana.clara@email.com",
    phone: "11977776666",
    matricula: "GF-66120",
    goal: "Condicionamento Geral",
    currentRoutineTitle: "Circuito Funcional & Core",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "09/09/2026",
    plan: "Mensal Básico (R$ 35/mês)",
    status: "ativo",
    paymentStatus: "atrasado",
    paymentDueDate: "Dia 08",
    lastPaymentDate: "08/08/2026",
    monthlyPresence: 12,
    monthlyAbsences: 1,
    monthlyDelays: 0,
    totalClasses: 13,
    hasWorkoutSheet: true,
    isOfflineStudent: true,
    age: 31,
    lastPresence: "Hoje às 08:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "08:00",
    registeredSince: "12/03/2024",
    weeklySchedule: ["Segunda · 08:00", "Quarta · 08:00", "Sexta · 08:00"],
    notes: "Condicionamento físico e alinhamento postural. Aluna exemplar, nunca falta sem avisar.",
  },
  {
    id: "student_camila",
    name: "Camila Fernandes",
    email: "camila.f@email.com",
    phone: "11966665555",
    matricula: "GF-55341",
    goal: "Emagrecimento",
    currentRoutineTitle: "Full Body Metabólico & HIIT",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "05/09/2026",
    plan: "Mensal Pro (R$ 45/mês)",
    status: "ativo",
    paymentStatus: "pago",
    paymentDueDate: "Dia 15",
    lastPaymentDate: "15/08/2026",
    monthlyPresence: 15,
    monthlyAbsences: 0,
    monthlyDelays: 1,
    totalClasses: 16,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    age: 27,
    lastPresence: "Hoje às 09:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "09:00",
    registeredSince: "05/04/2024",
    weeklySchedule: ["Terça · 09:00", "Quinta · 09:00", "Sexta · 09:00"],
    notes: "Foco em queima calórica e tônus muscular. Treinos metabólicos rápidos com alta densidade.",
  },
  {
    id: "student_mariana",
    name: "Mariana Oliveira",
    email: "mariana.o@email.com",
    phone: "11955554444",
    matricula: "GF-44982",
    goal: "Hipertrofia",
    currentRoutineTitle: "Upper / Lower Equilibrado",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "07/09/2026",
    plan: "Mensal VIP (R$ 55/mês)",
    status: "ativo",
    paymentStatus: "pago",
    paymentDueDate: "Dia 10",
    lastPaymentDate: "10/09/2026",
    monthlyPresence: 11,
    monthlyAbsences: 3,
    monthlyDelays: 0,
    totalClasses: 14,
    hasWorkoutSheet: true,
    isOfflineStudent: true,
    age: 24,
    lastPresence: "Hoje às 10:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "10:00",
    registeredSince: "20/02/2024",
    weeklySchedule: ["Segunda · 10:00", "Quarta · 10:00", "Sexta · 10:00"],
    notes: "Boa evolução no treino de pernas e glúteos. Manter cadência lenta na fase excêntrica.",
  },
  {
    id: "student_diego",
    name: "Diego Martins",
    email: "diego.m@email.com",
    phone: "11944443333",
    matricula: "GF-33821",
    goal: "Força & Performance",
    currentRoutineTitle: "Força Pura 5x5",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "04/09/2026",
    plan: "Mensal Pro (R$ 45/mês)",
    status: "ativo",
    paymentStatus: "pago",
    paymentDueDate: "Dia 05",
    lastPaymentDate: "05/09/2026",
    monthlyPresence: 13,
    monthlyAbsences: 1,
    monthlyDelays: 0,
    totalClasses: 14,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    age: 33,
    lastPresence: "Hoje às 12:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "12:00",
    registeredSince: "18/05/2024",
    weeklySchedule: ["Segunda · 12:00", "Quarta · 12:00", "Quinta · 12:00"],
    notes: "Foco em progressão de carga no agachamento livre. Intervalo de descanso completo.",
  },
  {
    id: "student_pedro",
    name: "Pedro Henrique",
    email: "pedro.h@email.com",
    phone: "11933332222",
    matricula: "GF-22901",
    goal: "Hipertrofia",
    currentRoutineTitle: "Hipertrofia ABC Intensivo",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "03/09/2026",
    plan: "Mensal Básico (R$ 35/mês)",
    status: "ativo",
    paymentStatus: "pendente",
    paymentDueDate: "Dia 12",
    lastPaymentDate: "12/08/2026",
    monthlyPresence: 10,
    monthlyAbsences: 2,
    monthlyDelays: 2,
    totalClasses: 14,
    hasWorkoutSheet: true,
    isOfflineStudent: true,
    age: 22,
    lastPresence: "Ontem às 07:00",
    todayAttendanceStatus: "agendado",
    scheduledTimeToday: "17:00",
    registeredSince: "10/06/2024",
    weeklySchedule: ["Terça · 07:00", "Quinta · 07:00"],
    notes: "Aluno dedicado. Ajustar técnica no levantamento lateral e puxada pela frente.",
  },
  {
    id: "student_carlos",
    name: "Carlos Mendes",
    email: "carlos.mendes@email.com",
    phone: "11999998888",
    matricula: "GF-10492",
    goal: "Hipertrofia",
    currentRoutineTitle: "Hipertrofia Avançada ABC",
    prescribedBy: "Prof. Rodrigo",
    prescribedAt: "10/09/2026",
    notesFromCoach: "Foco em peitoral e deltoides.",
    plan: "Mensal VIP (R$ 55/mês)",
    status: "ativo",
    paymentStatus: "pago",
    paymentDueDate: "Dia 10",
    lastPaymentDate: "10/09/2026",
    monthlyPresence: 18,
    monthlyAbsences: 1,
    monthlyDelays: 0,
    totalClasses: 19,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    age: 28,
    lastPresence: "Hoje às 18:00",
    todayAttendanceStatus: "presente",
    scheduledTimeToday: "18:00",
    registeredSince: "03/01/2024",
    weeklySchedule: ["Segunda · 18:00", "Quarta · 18:00", "Quinta · 18:00"],
    notes: "Treina no final do dia após o trabalho. Hidratação reforçada e cargas pesadas.",
  },
];

// Flag de sincronização inicial em memória
let hasTriggeredInitialSupabaseSync = false;

export function getStoredStudents(): StudentProfile[] {
  if (typeof window === "undefined") return INITIAL_STUDENTS;

  // Sincronização assíncrona transparente com o Supabase (executada uma vez por sessão no client)
  if (!hasTriggeredInitialSupabaseSync) {
    hasTriggeredInitialSupabaseSync = true;
    fetchStudentsFromSupabase().then((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(remoteStudents));
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    }).catch(() => {});
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return parsed;
  } catch (e) {
    return INITIAL_STUDENTS;
  }
}

export function saveNewStudent(studentData: {
  name: string;
  email?: string;
  goal: StudentProfile["goal"];
  phone?: string;
  plan?: string;
  age?: number;
  emergencyContact?: string;
  avatarUrl?: string;
  isOfflineStudent?: boolean;
}): StudentProfile {
  const students = getStoredStudents();
  const newStudent: StudentProfile = {
    id: `student_${Date.now()}`,
    name: studentData.name,
    email: studentData.email || "",
    phone: studentData.phone || "",
    matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
    goal: studentData.goal,
    plan: studentData.plan || "Mensal VIP Presencial",
    status: "ativo",
    monthlyPresence: 0,
    monthlyAbsences: 0,
    totalClasses: 0,
    hasWorkoutSheet: false, // Ficha não é obrigatória!
    isOfflineStudent: studentData.isOfflineStudent ?? true,
    age: studentData.age || 25,
    emergencyContact: studentData.emergencyContact || "",
    avatarUrl: studentData.avatarUrl || "",
    currentRoutineTitle: "Acompanhamento Presencial Livre",
    prescribedBy: "",
    prescribedAt: "Sem Ficha Fixa",
  };

  const updated = [newStudent, ...students];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  // Sincroniza em segundo plano com Supabase
  upsertStudentToSupabase(newStudent).catch(() => {});

  return newStudent;
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

  if (typeof window === "undefined") {
    return {
      studentId,
      routineTitle: defaultRoutine.name,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: "09/Set/2026",
      coachNotes: "Cadência 3-0-1 em todos os compostos.",
      splits: defaultRoutine.splits,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = raw ? JSON.parse(raw) : {};

    if (workoutsMap[studentId]) {
      return workoutsMap[studentId];
    }

    // Se ainda não tiver ficha salva para esse aluno, associa a inicial
    const student = getStoredStudents().find((s) => s.id === studentId);
    let matchedRoutine = PREFORMED_ROUTINES[0];
    if (student?.currentRoutineTitle.includes("Glúteos")) {
      matchedRoutine = PREFORMED_ROUTINES[1] || PREFORMED_ROUTINES[0];
    } else if (student?.currentRoutineTitle.includes("Força")) {
      matchedRoutine = PREFORMED_ROUTINES[2] || PREFORMED_ROUTINES[0];
    }

    const initialPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: matchedRoutine.name,
      prescribedBy: student?.prescribedBy || "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: student?.prescribedAt || "09/Set/2026",
      coachNotes: student?.notesFromCoach || "Foco na amplitude completa e controle excêntrico.",
      splits: matchedRoutine.splits,
    };

    workoutsMap[studentId] = initialPackage;
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));
    return initialPackage;
  } catch (e) {
    return {
      studentId,
      routineTitle: defaultRoutine.name,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: "09/Set/2026",
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

