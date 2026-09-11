/**
 * GymFlow Smart Reminders Service
 * Motor de detecção, cálculo e envio de lembretes inteligentes:
 * - Aulas do Dia e horários próximos
 * - Vencimento de mensalidades e alertas de atraso com PIX
 * - Recuperação de faltas e reengajamento
 * - Disparos rápidos via WhatsApp, Notificações Internas e Web Push
 */

import {
  getStoredBookings,
  isSlotToday,
  addNotification,
  BookingRequest,
  getStoredCoaches,
} from "./booking-store";
import {
  getStoredStudents,
  StudentProfile,
  getStoredCoachPlans,
} from "./workout-store";
import { getCurrentUser } from "./auth-store";

export interface SmartReminderItem {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  type: "class_today" | "payment_due" | "payment_overdue" | "student_retention" | "praise";
  category: "aula" | "pagamento" | "retencao";
  urgency: "urgent" | "today" | "upcoming";
  title: string;
  description: string;
  timeTag: string;
  planName?: string;
  amount?: number;
  whatsappText: string;
  appNotificationTitle: string;
  appNotificationMessage: string;
  isSent?: boolean;
  sentAt?: string;
}

const STORAGE_KEY_SENT_REMINDERS = "gymflow_reminders_sent_log_v1";
const EVENT_REMINDERS_UPDATED = "gymflow:reminders-updated";

// Recupera registro de lembretes enviados no dia
export function getSentRemindersLog(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT_REMINDERS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Marca lembrete como enviado hoje
export function markReminderAsSent(reminderId: string): void {
  if (typeof window === "undefined") return;
  const current = getSentRemindersLog();
  const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  current[reminderId] = timeNow;
  localStorage.setItem(STORAGE_KEY_SENT_REMINDERS, JSON.stringify(current));
  window.dispatchEvent(new Event(EVENT_REMINDERS_UPDATED));
}

// Limpa status de envio (para teste ou reenvio)
export function unmarkReminderAsSent(reminderId: string): void {
  if (typeof window === "undefined") return;
  const current = getSentRemindersLog();
  delete current[reminderId];
  localStorage.setItem(STORAGE_KEY_SENT_REMINDERS, JSON.stringify(current));
  window.dispatchEvent(new Event(EVENT_REMINDERS_UPDATED));
}

// Calcula todos os lembretes inteligentes com base no estado real da aplicação
export function computeDailyReminders(): SmartReminderItem[] {
  if (typeof window === "undefined") return [];

  const students = getStoredStudents();
  const bookings = getStoredBookings();
  const coachPlans = getStoredCoachPlans();
  const coaches = getStoredCoaches();
  const currentUser = getCurrentUser();
  const sentLog = getSentRemindersLog();

  const activeCoach = coaches.find((c) => c.id === currentUser.id) || coaches[0] || {
    name: "Prof. Rodrigo Costa",
    phone: "11999990000",
  };

  const coachFirstName = (currentUser.name || activeCoach.name || "Seu Treinador").split(" ")[0];
  const coachPix = activeCoach.phone ? activeCoach.phone.replace(/\D/g, "") : "11999990000";

  const today = new Date();
  const currentDayOfMonth = today.getDate();
  const currentHour = today.getHours();
  const currentMinutes = today.getMinutes();
  const currentTimeTotalMin = currentHour * 60 + currentMinutes;

  const reminders: SmartReminderItem[] = [];

  // =========================================================================
  // 1. LEMBRETES DE AULAS DO DIA (BOOKINGS E ESTUDANTES)
  // =========================================================================
  bookings.forEach((booking) => {
    // Apenas reservas aceitas para hoje
    if (booking.status !== "accepted") return;
    if (!isSlotToday(booking.slotDay)) return;

    // Se já foi concluída, não precisa de lembrete
    if (booking.attendanceStatus === "attended" || booking.attendanceStatus === "missed") return;

    const studentMatch = students.find((s) => s.id === booking.studentId);
    const phone = booking.studentPhone || studentMatch?.phone;
    const studentFirstName = booking.studentName.split(" ")[0];

    // Calcula tempo até a aula
    const [slotH, slotM] = booking.slotTime.split(":").map(Number);
    const slotTotalMin = (slotH || 0) * 60 + (slotM || 0);
    const diffMin = slotTotalMin - currentTimeTotalMin;

    let timeNotice = `Hoje às ${booking.slotTime}`;
    let urgency: "urgent" | "today" | "upcoming" = "today";

    if (diffMin > 0 && diffMin <= 60) {
      timeNotice = `Em ${diffMin} min (às ${booking.slotTime})`;
      urgency = "urgent";
    } else if (diffMin > 60 && diffMin <= 180) {
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      timeNotice = `Em ~${hours}h${mins > 0 ? `${mins}m` : ""} (às ${booking.slotTime})`;
      urgency = "today";
    } else if (diffMin < 0) {
      timeNotice = `Horário das ${booking.slotTime} (em andamento)`;
      urgency = "urgent";
    }

    const reminderId = `rem_class_${booking.id}_${today.toISOString().split("T")[0]}`;
    const isSent = Boolean(sentLog[reminderId]);

    reminders.push({
      id: reminderId,
      studentId: booking.studentId,
      studentName: booking.studentName,
      studentPhone: phone,
      type: "class_today",
      category: "aula",
      urgency,
      title: `Aula com ${studentFirstName} às ${booking.slotTime}`,
      description: `Treino presencial agendado na grade de hoje. Plano: ${booking.planType.toUpperCase()}.`,
      timeTag: timeNotice,
      amount: booking.totalPrice,
      whatsappText: `Olá, ${studentFirstName}! Tudo pronto para o nosso treino hoje às ${booking.slotTime}? Já deixei sua ficha alinhada no salão. Te vejo lá! 🏋️‍♂️💪`,
      appNotificationTitle: `Lembrete: Treino Hoje às ${booking.slotTime} 🏋️‍♂️`,
      appNotificationMessage: `Seu treino presencial com ${activeCoach.name} está marcado para hoje às ${booking.slotTime}. Não se esqueça da garrafa d'água e prepare-se!`,
      isSent,
      sentAt: sentLog[reminderId],
    });
  });

  // Também verifica alunos que têm scheduledTimeToday marcado no cadastro
  students.forEach((student) => {
    if (student.scheduledTimeToday && student.todayAttendanceStatus === "agendado") {
      const alreadyIncluded = reminders.some(
        (r) => r.studentId === student.id && r.type === "class_today"
      );
      if (!alreadyIncluded) {
        const studentFirstName = student.name.split(" ")[0];
        const reminderId = `rem_student_class_${student.id}_${today.toISOString().split("T")[0]}`;
        const isSent = Boolean(sentLog[reminderId]);

        reminders.push({
          id: reminderId,
          studentId: student.id,
          studentName: student.name,
          studentPhone: student.phone,
          type: "class_today",
          category: "aula",
          urgency: "today",
          title: `Treino com ${studentFirstName} às ${student.scheduledTimeToday}`,
          description: `Aluno agendado na escala de hoje. Objetivo: ${student.goal}.`,
          timeTag: `Hoje às ${student.scheduledTimeToday}`,
          whatsappText: `Fala, ${studentFirstName}! Passando para confirmar nosso treino de hoje às ${student.scheduledTimeToday}. Vamos focar na sua evolução! 🚀`,
          appNotificationTitle: `Treino Agendado para Hoje às ${student.scheduledTimeToday}`,
          appNotificationMessage: `Olá ${studentFirstName}, seu treino de hoje está confirmado para às ${student.scheduledTimeToday}. Bons treinos!`,
          isSent,
          sentAt: sentLog[reminderId],
        });
      }
    }
  });

  // =========================================================================
  // 2. LEMBRETES DE MENSALIDADE E COBRANÇA
  // =========================================================================
  students.forEach((student) => {
    const studentFirstName = student.name.split(" ")[0];
    const planName = student.plan || "Plano Mensal";
    
    // Extrai valor estimado do plano
    let planPrice = 45;
    const priceMatch = student.plan?.match(/R\$\s*(\d+)/i);
    if (priceMatch && priceMatch[1]) {
      planPrice = parseInt(priceMatch[1], 10);
    } else {
      const matchedPlan = coachPlans.find((p) => student.plan?.includes(p.name));
      if (matchedPlan) planPrice = matchedPlan.price;
    }

    // Extrai o dia de vencimento (ex: "Dia 10", "10/09/2026", "Dia 08")
    let dueDay = 10;
    if (student.paymentDueDate) {
      const dayMatch = student.paymentDueDate.match(/(\d{1,2})/);
      if (dayMatch && dayMatch[1]) {
        dueDay = parseInt(dayMatch[1], 10);
      }
    }

    // CASO A: Pagamento com status explicitamente "atrasado"
    if (student.paymentStatus === "atrasado") {
      const reminderId = `rem_pay_overdue_${student.id}_${today.toISOString().split("T")[0]}`;
      const isSent = Boolean(sentLog[reminderId]);

      reminders.push({
        id: reminderId,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        type: "payment_overdue",
        category: "pagamento",
        urgency: "urgent",
        title: `Mensalidade em Atraso — ${studentFirstName}`,
        description: `${planName} • R$ ${planPrice},00 (Vencimento era ${student.paymentDueDate || `Dia ${dueDay}`})`,
        timeTag: "Atrasado ⚠️",
        planName,
        amount: planPrice,
        whatsappText: `Olá, ${studentFirstName}! Tudo bem? Passando para regularizar a mensalidade do seu plano (${planName} - R$ ${planPrice},00). Chave PIX: ${coachPix}. Qualquer dúvida ou para envio do comprovante, pode mandar aqui! 💳 Abraço, ${coachFirstName}.`,
        appNotificationTitle: `Mensalidade em Aberto — ${planName} ⚠️`,
        appNotificationMessage: `Consta uma pendência na mensalidade do seu plano. Chave PIX do personal: ${coachPix}. Regularize para manter seus treinos e agenda garantidos.`,
        isSent,
        sentAt: sentLog[reminderId],
      });
      return;
    }

    // CASO B: Vence HOJE
    if (currentDayOfMonth === dueDay) {
      const reminderId = `rem_pay_today_${student.id}_${today.toISOString().split("T")[0]}`;
      const isSent = Boolean(sentLog[reminderId]);

      reminders.push({
        id: reminderId,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        type: "payment_due",
        category: "pagamento",
        urgency: "today",
        title: `Mensalidade Vence Hoje — ${studentFirstName}`,
        description: `${planName} • R$ ${planPrice},00 com vencimento hoje (${dueDay})`,
        timeTag: "Vence Hoje 🔔",
        planName,
        amount: planPrice,
        whatsappText: `Olá, ${studentFirstName}! Tudo bem? Passando para lembrar que a mensalidade do seu plano (${planName} - R$ ${planPrice},00) vence hoje! Chave PIX: ${coachPix}. Quando puder, só me mandar o comprovante por aqui. Muito obrigado! 💳💪`,
        appNotificationTitle: `Sua Mensalidade Vence Hoje! 💳`,
        appNotificationMessage: `Seu plano ${planName} (R$ ${planPrice},00) renova hoje. Chave PIX para pagamento: ${coachPix}. Obrigado pela preferência!`,
        isSent,
        sentAt: sentLog[reminderId],
      });
      return;
    }

    // CASO C: Vence em 1 ou 2 dias (antecedência preventiva)
    const daysUntilDue = dueDay - currentDayOfMonth;
    if (daysUntilDue > 0 && daysUntilDue <= 2) {
      const reminderId = `rem_pay_upcoming_${student.id}_${today.toISOString().split("T")[0]}`;
      const isSent = Boolean(sentLog[reminderId]);

      reminders.push({
        id: reminderId,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        type: "payment_due",
        category: "pagamento",
        urgency: "upcoming",
        title: `Vencimento em ${daysUntilDue} dia${daysUntilDue > 1 ? "s" : ""} — ${studentFirstName}`,
        description: `${planName} • R$ ${planPrice},00 (Dia ${dueDay})`,
        timeTag: `Em ${daysUntilDue} dia${daysUntilDue > 1 ? "s" : ""}`,
        planName,
        amount: planPrice,
        whatsappText: `Olá, ${studentFirstName}! Tudo em ordem? Passando para te avisar com antecedência que a renovação do seu plano (${planName} - R$ ${planPrice},00) vence no dia ${dueDay}. Chave PIX: ${coachPix}. Conte comigo nos seus treinos! 🏋️‍♂️`,
        appNotificationTitle: `Aviso: Sua mensalidade vence no dia ${dueDay}`,
        appNotificationMessage: `Seu plano ${planName} vence em breve. Chave PIX para quitação: ${coachPix}.`,
        isSent,
        sentAt: sentLog[reminderId],
      });
    }
  });

  // =========================================================================
  // 3. RECUPERAÇÃO DE ALUNO (FALTAS RECENTES / RETENÇÃO)
  // =========================================================================
  students.forEach((student) => {
    if (student.todayAttendanceStatus === "falta" || (student.monthlyAbsences && student.monthlyAbsences >= 2)) {
      const studentFirstName = student.name.split(" ")[0];
      const reminderId = `rem_retention_${student.id}_${today.toISOString().split("T")[0]}`;
      const isSent = Boolean(sentLog[reminderId]);

      reminders.push({
        id: reminderId,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        type: "student_retention",
        category: "retencao",
        urgency: "today",
        title: `Reengajar Aluno(a) — ${studentFirstName}`,
        description: `Aluno com ausência recente (${student.monthlyAbsences || 1} falta no mês). Oferecer reposição para manter a disciplina.`,
        timeTag: "Recuperação 🔄",
        whatsappText: `Fala, ${studentFirstName}! Senti sua falta nos treinos. Sei que a rotina às vezes aperta, mas não vamos deixar o ritmo cair! Quer que eu veja um horário para você repor essa aula e continuar focado? 👊`,
        appNotificationTitle: `Sentimos sua falta no salão! 🏋️‍♂️`,
        appNotificationMessage: `Olá ${studentFirstName}, conte com o ${coachFirstName} para repor seus treinos e manter a evolução no ritmo certo.`,
        isSent,
        sentAt: sentLog[reminderId],
      });
    }
  });

  // Ordena por urgência: "urgent" primeiro, depois "today", depois "upcoming"
  const urgencyWeight = { urgent: 0, today: 1, upcoming: 2 };
  return reminders.sort((a, b) => urgencyWeight[a.urgency] - urgencyWeight[b.urgency]);
}

// Dispara lembrete para o WhatsApp do aluno
export function sendReminderViaWhatsApp(item: SmartReminderItem): { success: boolean; reason?: string } {
  if (typeof window === "undefined") return { success: false, reason: "Ambiente inválido" };

  const phone = item.studentPhone ? item.studentPhone.replace(/\D/g, "") : "";
  if (!phone) {
    return { success: false, reason: "Aluno sem telefone/WhatsApp cadastrado." };
  }

  const finalPhone = phone.length <= 11 && !phone.startsWith("55") ? `55${phone}` : phone;
  const encodedText = encodeURIComponent(item.whatsappText);
  const waUrl = `https://wa.me/${finalPhone}?text=${encodedText}`;

  window.open(waUrl, "_blank", "noopener,noreferrer");
  markReminderAsSent(item.id);

  return { success: true };
}

// Dispara notificação interna no App do aluno (aparece no sininho)
export function sendReminderToApp(item: SmartReminderItem): void {
  if (typeof window === "undefined") return;

  const notifType =
    item.type === "payment_overdue"
      ? "payment_overdue"
      : item.type === "payment_due"
      ? "payment_overdue"
      : item.type === "class_today"
      ? "training_reminder"
      : "training_reminder";

  addNotification({
    targetRole: "student",
    studentId: item.studentId,
    type: notifType,
    title: item.appNotificationTitle,
    message: item.appNotificationMessage,
  });

  // Também envia notificação nativa do navegador se permitida
  sendBrowserNotification(item.appNotificationTitle, {
    body: item.appNotificationMessage,
  });

  markReminderAsSent(item.id);
}

// ---------------------------------------------------------------------------
// WEB BROWSER NOTIFICATIONS (PUSH NATIVO NO CELULAR / DESKTOP)
// ---------------------------------------------------------------------------

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("Erro ao solicitar permissão de notificações do navegador:", err);
    return "denied";
  }
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return "denied";
  return Notification.permission;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: "/icon-192.svg",
          badge: "/icon-192.svg",
          vibrate: [150, 50, 150],
          ...(options || {}),
        } as any);
      });
      return true;
    }

    new Notification(title, {
      icon: "/icon-192.svg",
      ...options,
    });
    return true;
  } catch (err) {
    console.warn("Não foi possível disparar notificação do navegador:", err);
    return false;
  }
}

// Retorna contadores resumidos para badges no cabeçalho
export function getRemindersSummary() {
  const all = computeDailyReminders();
  const pending = all.filter((r) => !r.isSent);
  const classesToday = all.filter((r) => r.category === "aula" && !r.isSent);
  const paymentsDue = all.filter((r) => r.category === "pagamento" && !r.isSent);
  const retention = all.filter((r) => r.category === "retencao" && !r.isSent);

  return {
    total: all.length,
    totalPending: pending.length,
    classesTodayCount: classesToday.length,
    paymentsDueCount: paymentsDue.length,
    retentionCount: retention.length,
    reminders: all,
    pendingReminders: pending,
  };
}

export function subscribeToReminders(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_REMINDERS_UPDATED, callback);
  window.addEventListener("storage", callback);
  window.addEventListener("gymflow:workout-updated", callback);
  window.addEventListener("gymflow:booking-updated", callback);
  return () => {
    window.removeEventListener(EVENT_REMINDERS_UPDATED, callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("gymflow:workout-updated", callback);
    window.removeEventListener("gymflow:booking-updated", callback);
  };
}
