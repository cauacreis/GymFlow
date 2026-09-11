"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Flame,
  Plus,
  ArrowRight,
  Search,
  Filter,
  CalendarDays,
  LogOut,
  Crown,
  Lock,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser } from "@/lib/auth-store";
import { getUserPlanTier, isSubscriptionExpired } from "@/lib/subscription-features";
import {
  getStoredCoaches,
  getStoredBookings,
  requestTrainerBooking,
  subscribeToBookings,
  CoachTrainer,
  BookingRequest,
  getCoachSlotsForDate,
} from "@/lib/booking-store";
import { BookingCalendarModal } from "./BookingCalendarModal";
import { LeaveCoachModal } from "../student/LeaveCoachModal";

interface PersonalMarketplaceViewProps {
  studentId?: string;
  studentName?: string;
  studentPhone?: string;
  onOpenPlans?: () => void;
}

export function PersonalMarketplaceView({
  studentId = "student_carlos",
  studentName = "Aluno",
  studentPhone = "",
  onOpenPlans,
}: PersonalMarketplaceViewProps) {
  const [coaches, setCoaches] = useState<CoachTrainer[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("coach_principal");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedPlanType, setSelectedPlanType] = useState<"diario" | "semanal" | "mensal">("mensal");
  const [extraAmount, setExtraAmount] = useState<number>(15);
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(null);
  const [isLeaveCoachModalOpen, setIsLeaveCoachModalOpen] = useState(false);
  const [selectedBookingToLeave, setSelectedBookingToLeave] = useState<BookingRequest | null>(null);


  useEffect(() => {
    const refreshData = () => {
      setCoaches(getStoredCoaches());
      setMyBookings(getStoredBookings());
    };
    refreshData();
    const unsub = subscribeToBookings(refreshData);
    return () => unsub();
  }, []);

  const currentCoach = coaches.find((c) => c.id === selectedCoachId) || coaches[0];

  // Filtros de busca
  const filteredCoaches = coaches.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.distance.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isContract = selectedPlanType === "semanal" || selectedPlanType === "mensal";

  // Slots do dia selecionado no calendário
  const daySlots = useMemo(() => {
    return getCoachSlotsForDate(currentCoach, selectedDate);
  }, [currentCoach, selectedDate]);

  // Preço base do plano selecionado (Diária 35 / Semanal 45 / Mensal 55)
  const basePrice = currentCoach
    ? selectedPlanType === "diario"
      ? (currentCoach.pricing.dailySession ?? currentCoach.pricing.basicMonthly ?? 35)
      : selectedPlanType === "semanal"
      ? (currentCoach.pricing.weeklyPlan ?? currentCoach.pricing.proMonthly ?? 45)
      : (currentCoach.pricing.monthlyPlan ?? currentCoach.pricing.vipMonthly ?? 55)
    : 0;

  const totalPrice = basePrice + Math.max(0, extraAmount);

  // Próximos 7 dias para seleção rápida
  const upcomingWeekDays = useMemo(() => {
    const list = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const short = shortDays[d.getDay()];

      list.push({
        date: d,
        key: `quick_${d.toISOString().slice(0, 10)}`,
        shortName: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : short,
        dayNum: d.getDate(),
        fullDateStr: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      });
    }
    return list;
  }, []);

  const isDateSelected = (targetDate: Date) => {
    return (
      targetDate.getDate() === selectedDate.getDate() &&
      targetDate.getMonth() === selectedDate.getMonth() &&
      targetDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const dayOfWeekNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const selectedDayOfWeekName = dayOfWeekNames[selectedDate.getDay()];
  const selectedDateFormatted = selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const validUntilFormatted = useMemo(() => {
    const end = new Date(selectedDate);
    if (selectedPlanType === "semanal") {
      end.setDate(end.getDate() + 7);
    } else {
      end.setDate(end.getDate() + 30);
    }
    return end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }, [selectedDate, selectedPlanType]);

  const selectedDateLabel = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);

    const diff = Math.round((sel.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return `Hoje (${selectedDayOfWeekName}), ${selectedDateFormatted}`;
    if (diff === 1) return `Amanhã (${selectedDayOfWeekName}), ${selectedDateFormatted}`;
    return `${selectedDayOfWeekName}, ${selectedDateFormatted}`;
  }, [selectedDate, selectedDayOfWeekName, selectedDateFormatted]);

  // Enviar Solicitação de Agendamento
  const handleConfirmBooking = () => {
    const user = getCurrentUser();
    if (isSubscriptionExpired(user)) {
      setBookingErrorMessage("Sua assinatura ou período de teste está expirado. Renove seu plano para agendar treinos presenciais.");
      triggerHaptic("warning");
      if (onOpenPlans) onOpenPlans();
      return;
    }

    if (!selectedTimeSlot) {
      setBookingErrorMessage("Por favor, selecione um horário disponível na grade antes de continuar.");
      triggerHaptic("warning");
      return;
    }

    setBookingErrorMessage(null);

    const slotDayString = isContract
      ? `${selectedDayOfWeekName}, ${selectedDateFormatted} (Início)`
      : `${selectedDayOfWeekName}, ${selectedDateFormatted}`;

    triggerHaptic("heavy");
    requestTrainerBooking({
      studentId: studentId || "student_carlos",
      studentName,
      studentPhone,
      coachId: currentCoach.id,
      slotDay: slotDayString,
      slotTime: selectedTimeSlot,
      planType: selectedPlanType,
      extraOfferedAmount: extraAmount,
      notes: isContract
        ? `Início da assinatura em ${selectedDateFormatted} às ${selectedTimeSlot}. Válido até ${validUntilFormatted}.`
        : `Sessão presencial agendada para ${selectedDateFormatted} às ${selectedTimeSlot}.`,
    });

    setShowSuccessModal(true);
    setSelectedTimeSlot("");
  };

  // Gerar link do WhatsApp com mensagem pré-formatada
  const getWhatsAppLink = (booking: BookingRequest) => {
    const msg = encodeURIComponent(
      `Olá, ${booking.coachName}! Aqui é o ${booking.studentName}. Meu agendamento de treino presencial para ${booking.slotDay} às ${booking.slotTime} (Plano ${booking.planType.toUpperCase()}) foi confirmado pelo GymFlow. Como combinamos o encontro no salão?`
    );
    return `https://wa.me/${booking.coachPhone}?text=${msg}`;
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Header com Proposta de Valor */}
      <div className="rounded-3xl p-4 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Personal Presencial
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Agendamento em Tempo Real</span>
        </div>

        <h2 className="text-base font-black text-white">Treine com um Especialista no Salão</h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Encontre os melhores Personal Trainers com horários vagos na sua unidade, escolha seu plano e garanta seu horário presencial.
        </p>
      </div>

      {/* Indicador de Benefício VIP ou Aviso de Expiração */}
      {(() => {
        const u = getCurrentUser();
        const isVip = getUserPlanTier(u) === "vip";
        const isExpired = isSubscriptionExpired(u);

        if (isExpired) {
          return (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-950 border border-rose-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Assinatura Expirada</p>
                  <p className="text-[11px] text-zinc-400">Regularize seu plano para agendar sessões com Personals.</p>
                </div>
              </div>
              {onOpenPlans && (
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    onOpenPlans();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-md"
                >
                  Renovar
                </button>
              )}
            </div>
          );
        }

        if (isVip) {
          return (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Benefício VIP: Acompanhamento Incluso</p>
                  <p className="text-[11px] text-zinc-400">Você tem prioridade e acompanhamento com treinadores no seu plano VIP.</p>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Seção: Meus Agendamentos Ativos (se houver) */}
      {myBookings.length > 0 && (
        <div className="rounded-2xl p-4 bg-zinc-900/80 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Meus Treinos Agendados ({myBookings.length})</span>
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">Presencial</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {myBookings.map((b) => {
              const isAccepted = b.status === "accepted";
              const isPending = b.status === "pending";

              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                    isAccepted
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : isPending
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-white/[0.02] border-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{b.coachName}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isAccepted
                              ? "bg-emerald-500/20 text-emerald-300"
                              : isPending
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {isAccepted ? "Confirmado" : isPending ? "Aguardando Personal" : b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                        <span>📅 {b.slotDay} às {b.slotTime}</span>
                        <span>•</span>
                        <span>Plano {b.planType.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-white">
                        R$ {b.totalPrice.toFixed(2)}
                      </span>
                      <span
                        className={`block text-[9px] font-bold ${
                          b.paymentStatus === "paid"
                            ? "text-emerald-400"
                            : b.paymentStatus === "overdue"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {b.paymentStatus === "paid" ? "PAGO ✅" : "PAGAMENTO PENDENTE"}
                      </span>
                    </div>
                  </div>

                  {/* Ações: WhatsApp & Sair do Personal */}
                  <div className="flex items-center gap-2 pt-1">
                    {isAccepted && (
                      <a
                        href={getWhatsAppLink(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-zinc-950" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setSelectedBookingToLeave(b);
                        setIsLeaveCoachModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0"
                      title="Encerrar acompanhamento com este personal trainer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sair do Personal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Busca de Personais */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar personal por nome, especialidade ou distância..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Lista / Carrossel de Personais na Redondeza */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold uppercase text-zinc-400 px-1">
          Personais Disponíveis na Redondeza:
        </span>

        <div className="flex flex-col gap-2.5">
          {filteredCoaches.map((coach) => {
            const isSelected = selectedCoachId === coach.id;
            return (
              <div
                key={coach.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedCoachId(coach.id);
                  setSelectedTimeSlot("");
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                    : "bg-zinc-900/40 border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/[0.08]">
                    <Image
                      src={coach.avatarUrl}
                      alt={coach.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white truncate">{coach.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{coach.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-medium block truncate">
                      {coach.specialty}
                    </span>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-zinc-500" />
                        {coach.distance}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-zinc-300">
                        A partir de R$ {coach.pricing.basicMonthly ?? coach.pricing.dailySession ?? 35}/mês
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade de Horários & Agendamento com o Personal Selecionado */}
      {currentCoach && (
        <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3.5 shadow-xl">
          {/* Cabeçalho do Personal */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Agenda & Contratação</span>
              <h3 className="text-xs font-black text-white">{currentCoach.name}</h3>
            </div>
            {currentCoach.cref && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {currentCoach.cref.startsWith("CREF") ? currentCoach.cref : `CREF ${currentCoach.cref}`}
              </span>
            )}
          </div>

          {/* 1. SELEÇÃO DA MODALIDADE DO PLANO */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">1. Modalidade do Plano:</span>
              <span className="text-[9px] text-emerald-400 font-bold">
                {selectedPlanType === "diario"
                  ? "Sessão Avulsa"
                  : selectedPlanType === "semanal"
                  ? "Plano Semanal (3x)"
                  : "Plano Mensal VIP"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  id: "diario" as const,
                  title: "Diária Avulsa",
                  subtitle: "1 treino presencial",
                  price: currentCoach.pricing.basicMonthly ?? currentCoach.pricing.dailySession ?? 35,
                  period: "/treino",
                },
                {
                  id: "semanal" as const,
                  title: "Semanal (3x)",
                  subtitle: "3x por semana",
                  badge: "Flexível",
                  price: currentCoach.pricing.proMonthly ?? currentCoach.pricing.weeklyPlan ?? 45,
                  period: "/sem",
                },
                {
                  id: "mensal" as const,
                  title: "Mensal VIP",
                  subtitle: "Acompanhamento mês",
                  badge: "Mais Escolhido",
                  price: currentCoach.pricing.vipMonthly ?? currentCoach.pricing.monthlyPlan ?? 55,
                  period: "/mês",
                },
              ].map((plan) => {
                const isSelected = selectedPlanType === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedPlanType(plan.id);
                      setSelectedTimeSlot("");
                    }}
                    className={`relative p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10 scale-102"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 px-1.5 py-0.2 rounded-full whitespace-nowrap shadow">
                        {plan.badge}
                      </span>
                    )}
                    <span className="text-[11px] font-black text-white truncate">{plan.title}</span>
                    <span className="text-[8px] text-zinc-400 leading-tight mt-0.5">{plan.subtitle}</span>
                    <span className="text-xs font-mono font-black text-emerald-400 mt-1">
                      R$ {plan.price}{plan.period}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELEÇÃO DE DATA & CALENDÁRIO */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {isContract ? "2. Data de Início do Plano:" : "2. Data do Treino Presencial:"}
              </span>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsCalendarOpen(true);
                }}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1 transition-all active:scale-95"
                title="Abrir calendário mensal"
              >
                <CalendarDays className="w-3 h-3" />
                <span>Abrir Calendário</span>
              </button>
            </div>

            {/* Banner de Data Ativa e Validade */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  {isContract ? "O plano começará no dia:" : "Dia selecionado para o treino:"}
                </span>
                <span className="text-xs font-black text-white truncate block mt-0.5">
                  {selectedDateLabel}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                  {isContract
                    ? selectedPlanType === "semanal"
                      ? `Período: ${selectedDateFormatted} até ${validUntilFormatted} (7 dias)`
                      : `Período: ${selectedDateFormatted} até ${validUntilFormatted} (30 dias)`
                    : `Sessão única no salão com ${currentCoach.name}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsCalendarOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-bold text-zinc-200 border border-white/[0.08] shrink-0 ml-2 active:scale-95 transition-all"
              >
                Trocar no Calendário
              </button>
            </div>

            {/* Barra Horizontal de Dias da Semana */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {upcomingWeekDays.map((dayItem) => {
                const isSelected = isDateSelected(dayItem.date);
                return (
                  <button
                    key={dayItem.key}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedDate(dayItem.date);
                      setSelectedTimeSlot("");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center min-w-[62px] ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 shadow-md font-black scale-102"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    <span className="text-[9px] uppercase opacity-80">{dayItem.shortName}</span>
                    <span className="text-xs font-mono font-bold mt-0.5">{dayItem.dayNum}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsCalendarOpen(true);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center min-w-[62px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95"
                title="Escolher no calendário mensal"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-[9px] uppercase font-bold mt-0.5">+ Dias</span>
              </button>
            </div>
          </div>

          {/* 3. HORÁRIOS DISPONÍVEIS NO SALÃO PARA AQUELE DIA */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                {isContract
                  ? `3. Horário da 1ª Sessão (${selectedDayOfWeekName}):`
                  : `3. Horários no Salão (${selectedDayOfWeekName}):`}
              </span>
              {selectedTimeSlot && (
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  Horário: {selectedTimeSlot} ✓
                </span>
              )}
            </div>

            {daySlots.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <p className="text-xs text-zinc-400 italic">
                  Nenhum horário aberto para {selectedDayOfWeekName}. Toque em outro dia ou abra o calendário.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {daySlots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => {
                        triggerHaptic("selection");
                        setSelectedTimeSlot(slot.time);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30 scale-102"
                          : slot.isAvailable
                          ? "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]"
                          : "bg-zinc-950/40 text-zinc-600 line-through border border-white/[0.02] cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span>{slot.time}</span>
                      <span className="text-[8px] font-sans font-normal opacity-80">
                        {slot.isAvailable ? "Livre" : "Ocupado"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. OFERTA DE GORJETA / VALOR EXTRA (OPCIONAL) */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-amber-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Gorjeta / Valor Extra ao Personal (Opcional):
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                {extraAmount > 0 ? `+ R$ ${extraAmount},00` : "Sem gorjeta"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Alunos que oferecem valor extra têm maior prioridade de aceite em horários concorridos. O professor decidirá se aceita ou recusa.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[0, 15, 30, 50].map((amt) => {
                const isSelected = !isCustomTip && extraAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setIsCustomTip(false);
                      setExtraAmount(amt);
                    }}
                    className={`flex-1 min-w-[62px] py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      isSelected
                        ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black scale-102"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    {amt === 0 ? "Sem gorjeta" : `+R$ ${amt}`}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsCustomTip(true);
                  if (customTipInput) {
                    setExtraAmount(Number(customTipInput) || 0);
                  }
                }}
                className={`py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${
                  isCustomTip
                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black scale-102"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.04]"
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Personalizada</span>
              </button>
            </div>

            {/* Campo de Entrada de Gorjeta Personalizada */}
            {isCustomTip && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                <div className="relative flex-1 flex items-center rounded-xl bg-zinc-950 border border-amber-500/40 px-3 py-2 shadow-inner">
                  <span className="text-xs font-mono font-bold text-amber-400 mr-1.5">R$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="1000"
                    autoFocus
                    value={customTipInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTipInput(val);
                      const num = Math.min(1000, Math.max(0, Number(val) || 0));
                      setExtraAmount(num);
                    }}
                    placeholder="Digite o valor extra (ex: 20)"
                    className="w-full bg-transparent text-xs font-mono font-bold text-white placeholder:text-zinc-600 outline-none"
                  />
                  {customTipInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTipInput("");
                        setExtraAmount(0);
                      }}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {extraAmount > 0 ? `+R$ ${extraAmount},00` : "R$ 0"}
                </span>
              </div>
            )}
          </div>

          {bookingErrorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{bookingErrorMessage}</span>
            </div>
          )}

          {/* 5. RESUMO DE INVESTIMENTO E BOTÃO DE CONFIRMAÇÃO */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">

            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400">
                {isContract ? (selectedPlanType === "semanal" ? "Total Semanal:" : "Total Mensal:") : "Total da Sessão:"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-emerald-400">
                  R$ {totalPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {isContract ? (selectedPlanType === "semanal" ? "/sem" : "/mês") : "/treino"}
                </span>
                {extraAmount > 0 && (
                  <span className="text-[9px] text-zinc-400 line-through ml-1">
                    (Base R$ {basePrice})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmBooking}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center gap-1.5"
            >
              <span>Solicitar Horário</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Calendário Completo para Escolha de Data */}
      <BookingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setSelectedTimeSlot("");
        }}
        planType={selectedPlanType}
        coachName={currentCoach?.name || "Personal"}
      />

      {/* Modal de Confirmação de Envio */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/[0.12] rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-white">Solicitação Enviada com Sucesso!</h3>
            <div className="text-xs text-zinc-300 space-y-1.5 bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06] w-full text-left">
              <p><b>Personal:</b> {currentCoach.name}</p>
              <p>
                <b>Plano:</b>{" "}
                {selectedPlanType === "diario"
                  ? "Diária Avulsa (R$ 35)"
                  : selectedPlanType === "semanal"
                  ? "Semanal 3x (R$ 45/sem)"
                  : "Mensal VIP (R$ 55/mês)"}
              </p>
              <p>
                <b>{isContract ? "Data de Início:" : "Data do Treino:"}</b>{" "}
                {selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ({selectedDayOfWeekName}) às {selectedTimeSlot}
              </p>
              {isContract && (
                <p className="text-[10px] text-emerald-400 font-medium">
                  Validade da assinatura: até {validUntilFormatted}
                </p>
              )}
              <p>
                <b>Total a Pagar:</b> R$ {totalPrice.toFixed(2)}{" "}
                {extraAmount > 0 ? `(com +R$ ${extraAmount} extra)` : ""}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              O <b>{currentCoach.name}</b> foi notificado da sua solicitação. Assim que ele aceitar, você poderá conversar diretamente pelo WhatsApp!
            </p>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider mt-1 active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ALUNO DECIDIR SE QUER OU NÃO SAIR DO PERSONAL */}
      {selectedBookingToLeave && (
        <LeaveCoachModal
          isOpen={isLeaveCoachModalOpen}
          onClose={() => {
            setIsLeaveCoachModalOpen(false);
            setSelectedBookingToLeave(null);
          }}
          coachName={selectedBookingToLeave.coachName}
          coachId={selectedBookingToLeave.coachId}
          coachPhone={selectedBookingToLeave.coachPhone}
          currentPlan={`Plano ${selectedBookingToLeave.planType.toUpperCase()} (R$ ${selectedBookingToLeave.totalPrice.toFixed(2)})`}
          studentId={selectedBookingToLeave.studentId}
          studentName={studentName}
          onSuccessLeave={() => {
            setMyBookings(getStoredBookings());
          }}
        />
      )}
    </div>
  );
}
