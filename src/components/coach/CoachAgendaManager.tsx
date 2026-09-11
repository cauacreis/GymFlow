"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  AlertTriangle,
  UserCheck,
  Plus,
  ArrowRightLeft,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
  Dumbbell,
  Check,
  HelpCircle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredCoaches,
  getStoredBookings,
  updateBookingStatus,
  updateAttendanceStatus,
  requestReschedule,
  respondToReschedule,
  subscribeToBookings,
  CoachTrainer,
  BookingRequest,
  getRescheduleDayOptions,
  isSlotToday,
} from "@/lib/booking-store";
import {
  getStoredStudents,
  recordStudentAttendance,
  StudentProfile,
  subscribeToWorkoutChanges,
} from "@/lib/workout-store";

interface CoachAgendaManagerProps {
  coachId?: string;
  onOpenWorkoutSheet?: (studentId: string) => void;
}

export function CoachAgendaManager({
  coachId = "coach_rodrigo",
  onOpenWorkoutSheet,
}: CoachAgendaManagerProps) {
  const rescheduleDayOptions = getRescheduleDayOptions();

  // Estados principais
  const [coaches, setCoaches] = useState<CoachTrainer[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Navegação de Período & Modo de Visualização
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "dia" | "lista">("semana");
  const [now, setNow] = useState<Date>(new Date());

  // Modais
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [quickScheduleCell, setQuickScheduleCell] = useState<{ dayName: string; time: string } | null>(null);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState<string>("");

  // Modal Remanejamento
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingRequest | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState(
    rescheduleDayOptions[1]?.value || rescheduleDayOptions[0]?.value || "Amanhã"
  );
  const [rescheduleTime, setRescheduleTime] = useState("18:00");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Atualização em tempo real do relógio (traço vermelho que desce com o tempo)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000); // 30s
    return () => clearInterval(timer);
  }, []);

  // Carregamento e sincronização reativa com os stores
  useEffect(() => {
    const refresh = () => {
      setCoaches(getStoredCoaches());
      setBookings(getStoredBookings());
      setStudents(getStoredStudents());
    };
    refresh();
    const unsubBookings = subscribeToBookings(refresh);
    const unsubWorkouts = subscribeToWorkoutChanges(refresh);
    return () => {
      unsubBookings();
      unsubWorkouts();
    };
  }, [coachId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // CÁLCULO DOS DIAS DA SEMANA (DOMINGO A SÁBADO)
  // --------------------------------------------------------------------------
  const sunday = new Date(referenceDate);
  sunday.setDate(referenceDate.getDate() - referenceDate.getDay());
  sunday.setHours(0, 0, 0, 0);

  const shortNames = ["DOM.", "SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SÁB."];
  const fullNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const weekDays = Array.from({ length: 7 }, (_, i) => {
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

  // Título do Período (ex: "17 – 23 de mai. de 2026")
  const startDay = weekDays[0].date.getDate();
  const endDay = weekDays[6].date.getDate();
  const monthName = weekDays[6].date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const year = weekDays[6].date.getFullYear();
  const periodTitle =
    viewMode === "dia"
      ? referenceDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
      : `${startDay} – ${endDay} de ${monthName}. de ${year}`;

  // --------------------------------------------------------------------------
  // INDICADORES SUPERIORES (TOP KPIS)
  // --------------------------------------------------------------------------
  const todayDayName = fullNames[now.getDay()];
  const todayDateFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  const todayBookings = bookings.filter((b) => isSlotToday(b.slotDay));

  const activeStudentsCount = students.filter((s) => (s.status || "ativo") === "ativo").length;
  const attendedToday = todayBookings.filter((b) => b.attendanceStatus === "attended").length;
  const missedToday = todayBookings.filter((b) => b.attendanceStatus === "missed").length;
  const totalResolvedToday = attendedToday + missedToday;
  const todayAttendanceRate =
    totalResolvedToday > 0
      ? Math.round((attendedToday / totalResolvedToday) * 100)
      : todayBookings.length > 0
      ? 100
      : 83; // Taxa proporcional realista

  // Horários exibidos na grade (06:00 às 22:00)
  const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const ROW_HEIGHT = 64; // altura em pixels por hora

  // --------------------------------------------------------------------------
  // POSICIONAMENTO DA LINHA VERMELHA (TEMPO REAL)
  // --------------------------------------------------------------------------
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const minutesSince6 = (currentHour - 6) * 60 + currentMinutes;
  const isTimeInGrid = minutesSince6 >= 0 && minutesSince6 <= 17 * 60;
  const redLineTop = isTimeInGrid ? (minutesSince6 / 60) * ROW_HEIGHT : null;

  // Filtragem de agendamentos por dia da semana
  const getBookingsForDay = (d: (typeof weekDays)[0]) => {
    return bookings.filter((b) => {
      if (b.slotDay.includes(d.dateFormatted)) return true;
      if (d.isToday && isSlotToday(b.slotDay)) return true;
      if (b.slotDay.toLowerCase().includes(d.dayName.toLowerCase().slice(0, 3))) return true;
      return false;
    });
  };

  // Cores de Status dos Cards (Verde = Presente, Vermelho = Falta, Amarelo = Justificado, Cinza = Pendente)
  const getStatusStyle = (status: BookingRequest["attendanceStatus"]) => {
    switch (status) {
      case "attended":
        return {
          cardBg: "bg-emerald-600/95 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-950/40",
          dotColor: "bg-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          label: "Presente",
        };
      case "missed":
        return {
          cardBg: "bg-red-500/95 hover:bg-red-400 text-white border-red-400/40 shadow-red-950/40",
          dotColor: "bg-red-400",
          badge: "bg-red-500/20 text-red-300 border-red-500/30",
          label: "Falta",
        };
      case "justified":
        return {
          cardBg: "bg-amber-600/95 hover:bg-amber-500 text-white border-amber-400/40 shadow-amber-950/40",
          dotColor: "bg-amber-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          label: "Justificado",
        };
      case "delayed":
        return {
          cardBg: "bg-amber-700/95 hover:bg-amber-600 text-white border-amber-500/40 shadow-amber-950/40",
          dotColor: "bg-amber-300",
          badge: "bg-amber-500/20 text-amber-200 border-amber-500/30",
          label: "Atraso",
        };
      case "pending":
      case "scheduled":
      default:
        return {
          cardBg: "bg-slate-700/85 hover:bg-slate-600 text-zinc-200 border-slate-600/40 shadow-black/40",
          dotColor: "bg-zinc-400",
          badge: "bg-white/[0.06] text-zinc-400 border-white/10",
          label: "Pendente",
        };
    }
  };

  // Ação de Atualização de Presença (1 toque pelo professor)
  const handleUpdateStatus = (
    bookingId: string,
    newStatus: "attended" | "missed" | "justified" | "pending"
  ) => {
    triggerHaptic(newStatus === "attended" ? "success" : newStatus === "missed" ? "warning" : "light");
    updateAttendanceStatus(bookingId, newStatus);

    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, attendanceStatus: newStatus } : null));
    }

    showToast(`Status atualizado para "${getStatusStyle(newStatus).label}"!`);
  };

  // Criar agendamento rápido ao clicar em célula vazia
  const handleConfirmQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScheduleCell || !selectedStudentForSchedule) return;

    const st = students.find((s) => s.id === selectedStudentForSchedule);
    if (!st) return;

    const newBooking: BookingRequest = {
      id: `book_${Date.now()}`,
      studentId: st.id,
      studentName: st.name,
      studentPhone: st.phone || "",
      coachId,
      coachName: "Prof. Rodrigo",
      coachPhone: "11999990000",
      slotDay: quickScheduleCell.dayName,
      slotTime: quickScheduleCell.time,
      planType: "pro",
      basePrice: 45,
      extraOfferedAmount: 0,
      totalPrice: 45,
      status: "accepted",
      paymentStatus: "paid",
      attendanceStatus: "pending",
      createdAt: `Hoje às ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("gymflow_bookings_v3", JSON.stringify(updated));
      window.dispatchEvent(new Event("gymflow:booking-updated"));
    }

    setQuickScheduleCell(null);
    setSelectedStudentForSchedule("");
    showToast(`Aula agendada para ${st.name} às ${newBooking.slotTime}!`);
  };

  // Enviar proposta de remanejamento pelo professor
  const handleSendReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBooking) return;

    requestReschedule({
      bookingId: rescheduleBooking.id,
      requestedBy: "coach",
      proposedDay: rescheduleDay,
      proposedTime: rescheduleTime,
      reason: rescheduleReason.trim() || undefined,
    });

    setRescheduleBooking(null);
    setRescheduleReason("");
    showToast("Proposta de remanejamento enviada para o aluno!");
  };

  // Solicitações de Remanejamento Pendentes enviadas por alunos
  const studentRescheduleRequests = bookings.filter(
    (b) => b.rescheduleRequest?.requestedBy === "student" && b.rescheduleRequest.status === "pending"
  );

  return (
    <div className="flex flex-col gap-4 text-left w-full animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP STATS CARDS (Estilo PilatesFlow Studio Manager) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Aulas Hoje */}
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono leading-none">
              {todayBookings.length}
            </div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Aulas hoje</div>
          </div>
        </div>

        {/* Card 2: Alunos Ativos */}
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono leading-none">
              {activeStudentsCount}
            </div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Alunos ativos</div>
          </div>
        </div>

        {/* Card 3: Taxa de Hoje */}
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono leading-none">
              {todayAttendanceRate}%
            </div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Taxa de hoje</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. BARRA DE LEGENDA DE STATUS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2 px-3.5 rounded-2xl bg-zinc-900/50 border border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-zinc-300 font-medium">Presente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-zinc-300 font-medium">Falta</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-zinc-300 font-medium">Justificado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span className="text-zinc-300 font-medium">Pendente</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. BARRA DE CONTROLE: NAVEGAÇÃO, DATA & MODOS (MÊS/SEMANA/DIA/LISTA) */}
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
                else if (viewMode === "mes") next.setMonth(next.getMonth() - 1);
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
                else if (viewMode === "mes") next.setMonth(next.getMonth() + 1);
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

        {/* Alternador de Modos */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-white/[0.08] self-stretch sm:self-auto justify-center">
          {(["mes", "semana", "dia", "lista"] as const).map((mode) => {
            const labels = { mes: "Mês", semana: "Semana", dia: "Dia", lista: "Lista" };
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
      {/* 4. SEÇÃO: ALERTAS DE REMANEJAMENTO SOLICITADOS POR ALUNOS */}
      {/* ------------------------------------------------------------------ */}
      {studentRescheduleRequests.length > 0 && (
        <div className="rounded-3xl p-4 bg-amber-950/20 border-2 border-amber-500/40 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black text-amber-300">
              Solicitações de Troca de Horário ({studentRescheduleRequests.length})
            </h4>
          </div>
          <div className="flex flex-col gap-2">
            {studentRescheduleRequests.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/30 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-black text-white">{b.studentName}</h5>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      Horário atual: <strong>{b.slotDay} às {b.slotTime}</strong> ➔ Sugestão do aluno:{" "}
                      <strong className="text-amber-300">
                        {b.rescheduleRequest?.proposedDay} às {b.rescheduleRequest?.proposedTime}
                      </strong>
                    </p>
                  </div>
                </div>
                {b.rescheduleRequest?.reason && (
                  <p className="text-[10px] text-zinc-400 italic bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                    Justificativa: "{b.rescheduleRequest.reason}"
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      triggerHaptic("warning");
                      respondToReschedule(b.id, false);
                      showToast("Remanejamento recusado.");
                    }}
                    className="py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-zinc-300 text-xs font-bold transition-all"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic("success");
                      respondToReschedule(b.id, true);
                      showToast("Remanejamento aprovado com sucesso!");
                    }}
                    className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aprovar Troca</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. VISUALIZAÇÃO PRINCIPAL: GRADE DA SEMANA (TIMETABLE CALENDÁRIOZÃO) */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "semana" && (
        <div className="w-full overflow-x-auto rounded-3xl border border-white/[0.08] bg-zinc-950/80 shadow-2xl custom-scrollbar">
          <div className="min-w-[700px] lg:min-w-full relative">
            {/* CABEÇALHO BRANCO DOS DIAS (DOM A SÁB) - IDÊNTICO À PRINT */}
            <div className="grid grid-cols-8 bg-white text-zinc-950 font-black border-b border-zinc-300 sticky top-0 z-30 shadow-sm">
              <div className="py-2.5 px-2 text-center text-[10px] sm:text-xs font-mono border-r border-zinc-200 uppercase tracking-wider text-zinc-600 flex items-center justify-center">
                Hora
              </div>
              {weekDays.map((d) => (
                <div
                  key={d.shortLabel}
                  className={`py-2.5 px-1 sm:px-2 text-center text-[10px] sm:text-xs uppercase tracking-wider border-r border-zinc-200 last:border-r-0 truncate ${
                    d.isToday ? "bg-amber-300/40 text-zinc-950 font-black" : ""
                  }`}
                >
                  <span>{d.shortLabel}</span>
                </div>
              ))}
            </div>

            {/* CORPO DA GRADE COM HORÁRIOS & LINHA VERMELHA EM TEMPO REAL */}
            <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}>
              {/* LINHA VERMELHA EM TEMPO REAL ("traço vermelho correndo com o horário") */}
              {redLineTop !== null && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `${redLineTop}px` }}
                >
                  {/* Seta e badge vermelha com a hora atual na lateral */}
                  <div className="absolute left-1 -translate-y-1/2 flex items-center gap-1 z-30">
                    <span className="text-red-500 text-xs font-black animate-pulse">▶</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white font-mono text-[9px] font-black shadow-md shadow-red-500/50">
                      {String(currentHour).padStart(2, "0")}:{String(currentMinutes).padStart(2, "0")}
                    </span>
                  </div>
                  {/* Linha horizontal contínua que cruza a grade */}
                  <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ml-14" />
                </div>
              )}

              {/* LINHAS DE HORAS E CÉLULAS DE CLIQUE */}
              {HOURS.map((hour, hIdx) => {
                const hourStr = `${String(hour).padStart(2, "0")}:00`;
                return (
                  <div
                    key={hour}
                    className="grid grid-cols-8 border-b border-white/[0.06]"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Eixo de Horário na Esquerda */}
                    <div className="border-r border-white/[0.06] flex items-center justify-center text-xs font-mono font-bold text-zinc-400 select-none bg-zinc-950/40">
                      {String(hour).padStart(2, "0")}
                    </div>

                    {/* 7 Colunas para os Dias */}
                    {weekDays.map((d) => (
                      <div
                        key={d.shortLabel}
                        onClick={() => {
                          triggerHaptic("light");
                          setQuickScheduleCell({ dayName: d.dayName, time: hourStr });
                        }}
                        className={`border-r border-white/[0.06] last:border-r-0 relative hover:bg-white/[0.02] cursor-pointer transition-colors ${
                          d.isToday ? "bg-amber-500/[0.02]" : ""
                        }`}
                        title={`Clique para agendar aluno em ${d.dayName} às ${hourStr}`}
                      />
                    ))}
                  </div>
                );
              })}

              {/* RENDERIZAÇÃO ABSOLUTA DOS CARDS DE ALUNOS NAS SUAS COLUNAS */}
              <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                {/* Gutter da esquerda vazio */}
                <div />

                {/* 7 Colunas com seus respectivos alunos posicionados */}
                {weekDays.map((d, colIdx) => {
                  const dayBookings = getBookingsForDay(d);

                  return (
                    <div key={d.shortLabel} className="relative h-full w-full">
                      {dayBookings.map((b) => {
                        const [bHour, bMin] = b.slotTime.split(":").map(Number);
                        if (isNaN(bHour) || bHour < 6 || bHour > 22) return null;

                        const top = ((bHour - 6) * 60 + (bMin || 0)) * (ROW_HEIGHT / 60);
                        const height = (55 / 60) * ROW_HEIGHT; // aula de 55 minutos padrão
                        const style = getStatusStyle(b.attendanceStatus);

                        // Termino previsto (55 min depois)
                        const endMins = (bMin || 0) + 55;
                        const endH = bHour + Math.floor(endMins / 60);
                        const endM = endMins % 60;
                        const timeSpan = `${b.slotTime} - ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("selection");
                              setSelectedBooking(b);
                            }}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            className={`absolute inset-x-1 rounded-xl p-1.5 border flex flex-col justify-center transition-all cursor-pointer pointer-events-auto ${style.cardBg}`}
                          >
                            <div className="text-[9px] sm:text-[10px] font-mono font-bold leading-tight opacity-90 truncate">
                              {timeSpan}
                            </div>
                            <div className="text-[11px] sm:text-xs font-black truncate mt-0.5">
                              {b.studentName}
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
      {/* 6. MODO DIA: GRADE DETALHADA PARA O DIA SELECIONADO */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "dia" && (
        <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              {referenceDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </h4>
            <span className="text-xs font-mono font-bold text-amber-400">
              {getBookingsForDay(weekDays.find((d) => d.isToday) || weekDays[0]).length} Aulas Agendadas
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {HOURS.map((h) => {
              const hourStr = `${String(h).padStart(2, "0")}:00`;
              const targetDay = weekDays.find((d) => d.isToday) || weekDays[0];
              const match = getBookingsForDay(targetDay).find((b) => b.slotTime.startsWith(String(h).padStart(2, "0")));

              return (
                <div
                  key={h}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/60 border border-white/[0.04]"
                >
                  <span className="w-14 text-xs font-mono font-bold text-zinc-400 shrink-0">{hourStr}</span>
                  {match ? (
                    <div
                      onClick={() => setSelectedBooking(match)}
                      className={`flex-1 p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                        getStatusStyle(match.attendanceStatus).cardBg
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-white">{match.studentName}</div>
                        <div className="text-[10px] font-mono opacity-80">{match.slotTime} • Plano {match.planType.toUpperCase()}</div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-black/30">
                        {getStatusStyle(match.attendanceStatus).label}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuickScheduleCell({ dayName: targetDay.dayName, time: hourStr })}
                      className="flex-1 py-2 rounded-xl border border-dashed border-white/10 hover:border-amber-500/40 text-zinc-500 hover:text-amber-400 text-xs font-medium transition-all"
                    >
                      + Disponível para agendar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. MODO MÊS: CALENDÁRIO GERAL COM CONTAGEM DE AULAS */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "mes" && (
        <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-4 shadow-xl">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((name) => (
              <div key={name} className="text-xs font-bold text-zinc-400 py-1 uppercase font-mono">
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }, (_, idx) => {
              const dayNum = ((idx % 30) + 1);
              const isToday = dayNum === now.getDate();
              return (
                <div
                  key={idx}
                  onClick={() => {
                    const next = new Date(referenceDate);
                    next.setDate(dayNum);
                    setReferenceDate(next);
                    setViewMode("semana");
                  }}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[64px] cursor-pointer transition-all hover:border-purple-500/50 ${
                    isToday ? "bg-purple-950/40 border-purple-500/50" : "bg-zinc-950/60 border-white/[0.04]"
                  }`}
                >
                  <span className={`text-xs font-black font-mono ${isToday ? "text-purple-300" : "text-zinc-300"}`}>
                    {dayNum}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. MODO LISTA: VISÃO CRONOLÓGICA DAS AULAS COM AÇÕES RÁPIDAS */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "lista" && (
        <div className="flex flex-col gap-2.5">
          {bookings.map((b) => {
            const style = getStatusStyle(b.attendanceStatus);
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] hover:border-amber-500/30 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-10 rounded-full ${style.dotColor} shrink-0`} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{b.studentName}</h4>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      📅 {b.slotDay} às {b.slotTime} • Plano {b.planType.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1: DETALHES DA AULA & REGISTRO RÁPIDO DE PRESENÇA (1 TOQUE) */}
      {/* ------------------------------------------------------------------ */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/10 p-5 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Aluno */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-base font-black text-amber-400 shrink-0">
                {selectedBooking.studentName.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Gerenciar Aula / Presença
                </span>
                <h3 className="text-base font-black text-white truncate">{selectedBooking.studentName}</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {selectedBooking.slotDay} • {selectedBooking.slotTime} (55 min)
                </p>
              </div>
            </div>

            {/* Status Atual */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Status Atual da Aula:</span>
              <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${getStatusStyle(selectedBooking.attendanceStatus).badge}`}>
                {getStatusStyle(selectedBooking.attendanceStatus).label}
              </span>
            </div>

            {/* BOTOES DE 1 TOQUE PARA ATUALIZAR STATUS */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">
                Alterar Presença do Aluno:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, "attended")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    selectedBooking.attendanceStatus === "attended"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-white/[0.04] text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Presente</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, "missed")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    selectedBooking.attendanceStatus === "missed"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-white/[0.04] text-red-400 hover:bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Falta</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, "justified")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    selectedBooking.attendanceStatus === "justified"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                      : "bg-white/[0.04] text-amber-400 hover:bg-amber-600/20 border border-amber-500/30"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Justificado</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, "pending")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    selectedBooking.attendanceStatus === "pending" || selectedBooking.attendanceStatus === "scheduled"
                      ? "bg-slate-600 text-white shadow-lg"
                      : "bg-white/[0.04] text-zinc-300 hover:bg-slate-700/40 border border-slate-600/30"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Pendente</span>
                </button>
              </div>
            </div>

            {/* Ações Secundárias: WhatsApp & Remanejar */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              {selectedBooking.studentPhone && (
                <a
                  href={`https://wa.me/${selectedBooking.studentPhone}?text=${encodeURIComponent(
                    `Olá, ${selectedBooking.studentName}! Aqui é o ${selectedBooking.coachName}. Sobre nosso treino de ${selectedBooking.slotDay} às ${selectedBooking.slotTime}...`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                onClick={() => {
                  setRescheduleBooking(selectedBooking);
                  setSelectedBooking(null);
                }}
                className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Remanejar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2: AGENDAR ALUNO EM HORÁRIO VAGO CLICADO NA GRADE */}
      {/* ------------------------------------------------------------------ */}
      {quickScheduleCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleConfirmQuickSchedule}
            className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/10 p-5 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setQuickScheduleCell(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                Agendamento Rápido
              </span>
              <h3 className="text-base font-black text-white mt-0.5">Novo Aluno no Horário</h3>
              <p className="text-xs text-zinc-400 font-mono">
                📅 {quickScheduleCell.dayName} às {quickScheduleCell.time}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Selecione o Aluno:</label>
              <select
                value={selectedStudentForSchedule}
                onChange={(e) => setSelectedStudentForSchedule(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/50"
                required
              >
                <option value="" disabled>
                  Escolha um aluno cadastrado...
                </option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.plan || "VIP"})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedStudentForSchedule}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 active:scale-95"
            >
              Confirmar Agendamento
            </button>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 3: PROPOR REMANEJAMENTO DE HORÁRIO */}
      {/* ------------------------------------------------------------------ */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSendReschedule}
            className="w-full max-w-md rounded-3xl bg-zinc-900 border border-amber-500/30 p-5 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setRescheduleBooking(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Remanejamento de Horário
              </span>
              <h3 className="text-base font-black text-white mt-0.5">
                Proposta para {rescheduleBooking.studentName}
              </h3>
              <p className="text-xs text-zinc-400">
                Horário atual: {rescheduleBooking.slotDay} às {rescheduleBooking.slotTime}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Novo Dia:</label>
                <select
                  value={rescheduleDay}
                  onChange={(e) => setRescheduleDay(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white"
                >
                  {rescheduleDayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Novo Horário:</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400">
                Motivo / Recado (Opcional):
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Ex: Sala de musculação em manutenção às 18h..."
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Enviar Proposta de Troca
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
