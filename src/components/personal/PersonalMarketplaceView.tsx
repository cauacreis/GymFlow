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
  Navigation,
  Compass,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser, saveUserProfile, UserProfile } from "@/lib/auth-store";
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
import {
  calculateDistanceKm,
  formatDistance,
  isValidCoordinate,
  BRAZIL_STATES,
  reverseGeocode,
} from "@/lib/geo";
import { sanitizeInput } from "@/lib/security";
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
  const [selectedCoachId, setSelectedCoachId] = useState<string>("coach_rodrigo");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedPlanType, setSelectedPlanType] = useState<"diario" | "semanal" | "mensal">("mensal");
  const [extraAmount, setExtraAmount] = useState<number>(15);
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>("");
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(null);
  const [isLeaveCoachModalOpen, setIsLeaveCoachModalOpen] = useState(false);
  const [selectedBookingToLeave, setSelectedBookingToLeave] = useState<BookingRequest | null>(null);

  // Perfil do usuário e geolocalização do aluno
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(() => getCurrentUser());
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Filtros de busca avançada & proximidade
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedModality, setSelectedModality] = useState<string>("ALL"); // "ALL" | "presencial" | "online" | "hibrido"
  const [maxDistanceRadiusKm, setMaxDistanceRadiusKm] = useState<string>("ALL"); // "ALL" | "5" | "10" | "25" | "50"
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price_asc">("distance");
  const [showFilters, setShowFilters] = useState(false);

  // Sincroniza coaches e agendamentos
  useEffect(() => {
    const refreshData = () => {
      setCoaches(getStoredCoaches());
      setMyBookings(getStoredBookings());
    };
    refreshData();
    const unsub = subscribeToBookings(refreshData);
    return () => unsub();
  }, []);

  // Ouve mudanças de autenticação/perfil do usuário
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUserProfile(getCurrentUser());
    };
    window.addEventListener("gymflow:auth-changed", handleAuthChange);
    return () => window.removeEventListener("gymflow:auth-changed", handleAuthChange);
  }, []);

  // Solicitar ativação de geolocalização pelo aluno diretamente do marketplace
  const handleRequestUserLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocalização não suportada no seu dispositivo. Use os filtros de Estado e Cidade abaixo.");
      triggerHaptic("warning");
      return;
    }

    setIsLocatingUser(true);
    setLocationNotice(null);
    triggerHaptic("selection");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!isValidCoordinate(lat, lng)) {
          setIsLocatingUser(false);
          setLocationNotice("Coordenadas de GPS inválidas.");
          triggerHaptic("warning");
          return;
        }

        let detectedCity = currentUserProfile.city;
        let detectedState = currentUserProfile.state;
        let detectedNeighborhood = currentUserProfile.neighborhood;

        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo) {
            detectedCity = geo.city || detectedCity;
            detectedState = geo.state || detectedState;
            detectedNeighborhood = geo.neighborhood || detectedNeighborhood;
          }
        } catch {}

        const updated = saveUserProfile({
          ...currentUserProfile,
          latitude: lat,
          longitude: lng,
          city: detectedCity,
          state: detectedState,
          neighborhood: detectedNeighborhood,
        });

        setCurrentUserProfile(updated);
        setIsLocatingUser(false);
        setLocationNotice(`Localização ativada! Mostrando personais próximos a ${detectedCity || "sua área"}.`);
        triggerHaptic("success");
      },
      (err) => {
        setIsLocatingUser(false);
        let msg = "Permissão de localização não concedida. Você pode filtrar por Estado e Cidade abaixo.";
        if (err.code === 2) msg = "Sinal de GPS indisponível no momento. Use os filtros de Estado e Cidade.";
        if (err.code === 3) msg = "Tempo esgotado ao buscar GPS. Use os filtros de Estado e Cidade.";
        setLocationNotice(msg);
        triggerHaptic("warning");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

  // Lista enriquecida com cálculo de distância ortodrômica (Haversine)
  const enrichedCoaches = useMemo(() => {
    const userLat = currentUserProfile.latitude;
    const userLng = currentUserProfile.longitude;
    const hasUserCoords = isValidCoordinate(userLat, userLng);
    const userCity = (currentUserProfile.city || "").trim().toLowerCase();

    return coaches.map((coach) => {
      let calculatedDistanceKm: number | null = null;
      let proximityLabel = "";
      let isSameCity = false;

      // 1. Se aluno e personal possuem coordenadas válidas: calcula Haversine
      if (hasUserCoords && isValidCoordinate(coach.latitude, coach.longitude)) {
        calculatedDistanceKm = calculateDistanceKm(
          userLat as number,
          userLng as number,
          coach.latitude as number,
          coach.longitude as number
        );
      }

      // 2. Se personal tem cidade e bate com a cidade do aluno
      if (userCity && coach.city && coach.city.trim().toLowerCase() === userCity) {
        isSameCity = true;
      }

      // 3. Rótulo de exibição de proximidade
      if (calculatedDistanceKm !== null) {
        proximityLabel = `A ${formatDistance(calculatedDistanceKm)} de você`;
      } else if (isSameCity) {
        proximityLabel = `Na sua cidade (${coach.city}${coach.state ? ` - ${coach.state}` : ""})`;
      } else if (coach.serviceModality === "online") {
        proximityLabel = "Atendimento 100% Online";
      } else if (coach.city) {
        proximityLabel = `${coach.city}${coach.state ? ` - ${coach.state}` : ""}`;
      } else {
        proximityLabel = coach.distance || "Salão Principal";
      }

      const baseMonthlyPrice = coach.pricing.basicMonthly ?? coach.pricing.dailySession ?? 35;

      return {
        ...coach,
        calculatedDistanceKm,
        proximityLabel,
        isSameCity,
        baseMonthlyPrice,
      };
    });
  }, [coaches, currentUserProfile]);

  // Filtros aplicados e ordenação por proximidade
  const filteredAndSortedCoaches = useMemo(() => {
    let result = enrichedCoaches;

    // 1. Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.specialty.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.neighborhood && c.neighborhood.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          c.proximityLabel.toLowerCase().includes(q)
      );
    }

    // 2. Filtro por Estado (UF)
    if (selectedState !== "ALL") {
      result = result.filter((c) => {
        if (c.serviceModality === "online") return true;
        return c.state?.toUpperCase() === selectedState.toUpperCase();
      });
    }

    // 3. Filtro por Cidade
    if (selectedCity.trim()) {
      const cQuery = selectedCity.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.serviceModality === "online" ||
          (c.city && c.city.toLowerCase().includes(cQuery))
      );
    }

    // 4. Filtro por Modalidade
    if (selectedModality !== "ALL") {
      result = result.filter((c) => {
        if (selectedModality === "presencial") {
          return c.serviceModality === "presencial" || c.serviceModality === "hibrido" || !c.serviceModality;
        }
        if (selectedModality === "online") {
          return c.serviceModality === "online" || c.serviceModality === "hibrido";
        }
        if (selectedModality === "hibrido") {
          return c.serviceModality === "hibrido";
        }
        return true;
      });
    }

    // 5. Filtro por Raio Máximo (se GPS estiver ativo)
    if (maxDistanceRadiusKm !== "ALL") {
      const maxKm = Number(maxDistanceRadiusKm);
      result = result.filter((c) => {
        if (c.serviceModality === "online") return true;
        if (c.calculatedDistanceKm !== null) {
          return c.calculatedDistanceKm <= maxKm;
        }
        return false;
      });
    }

    // 6. Ordenação
    return [...result].sort((a, b) => {
      if (sortBy === "distance") {
        if (a.calculatedDistanceKm !== null && b.calculatedDistanceKm !== null) {
          return a.calculatedDistanceKm - b.calculatedDistanceKm;
        }
        if (a.calculatedDistanceKm !== null) return -1;
        if (b.calculatedDistanceKm !== null) return 1;
        if (a.isSameCity && !b.isSameCity) return -1;
        if (!a.isSameCity && b.isSameCity) return 1;
        return b.rating - a.rating;
      }

      if (sortBy === "rating") {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      }

      if (sortBy === "price_asc") {
        return a.baseMonthlyPrice - b.baseMonthlyPrice;
      }

      return 0;
    });
  }, [
    enrichedCoaches,
    searchQuery,
    selectedState,
    selectedCity,
    selectedModality,
    maxDistanceRadiusKm,
    sortBy,
  ]);

  const currentCoach =
    filteredAndSortedCoaches.find((c) => c.id === selectedCoachId) ||
    coaches.find((c) => c.id === selectedCoachId) ||
    filteredAndSortedCoaches[0] ||
    coaches[0];

  const isContract = selectedPlanType === "semanal" || selectedPlanType === "mensal";

  // Slots do dia selecionado no calendário
  const daySlots = useMemo(() => {
    return getCoachSlotsForDate(currentCoach, selectedDate);
  }, [currentCoach, selectedDate]);

  // Preço base do plano selecionado
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

  const hasUserGps = isValidCoordinate(currentUserProfile.latitude, currentUserProfile.longitude);
  const activeFiltersCount =
    (selectedState !== "ALL" ? 1 : 0) +
    (selectedModality !== "ALL" ? 1 : 0) +
    (maxDistanceRadiusKm !== "ALL" ? 1 : 0) +
    (selectedCity.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Header com Proposta de Valor */}
      <div className="rounded-3xl p-4 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Personal Presencial & Online
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Agendamento em Tempo Real</span>
        </div>

        <h2 className="text-base font-black text-white">Treine com um Especialista</h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Encontre os melhores Personal Trainers na sua área, compare horários vagos, escolha seu plano e garanta seu acompanhamento.
        </p>
      </div>

      {/* Banner de Geolocalização / Ativação de GPS do Aluno */}
      {!hasUserGps ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Ver personais mais próximos de você</p>
              <p className="text-[11px] text-zinc-400">
                Ative sua localização ou use os filtros de estado e cidade para ver treinadores na sua região.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestUserLocation}
            disabled={isLocatingUser}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            {isLocatingUser ? (
              <>
                <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Obtendo GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Detectar Localização</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium truncate">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Mostrando personais por proximidade{" "}
              {currentUserProfile.city ? `(${currentUserProfile.city} - ${currentUserProfile.state || "SP"})` : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRequestUserLocation}
            className="text-[10px] text-emerald-400 hover:underline shrink-0 font-bold"
          >
            Atualizar GPS
          </button>
        </div>
      )}

      {locationNotice && (
        <div className="p-2.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{locationNotice}</span>
        </div>
      )}

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

      {/* Seção: Meus Agendamentos Ativos */}
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

      {/* Barra de Busca & Toggle de Filtros de Região */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar personal por nome, especialidade ou cidade..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            setShowFilters(!showFilters);
          }}
          className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
            showFilters || activeFiltersCount > 0
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
              : "bg-zinc-900 border-white/[0.08] text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 font-black text-[9px] flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Painel Expansível de Filtros Avançados (Região, Modalidade, Raio, Ordenação) */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/[0.08] space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filtros de Região & Proximidade</span>
            </span>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState("ALL");
                  setSelectedCity("");
                  setSelectedModality("ALL");
                  setMaxDistanceRadiusKm("ALL");
                  setSortBy("distance");
                  triggerHaptic("light");
                }}
                className="text-[10px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Filtro por Estado (UF) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                Estado (UF)
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  triggerHaptic("selection");
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="ALL">Todos os Estados</option>
                {BRAZIL_STATES.map((s) => (
                  <option key={s.uf} value={s.uf}>
                    {s.uf} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Modalidade */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                Modalidade
              </label>
              <select
                value={selectedModality}
                onChange={(e) => {
                  setSelectedModality(e.target.value);
                  triggerHaptic("selection");
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="ALL">Todas as Modalidades</option>
                <option value="presencial">Presencial no Salão</option>
                <option value="online">Consultoria Online</option>
                <option value="hibrido">Híbrido (Presencial & Online)</option>
              </select>
            </div>

            {/* Filtro por Raio Máximo (habilitado quando há GPS) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                Raio de Distância
              </label>
              <select
                value={maxDistanceRadiusKm}
                onChange={(e) => {
                  setMaxDistanceRadiusKm(e.target.value);
                  triggerHaptic("selection");
                }}
                disabled={!hasUserGps}
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40 transition-all"
              >
                <option value="ALL">{hasUserGps ? "Qualquer Distância" : "Requer GPS ativo"}</option>
                <option value="5">Até 5 km</option>
                <option value="10">Até 10 km</option>
                <option value="25">Até 25 km</option>
                <option value="50">Até 50 km</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                Ordenar Por
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  triggerHaptic("selection");
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="distance">Mais Próximos</option>
                <option value="rating">Melhor Avaliados</option>
                <option value="price_asc">Menor Preço Mensal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista / Carrossel de Personais Encontrados */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400">
            Personais Disponíveis ({filteredAndSortedCoaches.length}):
          </span>
          {hasUserGps && sortBy === "distance" && (
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
              <Navigation className="w-2.5 h-2.5" /> Ordenados do mais perto ao mais longe
            </span>
          )}
        </div>

        {filteredAndSortedCoaches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-center space-y-2">
            <MapPin className="w-8 h-8 text-zinc-500 mx-auto" />
            <p className="text-xs font-bold text-white">Nenhum personal encontrado nesta região</p>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Tente ampliar seu raio de busca, escolher outro estado ou limpar os filtros para ver todos os profissionais.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedState("ALL");
                setSelectedCity("");
                setSelectedModality("ALL");
                setMaxDistanceRadiusKm("ALL");
                setSearchQuery("");
                triggerHaptic("light");
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition-all active:scale-95 inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Ver Todos os Personais</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredAndSortedCoaches.map((coach) => {
              const isSelected = currentCoach && currentCoach.id === coach.id;
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
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-xs font-black text-white truncate">{coach.name}</h4>
                          {coach.cref && (
                            <span className="text-[9px] font-mono font-bold text-zinc-400 bg-white/[0.04] px-1 py-0.2 rounded border border-white/[0.06] hidden sm:inline">
                              {coach.cref}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold shrink-0">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{coach.rating.toFixed(1)}</span>
                          <span className="text-zinc-500 text-[9px]">({coach.reviewCount})</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-emerald-400 font-medium block truncate">
                        {coach.specialty}
                      </span>

                      {/* Badges de Proximidade e Modalidade */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{coach.proximityLabel}</span>
                        </span>

                        {coach.serviceModality && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06] uppercase">
                            {coach.serviceModality === "hibrido"
                              ? "Presencial + Online"
                              : coach.serviceModality === "online"
                              ? "Online"
                              : "Presencial"}
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-zinc-300 ml-auto">
                          A partir de R$ {coach.pricing.basicMonthly ?? coach.pricing.dailySession ?? 35}/mês
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grade de Horários & Agendamento com o Personal Selecionado */}
      {currentCoach && (
        <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-3.5 shadow-xl">
          {/* Cabeçalho do Personal Selecionado */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Agenda & Contratação</span>
              <h3 className="text-xs font-black text-white">{currentCoach.name}</h3>
              {currentCoach.location && (
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  📍 {currentCoach.location}
                </span>
              )}
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
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition-all shrink-0 ml-2"
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Seletor rápido dos próximos 7 dias */}
            <div className="grid grid-cols-7 gap-1">
              {upcomingWeekDays.map((item) => {
                const isSelected = isDateSelected(item.date);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedDate(item.date);
                      setSelectedTimeSlot("");
                    }}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20 scale-105"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span className="text-[9px] uppercase leading-tight font-bold">{item.shortName}</span>
                    <span className="text-xs font-mono font-black mt-0.5">{item.dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. GRADE DE HORÁRIOS */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Horários Disponíveis:</span>
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">
                {daySlots.filter((s) => s.isAvailable).length} vagas
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
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
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-black border transition-all ${
                      !slot.isAvailable
                        ? "opacity-30 bg-zinc-950 border-white/[0.03] text-zinc-600 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-102"
                        : "bg-white/[0.03] border-white/[0.08] text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-300"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mensagem de Erro de Agendamento */}
          {bookingErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{bookingErrorMessage}</span>
            </div>
          )}

          {/* Botão de Confirmação do Agendamento */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total a Pagar:</span>
              <span className="text-base font-mono font-black text-emerald-400">
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmBooking}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <span>Confirmar Agendamento</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Calendário Mensal */}
      <BookingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedTimeSlot("");
        }}
        planType={selectedPlanType}
        coachName={currentCoach?.name || "Personal"}
      />

      {/* Modal de Confirmação de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-emerald-500/30 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Solicitação Enviada!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Seu agendamento foi registrado com sucesso. O treinador foi notificado e você já pode confirmar via WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Desvinculação de Personal */}
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
          currentPlan={selectedBookingToLeave.planType}
          studentId={studentId}
          studentName={studentName}
          onSuccessLeave={() => {
            setMyBookings(getStoredBookings());
          }}
        />
      )}
    </div>
  );
}
