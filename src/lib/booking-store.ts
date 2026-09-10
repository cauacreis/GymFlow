/**
 * Personal Trainer Barber-Style Booking & Notification Store
 * Gerenciamento de agenda de personais, solicitações de treino presencial,
 * planos (diário, semanal, mensal), ofertas de valor extra, pagamentos e notificações.
 */

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
  pricing: {
    basicMonthly: number; // R$ 35/mês (Plano Básico)
    proMonthly: number;   // R$ 45/mês (Plano Pro)
    vipMonthly: number;   // R$ 55/mês (Plano VIP)
    dailySession?: number; // Compatibilidade legada
    weeklyPlan?: number;
    monthlyPlan?: number;
  };
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
  attendanceStatus: "scheduled" | "attended" | "missed" | "rescheduled";
  notes?: string;
  createdAt: string;
  rescheduleRequest?: RescheduleProposal;
}

export interface AppNotification {
  id: string;
  targetRole: "student" | "coach";
  studentId?: string;
  coachId?: string;
  type: "training_reminder" | "payment_confirmed" | "payment_overdue" | "missed_class" | "booking_accepted" | "rescheduled";
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

  // Se tem prefixo compatível
  if (slotDay.startsWith(targetDay) || targetDay.startsWith(slotDay)) return true;

  return false;
}

const STORAGE_COACHES = "gymflow_coaches_v3";
const STORAGE_BOOKINGS = "gymflow_bookings_v2";
const STORAGE_NOTIFICATIONS = "gymflow_notifications_v1";

const EVENT_BOOKING = "gymflow:booking-updated";
const EVENT_NOTIFICATIONS = "gymflow:notifications-updated";

const INITIAL_COACHES: CoachTrainer[] = [
  {
    id: "coach_rodrigo",
    name: "Prof. Rodrigo Costa",
    cref: "CREF 08412-SP",
    avatarUrl: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=200&q=80",
    phone: "5511987654321",
    specialty: "Hipertrofia, Biomecânica & Força",
    distance: "No salão principal (0m)",
    rating: 4.9,
    reviewCount: 48,
    bio: "Especialista em periodização de alta intensidade e correção postural em exercícios compostos.",
    instagram: "@rodrigo.gymflow",
    location: "Salão Principal • Musculação & Área Funcional",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "s1", day: "Hoje", time: "07:00", isAvailable: false, studentName: "Lucas Mendes", studentPlan: "Mensal Pro" },
      { id: "s2", day: "Hoje", time: "08:00", isAvailable: true },
      { id: "s3", day: "Hoje", time: "09:00", isAvailable: true },
      { id: "s4", day: "Hoje", time: "17:00", isAvailable: true },
      { id: "s5", day: "Hoje", time: "18:00", isAvailable: false, studentName: "Carlos Silva", studentPlan: "Mensal VIP" },
      { id: "s6", day: "Hoje", time: "19:00", isAvailable: true },
      { id: "s7", day: "Amanhã", time: "06:00", isAvailable: true },
      { id: "s8", day: "Amanhã", time: "07:00", isAvailable: true },
      { id: "s9", day: "Amanhã", time: "18:00", isAvailable: true },
      { id: "s10", day: "Quinta", time: "08:00", isAvailable: true },
      { id: "s11", day: "Quinta", time: "19:00", isAvailable: true },
    ],
  },
  {
    id: "coach_camila",
    name: "Profª. Camila Martins",
    cref: "CREF 09332-SP",
    avatarUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=200&q=80",
    phone: "5511976543210",
    specialty: "Glúteos, Definição & Mobilidade",
    distance: "A 250m • Unidade Jardins",
    rating: 5.0,
    reviewCount: 62,
    bio: "Foco em ativação de glúteos, condicionamento metabólico e alinhamento de cintura escapular.",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "c1", day: "Hoje", time: "08:00", isAvailable: true },
      { id: "c2", day: "Hoje", time: "10:00", isAvailable: true },
      { id: "c3", day: "Hoje", time: "16:00", isAvailable: true },
      { id: "c4", day: "Amanhã", time: "07:00", isAvailable: true },
      { id: "c5", day: "Amanhã", time: "09:00", isAvailable: true },
    ],
  },
  {
    id: "coach_lucas",
    name: "Prof. Lucas Alencar",
    cref: "CREF 11204-SP",
    avatarUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=200&q=80",
    phone: "5511965432109",
    specialty: "Powerlifting & Reabilitação",
    distance: "A 500m • Unidade Paulista",
    rating: 4.8,
    reviewCount: 35,
    bio: "Treinador de atletas de força e reabilitação de joelho e ombro com foco em longevidade.",
    pricing: {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
    slots: [
      { id: "l1", day: "Hoje", time: "06:00", isAvailable: true },
      { id: "l2", day: "Hoje", time: "14:00", isAvailable: true },
      { id: "l3", day: "Hoje", time: "20:00", isAvailable: true },
      { id: "l4", day: "Quinta", time: "07:00", isAvailable: true },
    ],
  },
];

const INITIAL_BOOKINGS: BookingRequest[] = [
  {
    id: "book_001",
    studentId: "student_carlos",
    studentName: "Carlos Silva",
    studentPhone: "5511991234567",
    coachId: "coach_rodrigo",
    coachName: "Prof. Rodrigo Costa",
    coachPhone: "5511987654321",
    slotDay: "Hoje",
    slotTime: "18:00",
    planType: "vip",
    basePrice: 55,
    extraOfferedAmount: 0,
    totalPrice: 55,
    status: "accepted",
    paymentStatus: "paid",
    attendanceStatus: "scheduled",
    notes: "Foco em periodização de hipertrofia e biomecânica.",
    createdAt: "Hoje às 09:15",
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_1",
    targetRole: "student",
    studentId: "student_carlos",
    type: "booking_accepted",
    title: "Agendamento Confirmado! 🏋️",
    message: "Prof. Rodrigo Costa aceitou seu treino presencial para Hoje às 18:00.",
    timestamp: "Hoje às 09:20",
    read: false,
  },
  {
    id: "notif_2",
    targetRole: "student",
    studentId: "student_carlos",
    type: "payment_confirmed",
    title: "Pagamento Concluído ✅",
    message: "O pagamento do Plano Mensal VIP (R$ 55,00) foi confirmado pelo treinador.",
    timestamp: "Hoje às 09:25",
    read: false,
  },
  {
    id: "notif_3",
    targetRole: "student",
    studentId: "student_carlos",
    type: "training_reminder",
    title: "Lembrete de Treino no Salão ⏰",
    message: "Faltam poucas horas para o seu treino com o Prof. Rodrigo às 18:00. Não esqueça a toalha e garrafa!",
    timestamp: "Hoje às 14:00",
    read: false,
  },
];

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
    // Normalização defensiva: garante que os preços 35/45/55 sejam aplicados
    const normalized = list.map((c) => {
      const basic = c.pricing?.basicMonthly && c.pricing.basicMonthly <= 60 ? c.pricing.basicMonthly : 35;
      const pro = c.pricing?.proMonthly && c.pricing.proMonthly <= 75 ? c.pricing.proMonthly : 45;
      const vip = c.pricing?.vipMonthly && c.pricing.vipMonthly <= 90 ? c.pricing.vipMonthly : 55;
      return {
        ...c,
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
    return normalized;
  } catch {
    return INITIAL_COACHES;
  }
}

export function getStoredBookings(): BookingRequest[] {
  if (typeof window === "undefined") return INITIAL_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function getStoredNotifications(): AppNotification[] {
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

// ----------------------------------------------------------------------
// NOTIFICAÇÕES ENGINE
// ----------------------------------------------------------------------

export function addNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">): void {
  if (typeof window === "undefined") return;
  const list = getStoredNotifications();
  const newItem: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}`,
    timestamp: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    read: false,
  };
  const updated = [newItem, ...list];
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === "undefined") return;
  const list = getStoredNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

export function markAllNotificationsAsRead(): void {
  if (typeof window === "undefined") return;
  const list = getStoredNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NOTIFICATIONS));
}

// ----------------------------------------------------------------------
// BOOKING ACTIONS (ALUNO & PROFESSOR)
// ----------------------------------------------------------------------

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
}): BookingRequest {
  const coaches = getStoredCoaches();
  const coach = coaches.find((c) => c.id === params.coachId) || coaches[0];

  const basePrice =
    params.planType === "basico" || params.planType === "diario"
      ? (coach.pricing.basicMonthly ?? coach.pricing.dailySession ?? 35)
      : params.planType === "pro" || params.planType === "semanal"
      ? (coach.pricing.proMonthly ?? coach.pricing.weeklyPlan ?? 45)
      : (coach.pricing.vipMonthly ?? coach.pricing.monthlyPlan ?? 55);

  const totalPrice = basePrice + Math.max(0, params.extraOfferedAmount);

  const newBooking: BookingRequest = {
    id: `book_${Date.now()}`,
    studentId: params.studentId,
    studentName: params.studentName,
    studentPhone: params.studentPhone,
    coachId: coach.id,
    coachName: coach.name,
    coachPhone: coach.phone,
    slotDay: params.slotDay,
    slotTime: params.slotTime,
    planType: params.planType,
    basePrice,
    extraOfferedAmount: params.extraOfferedAmount,
    totalPrice,
    status: "pending",
    paymentStatus: "pending",
    attendanceStatus: "scheduled",
    notes: params.notes,
    createdAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  };

  const bookings = getStoredBookings();
  const updatedBookings = [newBooking, ...bookings];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updatedBookings));

    // Notifica o treinador sobre a nova solicitação
    addNotification({
      targetRole: "coach",
      coachId: coach.id,
      type: "training_reminder",
      title: "Nova Solicitação de Treino! 📅",
      message: `${params.studentName} solicitou o horário de ${params.slotDay} às ${params.slotTime} (Plano ${params.planType.toUpperCase()}${params.extraOfferedAmount > 0 ? ` com +R$ ${params.extraOfferedAmount} extra` : ""}).`,
    });

    window.dispatchEvent(new Event(EVENT_BOOKING));
  }

  return newBooking;
}

export function updateBookingStatus(
  bookingId: string,
  newStatus: "accepted" | "rejected" | "completed"
): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  // Notifica o aluno
  if (newStatus === "accepted") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "booking_accepted",
      title: "Treino Aceito pelo Personal! 🏋️‍♂️",
      message: `${booking.coachName} confirmou seu treino para ${booking.slotDay} às ${booking.slotTime}. Toque para falar no WhatsApp!`,
    });
  } else if (newStatus === "rejected") {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "rescheduled",
      title: "Horário Indisponível ⚠️",
      message: `${booking.coachName} não poderá atender no horário de ${booking.slotTime}. Por favor, selecione outro horário disponível.`,
    });
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
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
  attendanceStatus: "attended" | "missed" | "rescheduled"
): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, attendanceStatus } : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

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
}): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === params.bookingId);
  if (!booking) return;

  const proposal: RescheduleProposal = {
    id: `resched_${Date.now()}`,
    requestedBy: params.requestedBy,
    proposedDay: params.proposedDay,
    proposedTime: params.proposedTime,
    reason: params.reason,
    status: "pending",
    createdAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  };

  const updated = bookings.map((b) =>
    b.id === params.bookingId
      ? {
          ...b,
          rescheduleRequest: proposal,
        }
      : b
  );
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  // Notificação para a outra parte
  if (params.requestedBy === "student") {
    addNotification({
      targetRole: "coach",
      coachId: booking.coachId,
      type: "rescheduled",
      title: "Solicitação de Remanejamento de Horário 🔄",
      message: `${booking.studentName} solicitou mudar o treino de ${booking.slotDay} (${booking.slotTime}) para ${params.proposedDay} às ${params.proposedTime}${params.reason ? ` (Motivo: "${params.reason}")` : ""}.`,
    });
  } else {
    addNotification({
      targetRole: "student",
      studentId: booking.studentId,
      type: "rescheduled",
      title: "Proposta de Novo Horário do Treinador 🔄",
      message: `${booking.coachName} sugeriu alterar seu treino para ${params.proposedDay} às ${params.proposedTime}. Verifique na sua agenda para aceitar.`,
    });
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function respondToReschedule(bookingId: string, accept: boolean): void {
  if (typeof window === "undefined") return;
  const bookings = getStoredBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking || !booking.rescheduleRequest) return;

  const req = booking.rescheduleRequest;
  if (accept) {
    const updated = bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            slotDay: req.proposedDay,
            slotTime: req.proposedTime,
            attendanceStatus: "rescheduled" as const,
            rescheduleRequest: {
              ...req,
              status: "accepted" as const,
            },
          }
        : b
    );
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

    // Notifica quem solicitou que foi aceito
    if (req.requestedBy === "student") {
      addNotification({
        targetRole: "student",
        studentId: booking.studentId,
        type: "booking_accepted",
        title: "Remanejamento Aceito! ✅",
        message: `${booking.coachName} aprovou sua mudança de horário para ${req.proposedDay} às ${req.proposedTime}.`,
      });
    } else {
      addNotification({
        targetRole: "coach",
        coachId: booking.coachId,
        type: "booking_accepted",
        title: "Aluno Concordou com o Novo Horário! ✅",
        message: `${booking.studentName} aceitou o treino remanejado para ${req.proposedDay} às ${req.proposedTime}.`,
      });
    }
  } else {
    const updated = bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            rescheduleRequest: {
              ...req,
              status: "rejected" as const,
            },
          }
        : b
    );
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

    if (req.requestedBy === "student") {
      addNotification({
        targetRole: "student",
        studentId: booking.studentId,
        type: "rescheduled",
        title: "Remanejamento Recusado ❌",
        message: `${booking.coachName} não pode atender no horário sugerido. O horário original (${booking.slotDay} às ${booking.slotTime}) foi mantido.`,
      });
    } else {
      addNotification({
        targetRole: "coach",
        coachId: booking.coachId,
        type: "rescheduled",
        title: "Aluno Manteve o Horário Original ❌",
        message: `${booking.studentName} não pôde aceitar a nova data sugerida. Horário mantido.`,
      });
    }
  }

  window.dispatchEvent(new Event(EVENT_BOOKING));
}

export function updateCoachPublicProfile(coachId: string, profile: Partial<CoachTrainer>): void {
  if (typeof window === "undefined") return;
  const coaches = getStoredCoaches();
  const updated = coaches.map((c) => (c.id === coachId ? { ...c, ...profile } : c));
  localStorage.setItem(STORAGE_COACHES, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_BOOKING));
}

// ----------------------------------------------------------------------
// SUBSCRIPTIONS
// ----------------------------------------------------------------------

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
