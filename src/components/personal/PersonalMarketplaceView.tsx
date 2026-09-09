"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredCoaches,
  getStoredBookings,
  requestTrainerBooking,
  subscribeToBookings,
  CoachTrainer,
  BookingRequest,
} from "@/lib/booking-store";

interface PersonalMarketplaceViewProps {
  studentName?: string;
  studentPhone?: string;
}

export function PersonalMarketplaceView({
  studentName = "Carlos Silva",
  studentPhone = "5511991234567",
}: PersonalMarketplaceViewProps) {
  const [coaches, setCoaches] = useState<CoachTrainer[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("coach_rodrigo");
  const [selectedDay, setSelectedDay] = useState<string>("Hoje");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedPlanType, setSelectedPlanType] = useState<"diario" | "semanal" | "mensal">("mensal");
  const [extraAmount, setExtraAmount] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // Slots do dia selecionado
  const daySlots = (currentCoach?.slots || []).filter((s) => s.day === selectedDay);

  // Preço base do plano selecionado
  const basePrice = currentCoach
    ? selectedPlanType === "diario"
      ? currentCoach.pricing.dailySession
      : selectedPlanType === "semanal"
      ? currentCoach.pricing.weeklyPlan
      : currentCoach.pricing.monthlyPlan
    : 0;

  const totalPrice = basePrice + Math.max(0, extraAmount);

  // Enviar Solicitação de Agendamento
  const handleConfirmBooking = () => {
    if (!selectedTimeSlot) {
      alert("Por favor, selecione um horário disponível na grade!");
      return;
    }

    triggerHaptic("heavy");
    requestTrainerBooking({
      studentId: "student_carlos",
      studentName,
      studentPhone,
      coachId: currentCoach.id,
      slotDay: selectedDay,
      slotTime: selectedTimeSlot,
      planType: selectedPlanType,
      extraOfferedAmount: extraAmount,
      notes: "Treino presencial agendado pelo app GymFlow.",
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

                  {/* Botão de WhatsApp direto caso aceito */}
                  {isAccepted && (
                    <a
                      href={getWhatsAppLink(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-zinc-950" />
                      <span>Falar no WhatsApp com o Personal</span>
                    </a>
                  )}
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
                        A partir de R$ {coach.pricing.dailySession}/sessão
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade de Horários Estilo Barbearia para o Personal Selecionado */}
      {currentCoach && (
        <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Agenda Presencial</span>
              <h3 className="text-xs font-black text-white">{currentCoach.name}</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">{currentCoach.cref}</span>
          </div>

          {/* Seletor de Dias */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(["Hoje", "Amanhã", "Quinta", "Sexta", "Sábado"] as const).map((day) => (
              <button
                key={day}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedDay(day);
                  setSelectedTimeSlot("");
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

          {/* Slots de Horários Livres */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              Horários no Salão ({selectedDay}):
            </span>

            {daySlots.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                Nenhum horário livre cadastrado para {selectedDay}. Escolha outro dia acima.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {daySlots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.id}
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

          {/* Seletor de Planos Presenciais */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Modalidade do Plano:</span>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "diario", title: "Diária Avulsa", price: currentCoach.pricing.dailySession },
                { id: "semanal", title: "Semanal (3x)", price: currentCoach.pricing.weeklyPlan },
                { id: "mensal", title: "Mensal VIP", price: currentCoach.pricing.monthlyPlan },
              ].map((plan) => {
                const isSelected = selectedPlanType === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedPlanType(plan.id as any);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400"
                    }`}
                  >
                    <span className="text-[10px] font-bold truncate">{plan.title}</span>
                    <span className="text-xs font-mono font-black text-white mt-0.5">
                      R$ {plan.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Oferta de Valor Adicional / Gorjeta (O aluno pode pagar mais se quiser) */}
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

            <div className="flex items-center gap-1.5">
              {[0, 15, 30, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    triggerHaptic("light");
                    setExtraAmount(amt);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all ${
                    extraAmount === amt
                      ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.04]"
                  }`}
                >
                  {amt === 0 ? "Sem gorjeta" : `+R$ ${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo de Investimento e Botão de Confirmação */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400">Total a Pagar ao Personal:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-emerald-400">
                  R$ {totalPrice.toFixed(2)}
                </span>
                {extraAmount > 0 && (
                  <span className="text-[9px] text-zinc-400 line-through">
                    (Base R$ {basePrice})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center gap-1.5"
            >
              <span>Solicitar Horário</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Envio */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-zinc-900 border border-white/[0.12] rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-white">Solicitação Enviada com Sucesso!</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              O <b>{currentCoach.name}</b> recebeu seu pedido de treino para <b>{selectedDay}</b>. Assim que ele aceitar, você receberá uma notificação e o botão direto do WhatsApp para combinar os detalhes!
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
