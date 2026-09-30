"use client";

import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  User,
  Camera,
  Upload,
  Trash2,
  Phone,
  Dumbbell,
  GraduationCap,
  Target,
  Flame,
  Zap,
  Activity,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Scale,
  LogOut,
  Award,
  X,
  MapPin,
  Navigation,
  Loader2,
  ShieldCheck,
  Sparkles,
  DollarSign,
  FileText,
  Plus,
  Clock,
  Calendar,
  Layers,
  Heart,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { TermsOfServiceModal } from "./TermsOfServiceModal";
import {
  UserProfile,
  UserRole,
  saveUserProfile,
  logoutUser,
} from "@/lib/auth-store";
import { saveProfileToSupabase } from "@/lib/supabase-service";
import { getSupabase } from "@/lib/supabase";
import { updateCoachPublicProfile } from "@/lib/booking-store";
import {
  CoachPlanOption,
  getStoredCoachPlans,
  saveCoachPlans,
  DEFAULT_COACH_PLANS,
  saveNewStudent,
} from "@/lib/workout-store";
import { triggerHaptic } from "@/lib/haptic";
import {
  processAndCompressImageToWebP,
  validateImageFile,
} from "@/lib/image-processor";
import {
  BRAZIL_STATES,
  reverseGeocode,
  isValidCoordinate,
} from "@/lib/geo";
import { sanitizeInput, maskEmail } from "@/lib/security";

const AVAILABLE_MODALITIES: Array<{ id: string; label: string; icon: string }> = [
  { id: "Musculação", label: "Musculação", icon: "🏋️‍♂️" },
  { id: "Corrida / Cardio", label: "Corrida & Cardio", icon: "🏃‍♂️" },
  { id: "Treinamento Funcional", label: "Funcional", icon: "⚡" },
  { id: "Mobilidade & Alongamento", label: "Mobilidade & Along.", icon: "🧘" },
  { id: "Orientação Nutricional", label: "Nutrição & Hábitos", icon: "🥗" },
  { id: "Acompanhamento WhatsApp", label: "WhatsApp Direto", icon: "📱" },
  { id: "Avaliação Física", label: "Avaliação Física", icon: "📊" },
  { id: "Lutas / Artes Marciais", label: "Lutas & Artes Marciais", icon: "🥊" },
  { id: "Natação & Hidro", label: "Natação & Hidro", icon: "🏊‍♂️" },
];

const FREQUENCY_OPTIONS = [
  "1x na semana",
  "2x na semana",
  "3x na semana",
  "4x na semana",
  "5x na semana",
  "Acompanhamento Livre",
];

const DURATION_OPTIONS = [
  "30 min / aula",
  "45 min / aula",
  "1h / aula",
  "1h15 / aula",
  "1h30 / aula",
  "2h / aula",
];

const PERIOD_OPTIONS: Array<{ value: NonNullable<CoachPlanOption["period"]>; label: string }> = [
  { value: "mensal", label: "Mensal (R$/mês)" },
  { value: "semanal", label: "Semanal (R$/sem)" },
  { value: "diario", label: "Por Sessão / Aula" },
  { value: "trimestral", label: "Trimestral" },
  { value: "personalizado", label: "Personalizado" },
];

interface AccountCustomizationModalProps {
  isOpen: boolean;
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
  onClose?: () => void;
}

const GOAL_OPTIONS: Array<{
  value: string;
  label: string;
  desc: string;
  icon: any;
}> = [
  {
    value: "Hipertrofia",
    label: "Hipertrofia",
    desc: "Ganho de massa muscular e volume",
    icon: Dumbbell,
  },
  {
    value: "Emagrecimento",
    label: "Emagrecimento",
    desc: "Perda de gordura e definição corporal",
    icon: Flame,
  },
  {
    value: "Força & Performance",
    label: "Força & Performance",
    desc: "Aumento de cargas, potência e RM",
    icon: Zap,
  },
  {
    value: "Condicionamento Geral",
    label: "Condicionamento Geral",
    desc: "Saúde, resistência e longevidade",
    icon: Activity,
  },
  {
    value: "Personalizado",
    label: "Personalizado",
    desc: "Defina seu próprio objetivo ou foco específico",
    icon: Sparkles,
  },
];

const EXPERIENCE_OPTIONS: Array<{
  value: NonNullable<UserProfile["experienceLevel"]>;
  label: string;
  subtitle: string;
}> = [
  {
    value: "Iniciante",
    label: "Iniciante",
    subtitle: "Menos de 6 meses",
  },
  {
    value: "Intermediário",
    label: "Intermediário",
    subtitle: "6 meses a 2 anos",
  },
  {
    value: "Avançado",
    label: "Avançado",
    subtitle: "Mais de 2 anos",
  },
];

const SPECIALTY_OPTIONS = [
  "Musculação & Hipertrofia",
  "Treinamento Funcional",
  "Emagrecimento & Definição",
  "Biomecânica & Reabilitação",
  "Força & Powerlifting",
  "Condicionamento Geral & Saúde",
  "Outra / Personalizada",
];

// Utilitário de formatação de telefone com DDD (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function AccountCustomizationModal({
  isOpen,
  user,
  onComplete,
  onClose,
}: AccountCustomizationModalProps) {
  // Controle do Wizard (Passo 1 a 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const TOTAL_STEPS = 5;

  // Dados básicos (Passo 1)
  const [name, setName] = useState(user.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [phone, setPhone] = useState(formatPhone(user.phone || ""));

  // Papel (Passo 2)
  const [role, setRole] = useState<UserRole>(user.activeRole || "student");

  // Dados de Localização & Região (Passo 3)
  const [state, setState] = useState<string>(user.state || "SP");
  const [city, setCity] = useState<string>(user.city || "");
  const [neighborhood, setNeighborhood] = useState<string>(user.neighborhood || "");
  const [latitude, setLatitude] = useState<number | undefined>(user.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user.longitude);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<boolean>(
    Boolean(user.latitude && user.longitude)
  );
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Configurações de atendimento do Personal (Passo 3 & 4)
  const [serviceModality, setServiceModality] = useState<"presencial" | "online" | "hibrido">(
    user.serviceModality || "presencial"
  );
  const [operatingRadiusKm, setOperatingRadiusKm] = useState<number>(user.operatingRadiusKm || 15);
  const [operatingLocation, setOperatingLocation] = useState(user.location || "");

  // Dados de Aluno (Passo 4 - Aluno)
  const isPresetGoal = ["Hipertrofia", "Emagrecimento", "Força & Performance", "Condicionamento Geral"].includes(
    user.goal || ""
  );
  const [goal, setGoal] = useState<string>(
    user.goal ? (isPresetGoal ? user.goal : "Personalizado") : "Hipertrofia"
  );
  const [customGoalInput, setCustomGoalInput] = useState<string>(
    user.goal && !isPresetGoal ? user.goal : ""
  );
  const [experienceLevel, setExperienceLevel] = useState<UserProfile["experienceLevel"]>(
    user.experienceLevel || "Iniciante"
  );
  const [weight, setWeight] = useState<string>(user.weight ? String(user.weight) : "");
  const [height, setHeight] = useState<string>(user.height ? String(user.height) : "");

  // Dados de Personal Trainer (Passo 4 - Coach)
  const isPresetSpecialty = SPECIALTY_OPTIONS.filter((s) => s !== "Outra / Personalizada").includes(
    user.specialty || ""
  );
  const [specialty, setSpecialty] = useState<string>(
    user.specialty
      ? isPresetSpecialty
        ? user.specialty
        : "Outra / Personalizada"
      : "Musculação & Hipertrofia"
  );
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState<string>(
    user.specialty && !isPresetSpecialty ? user.specialty : ""
  );
  const [cref, setCref] = useState(user.cref || "");
  const [bio, setBio] = useState(user.bio || "");
  const [basicPrice, setBasicPrice] = useState(user.pricing?.basicMonthly || 35);
  const [proPrice, setProPrice] = useState(user.pricing?.proMonthly || 45);
  const [vipPrice, setVipPrice] = useState(user.pricing?.vipMonthly || 55);

  // Configurador de Planos, Frequências, Horas e Modalidades do Coach
  const [coachPlans, setCoachPlans] = useState<CoachPlanOption[]>(() => {
    if (user.coachPlans && user.coachPlans.length > 0) {
      return user.coachPlans;
    }
    const stored = getStoredCoachPlans();
    return stored && stored.length > 0 ? stored : DEFAULT_COACH_PLANS;
  });
  const [activePlanIndex, setActivePlanIndex] = useState<number>(0);
  const [newModalityInput, setNewModalityInput] = useState<string>("");
  const [showAddModalityInput, setShowAddModalityInput] = useState<boolean>(false);

  // Configuração de PIX do Personal Trainer
  const [pixKeyType, setPixKeyType] = useState<"phone" | "cpf" | "cnpj" | "email" | "random">(
    (user.pixKeyType as any) || "phone"
  );
  const [pixKey, setPixKey] = useState<string>(user.pixKey || "");
  const [pixName, setPixName] = useState<string>(user.pixName || "");
  const [pixBank, setPixBank] = useState<string>(user.pixBank || "");

  // Termos & LGPD (Passo 5)
  const [termsAccepted, setTermsAccepted] = useState(Boolean(user.termsAccepted));
  const [hasReadTermsToBottom, setHasReadTermsToBottom] = useState(Boolean(user.termsAccepted));
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Estados de Imagem
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de submissão
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincroniza com o usuário caso as props mudem
  useEffect(() => {
    setName(user.name || "");
    setAvatarUrl(user.avatarUrl || "");
    setAvatarImgError(false);
    setPhone(formatPhone(user.phone || ""));
    setRole(user.activeRole || "student");
    if (user.state) setState(user.state);
    if (user.city) setCity(user.city);
    if (user.neighborhood) setNeighborhood(user.neighborhood);
    if (user.latitude !== undefined) setLatitude(user.latitude);
    if (user.longitude !== undefined) setLongitude(user.longitude);
    setLocationSuccess(Boolean(user.latitude && user.longitude));
    if (user.serviceModality) setServiceModality(user.serviceModality);
    if (user.operatingRadiusKm) setOperatingRadiusKm(user.operatingRadiusKm);
    if (user.location) setOperatingLocation(user.location);

    if (user.pixKeyType) setPixKeyType(user.pixKeyType as any);
    if (user.pixKey) setPixKey(user.pixKey);
    if (user.pixName) setPixName(user.pixName);
    if (user.pixBank) setPixBank(user.pixBank);

    if (user.goal) {
      const isPreset = ["Hipertrofia", "Emagrecimento", "Força & Performance", "Condicionamento Geral"].includes(
        user.goal
      );
      if (isPreset) {
        setGoal(user.goal);
        setCustomGoalInput("");
      } else {
        setGoal("Personalizado");
        setCustomGoalInput(user.goal);
      }
    }
    if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
    if (user.weight) setWeight(String(user.weight));
    if (user.height) setHeight(String(user.height));
    if (user.cref) setCref(user.cref);

    if (user.specialty) {
      const isPreset = SPECIALTY_OPTIONS.filter((s) => s !== "Outra / Personalizada").includes(user.specialty);
      if (isPreset) {
        setSpecialty(user.specialty);
        setCustomSpecialtyInput("");
      } else {
        setSpecialty("Outra / Personalizada");
        setCustomSpecialtyInput(user.specialty);
      }
    }
    if (user.bio) setBio(user.bio);
    if (user.pricing?.basicMonthly) setBasicPrice(user.pricing.basicMonthly);
    if (user.pricing?.proMonthly) setProPrice(user.pricing.proMonthly);
    if (user.pricing?.vipMonthly) setVipPrice(user.pricing.vipMonthly);
    if (user.coachPlans && user.coachPlans.length > 0) {
      setCoachPlans(user.coachPlans);
    } else {
      const stored = getStoredCoachPlans();
      if (stored && stored.length > 0) setCoachPlans(stored);
    }
    if (user.termsAccepted) {
      setTermsAccepted(true);
      setHasReadTermsToBottom(true);
    }
  }, [user]);

  // Trava scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // Fecha modal com Escape se onClose for permitido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose && !showTermsModal && !isLoading && !isSuccess) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showTermsModal, isLoading, isSuccess]);

  if (!isOpen) return null;

  // Processamento e conversão de foto para WebP com validação binária anti-hacking
  const processUploadedFile = async (file: File) => {
    setIsProcessingImage(true);
    setErrorMessage(null);

    try {
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || "Arquivo de imagem inválido.");
        triggerHaptic("warning");
        setIsProcessingImage(false);
        return;
      }

      const compressed = await processAndCompressImageToWebP(file, {
        maxDimension: 400,
        quality: 0.82,
      });

      setAvatarUrl(compressed.dataUrl);
      setAvatarImgError(false);
      triggerHaptic("success");
    } catch (err: any) {
      console.error("Erro no processamento da imagem:", err);
      setErrorMessage(err?.message || "Não foi possível processar a imagem. Tente outro arquivo.");
      triggerHaptic("warning");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessingImage) {
      setIsDraggingImage(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    if (isProcessingImage) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      triggerHaptic("selection");
      await processUploadedFile(file);
    }
  };

  // Detecção de geolocalização via API com geocodificação reversa
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocalização não suportada no seu navegador. Você pode preencher sua cidade e estado manualmente abaixo.");
      triggerHaptic("warning");
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);
    triggerHaptic("selection");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!isValidCoordinate(lat, lng)) {
          setIsLocating(false);
          setLocationNotice("Coordenadas de GPS inválidas. Preencha sua região manualmente.");
          triggerHaptic("warning");
          return;
        }

        setLatitude(lat);
        setLongitude(lng);
        setLocationSuccess(true);
        triggerHaptic("success");

        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo && (geo.city || geo.state)) {
            if (geo.city) setCity(geo.city);
            if (geo.state) setState(geo.state);
            if (geo.neighborhood) setNeighborhood(geo.neighborhood);
            const detectedLabel = [geo.neighborhood, geo.city, geo.state].filter(Boolean).join(" - ");
            setLocationNotice(
              `📍 Localização identificada: ${detectedLabel}. Se algo estiver incorreto, você pode corrigir nos campos abaixo.`
            );
          } else {
            setLocationNotice("📍 GPS ativo com sucesso! Por favor, confirme ou preencha sua cidade e estado abaixo.");
          }
        } catch {
          setLocationNotice("📍 GPS ativo! Confirme sua cidade e estado abaixo.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Não foi possível obter sua localização. Por favor, preencha manualmente.";
        if (err.code === 1) {
          msg = "Permissão de localização não concedida. Preencha sua cidade e estado manualmente.";
        } else if (err.code === 2) {
          msg = "Sinal de GPS indisponível no momento. Preencha sua cidade e estado manualmente.";
        } else if (err.code === 3) {
          msg = "Tempo esgotado ao buscar sinal do GPS. Preencha sua cidade manualmente.";
        }
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

  // Validação e Avanço entre Passos
  const handleNextStep = () => {
    setErrorMessage(null);

    // Validação Passo 1: Nome e WhatsApp
    if (currentStep === 1) {
      const trimmedName = sanitizeInput(name.trim());
      if (trimmedName.length < 2) {
        setErrorMessage("Por favor, informe seu nome completo com pelo menos 2 letras.");
        triggerHaptic("warning");
        return;
      }

      let rawPhone = phone.replace(/\D/g, "");
      if (rawPhone.length > 11 && rawPhone.startsWith("55")) rawPhone = rawPhone.slice(2);
      if (rawPhone.length < 10) {
        setErrorMessage("WhatsApp obrigatório: informe seu DDD com o número (mínimo 10 dígitos).");
        triggerHaptic("warning");
        return;
      }
      const ddd = parseInt(rawPhone.slice(0, 2), 10);
      if (ddd < 11 || ddd > 99) {
        setErrorMessage("DDD inválido. Informe um DDD brasileiro válido (ex: 11, 21, 31, 81...).");
        triggerHaptic("warning");
        return;
      }
    }

    // Validação Passo 2: Papel
    if (currentStep === 2) {
      if (!role) {
        setErrorMessage("Selecione se você é Aluno(a) ou Personal Trainer para prosseguir.");
        triggerHaptic("warning");
        return;
      }
    }

    // Validação Passo 3: Localização
    if (currentStep === 3) {
      const sanitizedCity = sanitizeInput(city.trim());
      if (!sanitizedCity || sanitizedCity.length < 2) {
        setErrorMessage("Por favor, informe sua Cidade para encontrar ou atender pessoas próximas.");
        triggerHaptic("warning");
        return;
      }
      if (!state.trim()) {
        setErrorMessage("Por favor, selecione seu Estado (UF).");
        triggerHaptic("warning");
        return;
      }
    }

    // Validação Passo 4: Metas / Especialidade
    if (currentStep === 4) {
      if (role === "student") {
        if (goal === "Personalizado" && (!customGoalInput || customGoalInput.trim().length < 2)) {
          setErrorMessage("Por favor, digite seu objetivo de treino personalizado.");
          triggerHaptic("warning");
          return;
        }
        if (!experienceLevel) {
          setErrorMessage("Por favor, selecione seu nível de experiência com musculação.");
          triggerHaptic("warning");
          return;
        }
      } else {
        const finalSpec =
          specialty === "Outra / Personalizada"
            ? sanitizeInput(customSpecialtyInput.trim())
            : sanitizeInput(specialty.trim());

        if (!finalSpec || finalSpec.length < 2) {
          setErrorMessage("Por favor, selecione ou descreva sua especialidade profissional.");
          triggerHaptic("warning");
          return;
        }
      }
    }

    triggerHaptic("selection");
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    triggerHaptic("light");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Gestão de Planos e Serviços do Coach
  const activePlan = coachPlans[activePlanIndex] || coachPlans[0] || DEFAULT_COACH_PLANS[0];

  const updateActivePlan = (updates: Partial<CoachPlanOption>) => {
    setCoachPlans((prev) => {
      const next = [...prev];
      if (next[activePlanIndex]) {
        next[activePlanIndex] = { ...next[activePlanIndex], ...updates };
      }
      return next;
    });
  };

  const togglePlanModality = (modalityName: string) => {
    if (!activePlan) return;
    const currentMods = activePlan.modalities || [];
    const exists = currentMods.includes(modalityName);
    const nextMods = exists
      ? currentMods.filter((m) => m !== modalityName)
      : [...currentMods, modalityName];
    updateActivePlan({ modalities: nextMods });
    triggerHaptic("selection");
  };

  const handleAddCustomModality = () => {
    const trimmed = sanitizeInput(newModalityInput.trim());
    if (!trimmed) return;
    if (!activePlan) return;
    const currentMods = activePlan.modalities || [];
    if (!currentMods.includes(trimmed)) {
      updateActivePlan({ modalities: [...currentMods, trimmed] });
    }
    setNewModalityInput("");
    setShowAddModalityInput(false);
    triggerHaptic("success");
  };

  const handleRemoveCustomModality = (modalityName: string) => {
    if (!activePlan) return;
    const currentMods = activePlan.modalities || [];
    updateActivePlan({ modalities: currentMods.filter((m) => m !== modalityName) });
    triggerHaptic("light");
  };

  const handleAddNewPlan = () => {
    const nextNum = coachPlans.length + 1;
    const newPlan: CoachPlanOption = {
      id: `plan_custom_${Date.now()}`,
      name: `Plano Custom ${nextNum}`,
      price: 50,
      period: "mensal",
      frequency: "3x na semana",
      duration: "1h / aula",
      modalities: ["Musculação", "Treinamento Funcional"],
      description: "Plano sob medida com acompanhamento e foco em resultados.",
      isCustom: true,
    };
    const nextPlans = [...coachPlans, newPlan];
    setCoachPlans(nextPlans);
    setActivePlanIndex(nextPlans.length - 1);
    triggerHaptic("success");
  };

  const handleRemoveActivePlan = (indexToRemove: number) => {
    if (coachPlans.length <= 1) return;
    const nextPlans = coachPlans.filter((_, idx) => idx !== indexToRemove);
    setCoachPlans(nextPlans);
    setActivePlanIndex((prev) => Math.max(0, Math.min(prev, nextPlans.length - 1)));
    triggerHaptic("light");
  };

  // Submissão Final (Passo 5)
  const handleSubmitFinal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted || !hasReadTermsToBottom) {
      setErrorMessage("É obrigatório abrir, ler até o final e concordar com os Termos de Uso e Proteção de Dados LGPD.");
      triggerHaptic("warning");
      setShowTermsModal(true);
      return;
    }

    const trimmedName = sanitizeInput(name.trim());
    let rawPhoneDigits = phone.replace(/\D/g, "");
    if (rawPhoneDigits.length > 11 && rawPhoneDigits.startsWith("55")) {
      rawPhoneDigits = rawPhoneDigits.slice(2);
    }
    rawPhoneDigits = rawPhoneDigits.slice(0, 11);

    const sanitizedCity = sanitizeInput(city.trim());
    const sanitizedState = sanitizeInput(state.trim().toUpperCase());
    const sanitizedNeighborhood = sanitizeInput(neighborhood.trim());
    const sanitizedLocation = sanitizeInput(operatingLocation.trim());

    const finalGoal =
      role === "student"
        ? goal === "Personalizado"
          ? sanitizeInput(customGoalInput.trim()) || "Condicionamento Geral"
          : goal
        : user.goal || "Hipertrofia";

    const finalSpecialty =
      role === "coach"
        ? specialty === "Outra / Personalizada"
          ? sanitizeInput(customSpecialtyInput.trim()) || "Personal Trainer"
          : sanitizeInput(specialty.trim())
        : user.specialty;

    const parsedWeight = weight ? parseFloat(weight.replace(",", ".")) : undefined;
    let parsedHeight = height ? parseFloat(height.replace(",", ".")) : undefined;

    if (parsedHeight && parsedHeight > 0.5 && parsedHeight < 3.0) {
      parsedHeight = Math.round(parsedHeight * 100);
    }

    setIsLoading(true);

    try {
      const validCoords = isValidCoordinate(latitude, longitude);

      const primaryBasic = coachPlans[0]?.price || basicPrice || 35;
      const primaryPro = coachPlans[1]?.price || proPrice || 45;
      const primaryVip = coachPlans[2]?.price || vipPrice || 55;

      const pricingObj = {
        basicMonthly: Number(primaryBasic) || 35,
        proMonthly: Number(primaryPro) || 45,
        vipMonthly: Number(primaryVip) || 55,
        dailySession: Number(primaryBasic) || 35,
        weeklyPlan: Number(primaryPro) || 45,
        monthlyPlan: Number(primaryVip) || 55,
      };

      if (role === "coach") {
        saveCoachPlans(coachPlans);
      }

      const rawPhoneDigits = phone.replace(/\D/g, "");
      const formattedPhone = rawPhoneDigits.length >= 10 ? formatPhone(rawPhoneDigits) : user.phone || phone;

      const updatedUserPayload: UserProfile = {
        ...user,
        id: user.id,
        email: user.email,
        name: trimmedName,
        avatarUrl: avatarUrl || undefined,
        phone: formattedPhone || undefined,
        activeRole: role,
        enabledRoles:
          role === "coach"
            ? ["coach", "student"]
            : user.enabledRoles?.includes("coach")
            ? ["student", "coach"]
            : ["student"],
        city: sanitizedCity,
        state: sanitizedState,
        neighborhood: sanitizedNeighborhood || undefined,
        latitude: validCoords ? latitude : undefined,
        longitude: validCoords ? longitude : undefined,
        location:
          role === "coach" && sanitizedLocation
            ? sanitizedLocation
            : `${sanitizedCity} - ${sanitizedState}`,
        operatingRadiusKm: role === "coach" ? operatingRadiusKm : undefined,
        serviceModality: role === "coach" ? serviceModality : undefined,
        goal: finalGoal,
        experienceLevel: role === "student" ? experienceLevel : user.experienceLevel || "Avançado",
        weight: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : user.weight,
        height: parsedHeight && !isNaN(parsedHeight) ? parsedHeight : user.height,
        cref: role === "coach" ? sanitizeInput(cref.trim().toUpperCase()) || undefined : user.cref,
        specialty: finalSpecialty,
        bio: role === "coach" ? sanitizeInput(bio.trim()) : user.bio,
        pricing: role === "coach" ? pricingObj : user.pricing,
        coachPlans: role === "coach" ? coachPlans : user.coachPlans,
        pixKey: role === "coach" ? sanitizeInput(pixKey.trim()) || undefined : user.pixKey,
        pixKeyType: role === "coach" ? pixKeyType : user.pixKeyType,
        pixName: role === "coach" ? sanitizeInput(pixName.trim()) || undefined : user.pixName,
        pixBank: role === "coach" ? sanitizeInput(pixBank.trim()) || undefined : user.pixBank,
        profileCompleted: true,
        termsAccepted: true,
        termsAcceptedAt: user.termsAcceptedAt || new Date().toISOString(),
        subscriptionStatus:
          role === "coach"
            ? "active"
            : user.subscriptionStatus === "active" && user.subscriptionPlan
            ? "active"
            : user.subscriptionStatus === "trial" && user.trialEndsAt
            ? "trial"
            : "pending_choice",
        subscriptionPlan:
          role === "coach"
            ? "coach_unlimited"
            : user.subscriptionStatus === "active" || user.subscriptionStatus === "trial"
            ? user.subscriptionPlan
            : undefined,
        trialEndsAt:
          role === "coach"
            ? undefined
            : user.subscriptionStatus === "trial"
            ? user.trialEndsAt
            : undefined,
        planTier:
          role === "coach"
            ? undefined
            : user.subscriptionStatus === "active" || user.subscriptionStatus === "trial"
            ? user.planTier
            : undefined,
      };

      // 1. Atualiza metadados no Supabase Auth
      const client = getSupabase();
      if (client) {
        const safeAvatarMeta =
          updatedUserPayload.avatarUrl && updatedUserPayload.avatarUrl.length > 2048
            ? undefined
            : updatedUserPayload.avatarUrl;

        client.auth.updateUser({
          data: {
            name: updatedUserPayload.name,
            phone: updatedUserPayload.phone,
            role: updatedUserPayload.activeRole,
            city: updatedUserPayload.city,
            state: updatedUserPayload.state,
            neighborhood: updatedUserPayload.neighborhood,
            latitude: updatedUserPayload.latitude,
            longitude: updatedUserPayload.longitude,
            location: updatedUserPayload.location,
            operating_radius_km: updatedUserPayload.operatingRadiusKm,
            service_modality: updatedUserPayload.serviceModality,
            goal: updatedUserPayload.goal,
            experience_level: updatedUserPayload.experienceLevel,
            cref: updatedUserPayload.cref,
            specialty: updatedUserPayload.specialty,
            bio: updatedUserPayload.bio,
            pix_key: updatedUserPayload.pixKey,
            pix_key_type: updatedUserPayload.pixKeyType,
            pix_name: updatedUserPayload.pixName,
            ...(safeAvatarMeta ? { avatar_url: safeAvatarMeta } : {}),
            profile_completed: true,
            terms_accepted: true,
            terms_accepted_at: updatedUserPayload.termsAcceptedAt,
          },
        }).catch(() => {});
      }

      // 2. Salva no banco PostgreSQL (profiles)
      await saveProfileToSupabase(updatedUserPayload);

      // 3. Salva no auth store local
      saveUserProfile(updatedUserPayload);

      // 4. Se for professor, atualiza perfil público no marketplace
      if (role === "coach") {
        updateCoachPublicProfile(user.id || "coach_me", {
          name: updatedUserPayload.name,
          cref: updatedUserPayload.cref,
          specialty: updatedUserPayload.specialty || "Personal Trainer",
          bio: updatedUserPayload.bio || "",
          phone: updatedUserPayload.phone || "",
          avatarUrl: updatedUserPayload.avatarUrl,
          location: updatedUserPayload.location || `${sanitizedCity} - ${sanitizedState}`,
          city: sanitizedCity,
          state: sanitizedState,
          neighborhood: sanitizedNeighborhood,
          latitude: validCoords ? latitude : undefined,
          longitude: validCoords ? longitude : undefined,
          serviceModality: updatedUserPayload.serviceModality,
          operatingRadiusKm: updatedUserPayload.operatingRadiusKm,
          coachPlans: coachPlans,
          pricing: pricingObj,
          pixKey: updatedUserPayload.pixKey,
          pixKeyType: updatedUserPayload.pixKeyType,
          pixName: updatedUserPayload.pixName,
          pixBank: updatedUserPayload.pixBank,
        });
      } else {
        // Se for aluno, cadastra na lista local de alunos vinculando o ID real
        saveNewStudent({
          id: updatedUserPayload.id,
          name: updatedUserPayload.name,
          email: updatedUserPayload.email,
          phone: updatedUserPayload.phone,
          goal: finalGoal,
          plan: "App GymFlow Pro",
          age: 26,
          avatarUrl: updatedUserPayload.avatarUrl,
          isOfflineStudent: false,
        });
      }

      // 5. Notifica eventos globais de atualização
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("gymflow:auth-changed"));
      }

      // 6. Confetes e transição imediata para o app
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setIsSuccess(true);
      triggerHaptic("success");

      setTimeout(() => {
        setIsLoading(false);
        if (onClose) onClose();
        onComplete(updatedUserPayload);
      }, 700);
    } catch (err: any) {
      console.error("Erro ao salvar dados de personalização:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao salvar seu perfil. Tente novamente.");
      triggerHaptic("warning");
      setIsLoading(false);
    }
  };

  const isCoach = role === "coach";

  const stepLabels = [
    { number: 1, title: "Perfil" },
    { number: 2, title: "Papel" },
    { number: 3, title: "Região" },
    { number: 4, title: isCoach ? "Especialidade" : "Treinos" },
    { number: 5, title: "Concluir" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800/90 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* CABEÇALHO DO WIZARD: STEPPER & PROGRESSO */}
        {/* ================================================================= */}
        <div className="px-5 pt-4 pb-3 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isCoach ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {currentStep}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                  {currentStep === 1 && "Foto & Dados Básicos"}
                  {currentStep === 2 && "Como você usará o GymFlow?"}
                  {currentStep === 3 && (isCoach ? "Área de Atendimento" : "Localização & Região")}
                  {currentStep === 4 && (isCoach ? "Especialidade & Apresentação" : "Objetivo & Nível de Treino")}
                  {currentStep === 5 && "Revisão & Termos"}
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Passo {currentStep} de {TOTAL_STEPS} • {stepLabels[currentStep - 1]?.title}
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading || isSuccess}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {stepLabels.map((s) => {
              const isDone = s.number < currentStep;
              const isCurrent = s.number === currentStep;
              return (
                <div key={s.number} className="flex flex-col gap-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isDone
                        ? isCoach
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : isCurrent
                        ? isCoach
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                        : "bg-zinc-800"
                    }`}
                  />
                  <span
                    className={`text-[9px] text-center hidden xs:block font-medium truncate ${
                      isCurrent
                        ? isCoach
                          ? "text-amber-300"
                          : "text-emerald-300"
                        : isDone
                        ? "text-zinc-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CORPO DINÂMICO DO PASSO ATUAL (COM SCROLL INTERNO) */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs sm:text-sm">
          {/* Alerta de erro caso validação falhe */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSO 1: FOTO DE PERFIL, NOME E WHATSAPP */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Adicione sua foto e confirme seu WhatsApp para receber lembretes de treinos e notificações.
              </p>

              {/* Upload de Imagem com WebP */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Foto de Perfil <span className="text-zinc-500 text-[10px] font-normal">(opcional)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 flex items-center justify-center shrink-0 group shadow-lg ${
                      isDraggingImage
                        ? "border-emerald-400 scale-105 bg-emerald-500/20"
                        : avatarUrl
                        ? "border-emerald-500/50 hover:border-emerald-400 bg-zinc-950"
                        : "border-dashed border-zinc-700 hover:border-emerald-500/60 bg-zinc-900/80"
                    }`}
                  >
                    {avatarUrl && !avatarImgError ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        onError={() => setAvatarImgError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <User className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    )}

                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                      <span className="text-[9px] font-bold mt-0.5">Trocar</span>
                    </div>

                    {isProcessingImage && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-emerald-400 text-[10px] font-bold">
                        <Loader2 className="w-5 h-5 animate-spin mb-1" />
                        <span>Carregando...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all flex items-center gap-1.5 border border-zinc-700"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar do Dispositivo</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl("");
                          }}
                          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Formatos aceitos: JPG, PNG ou WebP (até 5MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome Completo */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  Nome Completo <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  maxLength={80}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* WhatsApp com DDD */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  WhatsApp com DDD <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Utilizado para lembretes de treinos e acompanhamento.
                </p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSO 2: ESCOLHA DO PAPEL (ALUNO vs PERSONAL TRAINER) */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Selecione o modo de uso da sua conta. O cadastro será adaptado exclusivamente para a sua escolha.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opção Aluno */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("student");
                    triggerHaptic("selection");
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group active:scale-[0.98] flex flex-col justify-between min-h-[140px] ${
                    role === "student"
                      ? "bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10 text-white"
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        role === "student" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    {role === "student" && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-3">
                    <h3 className="font-bold text-sm text-white">Sou Aluno(a)</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Quero treinar, seguir fichas interativas, acompanhar minha evolução corporal e encontrar personais.
                    </p>
                  </div>
                </button>

                {/* Opção Personal Trainer */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("coach");
                    triggerHaptic("selection");
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group active:scale-[0.98] flex flex-col justify-between min-h-[140px] ${
                    role === "coach"
                      ? "bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10 text-white"
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        role === "coach" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    {role === "coach" && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-3">
                    <h3 className="font-bold text-sm text-white">Sou Personal Trainer</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Quero prescrever treinos para meus alunos, gerenciar minha agenda e planos de atendimento.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSO 3: LOCALIZAÇÃO & REGIÃO GEOGRÁFICA */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isCoach
                  ? "Informe onde você atende. Seu perfil será exibido com prioridade para alunos que buscam personais na sua cidade ou proximidades."
                  : "Sua localização é utilizada para encontrar Personal Trainers e academias mais próximas de você por proximidade em tempo real."}
              </p>

              {/* Botão de Localização Automática via GPS */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 border ${
                    locationSuccess
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10"
                      : isCoach
                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Identificando cidade e estado...</span>
                    </>
                  ) : locationSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Localização GPS Ativa</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Usar Minha Localização Atual</span>
                    </>
                  )}
                </button>

                {locationSuccess && (
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(undefined);
                      setLongitude(undefined);
                      setLocationSuccess(false);
                      setLocationNotice(null);
                      triggerHaptic("light");
                    }}
                    className="text-[10px] text-zinc-500 hover:text-rose-400 underline transition-colors px-1"
                  >
                    Desativar GPS
                  </button>
                )}
              </div>

              {locationNotice && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in ${
                    locationSuccess
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="flex-1 text-[11px] leading-relaxed">{locationNotice}</span>
                </div>
              )}

              {/* Grid: Estado e Cidade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-zinc-300">
                    Estado (UF) <span className={isCoach ? "text-amber-400" : "text-emerald-400"}>*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    {BRAZIL_STATES.map((s) => (
                      <option key={s.uf} value={s.uf}>
                        {s.uf} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-zinc-300">
                    Cidade <span className={isCoach ? "text-amber-400" : "text-emerald-400"}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo, Rio de Janeiro, Curitiba..."
                    maxLength={80}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Bairro / Região */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Bairro / Região <span className="text-zinc-500 text-[10px] font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Jardins, Copacabana, Savassi, Batel..."
                  maxLength={80}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Configurações exclusivas para Personal Trainer */}
              {isCoach && (
                <div className="pt-2 border-t border-amber-500/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-amber-300">
                        Modalidade de Atendimento
                      </label>
                      <select
                        value={serviceModality}
                        onChange={(e) => setServiceModality(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="presencial">Presencial (na minha região)</option>
                        <option value="online">100% Online (Consultoria Remota)</option>
                        <option value="hibrido">Híbrido (Presencial + Online)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-amber-300">
                        Raio Máximo de Deslocamento
                      </label>
                      <select
                        value={operatingRadiusKm}
                        onChange={(e) => setOperatingRadiusKm(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value={5}>Até 5 km de distância</option>
                        <option value={10}>Até 10 km de distância</option>
                        <option value={15}>Até 15 km de distância</option>
                        <option value={25}>Até 25 km de distância</option>
                        <option value={50}>Até 50 km de distância</option>
                        <option value={100}>Até 100 km (Toda a Região Metropolitana)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSO 4 (ALUNO): OBJETIVO, NÍVEL E DADOS CORPORAIS */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 4 && !isCoach && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Seleção do Objetivo Principal */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Objetivo Principal <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((g) => {
                    const Icon = g.icon;
                    const isSelected = goal === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => {
                          setGoal(g.value);
                          triggerHaptic("selection");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 active:scale-[0.98] ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500 shadow-sm shadow-emerald-500/10 text-white"
                            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <span className={`block text-xs font-bold ${isSelected ? "text-white" : "text-zinc-200"}`}>
                            {g.label}
                          </span>
                          <span className="block text-[10px] text-zinc-400 leading-tight">
                            {g.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Input para Objetivo Personalizado */}
                {goal === "Personalizado" && (
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-emerald-500/40 space-y-1.5 animate-in fade-in">
                    <label className="block text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Especifique seu Objetivo Personalizado *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customGoalInput}
                      onChange={(e) => setCustomGoalInput(e.target.value)}
                      placeholder="Ex: Treino para TAF militar, Calistenia, Maratona, Reabilitação de joelho..."
                      maxLength={80}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Nível de Experiência */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Nível de Experiência <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_OPTIONS.map((exp) => {
                    const isSelected = experienceLevel === exp.value;
                    return (
                      <button
                        key={exp.value}
                        type="button"
                        onClick={() => {
                          setExperienceLevel(exp.value);
                          triggerHaptic("selection");
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                          isSelected
                            ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span className="block text-xs font-bold">{exp.label}</span>
                        <span className={`block text-[9px] mt-0.5 ${isSelected ? "text-zinc-900" : "text-zinc-500"}`}>
                          {exp.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dados Corporais Iniciais (Opcional) */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dados Corporais Iniciais</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal lowercase">(opcional)</span>
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Peso Atual (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="250"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Ex: 74.5"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="100"
                      max="240"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Ex: 175"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSO 4 (PROFESSOR): ESPECIALIDADE, CREF, BIO E PLANOS/SERVIÇOS */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 4 && isCoach && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Especialidade Principal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-amber-300">
                  Especialidade Principal <span className="text-amber-400">*</span>
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {SPECIALTY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {specialty === "Outra / Personalizada" && (
                  <div className="pt-1.5 animate-in fade-in">
                    <input
                      type="text"
                      required
                      value={customSpecialtyInput}
                      onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                      placeholder="Digite sua especialidade (ex: Preparação de Atletas, Pilates...)"
                      maxLength={60}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Registro CREF & Apresentação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Registro Profissional (CREF)</span>
                    <span className="text-[9px] text-zinc-500 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={cref}
                    onChange={(e) => setCref(e.target.value.toUpperCase())}
                    placeholder="Ex: 08412-G/SP"
                    maxLength={30}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-zinc-300">
                    Metodologia / Bio <span className="text-zinc-500 text-[9px] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Metodologia e estilo de treino..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* CONFIGURADOR DINÂMICO DE PLANOS & SERVIÇOS DO PERSONAL */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/30 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">
                        Seus Planos e Aulas de Atendimento
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        Personalize os valores, frequência semanal e o que está incluso em cada plano.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewPlan}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm shadow-amber-500/20 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Criar Novo Plano</span>
                  </button>
                </div>

                {/* 1. SELETOR DE PLANO (ABAS COM ALTO CONTRASTE) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    1. Escolha o plano para editar:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {coachPlans.map((p, idx) => {
                      const isSelected = idx === activePlanIndex;
                      return (
                        <button
                          key={p.id || idx}
                          type="button"
                          onClick={() => {
                            setActivePlanIndex(idx);
                            triggerHaptic("selection");
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border shrink-0 flex items-center gap-2 ${
                            isSelected
                              ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30 scale-[1.02]"
                              : "bg-zinc-950/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{p.name || `Plano ${idx + 1}`}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isSelected ? "bg-zinc-950 text-amber-400 font-bold" : "bg-zinc-800 text-amber-300 font-semibold"}`}>
                            R${p.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editor do Plano Ativo */}
                {activePlan && (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3.5 animate-in fade-in duration-150">
                    {/* 2. NOME E PREÇO */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        2. Identificação e Preço Mensal:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-300 block">Nome do Plano</label>
                          <input
                            type="text"
                            maxLength={45}
                            value={activePlan.name}
                            onChange={(e) => updateActivePlan({ name: e.target.value })}
                            placeholder="Ex: Mensal Pro, Corrida & Hipertrofia..."
                            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-amber-300 block">Valor Mensal (R$)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                              R$
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={9999}
                              value={activePlan.price}
                              onChange={(e) => updateActivePlan({ price: Number(e.target.value) || 0 })}
                              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-xs font-mono font-black text-white focus:outline-none focus:border-amber-400 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. FREQUÊNCIA (AULAS SEMANAIS) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>3. Aulas Semanais / Frequência:</span>
                        </label>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {activePlan.frequency || "2x na semana"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {FREQUENCY_OPTIONS.map((freq) => {
                          const isSelected = activePlan.frequency === freq;
                          return (
                            <button
                              key={freq}
                              type="button"
                              onClick={() => {
                                updateActivePlan({ frequency: freq });
                                triggerHaptic("selection");
                              }}
                              className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 ${
                                isSelected
                                  ? "bg-amber-500 text-zinc-950 font-black border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40"
                                  : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3] text-zinc-950" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                              )}
                              <span>{freq}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. DURAÇÃO DA AULA / HORAS POR DIA */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>4. Duração de Cada Aula:</span>
                        </label>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {activePlan.duration || "1h / aula"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {DURATION_OPTIONS.map((dur) => {
                          const isSelected = activePlan.duration === dur;
                          return (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => {
                                updateActivePlan({ duration: dur });
                                triggerHaptic("selection");
                              }}
                              className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 ${
                                isSelected
                                  ? "bg-amber-500 text-zinc-950 font-black border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40"
                                  : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3] text-zinc-950" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                              )}
                              <span>{dur}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. MODALIDADES INCLUSAS COM ALTO CONTRASTE */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                          <span>5. Modalidades e Atividades Inclusas:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddModalityInput(!showAddModalityInput)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Outra Atividade</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {AVAILABLE_MODALITIES.map((mod) => {
                          const isChecked = (activePlan.modalities || []).includes(mod.id);
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => togglePlanModality(mod.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
                                isChecked
                                  ? "bg-amber-500 text-zinc-950 font-black border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40"
                                  : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                              }`}
                            >
                              <span>{mod.icon}</span>
                              <span>{mod.label}</span>
                              {isChecked ? (
                                <Check className="w-3.5 h-3.5 stroke-[3] ml-0.5 text-zinc-950" />
                              ) : (
                                <Plus className="w-3 h-3 ml-0.5 text-zinc-500" />
                              )}
                            </button>
                          );
                        })}

                        {/* Modalidades customizadas adicionadas pelo personal */}
                        {(activePlan.modalities || [])
                          .filter((m) => !AVAILABLE_MODALITIES.some((am) => am.id === m))
                          .map((customMod) => (
                            <span
                              key={customMod}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-amber-500 text-zinc-950 border border-amber-400 flex items-center gap-1.5 shadow-sm"
                            >
                              <span>🎯</span>
                              <span>{customMod}</span>
                              <Check className="w-3 h-3 stroke-[3]" />
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomModality(customMod)}
                                className="hover:bg-zinc-950/20 rounded p-0.5 ml-0.5 text-zinc-950"
                                title="Remover modalidade"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                      </div>

                      {/* Input para adicionar nova modalidade personalizada */}
                      {showAddModalityInput && (
                        <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                          <input
                            type="text"
                            value={newModalityInput}
                            onChange={(e) => setNewModalityInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCustomModality();
                              }
                            }}
                            placeholder="Ex: Pilates, Calistenia, Cross..."
                            maxLength={30}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomModality}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs hover:bg-amber-400 transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Descrição curta / Benefício */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        6. Destaque / Descrição do Plano:
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={activePlan.description || ""}
                        onChange={(e) => updateActivePlan({ description: e.target.value })}
                        placeholder="Ex: Treino essencial com foco biomecânico e acompanhamento direto"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    {/* 7. PRÉVIA EM TEMPO REAL PARA O ALUNO (WYSIWYG) */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <span>👁️ Prévia em Tempo Real (Como o Aluno Verá)</span>
                        </span>
                        <span className="text-[9px] text-zinc-500">Atualizado ao vivo</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/30 shadow-md flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white truncate">
                              {activePlan.name || "Nome do Plano"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {activePlan.frequency || "2x na semana"}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">
                            {activePlan.description || "Acompanhamento profissional sob medida."}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {(activePlan.modalities || ["Musculação"]).map((m) => (
                              <span
                                key={m}
                                className="text-[9px] text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5 text-amber-400 stroke-[3]" />
                                <span>{m}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-sm font-black font-mono text-amber-400">
                            R$ {activePlan.price}
                          </span>
                          <span className="block text-[9px] text-zinc-500 uppercase font-semibold">
                            /mês
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Excluir Plano (se houver mais de 1) */}
                    {coachPlans.length > 1 && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveActivePlan(activePlanIndex)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir este plano</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* 8. CONFIGURAÇÃO DA CHAVE PIX DO PERSONAL TRAINER */}
                {/* --------------------------------------------------------- */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💳</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">Chave PIX para Recebimentos</h4>
                        <p className="text-[10px] text-zinc-400">
                          Seus alunos verão esta chave ao realizarem pagamentos de planos
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase">
                      Configurável
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Tipo de Chave */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { type: "phone", label: "📱 Celular / WhatsApp" },
                        { type: "cpf", label: "📄 CPF" },
                        { type: "cnpj", label: "🏢 CNPJ" },
                        { type: "email", label: "✉️ E-mail" },
                        { type: "random", label: "🔑 Aleatória (EVP)" },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            triggerHaptic("selection");
                            setPixKeyType(item.type as any);
                            if (item.type === "phone" && !pixKey) {
                              setPixKey(phone);
                            } else if (item.type === "email" && !pixKey) {
                              setPixKey(user.email);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                            pixKeyType === item.type
                              ? "bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-sm"
                              : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Inputs da Chave e Titular */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Chave PIX:
                        </label>
                        <input
                          type="text"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder={
                            pixKeyType === "phone"
                              ? "(11) 99999-9999"
                              : pixKeyType === "cpf"
                              ? "000.000.000-00"
                              : pixKeyType === "cnpj"
                              ? "00.000.000/0001-00"
                              : pixKeyType === "email"
                              ? "seu-email@pix.com"
                              : "Chave aleatória UUID"
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Nome do Titular / Banco (opcional):
                        </label>
                        <input
                          type="text"
                          value={pixName}
                          onChange={(e) => setPixName(e.target.value)}
                          placeholder="Ex: Prof. Silva • Nubank"
                          maxLength={60}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSO 5: REVISÃO DOS DADOS E TERMOS DE SERVIÇO */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Confira o resumo das suas informações antes de concluir a personalização da sua conta:
              </p>

              {/* Resumo Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{name || "Seu Nome"}</h4>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCoach ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {isCoach ? "🎓 Personal Trainer" : "🏋️‍♂️ Aluno(a)"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800/60">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">WhatsApp:</span>
                    <span className="font-mono text-zinc-200 font-semibold">{phone || "--"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Localização:</span>
                    <span className="text-zinc-200 font-semibold truncate block">
                      {city ? `${city} - ${state}` : "Não informada"}
                    </span>
                  </div>

                  {role === "student" ? (
                    <>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Objetivo:</span>
                        <span className="text-emerald-400 font-semibold truncate block">
                          {goal === "Personalizado" ? customGoalInput || "Personalizado" : goal}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Nível:</span>
                        <span className="text-zinc-200 font-semibold">{experienceLevel}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Especialidade:</span>
                        <span className="text-amber-400 font-semibold truncate block">
                          {specialty === "Outra / Personalizada" ? customSpecialtyInput || "Personal Trainer" : specialty}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Chave PIX:</span>
                        <span className="font-mono text-amber-300 font-semibold truncate block">
                          {pixKey ? `${pixKey} (${pixKeyType.toUpperCase()})` : "Não configurada"}
                        </span>
                      </div>

                      {/* Resumo dos Planos do Coach */}
                      <div className="col-span-2 pt-2 border-t border-zinc-800/60 space-y-1.5">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                          Planos de Atendimento ({coachPlans.length}):
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {coachPlans.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-white block truncate">{p.name}</span>
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  {p.frequency || "Frequência livre"} • {p.duration || "1h / aula"}
                                  {p.modalities && p.modalities.length > 0 ? ` • ${p.modalities.join(", ")}` : ""}
                                </span>
                              </div>
                              <span className="font-mono font-black text-amber-400 text-xs shrink-0 ml-2">
                                R$ {p.price}/mês
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Termos de Uso e LGPD */}
              <div
                onClick={() => {
                  if (!hasReadTermsToBottom) {
                    triggerHaptic("selection");
                    setShowTermsModal(true);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all select-none space-y-2 cursor-pointer ${
                  termsAccepted && hasReadTermsToBottom
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                    : "bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasReadTermsToBottom) {
                        triggerHaptic("warning");
                        setShowTermsModal(true);
                      } else {
                        triggerHaptic("selection");
                        setTermsAccepted(!termsAccepted);
                      }
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      termsAccepted && hasReadTermsToBottom
                        ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm"
                        : "bg-zinc-950 border-zinc-700 hover:border-amber-400/80"
                    }`}
                  >
                    {termsAccepted && hasReadTermsToBottom && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        Termos de Uso & Proteção de Dados LGPD
                      </span>
                      {hasReadTermsToBottom ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>100% Lido & Aceito</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          <span>Ler obrigatório</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {hasReadTermsToBottom ? (
                        <span>
                          Concordo com os{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("light");
                              setShowTermsModal(true);
                            }}
                            className="text-emerald-400 underline hover:text-emerald-300 font-semibold"
                          >
                            Termos de Uso e Política de Privacidade & LGPD
                          </button>{" "}
                          do GymFlow para armazenamento seguro dos meus treinos e dados.
                        </span>
                      ) : (
                        <span className="text-amber-200/90 font-medium">
                          Clique aqui para abrir os termos. O botão de aceite só é liberado após você rolar e ler o documento até o final.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* RODAPÉ: BOTÕES DE NAVEGAÇÃO ENTRE PASSOS & CONTA CONECTADA */}
        {/* ================================================================= */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/60 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading || isSuccess}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNextStep}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-zinc-950 transition-all active:scale-95 shadow-md ${
                  isCoach
                    ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                    : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                }`}
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitFinal()}
                disabled={isLoading || isSuccess || !termsAccepted || !hasReadTermsToBottom}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-950 flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                  !termsAccepted || !hasReadTermsToBottom
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                    : isCoach
                    ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                    : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Perfil...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                    <span>Cadastro Concluído!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Concluir Cadastro & Começar</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Rodapé: Conta conectada com e-mail censurado e botão de logout */}
          {user?.email && user.id !== "user_me" && (
            <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-center gap-2 text-[11px] text-zinc-400 flex-wrap">
              <span>
                Conectado como{" "}
                <strong className="text-zinc-200 font-mono font-medium">
                  {maskEmail(user.email)}
                </strong>
              </span>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("warning");
                  logoutUser();
                  if (onClose) onClose();
                  window.location.reload();
                }}
                className="text-rose-400 hover:text-rose-300 hover:underline font-medium transition-colors inline-flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Termos de Serviço Completo */}
      {showTermsModal && (
        <TermsOfServiceModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={() => {
            setTermsAccepted(true);
            setHasReadTermsToBottom(true);
            setShowTermsModal(false);
            setErrorMessage(null);
          }}
          hasAlreadyAccepted={hasReadTermsToBottom}
        />
      )}
    </div>
  );
}
