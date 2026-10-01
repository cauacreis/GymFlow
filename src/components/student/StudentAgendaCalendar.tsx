"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Dumbbell,
  UserCheck,
  RotateCcw,
  MessageSquare,
  CalendarDays,
  X,
  Phone,
  LogOut,
  UserX,
  TrendingUp,
  Settings2,
  Check,
  Flame,
  Activity,
  Play,
  HelpCircle,
  Users,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredBookings,
  getStudentBookings,
  requestReschedule,
  respondToReschedule,
  subscribeToBookings,
  BookingRequest,
  getRescheduleDayOptions,
  isSlotToday,
  calculateSlotEndTime,
  formatSlotTimeSpan,
  setupRecurringStudentSchedule,
} from "@/lib/booking-store";
import {
  getStoredStudents,
  StudentProfile,
  subscribeToWorkoutChanges,
  getStudentWorkout,
  getStudentCoachInfo,
  StudentWorkoutPackage,
} from "@/lib/workout-store";
import { getCurrentUser } from "@/lib/auth-store";
import { LeaveCoachModal } from "./LeaveCoachModal";
import { WorkoutSplitTemplate } from "@/lib/exercisedb";

interface StudentAgendaCalendarProps {
  studentId?: string;
  onNavigateToWorkout?: () => void;
  onNavigateToPersonal?: () => void;
}

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const ROW_HEIGHT = 64; // Altura em pixels de cada hora na grade

export function StudentAgendaCalendar({
  studentId: propStudentId,
  onNavigateToWorkout,
  onNavigateToPersonal,
}: StudentAgendaCalendarProps) {
  const currentUser = getCurrentUser();
  const effectiveStudentId =
    propStudentId && propStudentId !== "student_carlos"
      ? propStudentId
      : currentUser.id || "student_user";

  const rescheduleDayOptions = getRescheduleDayOptions();

  // Estados principais de dados
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [workoutPackage, setWorkoutPackage] = useState<StudentWorkoutPackage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Navegação de Período & Modo de Visualização (Semana, Dia, Lista)
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"semana" | "dia" | "lista">("semana");
  const [now, setNow] = useState<Date>(new Date());

  // Modal para Aluno sair do Personal Trainer
  const [isLeaveCoachModalOpen, setIsLeaveCoachModalOpen] = useState(false);

  // Modal de Detalhes da Sessão de Treino selecionada
  const [selectedSession, setSelectedSession] = useState<{
    booking: BookingRequest;
    workoutTitle: string;
    workoutSubtitle: string;
    startTime: string;
    endTime: string;
    durationText: string;
    split: WorkoutSplitTemplate | null;
    dayLabel: string;
  } | null>(null);

  // Modal de Solicitação de Remanejamento
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] =
    useState<BookingRequest | null>(null);
  const [proposedDay, setProposedDay] = useState(
    rescheduleDayOptions[1]?.value || rescheduleDayOptions[0]?.value || "Amanhã"
  );
  const [proposedTime, setProposedTime] = useState("19:00");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Modal de Configuração de Dias & Horários Recorrentes (ex: 3x na semana, 1h)
  const [isAdjustScheduleOpen, setIsAdjustScheduleOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<"2x" | "3x" | "4x" | "5x">("3x");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Segunda",
    "Quarta",
    "Sexta",
  ]);
  const [selectedStartTime, setSelectedStartTime] = useState("09:00");
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(60);

  // Atualização dinâmica do relógio em tempo real (linha vermelha)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Carregamento de agendamentos, ficha de treino e informações do personal
  useEffect(() => {
    const load = () => {
      const allBookings = getStudentBookings(effectiveStudentId);
      const user = getCurrentUser();
      const allStudents = getStoredStudents();
      const coachInfo = getStudentCoachInfo(effectiveStudentId);
      const pkg = getStudentWorkout(effectiveStudentId);
      setWorkoutPackage(pkg);

      let st = allStudents.find(
        (s) => s.id === effectiveStudentId || (user.email && s.email === user.email)
      );

      if (!st) {
        const safeMatricula =
          user.matricula ||
          (effectiveStudentId
            ? `GF-${effectiveStudentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5)}`
            : "GF-10001");
        st = {
          id: effectiveStudentId || "student_user",
          name: user.name || "Aluno",
          email: user.email || "",
          phone: user.phone || "",
          matricula: safeMatricula,
          goal: user.goal || "Hipertrofia",
          currentRoutineTitle: "Treino Personalizado",
          prescribedBy: coachInfo.coachName || "Personal Trainer",
          prescribedAt: "Hoje",
          status: "ativo",
          monthlyPresence: 0,
          monthlyAbsences: 0,
          totalClasses: 0,
          hasWorkoutSheet: true,
          weeklySchedule: ["Segunda · 09:00", "Quarta · 09:00", "Sexta · 09:00"],
        };
      }
      setStudent(st);

      // Filtra agendamentos pertencentes ao aluno
      let myStudentBookings = allBookings.filter(
        (b) =>
          b.studentId === effectiveStudentId ||
          (user.name && b.studentName.trim().toLowerCase() === user.name.trim().toLowerCase())
      );

      // SE O ALUNO POSSUI PERSONAL TRAINER MAS NÃO TEM SESSÕES GERADAS NA GRADE:
      // Auto-inicializa a grade padrão de 3x na semana (1h/dia) com o personal trainer
      if (myStudentBookings.length === 0 && (coachInfo.hasCoach || st.coachId)) {
        const coachId = coachInfo.coachId || st.coachId || "coach_vinicius";
        const coachName = coachInfo.coachName || st.prescribedBy || "Personal Trainer";
        const coachPhone = coachInfo.coachPhone || "";

        const autoSessions = setupRecurringStudentSchedule({
          studentId: effectiveStudentId,
          studentName: user.name || st.name || "Aluno",
          studentPhone: user.phone || st.phone || "",
          coachId,
          coachName,
          coachPhone,
          daysOfWeek: ["Segunda", "Quarta", "Sexta"],
          startTime: "09:00",
          durationMinutes: 60,
          planType: "pro",
          workoutTitles: pkg.splits.length >= 3
            ? [pkg.splits[0].title, pkg.splits[1].title, pkg.splits[2].title]
            : ["Treino A", "Treino B", "Treino C"],
        });

        myStudentBookings = autoSessions;
      }

      setBookings(myStudentBookings);
    };

    load();
    const unsubBookings = subscribeToBookings(load);
    const unsubWorkouts = subscribeToWorkoutChanges(load);
    return () => {
      unsubBookings();
      unsubWorkouts();
    };
  }, [effectiveStudentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // CÁLCULO DOS DIAS DA SEMANA (DOMINGO A SÁBADO)
  // --------------------------------------------------------------------------
  const sunday = useMemo(() => {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - referenceDate.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [referenceDate]);

  const shortNames = ["DOM.", "SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SÁB."];
  const fullNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      const dateFormatted = `${dayNum}/${monthNum}`;
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      return {
        date: d,
        dayIndex: i,
        shortLabel: `${shortNames[i]} ${dateFormatted}`,
        fullLabel: `${fullNames[i]}, ${dateFormatted}`,
        dayName: fullNames[i],
        dateFormatted,
        isToday,
      };
    });
  }, [sunday, now]);

  // Título do Período (ex: "28 de set. – 04 de out. de 2026")
  const periodTitle = useMemo(() => {
    if (viewMode === "dia") {
      return referenceDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const startDay = weekDays[0].date.getDate();
    const endDay = weekDays[6].date.getDate();
    const monthName = weekDays[6].date
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
    const year = weekDays[6].date.getFullYear();
    return `${startDay} – ${endDay} de ${monthName}. de ${year}`;
  }, [viewMode, referenceDate, weekDays]);

  // --------------------------------------------------------------------------
  // POSICIONAMENTO DA LINHA VERMELHA (HORÁRIO ATUAL EM TEMPO REAL)
  // --------------------------------------------------------------------------
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const minutesSince6 = (currentHour - 6) * 60 + currentMinutes;
  const isTimeInGrid = minutesSince6 >= 0 && minutesSince6 <= 17 * 60;
  const redLineTop = isTimeInGrid ? (minutesSince6 / 60) * ROW_HEIGHT : null;

  // Personal Trainer ativo do aluno
  const coachInfo = getStudentCoachInfo(effectiveStudentId);
  const activeCoachBooking =
    bookings.find((b) => b.status === "accepted" || b.status === "pending") || null;
  const hasActiveCoach =
    coachInfo.hasCoach ||
    (!!activeCoachBooking &&
      student?.plan !== "Treino Livre (Sem Personal)" &&
      student?.paymentStatus !== "cancelado");

  const currentCoachName =
    coachInfo.coachName ||
    activeCoachBooking?.coachName ||
    student?.prescribedBy ||
    "Prof. Personal Trainer";
  const currentCoachPhone =
    coachInfo.coachPhone || activeCoachBooking?.coachPhone || "11988887777";
  const currentCoachId =
    coachInfo.coachId || activeCoachBooking?.coachId || "coach_vinicius";

  // Mapeamento e filtragem de agendamentos por dia da semana
  const getBookingsForDay = (d: (typeof weekDays)[0]) => {
    return bookings.filter((b) => {
      if (b.slotDay.includes(d.dateFormatted)) return true;
      if (d.isToday && isSlotToday(b.slotDay)) return true;
      if (b.slotDay.toLowerCase().includes(d.dayName.toLowerCase().slice(0, 3))) return true;
      return false;
    });
  };

  // Helper para resolver os detalhes do treino e duração para o aluno
  const getWorkoutDetailsForBooking = (b: BookingRequest, dayIndex?: number) => {
    const duration = b.durationMinutes || 60;
    const endTime = calculateSlotEndTime(b.slotTime, duration);
    const durationText =
      duration >= 60
        ? `${duration / 60 === 1 ? "1h" : `${duration / 60}h`}`
        : `${duration}m`;

    // 1. Se tem título explícito no booking
    if (b.workoutTitle && !b.workoutTitle.startsWith("Treino Presencial")) {
      const splitMatch = workoutPackage?.splits?.find((s) => s.title === b.workoutTitle);
      return {
        title: b.workoutTitle,
        subtitle: splitMatch?.muscles || `Com ${b.coachName || currentCoachName}`,
        durationText,
        endTime,
        timeSpan: `${b.slotTime} - ${endTime}`,
        split: splitMatch || null,
      };
    }

    // 2. Se o aluno tem splits prescritos
    if (workoutPackage && workoutPackage.splits && workoutPackage.splits.length > 0) {
      const matchedSplit =
        workoutPackage.splits.find((s) => {
          const slotLower = b.slotDay.toLowerCase();
          return (
            s.title.toLowerCase().includes(slotLower.slice(0, 3)) ||
            (s.muscles && s.muscles.toLowerCase().includes(slotLower.slice(0, 3)))
          );
        }) ||
        workoutPackage.splits[(dayIndex ?? 0) % workoutPackage.splits.length];

      return {
        title: matchedSplit.title,
        subtitle: matchedSplit.muscles || `Com ${b.coachName || currentCoachName}`,
        durationText,
        endTime,
        timeSpan: `${b.slotTime} - ${endTime}`,
        split: matchedSplit,
      };
    }

    // 3. Se está aguardando prescrição do treinador
    if (workoutPackage?.isAwaitingCoachPrescription || hasActiveCoach) {
      return {
        title: `Treino com ${currentCoachName}`,
        subtitle: "Aguardando prescrição técnica",
        durationText,
        endTime,
        timeSpan: `${b.slotTime} - ${endTime}`,
        split: null,
      };
    }

    // 4. Treino individual
    return {
      title: "Treino Personalizado",
      subtitle: "Musculação & Cárdio",
      durationText,
      endTime,
      timeSpan: `${b.slotTime} - ${endTime}`,
      split: null,
    };
  };

  // Cores e estilos dos cards de treino
  const getStatusStyle = (
    status: BookingRequest["attendanceStatus"],
    isLiveNow?: boolean
  ) => {
    if (isLiveNow) {
      return {
        cardBg:
          "bg-emerald-600/95 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50",
        badge: "bg-emerald-400 text-zinc-950 font-black",
        dotColor: "bg-emerald-400",
        label: "Agora • Em Andamento",
      };
    }

    switch (status) {
      case "attended":
        return {
          cardBg:
            "bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border-emerald-500/40 shadow-emerald-950/40",
          badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
          dotColor: "bg-emerald-400",
          label: "Concluído • Presente",
        };
      case "missed":
        return {
          cardBg:
            "bg-rose-950/90 hover:bg-rose-900 text-rose-100 border-rose-500/40 shadow-rose-950/40",
          badge: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          dotColor: "bg-rose-400",
          label: "Falta Registrada",
        };
      case "delayed":
        return {
          cardBg:
            "bg-amber-900/90 hover:bg-amber-800 text-amber-100 border-amber-500/40 shadow-amber-950/40",
          badge: "bg-amber-500/20 text-amber-200 border border-amber-500/30",
          dotColor: "bg-amber-300",
          label: "Atraso Registrado",
        };
      case "rescheduled":
        return {
          cardBg:
            "bg-amber-950/90 hover:bg-amber-900 text-amber-100 border-amber-500/40 shadow-amber-950/40",
          badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          dotColor: "bg-amber-400",
          label: "Remanejamento em Análise",
        };
      case "scheduled":
      default:
        return {
          cardBg:
            "bg-gradient-to-br from-indigo-950/90 via-purple-950/80 to-zinc-900 text-white border-indigo-400/40 shadow-indigo-950/50 hover:border-indigo-400/70",
          badge: "bg-indigo-500/25 text-indigo-200 border border-indigo-400/30",
          dotColor: "bg-indigo-400",
          label: "Agendado",
        };
    }
  };

  // Contadores & Indicadores Superiores
  const totalPresences = bookings.filter((b) => b.attendanceStatus === "attended").length;
  const totalMissed = bookings.filter((b) => b.attendanceStatus === "missed").length;
  const totalResolved = totalPresences + totalMissed;
  const attendanceRate =
    totalResolved > 0 ? Math.round((totalPresences / totalResolved) * 100) : 100;

  // Próxima Sessão Agendada
  const nextSessionBooking = bookings.find(
    (b) => b.attendanceStatus === "scheduled" || b.status === "pending"
  );
  const nextSessionDetails = nextSessionBooking
    ? getWorkoutDetailsForBooking(nextSessionBooking)
    : null;

  // Aluno solicita remanejamento
  const handleSendRescheduleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReschedule) return;

    requestReschedule({
      bookingId: selectedBookingForReschedule.id,
      requestedBy: "student",
      proposedDay,
      proposedTime,
      reason: rescheduleReason.trim() || undefined,
    });

    setIsRescheduleModalOpen(false);
    setSelectedBookingForReschedule(null);
    setRescheduleReason("");
    showToast("Solicitação de remanejamento enviada para o professor!");
  };

  // Aluno responde a proposta de remanejamento do treinador
  const handleStudentRespondReschedule = (bookingId: string, accept: boolean) => {
    triggerHaptic(accept ? "success" : "warning");
    respondToReschedule(bookingId, accept);
    showToast(accept ? "Novo horário aceito com sucesso!" : "Horário original mantido.");
  };

  // Salvar novo cronograma recorrente (ex: 3x na semana, 1h)
  const handleSaveAdjustSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      showToast("Selecione pelo menos 1 dia para seus treinos.");
      return;
    }

    const updatedSessions = setupRecurringStudentSchedule({
      studentId: effectiveStudentId,
      studentName: student?.name || currentUser.name || "Aluno",
      studentPhone: student?.phone || currentUser.phone || "",
      coachId: currentCoachId,
      coachName: currentCoachName,
      coachPhone: currentCoachPhone,
      daysOfWeek: selectedDays,
      startTime: selectedStartTime,
      durationMinutes: selectedDurationMinutes,
      planType: "pro",
      workoutTitles: workoutPackage?.splits?.length
        ? selectedDays.map((_, i) => workoutPackage.splits[i % workoutPackage.splits.length].title)
        : selectedDays.map((_, i) => `Treino ${String.fromCharCode(65 + i)}`),
    });

    setBookings(updatedSessions);
    setIsAdjustScheduleOpen(false);
    showToast(`Agenda atualizada! ${selectedDays.length} treinos de ${selectedDurationMinutes / 60}h programados.`);
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP STATS CARDS (Idêntico ao painel de alta performance do coach) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Treinos na Semana */}
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono leading-none">
              {bookings.length}
            </div>
            <div className="text-xs text-zinc-400 font-medium mt-1">
              Treinos na semana ({bookings.length}h programadas)
            </div>
          </div>
        </div>

        {/* Card 2: Presenças / Concluídos */}
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono leading-none">
              {totalPresences}
            </div>
            <div className="text-xs text-zinc-400 font-medium mt-1">
              Treinos concluídos • {attendanceRate}% assiduidade
            </div>
          </div>
        </div>

        {/* Card 3: Próximo Treino & Horário de Término */}
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-white truncate leading-tight">
              {nextSessionBooking
                ? `${nextSessionBooking.slotDay} às ${nextSessionBooking.slotTime}`
                : "Nenhum agendado"}
            </div>
            <div className="text-xs text-amber-300 font-mono mt-1 truncate">
              {nextSessionDetails
                ? `Até ${nextSessionDetails.endTime} (${nextSessionDetails.durationText})`
                : "Sem aula pendente"}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. CARD DO PERSONAL TRAINER ATIVO & AÇÕES RÁPIDAS */}
      {/* ------------------------------------------------------------------ */}
      {hasActiveCoach ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-2xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300 font-black text-lg shadow-inner">
              {currentCoachName.charAt(0)}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950"
                title="Personal Ativo"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                  Meu Personal Trainer
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  • 3x na semana (1h/dia)
                </span>
              </div>
              <h4 className="text-sm font-black text-white truncate mt-0.5">
                {currentCoachName}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate">
                Plano: <span className="text-zinc-200 font-semibold">{student?.plan || "Acompanhamento Personal VIP"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            {/* Ajustar Dias e Horários do Aluno */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsAdjustScheduleOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              title="Ajustar dias da semana e horários da aula"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Ajustar Dias & Horários</span>
            </button>

            {/* WhatsApp */}
            {currentCoachPhone && (
              <a
                href={`https://wa.me/${currentCoachPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá, ${currentCoachName}! Aqui é o ${student?.name || "seu aluno"}. Passando para tirar uma dúvida sobre meus horários de treino!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Sair do Personal */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsLeaveCoachModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-300 border border-white/[0.08] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              title="Encerrar acompanhamento"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-zinc-900/40 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Treino Individual
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                Treine com autonomia ou contrate um Personal Trainer
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Você pode organizar seus horários (ex: 3x na semana, 1h) e acompanhar sua frequência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustScheduleOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Configurar Horários</span>
            </button>

            {onNavigateToPersonal && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  onNavigateToPersonal();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Contratar Personal</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. PROPOSTA DE REMANEJAMENTO DO PROFESSOR (SE HOUVER) */}
      {/* ------------------------------------------------------------------ */}
      {bookings.some(
        (b) =>
          b.rescheduleRequest?.requestedBy === "coach" &&
          b.rescheduleRequest?.status === "pending"
      ) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 shadow-xl space-y-2.5 animate-in slide-in-from-top-2">
          {bookings
            .filter(
              (b) =>
                b.rescheduleRequest?.requestedBy === "coach" &&
                b.rescheduleRequest?.status === "pending"
            )
            .map((b) => (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
                  <h4 className="text-xs font-black text-amber-300">
                    O {b.coachName} solicitou remanejar seu treino!
                  </h4>
                </div>
                <p className="text-xs text-zinc-300">
                  Horário atual: <strong>{b.slotDay} às {b.slotTime}</strong> ➔ Proposta de novo
                  horário:{" "}
                  <strong className="text-amber-300">
                    {b.rescheduleRequest?.proposedDay} às {b.rescheduleRequest?.proposedTime}
                  </strong>
                  .
                </p>
                {b.rescheduleRequest?.reason && (
                  <p className="text-[11px] text-zinc-400 italic bg-black/30 p-2 rounded-xl border border-white/[0.06]">
                    Motivo do professor: "{b.rescheduleRequest.reason}"
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleStudentRespondReschedule(b.id, true)}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-1 active:scale-95 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aceitar Novo Horário</span>
                  </button>
                  <button
                    onClick={() => handleStudentRespondReschedule(b.id, false)}
                    className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 font-bold text-xs active:scale-95 transition-all"
                  >
                    Manter Original
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. BARRA DE LEGENDA DE STATUS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2 px-3.5 rounded-2xl bg-zinc-900/50 border border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-zinc-300 font-medium">Presente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-zinc-300 font-medium">Falta</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-zinc-300 font-medium">Atraso / Justificado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <span className="text-zinc-300 font-medium">Agendado</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. BARRA DE CONTROLE: NAVEGAÇÃO, DATA & MODOS (SEMANA / DIA / LISTA) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-900/70 border border-white/[0.08]">
        {/* Navegação de Datas */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic("light");
                const next = new Date(referenceDate);
                if (viewMode === "dia") next.setDate(next.getDate() - 1);
                else next.setDate(next.getDate() - 7);
                setReferenceDate(next);
              }}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                const next = new Date(referenceDate);
                if (viewMode === "dia") next.setDate(next.getDate() + 1);
                else next.setDate(next.getDate() + 7);
                setReferenceDate(next);
              }}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerHaptic("medium");
                setReferenceDate(new Date());
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 text-xs font-bold active:scale-95 transition-all ml-1"
            >
              Hoje
            </button>
          </div>

          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider text-center">
            {periodTitle}
          </h3>
        </div>

        {/* Alternador de Modos (Semana, Dia, Lista) */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-white/[0.08] self-stretch sm:self-auto justify-center">
          {(["semana", "dia", "lista"] as const).map((mode) => {
            const labels = { semana: "Semana", dia: "Dia", lista: "Lista" };
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  triggerHaptic("selection");
                  setViewMode(mode);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. VISUALIZAÇÃO PRINCIPAL: GRADE DA SEMANA (TIMETABLE CALENDÁRIO)  */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "semana" && (
        <div className="w-full overflow-x-auto rounded-3xl border border-white/[0.08] bg-zinc-950/80 shadow-2xl custom-scrollbar">
          <div className="min-w-[700px] lg:min-w-full relative">
            {/* CABEÇALHO BRANCO DOS DIAS (DOM A SÁB) COM DESTAQUE EM HOJE */}
            <div className="grid grid-cols-8 bg-white text-zinc-950 font-black border-b border-zinc-300 sticky top-0 z-30 shadow-sm">
              <div className="py-2.5 px-2 text-center text-[10px] sm:text-xs font-mono border-r border-zinc-200 uppercase tracking-wider text-zinc-600 flex items-center justify-center">
                Hora
              </div>
              {weekDays.map((d) => (
                <div
                  key={d.shortLabel}
                  className={`py-2.5 px-1 sm:px-2 text-center text-[10px] sm:text-xs uppercase tracking-wider border-r border-zinc-200 last:border-r-0 truncate ${
                    d.isToday ? "bg-amber-300/50 text-zinc-950 font-black" : ""
                  }`}
                >
                  <span>{d.shortLabel}</span>
                </div>
              ))}
            </div>

            {/* CORPO DA GRADE COM HORAS E LINHA VERMELHA EM TEMPO REAL */}
            <div
              className="relative"
              style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}
            >
              {/* LINHA VERMELHA EM TEMPO REAL (MARCADOR DE HORÁRIO ATUAL) */}
              {redLineTop !== null && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `${redLineTop}px` }}
                >
                  <div className="absolute left-1 -translate-y-1/2 flex items-center gap-1 z-30">
                    <span className="text-red-500 text-xs font-black animate-pulse">▶</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white font-mono text-[9px] font-black shadow-md shadow-red-500/50">
                      {String(currentHour).padStart(2, "0")}:
                      {String(currentMinutes).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ml-14" />
                </div>
              )}

              {/* LINHAS DE HORAS E CÉLULAS DE CLIQUE */}
              {HOURS.map((hour) => {
                const hourStr = `${String(hour).padStart(2, "0")}:00`;
                return (
                  <div
                    key={hour}
                    className="grid grid-cols-8 border-b border-white/[0.06]"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Eixo de Horário na Esquerda */}
                    <div className="border-r border-white/[0.06] flex items-center justify-center text-xs font-mono font-bold text-zinc-400 select-none bg-zinc-950/40">
                      {String(hour).padStart(2, "0")}:00
                    </div>

                    {/* 7 Colunas para os Dias */}
                    {weekDays.map((d) => (
                      <div
                        key={d.shortLabel}
                        onClick={() => {
                          triggerHaptic("light");
                          setSelectedStartTime(hourStr);
                          setSelectedDays([d.dayName]);
                          setIsAdjustScheduleOpen(true);
                        }}
                        className={`border-r border-white/[0.06] last:border-r-0 relative hover:bg-white/[0.02] cursor-pointer transition-colors ${
                          d.isToday ? "bg-amber-500/[0.02]" : ""
                        }`}
                        title={`Clique para agendar ou ajustar treino em ${d.dayName} às ${hourStr}`}
                      />
                    ))}
                  </div>
                );
              })}

              {/* RENDERIZAÇÃO DOS CARDS DE TREINO NAS RESPECTIVAS COLUNAS */}
              {/* O DO ALUNO MOSTRA O TREINO E ATÉ QUE HORA ELE VAI DURAR! */}
              <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                {/* Gutter esquerdo vazio */}
                <div />

                {/* 7 Colunas com os blocos de treino posicionados na hora e dia */}
                {weekDays.map((d, colIdx) => {
                  const dayBookings = getBookingsForDay(d);

                  return (
                    <div key={d.shortLabel} className="relative h-full w-full">
                      {dayBookings.map((b) => {
                        const [bHour, bMin] = b.slotTime.split(":").map(Number);
                        if (isNaN(bHour) || bHour < 6 || bHour > 22) return null;

                        const details = getWorkoutDetailsForBooking(b, colIdx);
                        const durationMins = b.durationMinutes || 60;

                        // Altura e topo calculados proporcionalmente ao tempo
                        const top = ((bHour - 6) * 60 + (bMin || 0)) * (ROW_HEIGHT / 60);
                        const height = Math.max(
                          48,
                          (durationMins / 60) * ROW_HEIGHT - 4
                        );

                        // Checagem se o treino está ocorrendo no momento atual
                        const [endH, endM] = details.endTime.split(":").map(Number);
                        const isLiveNow =
                          d.isToday &&
                          (currentHour > bHour || (currentHour === bHour && currentMinutes >= (bMin || 0))) &&
                          (currentHour < endH || (currentHour === endH && currentMinutes <= endM));

                        const style = getStatusStyle(b.attendanceStatus, isLiveNow);

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("selection");
                              setSelectedSession({
                                booking: b,
                                workoutTitle: details.title,
                                workoutSubtitle: details.subtitle,
                                startTime: b.slotTime,
                                endTime: details.endTime,
                                durationText: details.durationText,
                                split: details.split,
                                dayLabel: d.fullLabel,
                              });
                            }}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            className={`absolute inset-x-1 rounded-2xl p-2 border flex flex-col justify-between transition-all cursor-pointer pointer-events-auto ${style.cardBg} group hover:scale-[1.02] shadow-md`}
                          >
                            {/* Linha 1: Horário de Início e Término */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-black tracking-tight text-white flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 opacity-80" />
                                {details.timeSpan}
                              </span>
                              <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-black/30 text-amber-200 border border-white/10 shrink-0">
                                Até {details.endTime} ({details.durationText})
                              </span>
                            </div>

                            {/* Linha 2: O Treino do Aluno */}
                            <div className="min-w-0 my-0.5">
                              <h5 className="text-xs font-black text-white truncate leading-tight flex items-center gap-1">
                                <Dumbbell className="w-3 h-3 text-amber-300 shrink-0" />
                                <span>{details.title}</span>
                              </h5>
                              <p className="text-[10px] text-zinc-300/90 truncate mt-0.5">
                                {details.subtitle}
                              </p>
                            </div>

                            {/* Linha 3: Status / Duração */}
                            <div className="flex items-center justify-between text-[9px] font-bold opacity-90 border-t border-white/10 pt-1">
                              <span className="truncate flex items-center gap-1 text-zinc-200">
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
                                {b.coachName || currentCoachName}
                              </span>
                              <span className="shrink-0 font-mono text-amber-200">
                                {details.durationText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. MODO DIA: LINHA DO TEMPO DETALHADA DO DIA SELECIONADO          */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "dia" && (
        <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-400">
                Visão Diária
              </span>
              <h4 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
                {periodTitle}
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {
                getBookingsForDay(
                  weekDays.find(
                    (d) =>
                      d.date.getDate() === referenceDate.getDate() &&
                      d.date.getMonth() === referenceDate.getMonth()
                  ) || weekDays[0]
                ).length
              }{" "}
              Treino(s) no dia
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {HOURS.map((h) => {
              const hourStr = `${String(h).padStart(2, "0")}:00`;
              const targetDay =
                weekDays.find(
                  (d) =>
                    d.date.getDate() === referenceDate.getDate() &&
                    d.date.getMonth() === referenceDate.getMonth()
                ) || weekDays[0];
              const dayBookings = getBookingsForDay(targetDay).filter((b) => {
                const bHour = parseInt(b.slotTime.split(":")[0], 10);
                return bHour === h;
              });

              return (
                <div
                  key={h}
                  className="flex items-start gap-3 p-2 rounded-2xl bg-zinc-900/40 border border-white/[0.04]"
                >
                  <div className="w-16 font-mono text-xs font-bold text-zinc-400 pt-1 shrink-0">
                    {hourStr}
                  </div>
                  <div className="flex-1 space-y-2">
                    {dayBookings.length === 0 ? (
                      <div
                        onClick={() => {
                          triggerHaptic("light");
                          setSelectedStartTime(hourStr);
                          setSelectedDays([targetDay.dayName]);
                          setIsAdjustScheduleOpen(true);
                        }}
                        className="p-2.5 rounded-xl border border-dashed border-white/[0.06] text-[11px] text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>Horário livre</span>
                        <span className="text-[10px] text-zinc-600 hover:text-zinc-400 font-bold">
                          + Agendar treino
                        </span>
                      </div>
                    ) : (
                      dayBookings.map((b) => {
                        const details = getWorkoutDetailsForBooking(b);
                        const style = getStatusStyle(b.attendanceStatus);
                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              triggerHaptic("selection");
                              setSelectedSession({
                                booking: b,
                                workoutTitle: details.title,
                                workoutSubtitle: details.subtitle,
                                startTime: b.slotTime,
                                endTime: details.endTime,
                                durationText: details.durationText,
                                split: details.split,
                                dayLabel: targetDay.fullLabel,
                              });
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${style.cardBg}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white flex items-center gap-1.5">
                                <Dumbbell className="w-4 h-4 text-amber-300" />
                                {details.title}
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-300">
                                {b.slotTime} até {details.endTime} ({details.durationText})
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1">
                              {details.subtitle} • Personal: {b.coachName || currentCoachName}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. MODO LISTA: LINHA DO TEMPO CRONOLÓGICA DE TREINOS               */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "lista" && (
        <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-400" />
              Sessões Programadas na Semana
            </h4>
            <span className="text-xs font-mono font-bold text-zinc-400">
              Total: {bookings.length} treinos
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {bookings.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-300">
                  Nenhum treino programado para este período
                </p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Defina seus dias de acompanhamento ou contrate um personal trainer.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAdjustScheduleOpen(true)}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Configurar Meus 3 Dias</span>
                </button>
              </div>
            ) : (
              bookings.map((b, idx) => {
                const details = getWorkoutDetailsForBooking(b, idx);
                const style = getStatusStyle(b.attendanceStatus);
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedSession({
                        booking: b,
                        workoutTitle: details.title,
                        workoutSubtitle: details.subtitle,
                        startTime: b.slotTime,
                        endTime: details.endTime,
                        durationText: details.durationText,
                        split: details.split,
                        dayLabel: b.slotDay,
                      });
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${style.cardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 text-amber-300">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-white">{details.title}</h5>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${style.badge}`}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          {b.slotDay} • Personal: {b.coachName || currentCoachName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right font-mono">
                        <div className="text-xs font-black text-white">
                          {b.slotTime} até {details.endTime}
                        </div>
                        <div className="text-[10px] text-amber-300">
                          Duração: {details.durationText} (1h)
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 9. MODAL DETALHADO DA SESSÃO DE TREINO AO CLICAR NO CARD           */}
      {/* ------------------------------------------------------------------ */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-gradient-to-r from-purple-950/60 to-zinc-900 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                    Detalhes do Treino Presencial
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {selectedSession.workoutTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedSession.workoutSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Box de Horário & Até que hora vai durar */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Dia da Sessão:</span>
                  <span className="font-bold text-white">{selectedSession.dayLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Horário de Início:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    {selectedSession.startTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
                  <span className="text-zinc-400 font-medium">Até que hora vai durar:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">
                    Até às {selectedSession.endTime} ({selectedSession.durationText})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
                  <span className="text-zinc-400 font-medium">Duração Total:</span>
                  <span className="font-bold text-zinc-200">
                    {selectedSession.booking.durationMinutes || 60} minutos (1 hora completa)
                  </span>
                </div>
              </div>

              {/* Informações do Personal Trainer */}
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/30 text-purple-300 font-black flex items-center justify-center shrink-0">
                    {(selectedSession.booking.coachName || currentCoachName).charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase font-bold block">
                      Acompanhamento com Personal
                    </span>
                    <h5 className="text-xs font-black text-white">
                      {selectedSession.booking.coachName || currentCoachName}
                    </h5>
                  </div>
                </div>

                {currentCoachPhone && (
                  <a
                    href={`https://wa.me/${currentCoachPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá, ${currentCoachName}! Aqui é o ${student?.name || "seu aluno"}. Confirmando meu treino de ${selectedSession.dayLabel} às ${selectedSession.startTime} (até ${selectedSession.endTime})!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Lista dos Exercícios e Cárdio do Treino (se houver split prescrito) */}
              {selectedSession.split && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Exercícios Prescritos para este Dia
                  </h4>

                  {selectedSession.split.exercises?.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedSession.split.exercises.map((ex, i) => (
                        <div
                          key={ex.id || i}
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-zinc-200">
                            {i + 1}. {ex.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {ex.sets?.length || 4} séries
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                      Exercícios instruídos presencialmente pelo treinador durante a sessão.
                    </p>
                  )}

                  {/* Cárdio */}
                  {selectedSession.split.cardio && selectedSession.split.cardio.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="font-bold text-white">
                            {selectedSession.split.cardio[0].title}
                          </span>
                          <p className="text-[10px] text-zinc-400">
                            Duração: {selectedSession.split.cardio[0].durationMinutes} min • Queima: ~{selectedSession.split.cardio[0].targetCalories || 180} kcal
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                        Cárdio
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingForReschedule(selectedSession.booking);
                    setSelectedSession(null);
                    setIsRescheduleModalOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Remanejar Horário</span>
                </button>

                {onNavigateToWorkout ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      onNavigateToWorkout();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>Abrir Ficha de Treino</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedSession(null)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 10. MODAL: CONFIGURAR DIAS & HORÁRIOS (3X NA SEMANA, 1H)          */}
      {/* ------------------------------------------------------------------ */}
      {isAdjustScheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsAdjustScheduleOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Configurar Meus Treinos</h3>
                  <p className="text-[10px] text-zinc-400">
                    Defina seus dias de aula e duração da sessão
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustScheduleOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustSchedule} className="p-4 space-y-4">
              {/* Seleção de Frequência */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Frequência Semanal
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["2x", "3x", "4x", "5x"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => {
                        setSelectedFrequency(freq);
                        if (freq === "2x") setSelectedDays(["Terça", "Quinta"]);
                        else if (freq === "3x") setSelectedDays(["Segunda", "Quarta", "Sexta"]);
                        else if (freq === "4x") setSelectedDays(["Segunda", "Terça", "Quinta", "Sexta"]);
                        else setSelectedDays(["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]);
                      }}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        selectedFrequency === freq
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      {freq} {freq === "3x" ? "★" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção dos Dias */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Dias de Treino Selecionados ({selectedDays.length} dias)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedDays.length > 1) {
                              setSelectedDays(selectedDays.filter((d) => d !== day));
                            }
                          } else {
                            setSelectedDays([...selectedDays, day]);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-zinc-900 text-zinc-400 border border-white/[0.06]"
                        }`}
                      >
                        <span>{day}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horário de Início & Duração */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Horário de Início
                  </label>
                  <select
                    value={selectedStartTime}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-purple-500/50"
                  >
                    {HOURS.map((h) => {
                      const str = `${String(h).padStart(2, "0")}:00`;
                      return (
                        <option key={str} value={str}>
                          {str}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Duração da Sessão
                  </label>
                  <select
                    value={selectedDurationMinutes}
                    onChange={(e) => setSelectedDurationMinutes(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora (60 min) ★</option>
                    <option value={75}>1h15 (75 min)</option>
                    <option value={90}>1h30 (90 min)</option>
                  </select>
                </div>
              </div>

              {/* Box Informativo Dinâmico */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/[0.08] text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-400 block">
                  Resumo da Sessão
                </span>
                <p className="text-zinc-200">
                  Seus treinos começarão às <strong>{selectedStartTime}</strong> e durarão até às{" "}
                  <strong className="text-emerald-300">
                    {calculateSlotEndTime(selectedStartTime, selectedDurationMinutes)}
                  </strong>{" "}
                  ({selectedDurationMinutes / 60}h de duração).
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Dias: {selectedDays.join(", ")}.
                </p>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAdjustScheduleOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md"
                >
                  Salvar Programação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 11. MODAL: SOLICITAR REMANEJAMENTO DE HORÁRIO                      */}
      {/* ------------------------------------------------------------------ */}
      {isRescheduleModalOpen && selectedBookingForReschedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsRescheduleModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Remanejar Horário de Treino</h3>
                  <p className="text-[10px] text-zinc-400">
                    O professor receberá uma notificação para aprovar
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendRescheduleRequest} className="p-4 space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                <span className="text-[10px] text-zinc-400 block">Horário Atual:</span>
                <span className="font-bold text-white">
                  {selectedBookingForReschedule.slotDay} às {selectedBookingForReschedule.slotTime} com{" "}
                  {selectedBookingForReschedule.coachName || currentCoachName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Novo Dia Sugerido
                  </label>
                  <select
                    value={proposedDay}
                    onChange={(e) => setProposedDay(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {rescheduleDayOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Novo Horário
                  </label>
                  <select
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Motivo da Troca (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Ex: Imprevisto no trabalho, prefiro treinar à noite..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 12. MODAL: ALUNO DECIDIR SE QUER OU NÃO SAIR DO PERSONAL          */}
      {/* ------------------------------------------------------------------ */}
      <LeaveCoachModal
        isOpen={isLeaveCoachModalOpen}
        onClose={() => setIsLeaveCoachModalOpen(false)}
        coachName={currentCoachName}
        coachId={currentCoachId}
        coachPhone={currentCoachPhone}
        currentPlan={student?.plan || "Acompanhamento Personal VIP"}
        studentId={student?.id || effectiveStudentId}
        studentName={student?.name || currentUser.name || "Aluno"}
        onSuccessLeave={() => {
          showToast(`Acompanhamento com ${currentCoachName} encerrado. Horários liberados!`);
        }}
      />
    </div>
  );
}
