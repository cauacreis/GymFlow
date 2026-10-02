/**
 * Personal Trainer Barber-Style Booking & Notification Store
 * Gerenciamento de agenda de personais, solicitações de treino presencial,
 * planos (diário, semanal, mensal), ofertas de valor extra, pagamentos e notificações.
 */

import {
  fetchBookingsFromSupabase,
  saveBookingToSupabase,
} from "./supabase-service";
import type { CoachPlanOption } from "./workout-store";

export interface TrainerSlot {
  id: string;
  time: string; // Ex: "07:00", "08:00", "18:00"
  isAvailable: boolean;
  day: "Hoje" | "Amanhã" | "Quinta" | "Sexta" | "Sábado" | string;
  studentId?: string;
  studentName?: string;
  studentAvatar?: string;
  studentPlan?: string;
  isBlocked?: boolean;
}

export interface CoachTrainer {
  id: string;
  name: string;
  email?: string;
  cref?: string;
  avatarUrl: string;
  phone: string;
  specialty: string;
  distance: string;
  rating: number;
  reviewCount: number;
  bio: string;
  instagram?: string;
  location?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  operatingRadiusKm?: number;
  serviceModality?: "presencial" | "online" | "hibrido";
  pricing: {
    basicMonthly: number; // R$ 35/mês (Plano Básico)
    proMonthly: number;   // R$ 45/mês (Plano Pro)
    vipMonthly: number;   // R$ 55/mês (Plano VIP)
    dailySession?: number; // Compatibilidade legada
    weeklyPlan?: number;
    monthlyPlan?: number;
  };
  coachPlans?: CoachPlanOption[];
  // Configuração PIX do Personal
  pixKey?: string;
  pixKeyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
  pixName?: string;
  pixBank?: string;
  allowBookingMessages?: boolean; // Receber mensagens e dúvidas de alunos antes da contratação
  isCurrentUserProfile?: boolean; // Indica se este perfil público pertence à conta do usuário autenticado
  slots: TrainerSlot[];
}

export interface RescheduleProposal {
  id: string;
  requestedBy: "student" | "coach";
  proposedDay: string;
  proposedTime: string;
  reason?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  coachId: string;
  coachName: string;
  coachPhone: string;
  slotDay: string;
  slotTime: string;
  planType: "basico" | "pro" | "vip" | "diario" | "semanal" | "mensal";
  basePrice: number;
  extraOfferedAmount: number;
  totalPrice: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  paymentStatus: "pending" | "paid" | "overdue";
  attendanceStatus: "scheduled" | "attended" | "missed" | "delayed" | "rescheduled" | "justified" | "pending";
  notes?: string;
  createdAt: string;
  rescheduleRequest?: RescheduleProposal;
  durationMinutes?: number;
  workoutTitle?: string;
}

export interface AppNotification {
  id: string;
  targetRole: "student" | "coach";
  studentId?: string;
  coachId?: string;
  type:
    | "training_reminder"
    | "payment_confirmed"
    | "payment_overdue"
    | "missed_class"
    | "booking_accepted"
    | "rescheduled"
    | "delay_warning"
    | "workout_updated"
    | "booking_message"
    | "achievement_unlocked"
    | "subscription_canceled";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface RescheduleDayOption {
  value: string;
  label: string;
  isToday?: boolean;
  isTomorrow?: boolean;
}

export interface ScheduleWeekTab {
  id: string;
  label: string;
  fullDate: string;
}

/**
 * Retorna as opções dinâmicas e inteligentes para remanejamento de horário.
 * Respeita rigorosamente o dia atual (ex: se hoje é Quinta, lista Quinta como Hoje, Sexta como Amanhã, etc.)
 */
export function getRescheduleDayOptions(): RescheduleDayOption[] {
  const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const now = new Date();
  const options: RescheduleDayOption[] = [];

  for (let i = 0; i < 9; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    if (d.getDay() === 0) continue; // Academia fechada aos domingos

    const dayName = weekDays[d.getDay()];
    const dateFormatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    let label = "";
    if (i === 0) {
      label = `Hoje (${dayName.replace("-feira", "")}, ${dateFormatted})`;
    } else if (i === 1) {
      label = `Amanhã (${dayName.replace("-feira", "")}, ${dateFormatted})`;
    } else {
      label = `${dayName} (${dateFormatted})`;
    }

    options.push({
      value: label,
      label,
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }

  return options;
}

/**
 * Retorna as abas dinâmicas da semana para a grade de atendimento (Seg a Sáb)
 * Ajustadas para o dia atual sem duplicidades
 */
export function getScheduleWeekTabs(): ScheduleWeekTab[] {
  const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const fullDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const now = new Date();
  const tabs: ScheduleWeekTab[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    if (d.getDay() === 0) continue; // Não exibe domingo na grade

    const dayShort = shortDays[d.getDay()];
    const dayFull = fullDays[d.getDay()];
    const dateFormatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    if (i === 0) {
      tabs.push({ id: "Hoje", label: `Hoje (${dayShort})`, fullDate: dateFormatted });
    } else if (i === 1) {
      tabs.push({ id: "Amanhã", label: `Amanhã (${dayShort})`, fullDate: dateFormatted });
    } else {
      tabs.push({ id: dayFull, label: `${dayFull} (${dateFormatted})`, fullDate: dateFormatted });
    }
  }

  return tabs;
}

/**
 * Verifica se um slot de treino corresponde ao dia selecionado,
 * com tolerância inteligente (ex: slots salvos como 'Quinta' ou 'Hoje' coincidem quando hoje é quinta)
 */
export function matchesScheduleDay(slotDay: string, targetDay: string): boolean {
  if (slotDay === targetDay) return true;

  const now = new Date();
  const currentDayOfWeekIndex = now.getDay();
  const fullDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const todayName = fullDays[currentDayOfWeekIndex];
  const tomorrowName = fullDays[(currentDayOfWeekIndex + 1) % 7];

  // Se o usuário selecionou "Hoje" e hoje é Quinta, aceita slots cadastrados como "Quinta" ou "Hoje"
  if (targetDay === "Hoje" && (slotDay === "Hoje" || slotDay === todayName)) return true;
  if (slotDay === "Hoje" && targetDay === todayName) return true;

  // Se o usuário selecionou "Amanhã" e amanhã é Sexta, aceita slots cadastrados como "Sexta" ou "Amanhã"
  if (targetDay === "Amanhã" && (slotDay === "Amanhã" || slotDay === tomorrowName)) return true;
  if (slotDay === "Amanhã" && targetDay === tomorrowName) return true;

  return false;
}

/**
 * Verifica se um slot de treino corresponde rigorosamente a HOJE.
 * Reconhece "Hoje", o nome do dia da semana (ex: "Sexta", "Sexta-feira"), abreviações ("Sex")
 * e a data no formato DD/MM (ex: "11/09").
 */
export function isSlotToday(slotDay: string | undefined): boolean {
  if (!slotDay) return false;
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const s = normalize(slotDay.trim());
  if (s === "hoje" || s.includes("hoje")) return true;

  const now = new Date();
  const fullDays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const shortDays = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const todayDayIndex = now.getDay();
  const todayFull = fullDays[todayDayIndex];
  const todayShort = shortDays[todayDayIndex];

  if (s.includes(todayFull) || s.includes(todayShort)) return true;

  const dayNum = String(now.getDate()).padStart(2, "0");
  const monthNum = String(now.getMonth() + 1).padStart(2, "0");
  const dateStr = `${dayNum}/${monthNum}`;
  if (s.includes(dateStr)) return true;

  return false;
}

/**
 * Retorna os horários no salão para um treinador em uma data específica do calendário.
 * Se o treinador não possuir slots personalizados para aquele dia da semana,
 * gera a grade padrão da academia para permitir o agendamento fluido em qualquer data futura.
 */
export function getCoachSlotsForDate(coach: CoachTrainer | undefined, targetDate: Date): TrainerSlot[] {
  if (!coach) return [];

  const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const fullDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const dayIndex = targetDate.getDay();
  const dayFull = fullDays[dayIndex];
  const dayShort = shortDays[dayIndex];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetMidnight = new Date(targetDate);
  targetMidnight.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const targetDayIdentifier = diffDays === 0 ? "Hoje" : diffDays === 1 ? "Amanhã" : dayFull;

  const existing = (coach.slots || []).filter(
    (s) =>
      matchesScheduleDay(s.day, targetDayIdentifier) ||
      matchesScheduleDay(s.day, dayFull) ||
      matchesScheduleDay(s.day, dayShort)
  );

  if (existing.length > 0) {
    return existing;
  }

  if (dayIndex === 0) {
    return []; // Fechado aos domingos
  }

  // Horários padrão de atendimento
  const defaultTimes = ["07:00", "08:00", "10:00", "16:00", "18:00", "19:00"];
  return defaultTimes.map((time, idx) => ({
    id: `slot_${coach.id}_${dayShort}_${time.replace(":", "")}`,
    day: targetDayIdentifier,
    time,
    isAvailable: idx !== 4, // 18:00 ocupado para realismo
  }));
}

const STORAGE_COACHES = "gymflow_coaches_v4";
const STORAGE_BOOKINGS = "gymflow_bookings_v3";
const STORAGE_NOTIFICATIONS = "gymflow_notifications_v2";

const EVENT_BOOKING = "gymflow:booking-updated";
const EVENT_NOTIFICATIONS = "gymflow:notifications-updated";

const INITIAL_COACHES: CoachTrainer[] = [
  {
    id: "coach_rodrigo",
    name: "Prof. Rodrigo Silveira",
    cref: "12345-G/SP",
    avatarUrl: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=200&q=80",
    phone: "11999990000",
    specialty: "Hipertrofia, Biomecânica & Força",
    distance: "A 1.2 km de você",
    rating: 5.0,
    reviewCount: 38,
    bio: "Especialista em periodização de alta intensidade e correção biomecânica de exercícios compostos.",
    instagram: "@rodrigo.coach",
    location: "Smart Fit • Jardins / Paulista",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Jardins",
    latitude: -23.5617,
    longitude: -46.656,
    operatingRadiusKm: 15,
    serviceModality: "hibrido",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "s1", day: "Hoje", time: "07:00", isAvailable: true },
      { id: "s2", day: "Hoje", time: "08:00", isAvailable: true },
      { id: "s3", day: "Hoje", time: "09:00", isAvailable: true },
      { id: "s4", day: "Hoje", time: "17:00", isAvailable: true },
      { id: "s5", day: "Hoje", time: "18:00", isAvailable: true },
      { id: "s6", day: "Hoje", time: "19:00", isAvailable: true },
      { id: "s7", day: "Amanhã", time: "06:00", isAvailable: true },
      { id: "s8", day: "Amanhã", time: "07:00", isAvailable: true },
      { id: "s9", day: "Amanhã", time: "18:00", isAvailable: true },
    ],
  },
  {
    id: "coach_felipe",
    name: "Felipe Mendes",
    cref: "54321-G/SP",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    phone: "11988881234",
    specialty: "Emagrecimento & Treinamento Funcional",
    distance: "A 3.5 km de você",
    rating: 4.9,
    reviewCount: 24,
    bio: "Treinador focado em queima de gordura, mobilidade funcional e longevidade articular.",
    instagram: "@felipe.trainer",
    location: "Bio Ritmo • Moema / Ibirapuera",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Moema",
    latitude: -23.6011,
    longitude: -46.666,
    operatingRadiusKm: 10,
    serviceModality: "presencial",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "sf1", day: "Hoje", time: "08:00", isAvailable: true },
      { id: "sf2", day: "Hoje", time: "10:00", isAvailable: true },
      { id: "sf3", day: "Hoje", time: "18:00", isAvailable: true },
      { id: "sf4", day: "Amanhã", time: "07:00", isAvailable: true },
      { id: "sf5", day: "Amanhã", time: "19:00", isAvailable: true },
    ],
  },
  {
    id: "coach_mariana",
    name: "Mariana Costa",
    cref: "98765-G/RJ",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    phone: "21977778888",
    specialty: "Musculação Feminina & Glúteos",
    distance: "Rio de Janeiro - RJ",
    rating: 5.0,
    reviewCount: 42,
    bio: "Metodologia científica para hipertrofia de membros inferiores e definição estética.",
    instagram: "@mariana.fitness",
    location: "Bodytech • Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
    neighborhood: "Copacabana",
    latitude: -22.9711,
    longitude: -43.1822,
    operatingRadiusKm: 12,
    serviceModality: "hibrido",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "sm1", day: "Hoje", time: "07:00", isAvailable: true },
      { id: "sm2", day: "Hoje", time: "09:00", isAvailable: true },
      { id: "sm3", day: "Hoje", time: "17:00", isAvailable: true },
      { id: "sm4", day: "Amanhã", time: "08:00", isAvailable: true },
    ],
  },
  {
    id: "coach_camila",
    name: "Camila Ribeiro",
    cref: "67890-G/MG",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    phone: "31966665555",
    specialty: "Força & Powerlifting",
    distance: "Belo Horizonte - MG",
    rating: 4.8,
    reviewCount: 19,
    bio: "Treinamento de força máxima, levantamento de peso e superação de cargas com segurança.",
    instagram: "@camila.power",
    location: "Cia Athletica • Savassi",
    city: "Belo Horizonte",
    state: "MG",
    neighborhood: "Savassi",
    latitude: -19.9387,
    longitude: -43.9332,
    operatingRadiusKm: 15,
    serviceModality: "presencial",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "sc1", day: "Hoje", time: "06:00", isAvailable: true },
      { id: "sc2", day: "Hoje", time: "07:00", isAvailable: true },
      { id: "sc3", day: "Amanhã", time: "18:00", isAvailable: true },
    ],
  },
  {
    id: "coach_andre",
    name: "André Santos",
    cref: "11223-G/PR",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    phone: "41955554444",
    specialty: "Consultoria Online & Biomecânica",
    distance: "Atendimento 100% Online",
    rating: 4.9,
    reviewCount: 31,
    bio: "Consultoria remota individualizada com análise de vídeo dos movimentos e periodização.",
    instagram: "@andre.biomecanica",
    location: "Studio Privado • Batel",
    city: "Curitiba",
    state: "PR",
    neighborhood: "Batel",
    latitude: -25.4431,
    longitude: -49.2882,
    operatingRadiusKm: 50,
    serviceModality: "online",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "sa1", day: "Hoje", time: "09:00", isAvailable: true },
      { id: "sa2", day: "Hoje", time: "14:00", isAvailable: true },
      { id: "sa3", day: "Hoje", time: "16:00", isAvailable: true },
      { id: "sa4", day: "Amanhã", time: "10:00", isAvailable: true },
    ],
  },
];

export const INITIAL_BOOKINGS: BookingRequest[] = [];

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// ----------------------------------------------------------------------
// GETTERS
// ----------------------------------------------------------------------

export function getStoredCoaches(): CoachTrainer[] {
  if (typeof window === "undefined") return INITIAL_COACHES;
  try {
    const raw = localStorage.getItem(STORAGE_COACHES);
    if (!raw) {
      localStorage.setItem(STORAGE_COACHES, JSON.stringify(INITIAL_COACHES));
      return INITIAL_COACHES;
    }
    const list: CoachTrainer[] = JSON.parse(raw);

    // Purga terminantemente o treinador fake legado ("Treinador Principal" / "coach_principal")
    const filteredList = Array.isArray(list)
      ? list.filter((c) => c && c.id !== "coach_principal" && c.name !== "Treinador Principal")
      : INITIAL_COACHES;

    const hasRemovedFake = Array.isArray(list) && filteredList.length !== list.length;

    // Normalização defensiva: garante preços 35/45/55 e migra dados geográficos de INITIAL_COACHES
    const normalized = filteredList.map((c) => {
      const initial = INITIAL_COACHES.find((ic) => ic.id === c.id);
      const resolvedName = c.name || initial?.name || "Personal Trainer";
      const resolvedCref = c.cref || initial?.cref;
      const resolvedAvatar = c.avatarUrl || initial?.avatarUrl || "";
      const resolvedSpecialty = c.specialty || initial?.specialty || "Musculação & Hipertrofia";
      const resolvedPhone = c.phone || initial?.phone || "";

      const basic = c.pricing?.basicMonthly && c.pricing.basicMonthly <= 60 ? c.pricing.basicMonthly : 35;
      const pro = c.pricing?.proMonthly && c.pricing.proMonthly <= 75 ? c.pricing.proMonthly : 45;
      const vip = c.pricing?.vipMonthly && c.pricing.vipMonthly <= 90 ? c.pricing.vipMonthly : 55;
      return {
        ...initial,
        ...c,
        name: resolvedName,
        cref: resolvedCref,
        avatarUrl: resolvedAvatar,
        specialty: resolvedSpecialty,
        phone: resolvedPhone,
        city: c.city || initial?.city,
        state: c.state || initial?.state,
        neighborhood: c.neighborhood || initial?.neighborhood,
        location: c.location || initial?.location,
        latitude: c.latitude ?? initial?.latitude,
        longitude: c.longitude ?? initial?.longitude,
        operatingRadiusKm: c.operatingRadiusKm ?? initial?.operatingRadiusKm,
        serviceModality: c.serviceModality || initial?.serviceModality || "presencial",
        coachPlans: c.coachPlans || initial?.coachPlans,
        pixKey: c.pixKey || initial?.pixKey,
        pixKeyType: c.pixKeyType || initial?.pixKeyType,
        pixName: c.pixName || initial?.pixName,
        pixBank: c.pixBank || initial?.pixBank,
        allowBookingMessages: c.allowBookingMessages !== undefined ? c.allowBookingMessages : (initial?.allowBookingMessages ?? true),
        pricing: {
          basicMonthly: basic,
          proMonthly: pro,
          vipMonthly: vip,
          dailySession: basic,
          weeklyPlan: pro,
          monthlyPlan: vip,
        },
      };
    });

    if (hasRemovedFake) {
      localStorage.setItem(STORAGE_COACHES, JSON.stringify(normalized.length > 0 ? normalized : INITIAL_COACHES));
    }

    return normalized.length > 0 ? normalized : INITIAL_COACHES;
  } catch {
    return INITIAL_COACHES;
  }
}

export function saveStoredCoaches(coaches: CoachTrainer[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_COACHES, JSON.stringify(coaches));
    window.dispatchEvent(new Event(EVENT_BOOKING));
  } catch (err) {
    console.error("Falha ao salvar lista de treinadores:", err);
  }
}

// Helper interno para obter o usuário autenticado sem dependência circular
function getLocalAuthUser(): { id?: string; activeRole?: "student" | "coach"; name?: string; phone?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("gymflow_current_user_v4");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Flag de sincronização de agendamentos em memória
let hasTriggeredBookingsSupabaseSync = false;

export function getAllRawBookings(): BookingRequest[] {
  if (typeof window === "undefined") return INITIAL_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const cleaned = parsed.filter(
      (b: any) =>
        b &&
        !/^b_(seg|ter|qua|qui|sex|sab)_/i.test(b.id) &&
        b.coachId !== "coach_principal" &&
        b.coachName !== "Treinador Principal"
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function getCoachBookings(coachId: string): BookingRequest[] {
  const all = getAllRawBookings();
  if (!coachId) return [];
  return all.filter((b) => b.coachId === coachId);
}

export function getStudentBookings(studentId: string): BookingRequest[] {
  const all = getAllRawBookings();
  if (!studentId) return [];
  return all.filter((b) => b.studentId === studentId);
}

export function getStoredBookings(userId?: string, role?: "student" | "coach"): BookingRequest[] {
  if (typeof window === "undefined") return INITIAL_BOOKINGS;

  const authUser = getLocalAuthUser();
  const targetId = userId || authUser?.id;
  const targetRole = role || authUser?.activeRole;

  if (!hasTriggeredBookingsSupabaseSync) {
    hasTriggeredBookingsSupabaseSync = true;
    const coachIdParam = targetRole === "coach" ? targetId : undefined;
    const studentIdParam = targetRole === "student" ? targetId : undefined;
    fetchBookingsFromSupabase(coachIdParam, studentIdParam).then((remoteBookings) => {
      if (remoteBookings && remoteBookings.length > 0) {
        const current = getAllRawBookings();
        const remoteMap = new Map(remoteBookings.map((b) => [b.id, b]));
        const merged = [
          ...remoteBookings,
          ...current.filter((b) => !remoteMap.has(b.id)),
        ];
        localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(merged));
        window.dispatchEvent(new Event(EVENT_BOOKING));
      }
    }).catch(() => {});
  }

  const all = getAllRawBookings();

  if (!targetId || targetId === "user_me") {
    return all;
  }

  if (targetRole === "coach") {
    return all.filter((b) => b.coachId === targetId);
  } else if (targetRole === "student") {
    return all.filter((b) => b.studentId === targetId);
  }

  return all.filter((b) => b.coachId === targetId || b.studentId === targetId);
}

export function saveStoredBookings(bookings: BookingRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(bookings));
    window.dispatchEvent(new Event(EVENT_BOOKING));
  } catch (err) {
    console.error("Falha ao salvar agendamentos:", err);
  }
}

export function getAllRawNotifications(): AppNotification[] {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function getStoredNotifications(userId?: string, role?: "student" | "coach"): AppNotification[] {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  const raw = getAllRawNotifications();
  const authUser = getLocalAuthUser();
  const targetId = userId || authUser?.id;
  const targetRole = role || authUser?.activeRole;

  if (!targetId || targetId === "user_me") {
    return targetRole ? raw.filter((n) => n.targetRole === targetRole) : raw;
  }

  return raw.filter((n) => {
    if (targetRole && n.targetRole !== targetRole) return false;
    if (n.targetRole === "coach") {
      if (n.coachId) {
        return n.coachId === targetId;
      }
      return targetId === "coach_rodrigo" || targetId === "coach_default";
    } else {
      if (n.studentId) {
        return n.studentId === targetId;
      }
      return targetId === "student_carlos" || targetId === "student_user";
    }
  });
}

// ----------------------------------------------------------------------
// NOTIFICAÇÕES ENGINE & FILTROS DE PREFERÊNCIA DO USUÁRIO
// ----------------------------------------------------------------------

export function isNotificationTypePermitted(type: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem("gymflow_notification_prefs_v2");
    if (!raw) return true;
    const prefs = JSON.parse(raw);
    if (type === "achievement_unlocked" && prefs.pushAchievements === false) return false;
    if (type === "coach" && prefs.pushCoachMessages === false) return false;
    if (type === "payment" && prefs.whatsappPaymentAlerts === false) return false;
    if (type === "booking" && prefs.whatsappClassAlerts === false) return false;
    return true;
  } catch {
    return true;
  }
}

export function isWithinQuietHours(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("gymflow_notification_prefs_v2");
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    if (!prefs.quietHoursEnabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = (prefs.quietHoursStart || "22:00").split(":").map(Number);
    const [eH, eM] = (prefs.quietHoursEnd || "07:00").split(":").map(Number);
    const startMinutes = (sH ?? 22) * 60 + (sM ?? 0);
    const endMinutes = (eH ?? 7) * 60 + (eM ?? 0);

    if (startMinutes > endMinutes) {
      // Cruzou a meia-noite (ex: 22:00 às 07:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

export function addNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">): void {
  if (typeof window === "undefined") return;

  // Verifica se o usuário desabilitou esta categoria de notificação
  if (!isNotificationTypePermitted(notif.type)) {
    return;
  }

  const list = getAllRawNotifications();
  const isQuiet = isWithinQuietHours();

  const newItem: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    read: false,
  };
  const updated = [newItem, ...list];
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === "undefined") return;
  const list = getAllRawNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

export function markAllNotificationsAsRead(): void {
  if (typeof window === "undefined") return;
  const list = getAllRawNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

// ----------------------------------------------------------------------
// BOOKING ACTIONS (ALUNO & PROFESSOR)
// ----------------------------------------------------------------------

export function calculateSlotEndTime(startTime: string, durationMinutes: number = 60): string {
  if (!startTime) return "";
  const parts = startTime.split(":");
  if (parts.length < 2) return startTime;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (isNaN(h)) return startTime;

  const totalMinutes = h * 60 + m + (durationMinutes || 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function formatSlotTimeSpan(startTime: string, durationMinutes: number = 60): {
  startTime: string;
  endTime: string;
  timeSpan: string;
  durationLabel: string;
} {
  const endTime = calculateSlotEndTime(startTime, durationMinutes);
  const durationLabel =
    durationMinutes >= 60
      ? `${durationMinutes / 60 === 1 ? "1h" : `${(durationMinutes / 60).toFixed(1).replace(".0", "")}h`}`
      : `${durationMinutes}m`;
  return {
    startTime,
    endTime,
    timeSpan: `${startTime} - ${endTime}`,
    durationLabel,
  };
}

export function setupRecurringStudentSchedule(params: {
  studentId: string;
  studentName: string;
  studentPhone?: string;
  coachId: string;
  coachName?: string;
  coachPhone?: string;
  daysOfWeek: string[]; // ex: ["Segunda", "Quarta", "Sexta"]
  startTime: string;    // ex: "09:00"
  durationMinutes?: number; // ex: 60 (1 hora)
  planType?: "basico" | "pro" | "vip" | "diario" | "semanal" | "mensal";
  workoutTitles?: string[]; // ex: ["Treino A - Peitoral", "Treino B - Costas", "Treino C - Pernas"]
}): BookingRequest[] {
  const coaches = getStoredCoaches();
  const coach = coaches.find((c) => c.id === params.coachId);
  const resolvedCoachName = params.coachName || coach?.name || "Personal Trainer";
  const resolvedCoachPhone = params.coachPhone || coach?.phone || "";
  const duration = params.durationMinutes || 60;

  const currentBookings = getAllRawBookings();
  // Filtra agendamentos recorrentes anteriores desse aluno com esse coach para não duplicar
  const filtered = currentBookings.filter(
    (b) => !(b.studentId === params.studentId && b.coachId === params.coachId && b.id.startsWith("rec_"))
  );

  const newBookings: BookingRequest[] = params.daysOfWeek.map((day, idx) => {
    const defaultTitle = params.workoutTitles?.[idx] || `Treino ${String.fromCharCode(65 + idx)}`;
    return {
      id: `rec_${params.studentId}_${day.toLowerCase().slice(0, 3)}_${Date.now()}_${idx}`,
      studentId: params.studentId,
      studentName: params.studentName,
      studentPhone: params.studentPhone || "",
      coachId: params.coachId,
      coachName: resolvedCoachName,
      coachPhone: resolvedCoachPhone,
      slotDay: day,
      slotTime: params.startTime,
      durationMinutes: duration,
      workoutTitle: defaultTitle,
      planType: params.planType || "pro",
      basePrice: 45,
      extraOfferedAmount: 0,
      totalPrice: 45,
      status: "accepted",
      paymentStatus: "paid",
      attendanceStatus: "scheduled",
      notes: `Acompanhamento Recorrente (${params.daysOfWeek.length}x na semana, ${duration >= 60 ? `${Math.floor(duration / 60)}h` : `${duration}m`} por sessão).`,
      createdAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    };
  });

  const updated = [...newBookings, ...filtered];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_BOOKING));

    // Atualiza weeklySchedule no perfil do estudante em todos os armazenamentos
    try {
      const scheduleStrings = params.daysOfWeek.map((d) => `${d.split("-")[0].trim()} · ${params.startTime}`);
      const studentKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === "gymflow_students_v3" || k.startsWith("gymflow_students_"))) {
          studentKeys.push(k);
        }
      }
      for (const k of studentKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          const list = JSON.parse(val);
          if (Array.isArray(list)) {
            let changed = false;
            const updatedList = list.map((st: any) => {
              if (st.id === params.studentId || (params.studentName && st.name === params.studentName)) {
                changed = true;
                return {
                  ...st,
                  weeklySchedule: scheduleStrings,
                  scheduledTimeToday: params.startTime,
                  plan: `${params.daysOfWeek.length}x na semana (${duration >= 60 ? `${Math.floor(duration / 60)}h` : `${duration}m`}/aula)`,
                };
              }
              return st;
            });
            if (changed) {
              localStorage.setItem(k, JSON.stringify(updatedList));
            }
          }
        }
      }
    } catch {}
  }

  return newBookings;
}

export function requestTrainerBooking(params: {
  studentId: string;
  studentName: string;
  studentPhone: string;
  coachId: string;
  slotDay: string;
  slotTime: string;
  planType: "basico" | "pro" | "vip" | "diario" | "semanal" | "mensal";
  extraOfferedAmount: number;
  notes?: string;
  durationMinutes?: number;
  workoutTitle?: string;
}): BookingRequest {
  const coaches = getStoredCoaches();
  const coach = coaches.find((c) => c.id === params.coachId);
  const resolvedCoachId = coach ? coach.id : params.coachId;
  const resolvedCoachName = coach ? coach.name : "Personal Trainer";
  const resolvedCoachPhone = coach ? coach.phone : "";
  const duration = params.durationMinutes || 60;

  const basePrice = coach
    ? params.planType === "basico" || params.planType === "diario"
      ? (coach.pricing.basicMonthly ?? coach.pricing.dailySession ?? 35)
      : params.planType === "pro" || params.planType === "semanal"
      ? (coach.pricing.proMonthly ?? coach.pricing.weeklyPlan ?? 45)
      : (coach.pricing.vipMonthly ?? coach.pricing.monthlyPlan ?? 55)
    : 45;

  const totalPrice = basePrice + Math.max(0, params.extraOfferedAmount);

  const newBooking: BookingRequest = {
    id: `book_${Date.now()}`,
    studentId: params.studentId,
    studentName: params.studentName,
    studentPhone: params.studentPhone,
    coachId: resolvedCoachId,
    coachName: resolvedCoachName,
    coachPhone: resolvedCoachPhone,
    slotDay: params.slotDay,
    slotTime: params.slotTime,
    durationMinutes: duration,
    workoutTitle: params.workoutTitle || "Treino Presencial",
    planType: params.planType,
    basePrice,
    extraOfferedAmount: params.extraOfferedAmount,
    totalPrice,
    status: "pending", // Status inicial PENDENTE para aprovação do treinador
    paymentStatus: "paid", // Plano pago pelo aluno
    attendanceStatus: "pending",
    notes: params.notes,
    createdAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  };

  const bookings = getAllRawBookings();
  const updatedBookings = [newBooking, ...bookings];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updatedBookings));

    // Notifica o treinador sobre a nova solicitação de contratação pendente
    addNotification({
      targetRole: "coach",
      coachId: resolvedCoachId,
      studentId: params.studentId,
      type: "training_reminder",
      title: "Nova Solicitação de Contratação! 🔔",
      message: `${params.studentName} contratou seu plano (${params.planType.toUpperCase()}) para ${params.slotDay} às ${params.slotTime}. Toque para aceitar e matricular o aluno.`,
      actionUrl: "/coach/agenda",
    });

    // Notifica o aluno confirmando que o pedido foi enviado com sucesso
    addNotification({
      targetRole: "student",
      studentId: params.studentId,
      coachId: resolvedCoachId,
      type: "training_reminder",
      title: "Solicitação Enviada! ⏳",
      message: `Sua contratação foi enviada para ${resolvedCoachName}. Você receberá uma notificação assim que o personal confirmar.`,
    });

    window.dispatchEvent(new Event(EVENT_BOOKING));
    window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
  }

  // Sincroniza nova reserva com Supabase
  saveBookingToSupabase(newBooking).catch(() => {});

  return newBooking;
}

/**
 * Treinador aceita a solicitação de contratação do aluno:
 * 1. Atualiza status do agendamento para 'accepted'
 * 2. Matricula automaticamente o aluno no roster do treinador no workout-store com o plano pago
 * 3. Prepara a ficha com status 'Aguardando Prescrição' para que o treinador possa prescrever imediatamente
 * 4. Gera a grade de horários recorrentes caso o plano seja semanal/mensal
 * 5. Notifica o aluno sobre a confirmação
 */
export function acceptTrainerBooking(bookingId: string): BookingRequest | null {
  if (typeof window === "undefined") return null;
  const bookings = getAllRawBookings();
  const bookingIndex = bookings.findIndex((b) => b.id === bookingId);
  if (bookingIndex < 0) return null;

  const targetBooking = bookings[bookingIndex];
  const updatedBooking: BookingRequest = {
    ...targetBooking,
    status: "accepted",
    paymentStatus: "paid",
    attendanceStatus: "scheduled",
  };

  const updatedBookings = bookings.map((b, idx) => (idx === bookingIndex ? updatedBooking : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updatedBookings));

  // 1. Resolve os dados e frequência do plano
  const planType = updatedBooking.planType;
  let planLabel = "Mensal Pro (R$ 45/mês)";
  let daysOfWeek = ["Segunda", "Quarta", "Sexta"];
  const duration = updatedBooking.durationMinutes || 60;

  if (planType === "vip" || planType === "mensal") {
    planLabel = "Mensal VIP (R$ 55/mês)";
    daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  } else if (planType === "basico" || planType === "diario") {
    planLabel = "Mensal Básico (R$ 35/mês)";
    daysOfWeek = ["Segunda", "Quarta"];
  }

  // 2. Matricula o aluno no roster do treinador
  try {
    const coachKey = updatedBooking.coachId && updatedBooking.coachId !== "user_me"
      ? `gymflow_students_${updatedBooking.coachId}`
      : "gymflow_students_v3";

    const existingStudentsRaw = localStorage.getItem(coachKey) || localStorage.getItem("gymflow_students_v3");
    const existingList: any[] = existingStudentsRaw ? JSON.parse(existingStudentsRaw) : [];

    const existingIdx = existingList.findIndex(
      (s) =>
        s.id === updatedBooking.studentId ||
        (updatedBooking.studentPhone && s.phone === updatedBooking.studentPhone) ||
        (updatedBooking.studentName && s.name?.toLowerCase() === updatedBooking.studentName.toLowerCase())
    );

    const scheduleStrings = daysOfWeek.map((d) => `${d} · ${updatedBooking.slotTime}`);

    const studentRecord: any = {
      id: updatedBooking.studentId || `student_${Date.now()}`,
      coachId: updatedBooking.coachId,
      name: updatedBooking.studentName,
      phone: updatedBooking.studentPhone || "",
      matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
      goal: "Hipertrofia",
      plan: planLabel,
      status: "ativo",
      paymentStatus: "pago",
      paymentDueDate: "Dia 10",
      monthlyPresence: 0,
      monthlyAbsences: 0,
      totalClasses: 0,
      hasWorkoutSheet: true,
      isOfflineStudent: false,
      age: 26,
      currentRoutineTitle: "Treino Personalizado",
      prescribedBy: updatedBooking.coachName,
      prescribedAt: "Hoje",
      scheduledTimeToday: updatedBooking.slotTime,
      weeklySchedule: scheduleStrings,
      notes: updatedBooking.notes || `Aluno admitido via contratação do plano ${planLabel}.`,
    };

    if (existingIdx >= 0) {
      existingList[existingIdx] = {
        ...existingList[existingIdx],
        ...studentRecord,
        id: existingList[existingIdx].id || studentRecord.id,
      };
    } else {
      existingList.unshift(studentRecord);
    }

    localStorage.setItem(coachKey, JSON.stringify(existingList));
    localStorage.setItem("gymflow_students_v3", JSON.stringify(existingList));

    // Inicializa pacote de treino com isAwaitingCoachPrescription: true para prescrição imediata
    const rawWorkouts = localStorage.getItem("gymflow_student_workouts_v2");
    const workoutsMap = rawWorkouts ? JSON.parse(rawWorkouts) : {};
    if (!workoutsMap[studentRecord.id] || !workoutsMap[studentRecord.id].splits || workoutsMap[studentRecord.id].splits.length === 0) {
      workoutsMap[studentRecord.id] = {
        studentId: studentRecord.id,
        routineTitle: `Treino com ${updatedBooking.coachName}`,
        prescribedBy: updatedBooking.coachName,
        prescribedAt: "Hoje",
        isAwaitingCoachPrescription: true,
        hasPersonalTrainer: true,
        coachName: updatedBooking.coachName,
        coachPhone: updatedBooking.coachPhone,
        splits: [],
      };
      localStorage.setItem("gymflow_student_workouts_v2", JSON.stringify(workoutsMap));
    }
  } catch (err) {
    console.error("Erro ao matricular aluno no store do treinador:", err);
  }

  // 3. Se plano é recorrente, gera as sessões na grade
  setupRecurringStudentSchedule({
    studentId: updatedBooking.studentId,
    studentName: updatedBooking.studentName,
    studentPhone: updatedBooking.studentPhone,
    coachId: updatedBooking.coachId,
    coachName: updatedBooking.coachName,
    coachPhone: updatedBooking.coachPhone,
    daysOfWeek,
    startTime: updatedBooking.slotTime,
    durationMinutes: duration,
    planType: updatedBooking.planType,
  });

  // 4. Notifica o aluno
  addNotification({
    targetRole: "student",
    studentId: updatedBooking.studentId,
    coachId: updatedBooking.coachId,
    type: "booking_accepted",
    title: "Contratação Confirmada pelo Personal! 🏋️‍♂️",
    message: `${updatedBooking.coachName} aceitou sua solicitação! Seu treino para ${updatedBooking.slotDay} às ${updatedBooking.slotTime} está confirmado e o professor já pode prescrever sua ficha.`,
  });

  // 5. Salva no Supabase
  saveBookingToSupabase(updatedBooking).catch(() => {});

  window.dispatchEvent(new Event(EVENT_BOOKING));
  window.dispatchEvent(new Event("gymflow:workout-updated"));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));

  return updatedBooking;
}

/**
 * Treinador recusa a solicitação de contratação ou horário do aluno:
 * 1. Atualiza status para 'rejected'
 * 2. Notifica o aluno sobre a recusa com o motivo
 * 3. Salva no Supabase
 */
export function rejectTrainerBooking(bookingId: string, reason?: string): BookingRequest | null {
  if (typeof window === "undefined") return null;
  const bookings = getAllRawBookings();
  const bookingIndex = bookings.findIndex((b) => b.id === bookingId);
  if (bookingIndex < 0) return null;

  const targetBooking = bookings[bookingIndex];
  const updatedBooking: BookingRequest = {
    ...targetBooking,
    status: "rejected",
    attendanceStatus: "missed",
    notes: reason ? `Recusado pelo professor: ${reason}` : targetBooking.notes,
  };

  const updatedBookings = bookings.map((b, idx) => (idx === bookingIndex ? updatedBooking : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updatedBookings));

  // Notifica o aluno
  addNotification({
    targetRole: "student",
    studentId: targetBooking.studentId,
    coachId: targetBooking.coachId,
    type: "rescheduled",
    title: "Solicitação Não Aceita ❌",
    message: `${targetBooking.coachName} não pôde aceitar o agendamento no horário solicitado (${targetBooking.slotDay} às ${targetBooking.slotTime})${
      reason ? ` (Motivo: "${reason}")` : ""
    }. Por favor, selecione outro horário disponível ou outro treinador.`,
  });

  saveBookingToSupabase(updatedBooking).catch(() => {});

  window.dispatchEvent(new Event(EVENT_BOOKING));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));

  return updatedBooking;
}

export function updateBookingStatus(
  bookingId: string,
  newStatus: "accepted" | "rejected" | "completed"
): void {
  if (typeof window === "undefined") return;
  if (newStatus === "accepted") {
    acceptTrainerBooking(bookingId);
    return;
  }
  if (newStatus === "rejected") {
    rejectTrainerBooking(bookingId);
    return;
  }
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  const updatedBooking = updated.find((b) => b.id === bookingId);
  if (updatedBooking) {
    saveBookingToSupabase(updatedBooking).catch(() => {});
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
}

/**
 * Aluno encerra o vínculo / acompanhamento com o Personal Trainer
 * - Remove agendamentos com aquele coach na grade (desocupando as vagas para outros alunos)
 * - Notifica o treinador que os horários foram liberados
 * - Notifica o aluno confirmando o encerramento do acompanhamento
 */
export function studentLeaveCoach(params: {
  studentId: string;
  studentName: string;
  coachId?: string;
  coachName?: string;
  reason?: string;
}): void {
  if (typeof window === "undefined") return;

  const bookings = getStoredBookings();
  const filtered = bookings.filter((b) => {
    if (params.coachId) {
      return !(b.studentId === params.studentId && b.coachId === params.coachId);
    }
    return b.studentId !== params.studentId;
  });

  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(filtered));

  // Notifica o treinador
  addNotification({
    targetRole: "coach",
    coachId: params.coachId,
    type: "training_reminder",
    title: "Desligamento de Aluno 🚪",
    message: `${params.studentName} optou por encerrar o acompanhamento com você${
      params.reason ? ` (Motivo: "${params.reason}")` : ""
    }. Os horários dele foram liberados na grade da sua agenda.`,
  });

  // Notifica o aluno
  addNotification({
    targetRole: "student",
    studentId: params.studentId,
    type: "workout_updated",
    title: "Acompanhamento Encerrado",
    message: `Você encerrou o vínculo com ${
      params.coachName || "o seu personal"
    }. Seus horários foram desocupados. Você pode treinar livremente ou escolher outro personal a qualquer momento!`,
  });

  window.dispatchEvent(new Event(EVENT_BOOKING));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

export function updatePaymentStatus(
  bookingId: string,
  paymentStatus: "paid" | "pending" | "overdue"
): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, paymentStatus } : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  if (paymentStatus === "paid") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "payment_confirmed",
      title: "Pagamento Confirmado ✅",
      message: `${booking.coachName} marcou o pagamento de R$ ${booking.totalPrice.toFixed(2)} como concluído!`,
    });
  } else if (paymentStatus === "overdue") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "payment_overdue",
      title: "Aviso de Pagamento Pendente ⚠️",
      message: `O pagamento do seu plano com ${booking.coachName} consta como em aberto/atrasado. Regularize para garantir seus horários.`,
    });
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function updateAttendanceStatus(
  bookingId: string,
  attendanceStatus: "attended" | "missed" | "delayed" | "rescheduled" | "justified" | "pending",
  delayMinutes: number = 15
): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, attendanceStatus } : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  // Sincroniza imediatamente o perfil do aluno em gymflow_students_v3
  if (booking.studentId) {
    try {
      const rawStudents = localStorage.getItem("gymflow_students_v3");
      if (rawStudents) {
        const studentsList: any[] = JSON.parse(rawStudents);
        const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        let changedStudent = false;

        const updatedStudents = studentsList.map((st) => {
          if (st.id === booking.studentId) {
            changedStudent = true;
            if (attendanceStatus === "attended") {
              return {
                ...st,
                todayAttendanceStatus: "presente",
                monthlyPresence: (st.monthlyPresence || 0) + 1,
                totalClasses: (st.totalClasses || 0) + 1,
                lastPresence: `Hoje às ${timeNow}`,
                delayMinutes: undefined,
              };
            } else if (attendanceStatus === "missed") {
              return {
                ...st,
                todayAttendanceStatus: "falta",
                monthlyAbsences: (st.monthlyAbsences || 0) + 1,
                delayMinutes: undefined,
              };
            } else if (attendanceStatus === "delayed") {
              return {
                ...st,
                todayAttendanceStatus: "atraso",
                monthlyDelays: (st.monthlyDelays || 0) + 1,
                delayMinutes,
                lastPresence: `Hoje às ${timeNow} (${delayMinutes}m atraso)`,
              };
            } else {
              return {
                ...st,
                todayAttendanceStatus: "agendado",
                delayMinutes: undefined,
              };
            }
          }
          return st;
        });

        if (changedStudent) {
          localStorage.setItem("gymflow_students_v3", JSON.stringify(updatedStudents));
          window.dispatchEvent(new Event("gymflow:workout-updated"));
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar perfil do aluno em updateAttendanceStatus:", err);
    }
  }

  const updatedBooking = updated.find((b) => b.id === bookingId);
  if (updatedBooking) {
    saveBookingToSupabase(updatedBooking).catch(() => {});
  }

  if (attendanceStatus === "attended") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "training_reminder",
      title: "Presença Registrada! 🔥",
      message: `Treino de ${booking.slotDay} às ${booking.slotTime} concluído com sucesso. Parabéns pela disciplina!`,
    });
  } else if (attendanceStatus === "missed") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "missed_class",
      title: "Falta Registrada no Treino ❌",
      message: `${booking.coachName} registrou ausência no horário das ${booking.slotTime}. Lembre-se de avisar com antecedência caso não possa comparecer.`,
    });
  } else if (attendanceStatus === "justified") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "training_reminder",
      title: "Falta Justificada Registrada ⚠️",
      message: `Sua ausência para ${booking.slotDay} às ${booking.slotTime} foi justificada pelo professor ${booking.coachName}.`,
    });
  } else if (attendanceStatus === "delayed") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "delay_warning",
      title: "Aviso de Atraso Registrado ⚠️",
      message: `${booking.coachName} registrou atraso de ${delayMinutes} min no seu treino das ${booking.slotTime}. Acelere para aproveitar o tempo no salão!`,
    });
  } else if (attendanceStatus === "rescheduled") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "rescheduled",
      title: "Horário Reagendado 🔁",
      message: `Seu treino presencial com ${booking.coachName} foi remarcado. Verifique os novos detalhes em seus agendamentos.`,
    });
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function updateCoachSlots(
  coachId: string,
  newSlots: TrainerSlot[]
): void {
  if (typeof window === "undefined") return;
  const coaches = getStoredCoaches();
  const updated = coaches.map((c) => (c.id === coachId ? { ...c, slots: newSlots } : c));
  localStorage.setItem(STORAGE_COACHES, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function updateCoachPricing(
  coachId: string,
  pricing: CoachTrainer["pricing"]
): void {
  if (typeof window === "undefined") return;
  const coaches = getStoredCoaches();
  const updated = coaches.map((c) => (c.id === coachId ? { ...c, pricing } : c));
  localStorage.setItem(STORAGE_COACHES, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function occupySlot(
  coachId: string,
  slotId: string,
  studentName: string,
  studentId?: string,
  studentPlan?: string
): void {
  if (typeof window === "undefined") return;
  const coaches = getStoredCoaches();
  const updated = coaches.map((c) => {
    if (c.id === coachId) {
      return {
        ...c,
        slots: c.slots.map((s) =>
          s.id === slotId
            ? {
                ...s,
                isAvailable: false,
                studentName,
                studentId: studentId || `student_offline_${Date.now()}`,
                studentPlan: studentPlan || "Presencial Individual",
              }
            : s
        ),
      };
    }
    return c;
  });
  localStorage.setItem(STORAGE_COACHES, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function freeSlot(coachId: string, slotId: string): void {
  if (typeof window === "undefined") return;
  const coaches = getStoredCoaches();
  const updated = coaches.map((c) => {
    if (c.id === coachId) {
      return {
        ...c,
        slots: c.slots.map((s) =>
          s.id === slotId
            ? {
                ...s,
                isAvailable: true,
                studentName: undefined,
                studentId: undefined,
                studentPlan: undefined,
              }
            : s
        ),
      };
    }
    return c;
  });
  localStorage.setItem(STORAGE_COACHES, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function requestReschedule(params: {
  bookingId: string;
  requestedBy: "student" | "coach";
  proposedDay: string;
  proposedTime: string;
  reason?: string;
}): RescheduleProposal | null {
  if (typeof window === "undefined") return null;
  const bookings = getAllRawBookings();
  const bookingIndex = bookings.findIndex((b) => b.id === params.bookingId);
  if (bookingIndex < 0) return null;

  const booking = bookings[bookingIndex];
  const proposal: RescheduleProposal = {
    id: `resched_${Date.now()}`,
    requestedBy: params.requestedBy,
    proposedDay: params.proposedDay,
    proposedTime: params.proposedTime,
    reason: params.reason,
    status: "pending",
    createdAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  };

  const updatedBooking: BookingRequest = {
    ...booking,
    rescheduleRequest: proposal,
  };

  const updated = bookings.map((b, idx) => (idx === bookingIndex ? updatedBooking : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  // Notificação para a outra parte
  if (params.requestedBy === "student") {
    addNotification({
      targetRole: "coach",
      coachId: booking.coachId,
      studentId: booking.studentId,
      type: "rescheduled",
      title: "Solicitação de Remanejamento de Horário 🔄",
      message: `${booking.studentName} solicitou mudar o treino de ${booking.slotDay} (${booking.slotTime}) para ${params.proposedDay} às ${params.proposedTime}${params.reason ? ` (Motivo: "${params.reason}")` : ""}.`,
    });
  } else {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      coachId: booking.coachId,
      type: "rescheduled",
      title: "Proposta de Novo Horário do Treinador 🔄",
      message: `${booking.coachName} sugeriu alterar seu treino para ${params.proposedDay} às ${params.proposedTime}. Verifique na sua agenda para aceitar.`,
    });
  }

  saveBookingToSupabase(updatedBooking).catch(() => {});

  window.dispatchEvent(new Event(EVENT_BOOKING));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));

  return proposal;
}

export function respondToReschedule(bookingId: string, accept: boolean): BookingRequest | null {
  if (typeof window === "undefined") return null;
  const bookings = getAllRawBookings();
  const bookingIndex = bookings.findIndex((b) => b.id === bookingId);
  if (bookingIndex < 0) return null;

  const booking = bookings[bookingIndex];
  if (!booking.rescheduleRequest) return null;

  const req = booking.rescheduleRequest;
  let updatedBooking: BookingRequest;

  if (accept) {
    updatedBooking = {
      ...booking,
      slotDay: req.proposedDay,
      slotTime: req.proposedTime,
      attendanceStatus: "rescheduled" as const,
      rescheduleRequest: {
        ...req,
        status: "accepted" as const,
      },
    };

    const updated = bookings.map((b, idx) => (idx === bookingIndex ? updatedBooking : b));
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

    // Notifica quem solicitou que foi aceito
    if (req.requestedBy === "student") {
      addNotification({
        targetRole: "student",
        studentId: booking.studentId,
        coachId: booking.coachId,
        type: "booking_accepted",
        title: "Remanejamento Aceito! ✅",
        message: `${booking.coachName} aprovou sua mudança de horário para ${req.proposedDay} às ${req.proposedTime}.`,
      });
    } else {
      addNotification({
        targetRole: "coach",
        coachId: booking.coachId,
        studentId: booking.studentId,
        type: "booking_accepted",
        title: "Aluno Concordou com o Novo Horário! ✅",
        message: `${booking.studentName} aceitou o treino remanejado para ${req.proposedDay} às ${req.proposedTime}.`,
      });
    }

    saveBookingToSupabase(updatedBooking).catch(() => {});
  } else {
    updatedBooking = {
      ...booking,
      rescheduleRequest: {
        ...req,
        status: "rejected" as const,
      },
    };

    const updated = bookings.map((b, idx) => (idx === bookingIndex ? updatedBooking : b));
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

    if (req.requestedBy === "student") {
      addNotification({
        targetRole: "student",
        studentId: booking.studentId,
        coachId: booking.coachId,
        type: "rescheduled",
        title: "Remanejamento Recusado ❌",
        message: `${booking.coachName} não pôde atender no horário sugerido. O horário original (${booking.slotDay} às ${booking.slotTime}) foi mantido.`,
      });
    } else {
      addNotification({
        targetRole: "coach",
        coachId: booking.coachId,
        studentId: booking.studentId,
        type: "rescheduled",
        title: "Aluno Manteve o Horário Original ❌",
        message: `${booking.studentName} não pôde aceitar a nova data sugerida. Horário mantido.`,
      });
    }

    saveBookingToSupabase(updatedBooking).catch(() => {});
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));

  return updatedBooking;
}

export function updateBookingNotes(bookingId: string, notes: string): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, notes } : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));

  const match = updated.find((b) => b.id === bookingId);
  if (match) {
    saveBookingToSupabase(match).catch(() => {});
  }
}

export const EVENT_COACHES_UPDATED = "gymflow:coaches-updated";

export function updateCoachPublicProfile(coachId: string, profile: Partial<CoachTrainer>): void {
  if (typeof window === "undefined") return;
  const coaches = getStoredCoaches();

  // Busca coach existente por ID, e-mail, telefone ou nome normalizado
  const normalize = (str?: string) =>
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const cleanDigits = (str?: string) => (str || "").replace(/\D/g, "");

  const targetName = normalize(profile.name);
  const targetPhone = cleanDigits(profile.phone);
  const targetEmail = normalize(profile.email);

  const existingIndex = coaches.findIndex((c) => {
    if (c.id === coachId) return true;
    if (targetEmail && c.email && normalize(c.email) === targetEmail) return true;
    if (targetPhone && c.phone && cleanDigits(c.phone) === targetPhone) return true;
    if (targetName && normalize(c.name) === targetName) return true;
    return false;
  });

  let updated: CoachTrainer[];
  if (existingIndex >= 0) {
    const matched = coaches[existingIndex];
    updated = coaches.map((c, idx) => (idx === existingIndex ? { ...matched, ...profile, id: matched.id } : c));
  } else {
    const newCoach: CoachTrainer = {
      id: coachId,
      name: profile.name || "Personal Trainer",
      cref: profile.cref,
      avatarUrl: profile.avatarUrl || "",
      phone: profile.phone || "",
      specialty: profile.specialty || "Musculação & Hipertrofia",
      distance: profile.distance || "Na sua unidade",
      rating: profile.rating ?? 5.0,
      reviewCount: profile.reviewCount ?? 1,
      bio: profile.bio || "Personal Trainer no GymFlow.",
      instagram: profile.instagram,
      location: profile.location || "Salão Principal",
      city: profile.city,
      state: profile.state,
      neighborhood: profile.neighborhood,
      latitude: profile.latitude,
      longitude: profile.longitude,
      operatingRadiusKm: profile.operatingRadiusKm,
      serviceModality: profile.serviceModality || "presencial",
      coachPlans: profile.coachPlans,
      pixKey: profile.pixKey,
      pixKeyType: profile.pixKeyType,
      pixName: profile.pixName,
      pixBank: profile.pixBank,
      allowBookingMessages: profile.allowBookingMessages !== undefined ? profile.allowBookingMessages : true,
      pricing: profile.pricing || {
        basicMonthly: 35,
        proMonthly: 45,
        vipMonthly: 55,
      },
      slots: profile.slots || [],
    };
    updated = [newCoach, ...coaches];
  }

  localStorage.setItem(STORAGE_COACHES, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));
  window.dispatchEvent(new Event(EVENT_COACHES_UPDATED));
  window.dispatchEvent(new Event("gymflow:auth-changed"));
}

// ----------------------------------------------------------------------
// SUBSCRIPTIONS
// ----------------------------------------------------------------------

export function subscribeToCoaches(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_COACHES_UPDATED, callback);
  window.addEventListener(EVENT_BOOKING, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_COACHES_UPDATED, callback);
    window.removeEventListener(EVENT_BOOKING, callback);
    window.removeEventListener("storage", callback);
  };
}

export function subscribeToBookings(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_BOOKING, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_BOOKING, callback);
    window.removeEventListener("storage", callback);
  };
}

export function subscribeToNotifications(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NOTIFICATIONS, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NOTIFICATIONS, callback);
    window.removeEventListener("storage", callback);
  };
}
