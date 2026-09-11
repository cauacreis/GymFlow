"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  ChevronRight,
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
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredBookings,
  requestReschedule,
  respondToReschedule,
  subscribeToBookings,
  BookingRequest,
  getRescheduleDayOptions,
  isSlotToday,
} from "@/lib/booking-store";
import { getStoredStudents, StudentProfile, subscribeToWorkoutChanges } from "@/lib/workout-store";
import { LeaveCoachModal } from "./LeaveCoachModal";

interface StudentAgendaCalendarProps {
  studentId?: string;
  onNavigateToWorkout?: () => void;
  onNavigateToPersonal?: () => void;
}

interface CalendarDayEvent {
  id: string;
  dayLabel: string;
  dateStr: string;
  time: string;
  status: "presente" | "falta" | "atraso" | "agendado" | "remanejamento_pendente";
  coachName: string;
  coachPhone?: string;
  bookingId?: string;
  rescheduleDetails?: BookingRequest["rescheduleRequest"];
}

const DEFAULT_DAYS_CALENDAR: CalendarDayEvent[] = [];

export function StudentAgendaCalendar({
  studentId = "student_carlos",
  onNavigateToWorkout,
  onNavigateToPersonal,
}: StudentAgendaCalendarProps) {
  const rescheduleDayOptions = getRescheduleDayOptions();

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarDayEvent[]>(DEFAULT_DAYS_CALENDAR);

  // Modal para o aluno decidir sair do personal
  const [isLeaveCoachModalOpen, setIsLeaveCoachModalOpen] = useState(false);

  // Modal de Solicitação de Remanejamento
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<BookingRequest | null>(null);
  const [proposedDay, setProposedDay] = useState(
    rescheduleDayOptions[1]?.value || rescheduleDayOptions[0]?.value || "Amanhã"
  );
  const [proposedTime, setProposedTime] = useState("19:00");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      const allBookings = getStoredBookings();
      setBookings(allBookings);

      const allStudents = getStoredStudents();
      const st = allStudents.find((s) => s.id === studentId) || allStudents[0];
      setStudent(st);

      // Sincroniza eventos da agenda com os agendamentos reais do aluno
      const myBookings = allBookings.filter((b) => !studentId || b.studentId === studentId);
      if (myBookings.length > 0) {
        const dynamicEvents: CalendarDayEvent[] = myBookings.map((b) => {
          const hasPendingResched = b.rescheduleRequest && b.rescheduleRequest.status === "pending";
          return {
            id: b.id,
            dayLabel: b.slotDay,
            dateStr: "Hoje",
            time: b.slotTime,
            status: hasPendingResched
              ? ("remanejamento_pendente" as const)
              : b.attendanceStatus === "attended" || (isSlotToday(b.slotDay) && st?.todayAttendanceStatus === "presente")
              ? ("presente" as const)
              : b.attendanceStatus === "missed" || (isSlotToday(b.slotDay) && st?.todayAttendanceStatus === "falta")
              ? ("falta" as const)
              : b.attendanceStatus === "delayed" || (isSlotToday(b.slotDay) && st?.todayAttendanceStatus === "atraso")
              ? ("atraso" as const)
              : ("agendado" as const),
            coachName: b.coachName,
            coachPhone: b.coachPhone,
            bookingId: b.id,
            rescheduleDetails: b.rescheduleRequest,
          };
        });
        setCalendarEvents(dynamicEvents);
      } else {
        setCalendarEvents([]);
      }
    };

    load();
    const unsubBookings = subscribeToBookings(load);
    const unsubWorkouts = subscribeToWorkoutChanges(load);
    return () => {
      unsubBookings();
      unsubWorkouts();
    };
  }, [studentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Contadores
  const totalPresences = calendarEvents.filter((e) => e.status === "presente").length;
  const totalAbsences = calendarEvents.filter((e) => e.status === "falta").length;
  const totalAttendedOrMissed = totalPresences + totalAbsences;
  const attendanceRate = totalAttendedOrMissed > 0 ? Math.round((totalPresences / totalAttendedOrMissed) * 100) : 100;
  const nextSession = calendarEvents.find((e) => e.status === "agendado" || e.status === "remanejamento_pendente");

  // Dados do Personal Trainer Atual do Aluno
  const myBookings = bookings.filter((b) => !studentId || b.studentId === studentId);
  const activeCoachBooking =
    myBookings.find((b) => b.status === "accepted" || b.status === "pending") ||
    (myBookings.length > 0 ? myBookings[0] : null);

  const hasActiveCoach =
    !!activeCoachBooking &&
    student?.plan !== "Treino Livre (Sem Personal)" &&
    student?.paymentStatus !== "cancelado";

  const currentCoachName =
    activeCoachBooking?.coachName || student?.prescribedBy || "Prof. Rodrigo";
  const currentCoachPhone = activeCoachBooking?.coachPhone || "11988887777";
  const currentCoachId = activeCoachBooking?.coachId || "coach_principal";

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

  // Aluno responde a proposta de remanejamento feita pelo professor
  const handleStudentRespondReschedule = (bookingId: string, accept: boolean) => {
    triggerHaptic(accept ? "success" : "warning");
    respondToReschedule(bookingId, accept);
    showToast(accept ? "Novo horário aceito com sucesso!" : "Horário original mantido.");
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

      {/* Header com Resumo da Agenda do Aluno */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Agenda & Frequência
            </span>
            <h2 className="text-lg font-black text-white mt-1">Meus Treinos & Presenças</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acompanhe dias que foi, faltas e solicite remanejamento com seu treinador.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] text-right">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">Assiduidade</span>
            <span className="text-base font-black text-emerald-400 font-mono leading-none">
              {attendanceRate}%
            </span>
          </div>
        </div>

        {/* 3 Métricas Rápidas */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06]">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 block">Treinos Concluídos</span>
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {totalPresences}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 block">Faltas Registradas</span>
            <span className="text-sm sm:text-base font-black text-rose-400 font-mono mt-0.5 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {totalAbsences}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 block">Próxima Sessão</span>
            <span className="text-xs font-black text-white mt-1 truncate block font-mono">
              {nextSession ? `${nextSession.dayLabel} ${nextSession.time}` : "Nenhuma"}
            </span>
          </div>
        </div>
      </div>

      {/* CARD: PROPOSTA DE REMANEJAMENTO DO PROFESSOR (CASO HAJA UMA PENDENTE) */}
      {bookings.some(
        (b) =>
          b.studentId === studentId &&
          b.rescheduleRequest?.requestedBy === "coach" &&
          b.rescheduleRequest?.status === "pending"
      ) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 shadow-xl space-y-2.5 animate-in slide-in-from-top-2">
          {bookings
            .filter(
              (b) =>
                b.studentId === studentId &&
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

      {/* CARD: MEU PERSONAL TRAINER ATUAL & OPÇÃO DE DESVINCULAR */}
      {hasActiveCoach ? (
        <div className="p-4 rounded-3xl bg-zinc-900/90 border border-purple-500/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300 font-black text-base shadow-inner">
                {currentCoachName.charAt(0)}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950"
                  title="Acompanhamento Ativo"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                    Meu Personal Trainer
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    • Ativo
                  </span>
                </div>
                <h4 className="text-sm font-black text-white truncate mt-0.5">
                  {currentCoachName}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  Plano: <span className="text-zinc-200 font-semibold">{student?.plan || "Mensal VIP"}</span>
                </p>
              </div>
            </div>

            {/* Ações do Aluno: WhatsApp & Sair do Personal */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
              {currentCoachPhone && (
                <a
                  href={`https://wa.me/${currentCoachPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá, ${currentCoachName}! Aqui é o ${student?.name || "seu aluno"}. Passando para tirar uma dúvida sobre meus treinos!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Falar no WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* BOTÃO PARA O ALUNO DECIDIR SAIR DO PERSONAL */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsLeaveCoachModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                title="Encerrar acompanhamento com este personal trainer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sair do Personal</span>
              </button>
            </div>
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
                Você não possui um Personal Trainer vinculado
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Treine com as fichas livres ou contrate um treinador no salão.
              </p>
            </div>
          </div>

          {onNavigateToPersonal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("medium");
                onNavigateToPersonal();
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-amber-500/20 shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Contratar Personal</span>
            </button>
          )}
        </div>
      )}

      {/* CARD: STATUS DA FICHA TÉCNICA (OPCIONAL!) */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">
              Ficha Técnica do Treinador
            </span>
            <h4 className="text-xs font-black text-white truncate">
              {student?.hasWorkoutSheet
                ? student.currentRoutineTitle
                : "Acompanhamento Presencial Livre (Ficha Opcional)"}
            </h4>
            <p className="text-[10px] text-zinc-400 truncate">
              {student?.hasWorkoutSheet
                ? `Prescrita por ${student.prescribedBy}`
                : "Seu professor instrui seus exercícios diretamente no salão"}
            </p>
          </div>
        </div>

        {onNavigateToWorkout && (
          <button
            onClick={() => {
              triggerHaptic("selection");
              onNavigateToWorkout();
            }}
            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-bold shrink-0 border border-white/[0.08] active:scale-95 transition-all"
          >
            {student?.hasWorkoutSheet ? "Ver Ficha" : "Ver Treinos"}
          </button>
        )}
      </div>

      {/* Grade / Linha do Tempo de Treinos (Presenças, Faltas e Futuros) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Histórico & Próximos Dias
          </h3>
          <span className="text-[10px] text-zinc-400">Clique para remanejar</span>
        </div>

        <div className="flex flex-col gap-2">
          {calendarEvents.length === 0 ? (
            <div className="py-10 px-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-zinc-300">Nenhum treino agendado ainda</p>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                Seus agendamentos com personal trainer e histórico de frequências no salão aparecerão aqui.
              </p>
            </div>
          ) : (
            calendarEvents.map((evt) => {
              const isAttended = evt.status === "presente";
            const isMissed = evt.status === "falta";
            const isDelayed = evt.status === "atraso";
            const isScheduled = evt.status === "agendado";
            const isReschedPending = evt.status === "remanejamento_pendente";

            return (
              <div
                key={evt.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isAttended
                    ? "bg-emerald-950/20 border-emerald-500/20"
                    : isMissed
                    ? "bg-rose-950/20 border-rose-500/20"
                    : isDelayed
                    ? "bg-amber-950/25 border-amber-500/30"
                    : isReschedPending
                    ? "bg-amber-950/25 border-amber-500/30"
                    : "bg-zinc-900/60 border-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ícone de Status */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isAttended
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isMissed
                          ? "bg-rose-500/20 text-rose-400"
                          : isDelayed
                          ? "bg-amber-500/20 text-amber-400"
                          : isReschedPending
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-white/[0.06] text-white"
                      }`}
                    >
                      {isAttended ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isMissed ? (
                        <XCircle className="w-5 h-5" />
                      ) : isDelayed ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : isReschedPending ? (
                        <ArrowRightLeft className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white font-mono">
                          {evt.dayLabel} • {evt.time}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isAttended
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : isMissed
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : isDelayed
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : isReschedPending
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-white/[0.08] text-zinc-300 border border-white/10"
                          }`}
                        >
                          {isAttended
                            ? "Presente"
                            : isMissed
                            ? "Falta"
                            : isDelayed
                            ? "Atraso Registrado"
                            : isReschedPending
                            ? "Em Análise"
                            : "Agendado"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {evt.coachName} • Data: {evt.dateStr}
                      </p>
                    </div>
                  </div>

                  {/* Ação de Remanejamento para Treinos Agendados */}
                  {isScheduled && evt.bookingId && (
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        const b = bookings.find((item) => item.id === evt.bookingId);
                        if (b) {
                          setSelectedBookingForReschedule(b);
                          setIsRescheduleModalOpen(true);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 text-[10px] font-bold flex items-center gap-1 border border-white/[0.06] shrink-0 active:scale-95 transition-all"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Remanejar</span>
                    </button>
                  )}

                  {isReschedPending && (
                    <span className="text-[10px] text-amber-400 font-bold italic shrink-0">
                      Aguardando aceite...
                    </span>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* MODAL: SOLICITAR REMANEJAMENTO DE HORÁRIO */}
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
                  {selectedBookingForReschedule.coachName}
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
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                  >
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
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

      {/* MODAL: ALUNO DECIDIR SE QUER OU NÃO SAIR DO PERSONAL */}
      <LeaveCoachModal
        isOpen={isLeaveCoachModalOpen}
        onClose={() => setIsLeaveCoachModalOpen(false)}
        coachName={currentCoachName}
        coachId={currentCoachId}
        coachPhone={currentCoachPhone}
        currentPlan={student?.plan || "Mensal VIP (R$ 55/mês)"}
        studentId={student?.id || studentId}
        studentName={student?.name || "Aluno"}
        onSuccessLeave={() => {
          showToast(`Acompanhamento com ${currentCoachName} encerrado. Horários liberados!`);
        }}
      />
    </div>
  );
}
