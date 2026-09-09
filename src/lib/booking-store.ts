/**
 * Personal Trainer Barber-Style Booking & Notification Store
 * Gerenciamento de agenda de personais, solicitações de treino presencial,
 * planos (diário, semanal, mensal), ofertas de valor extra, pagamentos e notificações.
 */

export interface TrainerSlot {
  id: string;
  time: string; // Ex: "07:00", "08:00", "18:00"
  isAvailable: boolean;
  day: "Hoje" | "Amanhã" | "Quinta" | "Sexta" | "Sábado";
}

export interface CoachTrainer {
  id: string;
  name: string;
  cref: string;
  avatarUrl: string;
  phone: string;
  specialty: string;
  distance: string;
  rating: number;
  reviewCount: number;
  bio: string;
  pricing: {
    dailySession: number; // Ex: 70
    weeklyPlan: number;   // Ex: 180 (3x/semana)
    monthlyPlan: number;  // Ex: 550 (acompanhamento presencial)
  };
  slots: TrainerSlot[];
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
  planType: "diario" | "semanal" | "mensal";
  basePrice: number;
  extraOfferedAmount: number;
  totalPrice: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  paymentStatus: "pending" | "paid" | "overdue";
  attendanceStatus: "scheduled" | "attended" | "missed" | "rescheduled";
  notes?: string;
  createdAt: string;
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

const STORAGE_COACHES = "gymflow_coaches_v1";
const STORAGE_BOOKINGS = "gymflow_bookings_v1";
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
    pricing: {
      dailySession: 75,
      weeklyPlan: 190,
      monthlyPlan: 580,
    },
    slots: [
      { id: "s1", day: "Hoje", time: "07:00", isAvailable: false },
      { id: "s2", day: "Hoje", time: "08:00", isAvailable: true },
      { id: "s3", day: "Hoje", time: "09:00", isAvailable: true },
      { id: "s4", day: "Hoje", time: "17:00", isAvailable: true },
      { id: "s5", day: "Hoje", time: "18:00", isAvailable: false },
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
      dailySession: 80,
      weeklyPlan: 210,
      monthlyPlan: 620,
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
      dailySession: 70,
      weeklyPlan: 180,
      monthlyPlan: 520,
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
    planType: "mensal",
    basePrice: 580,
    extraOfferedAmount: 20,
    totalPrice: 600,
    status: "accepted",
    paymentStatus: "paid",
    attendanceStatus: "scheduled",
    notes: "Foco em bater metas de carga no supino e terra.",
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
    message: "O pagamento do Plano Mensal (R$ 600,00) foi confirmado pelo treinador.",
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
    return JSON.parse(raw);
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
  planType: "diario" | "semanal" | "mensal";
  extraOfferedAmount: number;
  notes?: string;
}): BookingRequest {
  const coaches = getStoredCoaches();
  const coach = coaches.find((c) => c.id === params.coachId) || coaches[0];

  const basePrice =
    params.planType === "diario"
      ? coach.pricing.dailySession
      : params.planType === "semanal"
      ? coach.pricing.weeklyPlan
      : coach.pricing.monthlyPlan;

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
