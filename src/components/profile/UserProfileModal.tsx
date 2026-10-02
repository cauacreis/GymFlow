"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  GraduationCap,
  Dumbbell,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  ArrowRightLeft,
  DollarSign,
  FileText,
  Target,
  LogOut,
  Save,
  Instagram,
  MapPin,
  Scale,
  Ruler,
  Plus,
  AlertCircle,
  ArrowRight,
  Check,
  Navigation,
  Loader2,
  Globe,
  Layers,
  Trash2,
  Clock,
  Calendar,
  MessageSquare,
  CreditCard,
  Lock,
  Bell,
  Sliders,
  ShieldAlert,
  Download,
  Info,
  Smartphone,
  Laptop,
  CheckCheck,
  Eye,
  EyeOff,
  Volume2,
  Vibrate,
  Moon,
  HelpCircle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { SubscriptionFAQ } from "../subscription/SubscriptionFAQ";
import { CancelSubscriptionModal } from "../subscription/CancelSubscriptionModal";
import { TermsOfServiceModal } from "../auth/TermsOfServiceModal";
import {
  getCurrentUser,
  saveUserProfile,
  switchUserRole,
  enableCoachRole,
  logoutUser,
  isUserAuthenticated,
  UserProfile,
  UserRole,
} from "@/lib/auth-store";
import { updateCoachPublicProfile } from "@/lib/booking-store";
import {
  CoachPlanOption,
  getStoredCoachPlans,
  saveCoachPlans,
  DEFAULT_COACH_PLANS,
} from "@/lib/workout-store";
import { saveProfileToSupabase } from "@/lib/supabase-service";
import { formatPhone, sanitizeInput, maskEmail } from "@/lib/security";
import { BRAZIL_STATES, reverseGeocode, isValidCoordinate } from "@/lib/geo";
import { AvatarUpload } from "./AvatarUpload";
import { getSupabase } from "@/lib/supabase";
import {
  PrivacyConsents,
  getPrivacyConsents,
  savePrivacyConsents,
  UserNotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  UserWorkoutPreferences,
  getWorkoutPreferences,
  saveWorkoutPreferences,
  getActiveSecuritySessions,
  downloadUserDataFile,
  executeAccountDeletion,
} from "@/lib/privacy-service";

export type SettingsTabType =
  | "perfil"
  | "seguranca"
  | "notificacoes"
  | "treino"
  | "assinatura"
  | "privacidade"
  | "sobre";

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

const REST_TIMER_OPTIONS = [30, 45, 60, 90, 120, 180];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  onOpenCustomization?: () => void;
  onOpenPlans?: () => void;
  initialTab?: SettingsTabType;
}

export function UserProfileModal({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenCustomization,
  onOpenPlans,
  initialTab = "perfil",
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [activeRole, setActiveRole] = useState<UserRole>(profile.activeRole);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [showFAQ, setShowFAQ] = useState<boolean>(false);

  // Foto de Perfil
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
  );

  // Campos de formulário de perfil
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || "");
  const isPresetGoal = ["Hipertrofia", "Emagrecimento", "Força & Performance", "Condicionamento Geral"].includes(
    profile.goal || ""
  );
  const [goal, setGoal] = useState<string>(
    profile.goal ? (isPresetGoal ? profile.goal : "Personalizado") : "Hipertrofia"
  );
  const [customGoalInput, setCustomGoalInput] = useState<string>(
    profile.goal && !isPresetGoal ? profile.goal : ""
  );
  const [experienceLevel, setExperienceLevel] = useState<UserProfile["experienceLevel"]>(
    profile.experienceLevel || "Iniciante"
  );

  // Biometria & Dados Corporais
  const [height, setHeight] = useState(profile.height || 178);
  const [weight, setWeight] = useState(profile.weight || 78.4);
  const [bodyFat, setBodyFat] = useState(profile.bodyFat || 13.8);
  const [targetWeight, setTargetWeight] = useState(profile.targetWeight || 76.0);
  const [targetBodyFat, setTargetBodyFat] = useState(profile.targetBodyFat || 12.0);
  const [gender, setGender] = useState<UserProfile["gender"]>(profile.gender || "masculino");

  // Campos de Professor
  const [cref, setCref] = useState(profile.cref || "");
  const [specialty, setSpecialty] = useState(profile.specialty || "Hipertrofia & Biomecânica");
  const [bio, setBio] = useState(profile.bio || "");
  const [instagram, setInstagram] = useState(profile.instagram || "@rodrigo.gymflow");
  const [location, setLocation] = useState(profile.location || "Salão Principal • Musculação");

  // Localização Geográfica
  const [state, setState] = useState<string>(profile.state || "SP");
  const [city, setCity] = useState<string>(profile.city || "");
  const [neighborhood, setNeighborhood] = useState<string>(profile.neighborhood || "");
  const [latitude, setLatitude] = useState<number | undefined>(profile.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(profile.longitude);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<boolean>(
    Boolean(profile.latitude && profile.longitude)
  );
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [serviceModality, setServiceModality] = useState<"presencial" | "online" | "hibrido">(
    profile.serviceModality || "presencial"
  );
  const [operatingRadiusKm, setOperatingRadiusKm] = useState<number>(profile.operatingRadiusKm || 15);

  // Preços Mensais do Personal
  const [basicPrice, setBasicPrice] = useState(profile.pricing?.basicMonthly || profile.pricing?.dailySession || 35);
  const [proPrice, setProPrice] = useState(profile.pricing?.proMonthly || profile.pricing?.weeklyPlan || 45);
  const [vipPrice, setVipPrice] = useState(profile.pricing?.vipMonthly || profile.pricing?.monthlyPlan || 55);

  // Configurador de Planos do Coach
  const [coachPlans, setCoachPlans] = useState<CoachPlanOption[]>(() => {
    const current = getCurrentUser();
    if (current.coachPlans && current.coachPlans.length > 0) return current.coachPlans;
    const stored = getStoredCoachPlans();
    return stored && stored.length > 0 ? stored : DEFAULT_COACH_PLANS;
  });
  const [activePlanIndex, setActivePlanIndex] = useState<number>(0);
  const [newModalityInput, setNewModalityInput] = useState<string>("");
  const [showAddModalityInput, setShowAddModalityInput] = useState<boolean>(false);

  // Configuração PIX do Personal
  const [pixKeyType, setPixKeyType] = useState<"phone" | "cpf" | "cnpj" | "email" | "random">(
    (profile.pixKeyType as any) || "phone"
  );
  const [pixKey, setPixKey] = useState(profile.pixKey || "");
  const [pixName, setPixName] = useState(profile.pixName || "");
  const [pixBank, setPixBank] = useState(profile.pixBank || "");
  const [allowBookingMessages, setAllowBookingMessages] = useState<boolean>(profile.allowBookingMessages ?? true);

  // Feedbacks
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("Configurações atualizadas com sucesso!");

  // Ativação de Modo Professor
  const hasCoachRole = Boolean(profile.enabledRoles?.includes("coach") || activeRole === "coach");
  const [isCoachUpgradeOpen, setIsCoachUpgradeOpen] = useState(false);
  const [upgradeSpecialty, setUpgradeSpecialty] = useState(profile.specialty || "");
  const [upgradeCref, setUpgradeCref] = useState(profile.cref || "");
  const [upgradeBio, setUpgradeBio] = useState(profile.bio || "");
  const [upgradeLocation, setUpgradeLocation] = useState(profile.location || "Salão Principal • Musculação");
  const [upgradeInstagram, setUpgradeInstagram] = useState(profile.instagram || "");
  const [upgradeBasicPrice, setUpgradeBasicPrice] = useState(profile.pricing?.basicMonthly || 35);
  const [upgradeProPrice, setUpgradeProPrice] = useState(profile.pricing?.proMonthly || 45);
  const [upgradeVipPrice, setUpgradeVipPrice] = useState(profile.pricing?.vipMonthly || 55);
  const [upgradeAllowBookingMessages, setUpgradeAllowBookingMessages] = useState<boolean>(true);
  const [upgradeError, setUpgradeError] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // ---------------------------------------------------------------------------
  // ABA 2: SEGURANÇA & ACESSO
  // ---------------------------------------------------------------------------
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [sessions, setSessions] = useState(() => getActiveSecuritySessions());
  const [terminatedSessionsNotice, setTerminatedSessionsNotice] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // ABA 3: NOTIFICAÇÕES & LEMBRETES
  // ---------------------------------------------------------------------------
  const [notifPrefs, setNotifPrefs] = useState<UserNotificationPreferences>(() => getNotificationPreferences());

  // ---------------------------------------------------------------------------
  // ABA 4: PREFERÊNCIAS DE TREINO
  // ---------------------------------------------------------------------------
  const [workoutPrefs, setWorkoutPrefs] = useState<UserWorkoutPreferences>(() => getWorkoutPreferences());

  // ---------------------------------------------------------------------------
  // ABA 6: PRIVACIDADE & LGPD
  // ---------------------------------------------------------------------------
  const [privacyConsents, setPrivacyConsents] = useState<PrivacyConsents>(() => getPrivacyConsents());
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUser();
      setProfile(current);
      setActiveRole(current.activeRole);
      setAvatarUrl(current.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80");
      setName(current.name);
      if (current.goal) {
        const isPreset = ["Hipertrofia", "Emagrecimento", "Força & Performance", "Condicionamento Geral"].includes(current.goal);
        if (isPreset) {
          setGoal(current.goal);
          setCustomGoalInput("");
        } else {
          setGoal("Personalizado");
          setCustomGoalInput(current.goal);
        }
      } else {
        setGoal("Hipertrofia");
        setCustomGoalInput("");
      }
      setHeight(current.height || 178);
      setWeight(current.weight || 78.4);
      setBodyFat(current.bodyFat || 13.8);
      setTargetWeight(current.targetWeight || 76.0);
      setTargetBodyFat(current.targetBodyFat || 12.0);
      setGender(current.gender || "masculino");
      setCref(current.cref || "");
      setSpecialty(current.specialty || "Hipertrofia & Biomecânica");
      setBio(current.bio || "");
      setInstagram(current.instagram || "@rodrigo.gymflow");
      setLocation(current.location || "Salão Principal • Musculação");

      setPixKeyType((current.pixKeyType as any) || "phone");
      setPixKey(current.pixKey || "");
      setPixName(current.pixName || "");
      setPixBank(current.pixBank || "");

      setState(current.state || "SP");
      setCity(current.city || "");
      setNeighborhood(current.neighborhood || "");
      setLatitude(current.latitude);
      setLongitude(current.longitude);
      setLocationSuccess(Boolean(current.latitude && current.longitude));
      setLocationNotice(null);
      setServiceModality(current.serviceModality || "presencial");
      setOperatingRadiusKm(current.operatingRadiusKm || 15);

      setBasicPrice(current.pricing?.basicMonthly || current.pricing?.dailySession || 35);
      setProPrice(current.pricing?.proMonthly || current.pricing?.weeklyPlan || 45);
      setVipPrice(current.pricing?.vipMonthly || current.pricing?.monthlyPlan || 55);

      if (current.coachPlans && current.coachPlans.length > 0) {
        setCoachPlans(current.coachPlans);
      } else {
        const stored = getStoredCoachPlans();
        if (stored && stored.length > 0) setCoachPlans(stored);
      }

      setUpgradeSpecialty(current.specialty || "");
      setUpgradeCref(current.cref || "");
      setUpgradeBio(current.bio || "");
      setUpgradeLocation(current.location || "Salão Principal • Musculação");
      setUpgradeInstagram(current.instagram || "");
      setUpgradeBasicPrice(current.pricing?.basicMonthly || 35);
      setUpgradeProPrice(current.pricing?.proMonthly || 45);
      setUpgradeVipPrice(current.pricing?.vipMonthly || 55);
      setUpgradeAllowBookingMessages(current.allowBookingMessages !== undefined ? current.allowBookingMessages : true);
      setAllowBookingMessages(current.allowBookingMessages !== undefined ? current.allowBookingMessages : true);
      setUpgradeError("");
      setIsCoachUpgradeOpen(false);
      setIsUpgrading(false);
      setSavedSuccess(false);

      // Sincroniza preferências e consentimentos
      setNotifPrefs(getNotificationPreferences());
      setWorkoutPrefs(getWorkoutPreferences());
      setPrivacyConsents(getPrivacyConsents());
      setSessions(getActiveSecuritySessions());
      setTerminatedSessionsNotice(null);
      setPasswordError("");
      setPasswordSuccess("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

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

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocalização não suportada no seu navegador. Você pode preencher manualmente abaixo.");
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
            setLocationNotice("📍 GPS ativo com sucesso! Confirme sua cidade e estado abaixo.");
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
          msg = "Sinal de GPS indisponível no momento. Preencha sua cidade manualmente.";
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

  const handleSwitchRole = (newRole: UserRole) => {
    triggerHaptic("medium");
    setActiveRole(newRole);
    const updated = switchUserRole(newRole);
    setProfile(updated);
  };

  const handleUpgradeToCoach = (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError("");

    const cleanSpecialty = sanitizeInput(upgradeSpecialty).trim();
    if (!cleanSpecialty) {
      setUpgradeError("Por favor, informe sua especialidade principal de atendimento.");
      triggerHaptic("warning");
      return;
    }

    setIsUpgrading(true);
    triggerHaptic("success");

    const pricingObj = {
      basicMonthly: Number(upgradeBasicPrice) || 35,
      proMonthly: Number(upgradeProPrice) || 45,
      vipMonthly: Number(upgradeVipPrice) || 55,
      dailySession: Number(upgradeBasicPrice) || 35,
      weeklyPlan: Number(upgradeProPrice) || 45,
      monthlyPlan: Number(upgradeVipPrice) || 55,
    };

    const cleanCref = sanitizeInput(upgradeCref).trim() || undefined;
    const cleanBio = sanitizeInput(upgradeBio).trim() || undefined;
    const cleanLocation = sanitizeInput(upgradeLocation).trim() || "Salão Principal";
    const cleanInstagram = sanitizeInput(upgradeInstagram).trim() || undefined;

    const updated = enableCoachRole({
      specialty: cleanSpecialty,
      cref: cleanCref,
      bio: cleanBio,
      location: cleanLocation,
      instagram: cleanInstagram,
      pricing: pricingObj,
      allowBookingMessages: upgradeAllowBookingMessages,
    });

    const resolveCoachId = (u: UserProfile) => {
      if (u.id && u.id !== "user_me") return u.id;
      if (u.name && u.name.toLowerCase().includes("rodrigo")) return "coach_rodrigo";
      return `coach_${u.id || "me"}`;
    };
    const targetCoachId = resolveCoachId(updated);
    updateCoachPublicProfile(targetCoachId, {
      name: updated.name,
      cref: cleanCref,
      specialty: cleanSpecialty,
      bio: cleanBio || "",
      phone: updated.phone || "",
      avatarUrl: updated.avatarUrl || avatarUrl,
      instagram: cleanInstagram || "",
      location: cleanLocation || `${city || "Salão Principal"}${state ? ` - ${state}` : ""}`,
      city: city || undefined,
      state: state || undefined,
      neighborhood: neighborhood || undefined,
      latitude: isValidCoordinate(latitude, longitude) ? latitude : undefined,
      longitude: isValidCoordinate(latitude, longitude) ? longitude : undefined,
      serviceModality,
      operatingRadiusKm,
      pricing: pricingObj,
      allowBookingMessages: upgradeAllowBookingMessages,
    });

    setProfile(updated);
    setActiveRole("coach");
    setAllowBookingMessages(upgradeAllowBookingMessages);
    setSpecialty(cleanSpecialty);
    if (cleanCref) setCref(cleanCref);
    if (cleanBio) setBio(cleanBio);
    if (cleanLocation) setLocation(cleanLocation);
    if (cleanInstagram) setInstagram(cleanInstagram);
    setBasicPrice(pricingObj.basicMonthly);
    setProPrice(pricingObj.proMonthly);
    setVipPrice(pricingObj.vipMonthly);

    setIsUpgrading(false);
    setIsCoachUpgradeOpen(false);
    setSavedSuccess(true);
    setSaveSuccessMessage("Modo Professor ativado com sucesso!");
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("success");

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

    if (isCoach) {
      saveCoachPlans(coachPlans);
    }

    const validCoords = isValidCoordinate(latitude, longitude);
    const cleanCity = sanitizeInput(city.trim());
    const cleanState = sanitizeInput(state.trim().toUpperCase());
    const cleanNeighborhood = sanitizeInput(neighborhood.trim());
    const finalGoal =
      goal === "Personalizado"
        ? sanitizeInput(customGoalInput.trim()) || "Condicionamento Geral"
        : goal;

    const updated = saveUserProfile({
      name,
      email,
      phone,
      activeRole,
      avatarUrl,
      goal: finalGoal,
      experienceLevel,
      height: Number(height) || 178,
      weight: Number(weight) || 78.4,
      bodyFat: Number(bodyFat) || 13.8,
      targetWeight: Number(targetWeight) || undefined,
      targetBodyFat: Number(targetBodyFat) || undefined,
      gender,
      cref: cref.trim() || undefined,
      specialty,
      bio,
      instagram,
      location,
      city: cleanCity || undefined,
      state: cleanState || undefined,
      neighborhood: cleanNeighborhood || undefined,
      latitude: validCoords ? latitude : undefined,
      longitude: validCoords ? longitude : undefined,
      serviceModality,
      operatingRadiusKm,
      coachPlans: isCoach ? coachPlans : profile.coachPlans,
      pricing: pricingObj,
      pixKey: isCoach ? sanitizeInput(pixKey.trim()) || undefined : profile.pixKey,
      pixKeyType: isCoach ? pixKeyType : profile.pixKeyType,
      pixName: isCoach ? sanitizeInput(pixName.trim()) || undefined : profile.pixName,
      pixBank: isCoach ? sanitizeInput(pixBank.trim()) || undefined : profile.pixBank,
      allowBookingMessages: isCoach ? allowBookingMessages : profile.allowBookingMessages,
    });

    saveProfileToSupabase(updated);

    if (isCoach) {
      const resolveCoachId = (u: UserProfile) => {
        if (u.id && u.id !== "user_me") return u.id;
        if (u.name && u.name.toLowerCase().includes("rodrigo")) return "coach_rodrigo";
        return `coach_${u.id || "me"}`;
      };
      const targetCoachId = resolveCoachId(updated);
      updateCoachPublicProfile(targetCoachId, {
        name,
        cref: cref.trim() || undefined,
        specialty,
        bio,
        phone,
        avatarUrl,
        instagram,
        location: location || `${cleanCity || "Salão Principal"}${cleanState ? ` - ${cleanState}` : ""}`,
        city: cleanCity || undefined,
        state: cleanState || undefined,
        neighborhood: cleanNeighborhood || undefined,
        latitude: validCoords ? latitude : undefined,
        longitude: validCoords ? longitude : undefined,
        serviceModality,
        operatingRadiusKm,
        coachPlans: coachPlans,
        pricing: pricingObj,
        pixKey: updated.pixKey,
        pixKeyType: updated.pixKeyType,
        pixName: updated.pixName,
        pixBank: updated.pixBank,
        allowBookingMessages: allowBookingMessages,
      });
    }

    setProfile(updated);
    setSavedSuccess(true);
    setSaveSuccessMessage("Dados do perfil atualizados com sucesso!");
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // Alteração de Senha
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve ter no mínimo 8 caracteres.");
      triggerHaptic("warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas digitadas não coincidem.");
      triggerHaptic("warning");
      return;
    }

    setIsUpdatingPassword(true);
    triggerHaptic("selection");

    try {
      const client = getSupabase();
      if (client) {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
          throw error;
        }
      }

      setPasswordSuccess("Sua senha foi alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
      triggerHaptic("success");
    } catch (err: any) {
      setPasswordError(err?.message || "Não foi possível alterar a senha no momento. Tente novamente.");
      triggerHaptic("warning");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Desconectar Outros Dispositivos (Revoga sessões ativas no Supabase Auth)
  const handleTerminateOtherSessions = async () => {
    triggerHaptic("medium");
    try {
      const client = getSupabase();
      if (client) {
        await client.auth.signOut({ scope: "others" });
      }
    } catch {}

    const filtered = sessions.filter((s) => s.isCurrent);
    setSessions(filtered);
    setTerminatedSessionsNotice("Todas as outras sessões foram encerradas com sucesso.");
    setTimeout(() => setTerminatedSessionsNotice(null), 4000);
  };

  // Salvar Preferências de Notificações
  const handleToggleNotif = (key: keyof UserNotificationPreferences) => {
    triggerHaptic("selection");
    const updated = saveNotificationPreferences({ [key]: !notifPrefs[key] });
    setNotifPrefs(updated);
  };

  // Salvar Preferências de Treino
  const handleToggleWorkoutPref = (key: keyof UserWorkoutPreferences, value: any) => {
    triggerHaptic("selection");
    const updated = saveWorkoutPreferences({ [key]: value });
    setWorkoutPrefs(updated);
  };

  // Salvar Consentimentos LGPD
  const handleToggleConsent = (key: keyof PrivacyConsents) => {
    if (key === "essentialCookies") return; // Obrigatório
    triggerHaptic("selection");
    const updated = savePrivacyConsents({ [key]: !privacyConsents[key] });
    setPrivacyConsents(updated);
  };

  // Exportar Todos os Dados (LGPD Art. 18, V)
  const handleExportData = () => {
    triggerHaptic("success");
    setIsExportingData(true);
    try {
      downloadUserDataFile(profile);
    } finally {
      setTimeout(() => setIsExportingData(false), 800);
    }
  };

  // Excluir Conta Definitivamente (LGPD Art. 18, VI)
  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    setIsDeletingAccount(true);
    triggerHaptic("warning");

    const res = await executeAccountDeletion(deleteConfirmationInput, profile);
    if (!res.success) {
      setDeleteError(res.error || "Falha ao excluir a conta.");
      setIsDeletingAccount(false);
      triggerHaptic("warning");
      return;
    }

    setIsDeletingAccount(false);
    setIsDeleteModalOpen(false);
    onClose();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  if (!isOpen) return null;

  const isCoach = activeRole === "coach";

  const TABS_CONFIG: Array<{ id: SettingsTabType; label: string; icon: any; badge?: string }> = [
    { id: "perfil", label: "Perfil & Conta", icon: User },
    { id: "seguranca", label: "Segurança", icon: Lock },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "treino", label: "Preferências", icon: Sliders },
    { id: "assinatura", label: "Assinatura", icon: CreditCard },
    { id: "privacidade", label: "Privacidade & LGPD", icon: ShieldCheck, badge: "LGPD" },
    { id: "sobre", label: "Sobre", icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal com Header do Usuário */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-zinc-900 shrink-0 shadow-md ${
                isCoach ? "border-amber-500/50" : "border-emerald-500/50"
              }`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-sm text-white">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white leading-none">{name || "Usuário GymFlow"}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isCoach
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isCoach ? "Professor" : "Aluno"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{email ? maskEmail(email) : "Conta Ativa"}</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Abas Horizontal com Rolagem Suave */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] bg-zinc-900/40 overflow-x-auto no-scrollbar shrink-0">
          {TABS_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 select-none ${
                  isSelected
                    ? isCoach
                      ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-[1.02]"
                      : "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                      isSelected
                        ? "bg-zinc-950 text-white"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Geral de Sucesso */}
        {savedSuccess && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Conteúdo Principal com Scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* ============================================================= */}
          {/* ABA 1: PERFIL & CONTA */}
          {/* ============================================================= */}
          {activeTab === "perfil" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
              {/* UPLOAD & TROCA DE FOTO DE PERFIL */}
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                userName={name}
                isCoach={isCoach}
                onSelectAvatar={(url) => setAvatarUrl(url)}
              />

              {/* ATIVAR MODO PROFESSOR OU ALTERNADOR DE MODO */}
              {!hasCoachRole ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border border-amber-500/20 shadow-lg relative overflow-hidden">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Tornar-se Personal Trainer
                      </span>
                      <h3 className="text-xs font-black text-white mt-1">
                        Ativar Perfil Profissional de Professor
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Opcional
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    Sua conta está como aluno. Se você também prescreve treinos ou atende alunos particulares, adicione suas informações de professor para desbloquear o modo treinador.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      setIsCoachUpgradeOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Informações de Professor</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/[0.1] shadow-lg">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" /> Papel na Plataforma
                      </span>
                      <h3 className="text-xs font-black text-white mt-0.5">
                        Treine ou Atenda Alunos com a Mesma Conta
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => handleSwitchRole("student")}
                      className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        !isCoach
                          ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>Modo Aluno</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchRole("coach")}
                      className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        isCoach
                          ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Modo Professor</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Informações Pessoais */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Informações Básicas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome Completo</label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(sanitizeInput(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail</label>
                    <input
                      type="email"
                      required
                      maxLength={100}
                      value={email}
                      onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      WhatsApp / Celular
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(11) 99123-4567"
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Matrícula Digital</label>
                    <input
                      type="text"
                      disabled
                      value={profile.matricula || "GF-84920"}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950/50 border border-white/[0.04] text-xs text-zinc-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Biometria & Dados Corporais */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-sky-400" /> Biometria & Composição Corporal
                  </h4>
                  <span className="text-[9px] text-sky-400 font-mono">
                    {height ? `${(height / 100).toFixed(2)}m` : "--"} • {weight ? `${weight}kg` : "--"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-sky-400" /> Altura (cm)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="250"
                      required
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <Scale className="w-3 h-3 text-emerald-400" /> Peso Atual (kg)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="250"
                      step="0.1"
                      required
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-400" /> Gordura (% BF)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="60"
                      step="0.1"
                      required
                      value={bodyFat}
                      onChange={(e) => setBodyFat(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Peso (kg)</label>
                    <input
                      type="number"
                      min="30"
                      max="250"
                      step="0.1"
                      value={targetWeight || ""}
                      onChange={(e) => setTargetWeight(e.target.value ? Number(e.target.value) : 0)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Gordura (% BF)</label>
                    <input
                      type="number"
                      min="3"
                      max="50"
                      step="0.1"
                      value={targetBodyFat || ""}
                      onChange={(e) => setTargetBodyFat(e.target.value ? Number(e.target.value) : 0)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Sexo Biológico</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as UserProfile["gender"])}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Se Aluno: Objetivo e Nível */}
              {!isCoach && (
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" /> Objetivo & Nível de Treino
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Objetivo Principal</label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="Hipertrofia">Hipertrofia</option>
                        <option value="Emagrecimento">Emagrecimento</option>
                        <option value="Força & Performance">Força & Performance</option>
                        <option value="Condicionamento Geral">Condicionamento Geral</option>
                        <option value="Personalizado">Personalizado / Outro...</option>
                      </select>

                      {goal === "Personalizado" && (
                        <input
                          type="text"
                          required
                          value={customGoalInput}
                          onChange={(e) => setCustomGoalInput(e.target.value)}
                          placeholder="Ex: Treino para TAF, Calistenia..."
                          maxLength={80}
                          className="w-full mt-2 p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Nível de Experiência</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value as UserProfile["experienceLevel"])}
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="Iniciante">Iniciante (menos de 6 meses)</option>
                        <option value="Intermediário">Intermediário (6 meses a 2 anos)</option>
                        <option value="Avançado">Avançado (mais de 2 anos)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Se Coach: Perfil Profissional, Planos e PIX */}
              {isCoach && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Perfil Público do Personal
                    </h4>
                    <span className="text-[9px] text-amber-400 font-mono">Marketplace</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Registro CREF (opcional)</label>
                      <input
                        type="text"
                        maxLength={30}
                        value={cref}
                        onChange={(e) => setCref(sanitizeInput(e.target.value))}
                        placeholder="Ex: 08412-SP"
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Especialidade</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={specialty}
                        onChange={(e) => setSpecialty(sanitizeInput(e.target.value))}
                        placeholder="Ex: Hipertrofia & Força"
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-400" /> Instagram
                      </label>
                      <input
                        type="text"
                        maxLength={40}
                        value={instagram}
                        onChange={(e) => setInstagram(sanitizeInput(e.target.value))}
                        placeholder="@seu.perfil"
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" /> Local de Atendimento
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={location}
                        onChange={(e) => setLocation(sanitizeInput(e.target.value))}
                        placeholder="Ex: Salão Principal • Musculação"
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Biografia Profissional</label>
                      <textarea
                        rows={2}
                        maxLength={300}
                        value={bio}
                        onChange={(e) => setBio(sanitizeInput(e.target.value))}
                        placeholder="Apresente sua metodologia e diferenciais aos alunos..."
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Localização e Região Geográfica */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 ${isCoach ? "text-amber-400" : "text-emerald-400"}`} />
                    <span>Localização & Proximidade</span>
                  </h4>
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {city ? `${city} - ${state}` : "Não configurada"}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      locationSuccess
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : isCoach
                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detectando GPS...</span>
                      </>
                    ) : locationSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GPS Ativo</span>
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
                      className="text-[10px] text-zinc-500 hover:text-rose-400 underline px-1"
                    >
                      Desativar GPS
                    </button>
                  )}
                </div>

                {locationNotice && (
                  <div className="p-2.5 rounded-xl text-xs bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                    <span className="text-[11px] leading-relaxed">{locationNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Estado (UF)</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      {BRAZIL_STATES.map((s) => (
                        <option key={s.uf} value={s.uf}>
                          {s.uf} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Cidade</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(sanitizeInput(e.target.value))}
                      placeholder="Ex: São Paulo, Rio de Janeiro..."
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Salvar */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
                    isCoach
                      ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                      : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Perfil</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================= */}
          {/* ABA 2: SEGURANÇA & ACESSO */}
          {/* ============================================================= */}
          {activeTab === "seguranca" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Alteração de Senha */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Alterar Senha de Acesso
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Crie uma senha forte com no mínimo 8 caracteres para proteger seus treinos e histórico.
                </p>

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Nova Senha</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full mt-1 p-2.5 pr-9 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-7 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Confirmar Nova Senha</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !newPassword}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Atualizando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Atualizar Senha</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Autenticação em Duas Etapas (2FA) */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Autenticação em Duas Etapas (2FA)
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Adicione uma camada extra de segurança para proteger seus dados de saúde e pagamentos.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Recomendado
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">Código de Verificação</p>
                      <p className="text-[10px] text-zinc-400">Verificação automática de login em novos navegadores</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
              </div>

              {/* Dispositivos Conectados & Sessões */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-sky-400" /> Dispositivos & Sessões Ativas
                  </h4>
                  <button
                    type="button"
                    onClick={handleTerminateOtherSessions}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-colors"
                  >
                    Encerrar outras sessões
                  </button>
                </div>

                {terminatedSessionsNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
                    {terminatedSessionsNotice}
                  </div>
                )}

                <div className="space-y-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {sess.device.includes("Mobile") || sess.device.includes("iOS") || sess.device.includes("Android") ? (
                          <Smartphone className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : (
                          <Laptop className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Dispositivo Atual
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {sess.browser} • {sess.location} • {sess.lastActive}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 3: NOTIFICAÇÕES & LEMBRETES */}
          {/* ============================================================= */}
          {activeTab === "notificacoes" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Notificações no App */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" /> Notificações no Aplicativo (Push)
                </h4>

                <div className="space-y-2.5">
                  {[
                    {
                      key: "pushTrainingReminders" as const,
                      title: "Lembretes Diários de Treino",
                      desc: "Notificação matinal com a ficha do dia e exercícios recomendados",
                    },
                    {
                      key: "pushAchievements" as const,
                      title: "Conquistas e Medalhas Desbloqueadas",
                      desc: "Celebração na tela e alertas ao bater recordes e metas",
                    },
                    {
                      key: "pushCoachMessages" as const,
                      title: "Avisos e Prescrições do Treinador",
                      desc: "Notificar imediatamente quando sua rotina ou ficha for atualizada",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="text-[10px] text-zinc-400">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs[item.key]}
                        onClick={() => handleToggleNotif(item.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          notifPrefs[item.key] ? "bg-emerald-500" : "bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                            notifPrefs[item.key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lembretes via WhatsApp */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Avisos Inteligentes via WhatsApp
                </h4>

                <div className="space-y-2.5">
                  {[
                    {
                      key: "whatsappClassAlerts" as const,
                      title: "Aviso de Aula Agendada (1h antes)",
                      desc: "Mensagem direta no seu WhatsApp para confirmar presença no horário marcado",
                    },
                    {
                      key: "whatsappHydration" as const,
                      title: "Lembretes de Hidratação e Cardio",
                      desc: "Notificações suaves ao longo do dia para atingir a meta diária de água",
                    },
                    {
                      key: "whatsappPaymentAlerts" as const,
                      title: "Alertas de Vencimento e Recibos",
                      desc: "Comprovantes automáticos e lembretes amigáveis de renovação",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="text-[10px] text-zinc-400">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs[item.key]}
                        onClick={() => handleToggleNotif(item.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          notifPrefs[item.key] ? "bg-emerald-500" : "bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                            notifPrefs[item.key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horário Silencioso (Não Perturbe) */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Horário de Silêncio</h4>
                      <p className="text-[10px] text-zinc-400">Pausar notificações durante o período de descanso</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPrefs.quietHoursEnabled}
                    onClick={() => handleToggleNotif("quietHoursEnabled")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      notifPrefs.quietHoursEnabled ? "bg-indigo-500" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                        notifPrefs.quietHoursEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {notifPrefs.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Início do Silêncio</label>
                      <input
                        type="time"
                        value={notifPrefs.quietHoursStart}
                        onChange={(e) => {
                          const updated = saveNotificationPreferences({ quietHoursStart: e.target.value });
                          setNotifPrefs(updated);
                        }}
                        className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Fim do Silêncio</label>
                      <input
                        type="time"
                        value={notifPrefs.quietHoursEnd}
                        onChange={(e) => {
                          const updated = saveNotificationPreferences({ quietHoursEnd: e.target.value });
                          setNotifPrefs(updated);
                        }}
                        className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 4: PREFERÊNCIAS DE TREINO */}
          {/* ============================================================= */}
          {activeTab === "treino" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Timer de Descanso Padrão */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Timer de Descanso Padrão
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {workoutPrefs.defaultRestTimerSeconds} segundos
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Tempo pré-selecionado ao iniciar uma pausa entre as séries de exercícios.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {REST_TIMER_OPTIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleToggleWorkoutPref("defaultRestTimerSeconds", sec)}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all border ${
                        workoutPrefs.defaultRestTimerSeconds === sec
                          ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback e Sons */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-teal-400" /> Efeitos & Resposta Tátil
                </h4>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Vibrate className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Vibração Haptic ao Concluir Série</p>
                        <p className="text-[10px] text-zinc-400">Feedback tátil para confirmar a conclusão sem olhar para a tela</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={workoutPrefs.hapticFeedbackEnabled}
                      onClick={() => handleToggleWorkoutPref("hapticFeedbackEnabled", !workoutPrefs.hapticFeedbackEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        workoutPrefs.hapticFeedbackEnabled ? "bg-emerald-500" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                          workoutPrefs.hapticFeedbackEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 text-teal-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Alarme Sonoro do Timer de Descanso</p>
                        <p className="text-[10px] text-zinc-400">Apito suave ao zerar a contagem regressiva de descanso</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={workoutPrefs.soundEnabled}
                      onClick={() => handleToggleWorkoutPref("soundEnabled", !workoutPrefs.soundEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        workoutPrefs.soundEnabled ? "bg-teal-500" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                          workoutPrefs.soundEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Manter Tela Ligada Durante o Treino</p>
                        <p className="text-[10px] text-zinc-400">Impede o bloqueio automático enquanto você executa as séries</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={workoutPrefs.keepScreenAwakeDuringWorkout}
                      onClick={() => handleToggleWorkoutPref("keepScreenAwakeDuringWorkout", !workoutPrefs.keepScreenAwakeDuringWorkout)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        workoutPrefs.keepScreenAwakeDuringWorkout ? "bg-indigo-500" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                          workoutPrefs.keepScreenAwakeDuringWorkout ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Unidades de Medida */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-sky-400" /> Unidades de Medida
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Carga / Peso</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleWorkoutPref("weightUnit", "kg")}
                        className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                          workoutPrefs.weightUnit === "kg"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Quilogramas (kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleWorkoutPref("weightUnit", "lb")}
                        className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                          workoutPrefs.weightUnit === "lb"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Libras (lb)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Distância de Cardio</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleWorkoutPref("distanceUnit", "km")}
                        className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                          workoutPrefs.distanceUnit === "km"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Quilômetros (km)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleWorkoutPref("distanceUnit", "mi")}
                        className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                          workoutPrefs.distanceUnit === "mi"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Milhas (mi)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 5: ASSINATURA & FATURAMENTO */}
          {/* ============================================================= */}
          {activeTab === "assinatura" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Status da Assinatura
                  </h4>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      profile.subscriptionStatus === "active"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : profile.subscriptionStatus === "trial"
                        ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {profile.subscriptionStatus === "trial" ? "Período de Testes" : "Plano Ativo"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/[0.05] flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-white">
                      {isCoach ? "Plano Personal Pro" : "Plano Aluno Pro"}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {profile.subscriptionEndsAt || profile.trialEndsAt
                        ? `Acesso liberado até ${new Date(profile.subscriptionEndsAt || profile.trialEndsAt!).toLocaleDateString("pt-BR")}`
                        : "Renovação mensal ativa."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenPlans && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          onClose();
                          onOpenPlans();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                      >
                        Alterar Plano
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("warning");
                        setIsCancelModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/15 text-zinc-300 hover:text-rose-300 font-bold text-xs border border-white/[0.08] transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                {/* FAQ de Cobrança */}
                <div className="pt-2 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setShowFAQ(!showFAQ);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[11px] font-semibold text-zinc-300 flex items-center justify-between transition-colors border border-white/[0.04]"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dúvidas Frequentes sobre Cobrança e Cancelamento</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {showFAQ ? "Recolher" : "Ver FAQ"}
                    </span>
                  </button>

                  {showFAQ && (
                    <div className="mt-2 pt-2 border-t border-white/[0.04] animate-in fade-in">
                      <SubscriptionFAQ />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 6: PRIVACIDADE & PROTEÇÃO DE DADOS (LGPD / GDPR) */}
          {/* ============================================================= */}
          {activeTab === "privacidade" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Portabilidade de Dados (Art. 18, V) */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportação de Dados (Portabilidade)
                  </h4>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Art. 18, V da LGPD
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Você tem direito ao download completo e legível de todos os seus dados cadastrais, histórico de treinos, biometria e registros de frequência em formato digital estruturado.
                </p>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExportingData}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isExportingData ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando arquivo de dados...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Exportar Todos os Meus Dados Pessoais (JSON)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Gestão Granular de Consentimentos (Art. 8º da LGPD) */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Preferências de Privacidade
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-400">LGPD</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white">Armazenamento Essencial & Sessão</p>
                        <span className="text-[8px] font-bold text-zinc-400 bg-white/[0.05] px-1.5 py-0.2 rounded">
                          Obrigatório
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Necessário para manter seu login ativo e salvar sua ficha de treino
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-black">Ativo</span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Compartilhar Medidas com Personal Trainer</p>
                      <p className="text-[10px] text-zinc-400">
                        Permitir que o personal contratado veja seu histórico de peso e evolução
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privacyConsents.shareMetricsWithCoach}
                      onClick={() => handleToggleConsent("shareMetricsWithCoach")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        privacyConsents.shareMetricsWithCoach ? "bg-emerald-500" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                          privacyConsents.shareMetricsWithCoach ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Exibir Perfil nos Rankings da Comunidade</p>
                      <p className="text-[10px] text-zinc-400">
                        Aparecer no placar de medalhas e sequência de treinos para outros alunos
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privacyConsents.publicProfileInRankings}
                      onClick={() => handleToggleConsent("publicProfileInRankings")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        privacyConsents.publicProfileInRankings ? "bg-emerald-500" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                          privacyConsents.publicProfileInRankings ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Telemetria Anônima de Desempenho</p>
                      <p className="text-[10px] text-zinc-400">
                        Envio anônimo de erros técnicos para melhoria contínua da estabilidade
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privacyConsents.telemetryAndDiagnostics}
                      onClick={() => handleToggleConsent("telemetryAndDiagnostics")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        privacyConsents.telemetryAndDiagnostics ? "bg-emerald-500" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow transition duration-200 ${
                          privacyConsents.telemetryAndDiagnostics ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Termos e Contato DPO */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-400" /> Termos de Uso e Encarregado (DPO)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Consentimento registrado em:{" "}
                  <strong className="text-white font-mono">
                    {profile.termsAcceptedAt
                      ? new Date(profile.termsAcceptedAt).toLocaleDateString("pt-BR")
                      : "Cadastro"}
                  </strong>
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setIsTermsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-bold text-xs border border-white/[0.08] transition-all"
                  >
                    Ler Termos de Uso e Privacidade
                  </button>
                </div>
              </div>

              {/* Zona Crítica: Eliminação Definitiva de Conta (Art. 18, VI) */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Eliminação de Conta (Direito ao Esquecimento)
                  </h4>
                  <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Art. 18, VI
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  A exclusão de conta é permanente e irreversível. Todos os seus dados, fichas, sessões de cárdio, bioimpedâncias e histórico de pagamentos serão apagados definitivamente.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("warning");
                    setDeleteConfirmationInput("");
                    setDeleteError("");
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Minha Conta Permanentemente</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* ABA 7: SOBRE & SUPORTE */}
          {/* ============================================================= */}
          {activeTab === "sobre" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-white">GymFlow Fitness Ecosystem</h3>
                <p className="text-[11px] text-zinc-400">
                  Versão 2.4.0 Pro • Construído com máxima precisão e segurança
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sistemas 100% Operacionais</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Canais de Atendimento</h4>
                <div className="space-y-2">
                  <a
                    href="https://wa.me/5511999999999?text=Ol%C3%A1,%20preciso%20de%20ajuda%20no%20GymFlow"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between text-xs text-white hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Falar com Suporte no WhatsApp</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setIsTermsModalOpen(true);
                    }}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between text-xs text-white hover:border-emerald-500/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-teal-400" />
                      <span>Termos de Uso e Política de Privacidade</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botão de Sair da Conta */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-zinc-900/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("warning");
              logoutUser();
              onClose();
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>

          <span className="text-[10px] text-zinc-500 font-mono">GymFlow v2.4</span>
        </div>
      </div>

      {/* Modal de Cancelamento de Assinatura */}
      <CancelSubscriptionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          const fresh = getCurrentUser();
          setProfile(fresh);
          setIsCancelModalOpen(false);
        }}
        user={profile}
      />

      {/* Modal de Termos de Uso e Privacidade */}
      <TermsOfServiceModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setIsTermsModalOpen(false)}
        hasAlreadyAccepted={true}
      />

      {/* Modal Defensivo de Exclusão de Conta (LGPD Art. 18, VI) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-rose-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-white">Exclusão Definitiva de Conta</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Esta ação é <strong>irreversível</strong>. Todos os seus treinos, histórico de cárdio, avaliações físicas e dados cadastrais serão completamente apagados em conformidade com o Art. 18 da LGPD.
            </p>

            <form onSubmit={handleConfirmDeleteAccount} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Digite a palavra <strong className="text-rose-400 font-mono">EXCLUIR</strong> para confirmar:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-xs text-white font-mono font-bold uppercase focus:outline-none focus:border-rose-400"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-rose-400 font-semibold">{deleteError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount || deleteConfirmationInput.trim().toUpperCase() !== "EXCLUIR"}
                  className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmar Exclusão</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Painel de Ativação do Modo Professor */}
      {isCoachUpgradeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Ativar Perfil de Professor</h3>
                  <p className="text-[11px] text-zinc-400">Complete seus dados profissionais para prescrever treinos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setIsCoachUpgradeOpen(false);
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpgradeToCoach} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
              {upgradeError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{upgradeError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Especialidade Principal *</label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={upgradeSpecialty}
                  onChange={(e) => setUpgradeSpecialty(sanitizeInput(e.target.value))}
                  placeholder="Ex: Hipertrofia & Biomecânica"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Registro CREF (opcional)</label>
                <input
                  type="text"
                  maxLength={30}
                  value={upgradeCref}
                  onChange={(e) => setUpgradeCref(sanitizeInput(e.target.value))}
                  placeholder="Ex: 08412-SP"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCoachUpgradeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpgrading}
                  className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUpgrading ? "Ativando..." : "Confirmar Modo Professor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
