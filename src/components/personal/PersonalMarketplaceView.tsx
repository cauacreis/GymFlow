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
  Check,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser, saveUserProfile, UserProfile } from "@/lib/auth-store";
import { getUserPlanTier, isSubscriptionExpired } from "@/lib/subscription-features";
import {
  getStoredCoaches,
  getStoredBookings,
  getStudentBookings,
  requestTrainerBooking,
  subscribeToBookings,
  subscribeToCoaches,
  CoachTrainer,
  BookingRequest,
  getCoachSlotsForDate,
  addNotification,
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
  onOpenProfile?: () => void;
}

function decodeHtml(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

function normalizeText(str?: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchState(coachState?: string, filterUf?: string): boolean {
  if (!filterUf || filterUf === "ALL") return true;
  if (!coachState) return false;
  const cleanTarget = filterUf.trim().toUpperCase();
  const cleanCoach = coachState.trim().toUpperCase();
  if (cleanCoach === cleanTarget) return true;
  const foundByUf = BRAZIL_STATES.find((s) => s.uf === cleanTarget);
  if (foundByUf && normalizeText(coachState) === normalizeText(foundByUf.name)) return true;
  const foundByName = BRAZIL_STATES.find((s) => normalizeText(s.name) === normalizeText(coachState));
  if (foundByName && foundByName.uf === cleanTarget) return true;
  return false;
}

export function PersonalMarketplaceView({
  studentId = "student_carlos",
  studentName = "Aluno",
  studentPhone = "",
  onOpenPlans,
  onOpenProfile,
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

  // Estados de Dúvidas / Mensagem prévia para o Personal
  const [showPreBookingModal, setShowPreBookingModal] = useState(false);
  const [preBookingMessage, setPreBookingMessage] = useState("");
  const [preBookingSent, setPreBookingSent] = useState(false);

  // Perfil do usuário e geolocalização do aluno
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(() => getCurrentUser());
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const effectiveStudentId = studentId && studentId !== "student_carlos" ? studentId : (currentUserProfile?.id || "student_carlos");
  const effectiveStudentName = studentName && studentName !== "Aluno" ? studentName : (currentUserProfile?.name || "Aluno");
  const effectiveStudentPhone = studentPhone || currentUserProfile?.phone || "";

  // Filtros de busca avançada & proximidade
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedModality, setSelectedModality] = useState<string>("ALL"); // "ALL" | "presencial" | "online" | "hibrido"
  const [maxDistanceRadiusKm, setMaxDistanceRadiusKm] = useState<string>("ALL"); // "ALL" | "5" | "10" | "25" | "50"
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price_asc">("distance");
  const [showFilters, setShowFilters] = useState(false);

  // Sincroniza coaches e agendamentos reativamente em tempo real
  useEffect(() => {
    const refreshData = () => {
      setCoaches(getStoredCoaches());
      setMyBookings(getStudentBookings(effectiveStudentId));
    };
    refreshData();
    const unsubBookings = subscribeToBookings(refreshData);
    const unsubCoaches = subscribeToCoaches(refreshData);
    window.addEventListener("gymflow:coaches-updated", refreshData);
    return () => {
      unsubBookings();
      unsubCoaches();
      window.removeEventListener("gymflow:coaches-updated", refreshData);
    };
  }, [effectiveStudentId]);

  // Ouve mudanças de autenticação/perfil do usuário e atualiza catálogo e localização
  useEffect(() => {
    const handleAuthChange = () => {
      const updated = getCurrentUser();
      setCurrentUserProfile(updated);
      setCoaches(getStoredCoaches());
      setMyBookings(getStudentBookings(updated.id || effectiveStudentId));
    };
    window.addEventListener("gymflow:auth-changed", handleAuthChange);
    return () => window.removeEventListener("gymflow:auth-changed", handleAuthChange);
  }, [effectiveStudentId]);

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

  // Lista enriquecida com cálculo de proximidade e identificação de perfil próprio
  const enrichedCoaches = useMemo(() => {
    const userLat = currentUserProfile.latitude;
    const userLng = currentUserProfile.longitude;
    const hasUserCoords = isValidCoordinate(userLat, userLng);
    const userCity = normalizeText(currentUserProfile.city);
    const userState = (currentUserProfile.state || "").trim().toUpperCase();

    const userDigits = (currentUserProfile.phone || studentPhone || "").replace(/\D/g, "");
    const currentUserName = normalizeText(currentUserProfile.name || studentName || "");

    return coaches
      .filter((c) => Boolean(c && c.id && c.name))
      .map((coach) => {
        const coachDigits = (coach.phone || "").replace(/\D/g, "");
        const coachName = normalizeText(coach.name);

        // Identifica se este card pertence à conta do próprio usuário
        const isCurrentUserProfile = Boolean(
          (currentUserProfile.id && (coach.id === currentUserProfile.id || coach.id === `coach_${currentUserProfile.id}`)) ||
          (studentId && (coach.id === studentId || coach.id === `coach_${studentId}`)) ||
          (currentUserProfile.email && coach.email && normalizeText(currentUserProfile.email) === normalizeText(coach.email)) ||
          (userDigits && coachDigits && userDigits.length >= 8 && userDigits === coachDigits) ||
          (currentUserName && coachName && currentUserName === coachName && currentUserName !== "aluno" && currentUserName !== "aluno convidado")
        );

        let calculatedDistanceKm: number | null = null;
        let proximityLabel = "";
        let isSameCity = false;
        let isSameState = false;

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
        if (userCity && coach.city && normalizeText(coach.city) === userCity) {
          isSameCity = true;
        }

        // 3. Se está no mesmo estado
        if (userState && matchState(coach.state, userState)) {
          isSameState = true;
        }

        // 4. Rótulo de exibição de proximidade
        if (calculatedDistanceKm !== null) {
          proximityLabel = `A ${formatDistance(calculatedDistanceKm)} de você`;
        } else if (isSameCity) {
          proximityLabel = `Na sua cidade (${coach.city}${coach.state ? ` - ${coach.state}` : ""})`;
        } else if (isSameState) {
          proximityLabel = `No seu estado (${coach.state}${coach.city ? ` • ${coach.city}` : ""})`;
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
          isCurrentUserProfile,
          calculatedDistanceKm,
          proximityLabel,
          isSameCity,
          isSameState,
          baseMonthlyPrice,
        };
      });
  }, [coaches, currentUserProfile, studentId, studentName, studentPhone]);

  // Filtros aplicados e ordenação por proximidade
  const filteredAndSortedCoaches = useMemo(() => {
    let result = enrichedCoaches;

    // 1. Busca textual resiliente a acentos e maiúsculas
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      result = result.filter(
        (c) =>
          normalizeText(c.name).includes(q) ||
          normalizeText(c.specialty).includes(q) ||
          normalizeText(c.city).includes(q) ||
          normalizeText(c.neighborhood).includes(q) ||
          normalizeText(c.location).includes(q) ||
          normalizeText(c.bio).includes(q) ||
          normalizeText(c.proximityLabel).includes(q)
      );
    }

    // 2. Filtro por Estado (UF)
    if (selectedState !== "ALL") {
      result = result.filter((c) => {
        if (c.serviceModality === "online" && selectedModality !== "presencial") return true;
        return matchState(c.state, selectedState) || matchState(c.location, selectedState);
      });
    }

    // 3. Filtro por Cidade
    if (selectedCity.trim()) {
      const cQuery = normalizeText(selectedCity);
      result = result.filter(
        (c) =>
          (c.serviceModality === "online" && selectedModality !== "presencial") ||
          normalizeText(c.city).includes(cQuery) ||
          normalizeText(c.neighborhood).includes(cQuery) ||
          normalizeText(c.location).includes(cQuery)
      );
    }

    // 4. Filtro por Modalidade
    if (selectedModality !== "ALL") {
      result = result.filter((c) => {
        const mod = c.serviceModality || "presencial";
        if (selectedModality === "presencial") {
          return mod === "presencial" || mod === "hibrido";
        }
        if (selectedModality === "online") {
          return mod === "online" || mod === "hibrido";
        }
        if (selectedModality === "hibrido") {
          return mod === "hibrido";
        }
        return true;
      });
    }

    // 5. Filtro por Raio Máximo (se GPS estiver ativo ou na mesma cidade)
    if (maxDistanceRadiusKm !== "ALL") {
      const maxKm = Number(maxDistanceRadiusKm);
      result = result.filter((c) => {
        if (c.serviceModality === "online" && selectedModality !== "presencial") return true;
        if (c.calculatedDistanceKm !== null) {
          return c.calculatedDistanceKm <= maxKm;
        }
        if (c.isSameCity) return true;
        return false;
      });
    }

    // 6. Ordenação inteligente
    return [...result].sort((a, b) => {
      // Se for o próprio treinador navegando, destaca seu perfil no topo
      if (a.isCurrentUserProfile && !b.isCurrentUserProfile) return -1;
      if (!a.isCurrentUserProfile && b.isCurrentUserProfile) return 1;

      if (sortBy === "distance") {
        if (a.calculatedDistanceKm !== null && b.calculatedDistanceKm !== null) {
          return a.calculatedDistanceKm - b.calculatedDistanceKm;
        }
        if (a.calculatedDistanceKm !== null) return -1;
        if (b.calculatedDistanceKm !== null) return 1;
        if (a.isSameCity && !b.isSameCity) return -1;
        if (!a.isSameCity && b.isSameCity) return 1;
        if (a.isSameState && !b.isSameState) return -1;
        if (!a.isSameState && b.isSameState) return 1;
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

  // Garante que o treinador selecionado seja válido e nunca o próprio usuário
  useEffect(() => {
    if (filteredAndSortedCoaches.length > 0) {
      const isSelectedAvailable = filteredAndSortedCoaches.some((c) => c.id === selectedCoachId);
      if (!isSelectedAvailable) {
        setSelectedCoachId(filteredAndSortedCoaches[0].id);
      }
    }
  }, [filteredAndSortedCoaches, selectedCoachId]);

  const currentCoach =
    filteredAndSortedCoaches.find((c) => c.id === selectedCoachId) ||
    coaches.find((c) => c.id === selectedCoachId) ||
    filteredAndSortedCoaches[0] ||
    coaches[0];

  const isContract = selectedPlanType === "semanal" || selectedPlanType === "mensal";

  // Planos disponíveis do personal selecionado (customizados ou padrões)
  const coachPlanOptions = useMemo(() => {
    if (currentCoach?.coachPlans && currentCoach.coachPlans.length > 0) {
      return currentCoach.coachPlans.map((p, idx) => ({
        id: (idx === 0 ? "diario" : idx === 1 ? "semanal" : "mensal") as "diario" | "semanal" | "mensal",
        customId: p.id,
        title: p.name,
        frequency: p.frequency || "2x na semana",
        duration: p.duration || "1h / aula",
        modalities: p.modalities || ["Musculação"],
        price: p.price,
        period: p.period === "diario" ? "/treino" : p.period === "semanal" ? "/sem" : "/mês",
        badge: idx === 1 ? "Mais Popular" : idx === 2 ? "Mais Escolhido" : undefined,
      }));
    }

    return [
      {
        id: "diario" as const,
        customId: "plan_basico",
        title: "Mensal Básico",
        frequency: "2x na semana",
        duration: "45 min / aula",
        modalities: ["Musculação", "Treinamento Funcional"],
        price: currentCoach?.pricing.basicMonthly ?? currentCoach?.pricing.dailySession ?? 35,
        period: "/mês",
      },
      {
        id: "semanal" as const,
        customId: "plan_pro",
        title: "Mensal Pro",
        frequency: "3x na semana",
        duration: "1h / aula",
        modalities: ["Musculação", "Corrida / Cardio", "Treinamento Funcional"],
        badge: "Mais Popular",
        price: currentCoach?.pricing.proMonthly ?? currentCoach?.pricing.weeklyPlan ?? 45,
        period: "/mês",
      },
      {
        id: "mensal" as const,
        customId: "plan_vip",
        title: "Mensal VIP",
        frequency: "5x na semana / Livre",
        duration: "1h15 / aula",
        modalities: ["Musculação", "Corrida / Cardio", "Treinamento Funcional", "Nutrição"],
        badge: "VIP Completo",
        price: currentCoach?.pricing.vipMonthly ?? currentCoach?.pricing.monthlyPlan ?? 55,
        period: "/mês",
      },
    ];
  }, [currentCoach]);

  // Slots do dia selecionado no calendário
  const daySlots = useMemo(() => {
    return getCoachSlotsForDate(currentCoach, selectedDate);
  }, [currentCoach, selectedDate]);

  // Preço base do plano selecionado
  const selectedPlanObj = coachPlanOptions.find((p) => p.id === selectedPlanType) || coachPlanOptions[0];
  const basePrice = selectedPlanObj ? selectedPlanObj.price : 0;

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
    if (currentCoach?.isCurrentUserProfile) {
      setBookingErrorMessage("Este é o seu próprio perfil de treinador. Para editar seus dados, especialidade ou localização, use o botão de Configurações.");
      triggerHaptic("warning");
      return;
    }

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
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      studentPhone: effectiveStudentPhone,
      coachId: currentCoach.id,
      slotDay: slotDayString,
      slotTime: selectedTimeSlot,
      planType: selectedPlanType,
      extraOfferedAmount: extraAmount,
      durationMinutes: 60,
      workoutTitle: `Treino com ${currentCoach.name}`,
      notes: isContract
        ? `Início da assinatura em ${selectedDateFormatted} às ${selectedTimeSlot}. 3x na semana, 1h por aula. Válido até ${validUntilFormatted}.`
        : `Sessão presencial agendada para ${selectedDateFormatted} às ${selectedTimeSlot} (Duração: 1h).`,
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

  // Handler para envio de dúvidas prévias via WhatsApp
  const handleSendPreBookingViaWhatsApp = () => {
    if (!currentCoach) return;
    const cleanCoachPhone = (currentCoach.phone || "").replace(/\D/g, "");
    const studentDisplay = studentName || currentUserProfile.name || "Aluno";
    const userDoubt = preBookingMessage.trim() || "Gostaria de saber mais sobre seu acompanhamento e metodologia de treino antes de escolher um plano.";
    const text = `Olá, ${decodeHtml(currentCoach.name)}! Sou o ${studentDisplay} no GymFlow. Tenho uma dúvida antes de contratar seu plano: "${userDoubt}". Como podemos conversar?`;

    if (cleanCoachPhone) {
      window.open(`https://wa.me/${cleanCoachPhone}?text=${encodeURIComponent(text)}`, "_blank");
    }

    addNotification({
      targetRole: "coach",
      coachId: currentCoach.id,
      studentId: studentId || currentUserProfile.id,
      type: "booking_message",
      title: `💬 Dúvida de ${studentDisplay}`,
      message: userDoubt,
      actionUrl: "/coach/agenda",
    });

    setPreBookingSent(true);
    triggerHaptic("success");
  };

  // Handler para envio de dúvidas prévias diretamente pelo GymFlow
  const handleSendPreBookingViaGymFlow = () => {
    if (!currentCoach) return;
    const studentDisplay = studentName || currentUserProfile.name || "Aluno";
    const userDoubt = preBookingMessage.trim() || "Gostaria de tirar algumas dúvidas sobre seus horários e metodologia antes de escolher o plano.";

    addNotification({
      targetRole: "coach",
      coachId: currentCoach.id,
      studentId: studentId || currentUserProfile.id,
      type: "booking_message",
      title: `💬 Mensagem prévia de ${studentDisplay}`,
      message: userDoubt,
      actionUrl: "/coach/agenda",
    });

    setPreBookingSent(true);
    triggerHaptic("success");
  };

  const hasUserGps = isValidCoordinate(currentUserProfile.latitude, currentUserProfile.longitude);
  const userRegisteredCity = (currentUserProfile.city || "").trim();
  const userRegisteredState = (currentUserProfile.state || "").trim().toUpperCase();
  const userRegisteredNeighborhood = (currentUserProfile.neighborhood || "").trim();
  const hasUserRegisteredLocation = Boolean(userRegisteredCity || userRegisteredState || hasUserGps);

  const userLocationDisplay = [
    userRegisteredNeighborhood,
    userRegisteredCity,
    userRegisteredState,
  ].filter(Boolean).join(" - ") || (hasUserGps ? "Coordenadas GPS ativas" : "");

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

        <h2 className="text-base font-black text-white">Treine com um Especialista</h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Encontre os melhores Personal Trainers na sua área, compare horários vagos, escolha seu plano e garanta seu acompanhamento.
        </p>
      </div>

      {/* Banner de Localização Cadastrada ou Ativação de GPS do Aluno */}
      {hasUserRegisteredLocation ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sua Localização</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {hasUserGps ? "GPS & Perfil" : "Cadastrada"}
                </span>
              </div>
              <p className="text-xs font-black text-white truncate mt-0.5">
                {userLocationDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRequestUserLocation}
              disabled={isLocatingUser}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold border border-white/[0.08] transition-all flex items-center gap-1.5 active:scale-95"
              title="Atualizar localização via GPS do dispositivo"
            >
              {isLocatingUser ? (
                <>
                  <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Obtendo GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>Atualizar GPS</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
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
            maxLength={80}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
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

            {/* Filtro por Cidade */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                Cidade
              </label>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                }}
                placeholder="Ex: São Paulo, Rio..."
                maxLength={50}
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
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
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/[0.08] bg-zinc-800">
                      {coach.avatarUrl ? (
                        <Image
                          src={coach.avatarUrl}
                          alt={coach.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-sm text-zinc-300">
                          {coach.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-xs font-black text-white truncate">{decodeHtml(coach.name)}</h4>
                          {coach.cref && (
                            <span className="text-[9px] font-mono font-bold text-zinc-400 bg-white/[0.04] px-1 py-0.2 rounded border border-white/[0.06] hidden sm:inline">
                              {coach.cref}
                            </span>
                          )}
                          {coach.isCurrentUserProfile && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                              Seu Perfil
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
                        {decodeHtml(coach.specialty)}
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

                        {coach.isCurrentUserProfile && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            ✨ Visualização Pública
                          </span>
                        )}

                        {coach.allowBookingMessages !== false && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            <MessageSquare className="w-2.5 h-2.5 text-blue-400" />
                            <span>Tira dúvidas</span>
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Agenda & Contratação</span>
                {currentCoach.isCurrentUserProfile && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Seu Perfil de Treinador
                  </span>
                )}
              </div>
              <h3 className="text-xs font-black text-white mt-0.5">{decodeHtml(currentCoach.name)}</h3>
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

          {/* BANNER / BOTÃO: TIRAR DÚVIDAS ANTES DE ESCOLHER O PLANO */}
          {currentCoach.allowBookingMessages !== false && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-900 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    Dúvidas antes de escolher o plano?
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    Mande uma mensagem para {decodeHtml(currentCoach.name)} e combine horários ou tire dúvidas.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setShowPreBookingModal(true);
                  setPreBookingSent(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mandar Mensagem</span>
              </button>
            </div>
          )}

          {/* 1. SELEÇÃO DA MODALIDADE DO PLANO */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">1. Modalidade do Plano:</span>
              <span className="text-[9px] text-emerald-400 font-bold">
                {selectedPlanObj?.title || "Plano Selecionado"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {coachPlanOptions.map((plan) => {
                const isSelected = selectedPlanType === plan.id;
                return (
                  <button
                    key={plan.customId || plan.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedPlanType(plan.id);
                      setSelectedTimeSlot("");
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? "bg-gradient-to-b from-emerald-950/60 to-zinc-900 border-emerald-400 text-white shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-400/40 scale-[1.01]"
                        : "bg-zinc-950/80 border-white/[0.08] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-3 text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs font-black block truncate ${isSelected ? "text-emerald-300" : "text-white"}`}>
                          {plan.title}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-400 text-zinc-950 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-300 font-semibold block mt-1">
                        {plan.frequency} • {plan.duration}
                      </span>
                      {plan.modalities && plan.modalities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.modalities.slice(0, 3).map((m) => (
                            <span
                              key={m}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                isSelected
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                              <span>{m}</span>
                            </span>
                          ))}
                          {plan.modalities.length > 3 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                              +{plan.modalities.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="pt-2.5 mt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-medium">Investimento:</span>
                      <span className={`text-sm font-mono font-black ${isSelected ? "text-emerald-300" : "text-emerald-400"}`}>
                        R$ {plan.price}{plan.period}
                      </span>
                    </div>
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

            {currentCoach.isCurrentUserProfile ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  if (onOpenProfile) {
                    onOpenProfile();
                  } else {
                    window.dispatchEvent(new CustomEvent("gymflow:open-profile"));
                  }
                }}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                <span>Editar Suas Configurações</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <span>Confirmar Agendamento</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Solicitação de Contratação Enviada! 🚀</h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Seu pedido para o plano <strong>{selectedPlanObj?.title || "Personal"}</strong> foi enviado para{" "}
                <strong>{currentCoach?.name || "seu treinador"}</strong>.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                O personal recebeu uma notificação no app para aceitar e matricular você. Assim que aceito, sua grade estará ativa e sua ficha de treino liberada!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {currentCoach?.phone && (
                <a
                  href={`https://wa.me/${currentCoach.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá, ${currentCoach.name}! Sou o ${effectiveStudentName}. Acabei de contratar o plano ${selectedPlanObj?.title || "Personal"} pelo GymFlow para ${selectedDateLabel} às ${selectedTimeSlot || "horário combinado"}. Aguardo sua confirmação!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Avisar no WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg active:scale-95 transition-all sm:col-span-1"
              >
                Concluir
              </button>
            </div>
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
          studentId={effectiveStudentId}
          studentName={effectiveStudentName}
          onSuccessLeave={() => {
            setMyBookings(getStudentBookings(effectiveStudentId));
          }}
        />
      )}

      {/* Modal de Envio de Dúvidas / Mensagem Prévia para o Personal */}
      {showPreBookingModal && currentCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                  {currentCoach.avatarUrl ? (
                    <img src={currentCoach.avatarUrl} alt={currentCoach.name} className="w-full h-full object-cover" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">{decodeHtml(currentCoach.name)}</h3>
                  <span className="text-[10px] text-emerald-400 font-medium block">
                    {decodeHtml(currentCoach.specialty)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPreBookingModal(false);
                  setPreBookingSent(false);
                }}
                className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {preBookingSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Mensagem Enviada!</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    {decodeHtml(currentCoach.name)} recebeu sua dúvida e entrará em contato em breve para você fechar seu treino.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreBookingModal(false);
                    setPreBookingSent(false);
                    setPreBookingMessage("");
                  }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-lg active:scale-95 transition-all"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tire suas dúvidas antes de escolher o plano
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Combine dias, pergunte sobre a metodologia ou fale sobre seus objetivos e restrições.
                  </p>
                </div>

                {/* Sugestões Rápidas de Mensagem */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Sugestões rápidas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Quero conhecer sua metodologia de treino",
                      "Tenho horários flexíveis, podemos alinhar?",
                      "Tenho restrição física/lesão, o treino é adaptado?",
                      "Gostaria de uma aula experimental de adaptação",
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setPreBookingMessage(sug);
                        }}
                        className="text-[10px] text-left px-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 hover:text-emerald-300 border border-white/[0.06] hover:border-emerald-500/30 text-zinc-300 transition-all active:scale-95"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center justify-between">
                    <span>Sua Mensagem:</span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {preBookingMessage.length}/300
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={preBookingMessage}
                    onChange={(e) => setPreBookingMessage(e.target.value)}
                    placeholder="Escreva sua dúvida ou o que gostaria de combinar antes de escolher o plano..."
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentCoach.phone && (
                    <button
                      type="button"
                      onClick={handleSendPreBookingViaWhatsApp}
                      className="py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Conversar no WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSendPreBookingViaGymFlow}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 sm:col-span-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar pelo GymFlow</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
