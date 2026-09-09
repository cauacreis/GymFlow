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
  subscribeToBookings,
  CoachTrainer,
  BookingRequest,
  TrainerSlot,
} from "@/lib/booking-store";

interface CoachAgendaManagerProps {
  coachId?: string;
}

export function CoachAgendaManager({ coachId = "coach_rodrigo" }: CoachAgendaManagerProps) {
  const [coaches, setCoaches] = useState<CoachTrainer[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [selectedDay, setSelectedDay] = useState<"Hoje" | "Amanhã" | "Quinta" | "Sexta">("Hoje");
  const [newSlotTime, setNewSlotTime] = useState("");
  const [isEditingPrices, setIsEditingPrices] = useState(false);

  // Preços editáveis
  const [dailyPrice, setDailyPrice] = useState(75);
  const [weeklyPrice, setWeeklyPrice] = useState(190);
  const [monthlyPrice, setMonthlyPrice] = useState(580);

  useEffect(() => {
    const refreshData = () => {
      const allCoaches = getStoredCoaches();
      setCoaches(allCoaches);
      setBookings(getStoredBookings());

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

  const currentCoach = coaches.find((c) => c.id === coachId) || coaches[0];
  const myBookings = bookings.filter((b) => b.coachId === coachId);
  const pendingRequests = myBookings.filter((b) => b.status === "pending");
  const activeBookings = myBookings.filter((b) => b.status === "accepted");

  // Alternar disponibilidade de um slot
  const handleToggleSlot = (slotId: string) => {
    triggerHaptic("selection");
    if (!currentCoach) return;
    const updatedSlots = currentCoach.slots.map((s) =>
      s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    updateCoachSlots(currentCoach.id, updatedSlots);
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
                        Aluno ofereceu + R$ {req.extraOfferedAmount} extra!
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-emerald-400">
                      R$ {req.totalPrice.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-zinc-500 block">Valor da Consultoria</span>
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
                    <h4 className="text-xs font-black text-white">{b.studentName}</h4>
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

      {/* Seção 3: Configuração de Horários & Planos */}
      {currentCoach && (
        <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <h3 className="text-xs font-black text-white">Minha Grade de Atendimento</h3>
              <p className="text-[10px] text-zinc-400">Ative ou desative horários vagos no salão</p>
            </div>
            <button
              onClick={() => setIsEditingPrices(!isEditingPrices)}
              className="text-[10px] font-bold text-emerald-400 hover:underline"
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
                className="w-full py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black uppercase tracking-wider"
              >
                Salvar Novos Valores
              </button>
            </div>
          )}

          {/* Seletor de Dia para Edição de Slots */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(["Hoje", "Amanhã", "Quinta", "Sexta"] as const).map((day) => (
              <button
                key={day}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedDay(day);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === day
                    ? "bg-emerald-500 text-zinc-950 shadow-md"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Grade de Horários: Clique para Alternar Disponibilidade */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-zinc-400">
              Toque no horário para marcar como <b>Livre</b> ou <b>Ocupado</b>:
            </span>

            <div className="grid grid-cols-4 gap-1.5">
              {currentCoach.slots
                .filter((s) => s.day === selectedDay)
                .map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleToggleSlot(slot.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                      slot.isAvailable
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                        : "bg-white/[0.02] border border-white/[0.04] text-zinc-600 line-through"
                    }`}
                  >
                    <span>{slot.time}</span>
                    <span className="text-[8px] font-sans font-normal opacity-75">
                      {slot.isAvailable ? "Disponível" : "Bloqueado"}
                    </span>
                  </button>
                ))}
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
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
