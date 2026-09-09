"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  ShieldCheck,
  UserX,
  RotateCcw,
  ArrowRightLeft,
  X,
  Trash2,
  Check,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredCoaches,
  getStoredBookings,
  updateBookingStatus,
  updatePaymentStatus,
  updateAttendanceStatus,
  updateCoachSlots,
  updateCoachPricing,
  occupySlot,
  freeSlot,
  requestReschedule,
  respondToReschedule,
  subscribeToBookings,
  CoachTrainer,
  BookingRequest,
  TrainerSlot,
} from "@/lib/booking-store";
import { getStoredStudents, StudentProfile } from "@/lib/workout-store";

interface CoachAgendaManagerProps {
  coachId?: string;
}

export function CoachAgendaManager({ coachId = "coach_rodrigo" }: CoachAgendaManagerProps) {
  const [coaches, setCoaches] = useState<CoachTrainer[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Hoje");
  const [newSlotTime, setNewSlotTime] = useState("");
  const [isEditingPrices, setIsEditingPrices] = useState(false);

  // Preços editáveis
  const [dailyPrice, setDailyPrice] = useState(75);
  const [weeklyPrice, setWeeklyPrice] = useState(190);
  const [monthlyPrice, setMonthlyPrice] = useState(580);

  // Modal Atribuir Aluno a Horário Vago
  const [assignModalSlot, setAssignModalSlot] = useState<TrainerSlot | null>(null);
  const [selectedStudentForSlot, setSelectedStudentForSlot] = useState<string>("");

  // Modal de Proposta de Remanejamento pelo Professor
  const [rescheduleModalBooking, setRescheduleModalBooking] = useState<BookingRequest | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState("Amanhã");
  const [rescheduleTime, setRescheduleTime] = useState("18:00");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const refreshData = () => {
      const allCoaches = getStoredCoaches();
      setCoaches(allCoaches);
      setBookings(getStoredBookings());
      setStudents(getStoredStudents());

      const me = allCoaches.find((c) => c.id === coachId) || allCoaches[0];
      if (me) {
        setDailyPrice(me.pricing.dailySession);
        setWeeklyPrice(me.pricing.weeklyPlan);
        setMonthlyPrice(me.pricing.monthlyPlan);
      }
    };
    refreshData();
    const unsub = subscribeToBookings(refreshData);
    return () => unsub();
  }, [coachId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentCoach = coaches.find((c) => c.id === coachId) || coaches[0];
  const myBookings = bookings.filter((b) => b.coachId === coachId);
  const pendingRequests = myBookings.filter((b) => b.status === "pending");
  const activeBookings = myBookings.filter((b) => b.status === "accepted");

  // Remanejamentos pendentes solicitados por alunos
  const studentRescheduleRequests = myBookings.filter(
    (b) => b.rescheduleRequest?.requestedBy === "student" && b.rescheduleRequest.status === "pending"
  );

  // Alternar disponibilidade de um slot
  const handleToggleSlot = (slotId: string) => {
    triggerHaptic("selection");
    if (!currentCoach) return;
    const updatedSlots = currentCoach.slots.map((s) =>
      s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    updateCoachSlots(currentCoach.id, updatedSlots);
  };

  // Liberar vaga ocupada
  const handleFreeSlot = (slotId: string) => {
    triggerHaptic("warning");
    if (!currentCoach) return;
    freeSlot(currentCoach.id, slotId);
    showToast("Vaga liberada com sucesso! O horário agora está disponível.");
  };

  // Atribuir aluno a vaga
  const handleConfirmAssignStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoach || !assignModalSlot || !selectedStudentForSlot) return;

    const st = students.find((s) => s.id === selectedStudentForSlot);
    if (!st) return;

    occupySlot(currentCoach.id, assignModalSlot.id, st.name, st.id, st.plan);
    setAssignModalSlot(null);
    setSelectedStudentForSlot("");
    showToast(`Horário atribuído a ${st.name}!`);
  };

  // Adicionar novo horário no dia selecionado
  const handleAddSlot = () => {
    if (!newSlotTime.trim() || !currentCoach) return;
    triggerHaptic("light");
    const newSlot: TrainerSlot = {
      id: `slot_${Date.now()}`,
      day: selectedDay,
      time: newSlotTime.trim(),
      isAvailable: true,
    };
    const updatedSlots = [...currentCoach.slots, newSlot];
    updateCoachSlots(currentCoach.id, updatedSlots);
    setNewSlotTime("");
    showToast(`Horário ${newSlot.time} adicionado para ${selectedDay}!`);
  };

  // Salvar novos preços
  const handleSavePrices = () => {
    triggerHaptic("success");
    if (!currentCoach) return;
    updateCoachPricing(currentCoach.id, {
      dailySession: Number(dailyPrice),
      weeklyPlan: Number(weeklyPrice),
      monthlyPlan: Number(monthlyPrice),
    });
    setIsEditingPrices(false);
    showToast("Tabela de preços atualizada no marketplace!");
  };

  // Professor responde a remanejamento solicitado pelo aluno
  const handleCoachRespondReschedule = (bookingId: string, accept: boolean) => {
    triggerHaptic(accept ? "success" : "warning");
    respondToReschedule(bookingId, accept);
    showToast(accept ? "Remanejamento aprovado! Agenda sincronizada." : "Remanejamento recusado. Horário mantido.");
  };

  // Professor envia proposta de novo horário para um aluno
  const handleSendCoachReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalBooking) return;

    requestReschedule({
      bookingId: rescheduleModalBooking.id,
      requestedBy: "coach",
      proposedDay: rescheduleDay,
      proposedTime: rescheduleTime,
      reason: rescheduleReason.trim() || undefined,
    });

    setRescheduleModalBooking(null);
    setRescheduleReason("");
    showToast("Proposta de remanejamento enviada para o aluno!");
  };

  // Link do WhatsApp para falar com o aluno
  const getStudentWhatsApp = (booking: BookingRequest) => {
    const msg = encodeURIComponent(
      `Olá, ${booking.studentName}! Aqui é o ${booking.coachName}. Vi seu agendamento de treino presencial para ${booking.slotDay} às ${booking.slotTime}. Vamos alinhar seus objetivos e pontualidade no salão!`
    );
    return `https://wa.me/${booking.studentPhone}?text=${msg}`;
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Resumo de Indicadores */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] flex flex-col">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Solicitações</span>
          <span className="text-lg font-black text-amber-400 font-mono mt-0.5">
            {pendingRequests.length}
          </span>
          <span className="text-[9px] text-zinc-500">Aguardando resposta</span>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] flex flex-col">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Alunos Ativos</span>
          <span className="text-lg font-black text-emerald-400 font-mono mt-0.5">
            {activeBookings.length}
          </span>
          <span className="text-[9px] text-zinc-500">Confirmados no salão</span>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] flex flex-col">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Previsto</span>
          <span className="text-base font-black text-white font-mono mt-0.5">
            R$ {myBookings.reduce((acc, b) => acc + (b.status === "accepted" ? b.totalPrice : 0), 0)}
          </span>
          <span className="text-[9px] text-emerald-400">Em consultorias</span>
        </div>
      </div>

      {/* Seção 0: Pedidos de Remanejamento de Horário Enviados por Alunos */}
      {studentRescheduleRequests.length > 0 && (
        <div className="rounded-3xl p-4 bg-amber-950/20 border-2 border-amber-500/40 flex flex-col gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-amber-300">
              Solicitações de Troca de Horário ({studentRescheduleRequests.length})
            </h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {studentRescheduleRequests.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-zinc-950/90 border border-amber-500/30 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">{b.studentName}</h4>
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
                    onClick={() => handleCoachRespondReschedule(b.id, false)}
                    className="py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 text-xs font-bold transition-all"
                  >
                    Recusar Troca
                  </button>

                  <button
                    onClick={() => handleCoachRespondReschedule(b.id, true)}
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

      {/* Seção 1: Solicitações Pendentes dos Alunos */}
      <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Solicitações de Alunos</h3>
              <p className="text-[10px] text-zinc-400">Aceite para liberar contato direto e horário</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {pendingRequests.length} Novas
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-3 text-center">
            Nenhuma nova solicitação pendente no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-amber-500/30 flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">{req.studentName}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      📅 {req.slotDay} às {req.slotTime} • Plano {req.planType.toUpperCase()}
                    </span>
                    {req.extraOfferedAmount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md mt-1 border border-amber-500/30">
                        <Sparkles className="w-3 h-3" />
                        Aluno ofereceu + R$ {req.extraOfferedAmount} de gorjeta extra!
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-emerald-400">
                      R$ {req.totalPrice.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-zinc-500 block">Total Proposto</span>
                  </div>
                </div>

                {/* Botões de Decisão */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      updateBookingStatus(req.id, "rejected");
                    }}
                    className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic("heavy");
                      updateBookingStatus(req.id, "accepted");
                      // Ocupa o slot correspondente automaticamente
                      const targetSlot = currentCoach?.slots.find(
                        (s) => s.day === req.slotDay && s.time === req.slotTime
                      );
                      if (targetSlot && currentCoach) {
                        occupySlot(currentCoach.id, targetSlot.id, req.studentName, req.studentId, req.planType);
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Aceitar Aluno</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção 2: Alunos Confirmados, Pagamentos e Faltas */}
      <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Alunos Confirmados & Presenças</h3>
              <p className="text-[10px] text-zinc-400">Controle financeiro e registro de frequência</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            {activeBookings.length} Ativos
          </span>
        </div>

        {activeBookings.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-3 text-center">
            Nenhum aluno com horário confirmado no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white">{b.studentName}</h4>
                      <button
                        onClick={() => {
                          setSelectedStudentForSlot(b.studentId);
                          setRescheduleModalBooking(b);
                        }}
                        className="text-[9px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                        title="Propor outro horário para este aluno"
                      >
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        <span>Remanejar</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-zinc-400 font-mono">
                      📅 {b.slotDay} às {b.slotTime} • Plano {b.planType.toUpperCase()}
                    </span>
                  </div>

                  <a
                    href={getStudentWhatsApp(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center gap-1 text-[10px] font-bold border border-emerald-500/30 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Linha 1: Status de Pagamento */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px]">
                  <span className="text-zinc-400 font-bold uppercase">Pagamento (R$ {b.totalPrice}):</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        updatePaymentStatus(b.id, "paid");
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        b.paymentStatus === "paid"
                          ? "bg-emerald-500 text-zinc-950 font-black shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      Pago ✅
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        updatePaymentStatus(b.id, "pending");
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        b.paymentStatus === "pending"
                          ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      Pendente ⏳
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("heavy");
                        updatePaymentStatus(b.id, "overdue");
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        b.paymentStatus === "overdue"
                          ? "bg-rose-500 text-white font-black shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-rose-400"
                      }`}
                    >
                      Atrasado ⚠️
                    </button>
                  </div>
                </div>

                {/* Linha 2: Frequência / Presença do Aluno */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-zinc-400 font-bold uppercase">Frequência no Salão:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        updateAttendanceStatus(b.id, "attended");
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        b.attendanceStatus === "attended"
                          ? "bg-emerald-500 text-zinc-950 font-black shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      Presente 🏋️
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("heavy");
                        updateAttendanceStatus(b.id, "missed");
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        b.attendanceStatus === "missed"
                          ? "bg-rose-500 text-white font-black shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-rose-400"
                      }`}
                    >
                      Falta ❌
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        updateAttendanceStatus(b.id, "rescheduled");
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        b.attendanceStatus === "rescheduled"
                          ? "bg-blue-500 text-white font-black shadow-sm"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      Reagendar 🔁
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção 3: Grade de Horários com Ocupação de Vagas & Desocupação */}
      {currentCoach && (
        <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <h3 className="text-xs font-black text-white">Grade Semanal de Horários</h3>
              <p className="text-[10px] text-zinc-400">
                Gerencie horários ocupados por alunos, libere vagas ou adicione slots
              </p>
            </div>
            <button
              onClick={() => setIsEditingPrices(!isEditingPrices)}
              className="text-[10px] font-bold text-amber-400 hover:underline"
            >
              {isEditingPrices ? "Fechar Valores" : "Configurar Valores"}
            </button>
          </div>

          {/* Editor de Preços dos Planos */}
          {isEditingPrices && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                Seus Preços de Consultoria Presencial:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-500 block mb-0.5">Diária Avulsa (R$)</label>
                  <input
                    type="number"
                    value={dailyPrice}
                    onChange={(e) => setDailyPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 block mb-0.5">Semanal 3x (R$)</label>
                  <input
                    type="number"
                    value={weeklyPrice}
                    onChange={(e) => setWeeklyPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 block mb-0.5">Mensal VIP (R$)</label>
                  <input
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs font-mono text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSavePrices}
                className="w-full py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider"
              >
                Salvar Novos Valores
              </button>
            </div>
          )}

          {/* Seletor de Dia para Edição de Slots */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(["Hoje", "Amanhã", "Quinta", "Sexta", "Sábado"] as const).map((day) => (
              <button
                key={day}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedDay(day);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === day
                    ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Grade de Horários com Status de Vagas */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-zinc-400">
              Horários de atendimento para <b>{selectedDay}</b>:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCoach.slots
                .filter((s) => s.day === selectedDay)
                .map((slot) => {
                  const isOccupied = !slot.isAvailable || !!slot.studentName;

                  return (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        isOccupied
                          ? "bg-zinc-950 border-amber-500/30"
                          : "bg-emerald-950/20 border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm font-mono font-black text-white px-2 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                          {slot.time}
                        </span>

                        <div className="min-w-0">
                          {isOccupied ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-amber-400 truncate">
                                  {slot.studentName || "Aluno Presencial"}
                                </span>
                                <span className="text-[8px] uppercase font-bold px-1 rounded bg-amber-500/20 text-amber-300">
                                  Ocupado
                                </span>
                              </div>
                              <span className="text-[9px] text-zinc-400 block truncate">
                                {slot.studentPlan || "Presencial"}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-bold text-emerald-400 block">
                                Vaga Aberta
                              </span>
                              <span className="text-[9px] text-zinc-400 block">
                                Disponível no Marketplace
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações da Vaga */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isOccupied ? (
                          <button
                            onClick={() => handleFreeSlot(slot.id)}
                            className="px-2 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-[10px] font-bold transition-all active:scale-95"
                            title="Liberar este horário caso o aluno saia"
                          >
                            Desocupar
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              triggerHaptic("selection");
                              setAssignModalSlot(slot);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Aluno</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Adicionar Novo Horário ao Dia */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
            <input
              type="text"
              value={newSlotTime}
              onChange={(e) => setNewSlotTime(e.target.value)}
              placeholder="Novo horário (ex: 21:00)"
              className="flex-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs font-mono text-white placeholder-zinc-500"
            />
            <button
              onClick={handleAddSlot}
              className="py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-white flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Horário</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ATRIBUIR ALUNO DA CARTEIRA A UMA VAGA VAGA */}
      {assignModalSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setAssignModalSlot(null)}
        >
          <div
            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div>
                <h3 className="text-sm font-black text-white">Preencher Horário</h3>
                <p className="text-[10px] text-zinc-400">
                  {assignModalSlot.day} às {assignModalSlot.time}
                </p>
              </div>

              <button
                onClick={() => setAssignModalSlot(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignStudent} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Selecione o Aluno (CRM)
                </label>
                <select
                  required
                  value={selectedStudentForSlot}
                  onChange={(e) => setSelectedStudentForSlot(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                >
                  <option value="">Selecione um aluno...</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.isOfflineStudent ? "Presencial" : "Online"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalSlot(null)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Ocupar Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROPOR REMANEJAMENTO DE HORÁRIO PARA ALUNO */}
      {rescheduleModalBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setRescheduleModalBooking(null)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div>
                <h3 className="text-sm font-black text-white">Propor Novo Horário</h3>
                <p className="text-[10px] text-zinc-400">
                  Para o aluno: {rescheduleModalBooking.studentName}
                </p>
              </div>

              <button
                onClick={() => setRescheduleModalBooking(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendCoachReschedule} className="p-4 space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                <span className="text-[10px] text-zinc-400 block">Horário Atual:</span>
                <span className="font-bold text-white">
                  {rescheduleModalBooking.slotDay} às {rescheduleModalBooking.slotTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Novo Dia</label>
                  <select
                    value={rescheduleDay}
                    onChange={(e) => setRescheduleDay(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                  >
                    <option value="Hoje">Hoje</option>
                    <option value="Amanhã">Amanhã</option>
                    <option value="Quinta">Quinta</option>
                    <option value="Sexta">Sexta</option>
                    <option value="Sábado">Sábado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Novo Horário</label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                  >
                    <option value="06:00">06:00</option>
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
                  Motivo da Sugestão
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Ex: Treinamento interno, remanejamento de salão..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalBooking(null)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Enviar ao Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
