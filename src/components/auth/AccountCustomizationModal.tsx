"use client";

import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  User,
  Camera,
  Upload,
  Link as LinkIcon,
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
  FileText,
  Scale,
  Ruler,
  LogOut,
  ShieldCheck,
  Award,
  ChevronRight,
  X,
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
import { saveNewStudent } from "@/lib/workout-store";
import { triggerHaptic } from "@/lib/haptic";

interface AccountCustomizationModalProps {
  isOpen: boolean;
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
  onClose?: () => void;
}

// 4 Avatares atléticos pré-definidos em alta resolução para escolha rápida
const PRESET_AVATARS = [
  {
    id: "preset_1",
    label: "Atleta 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "preset_2",
    label: "Atleta 2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "preset_3",
    label: "Atleta 3",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "preset_4",
    label: "Atleta 4",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
];

const GOAL_OPTIONS: Array<{
  value: NonNullable<UserProfile["goal"]>;
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
    desc: "Saúde, resistência e qualidade de vida",
    icon: Activity,
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
  // Dados básicos
  const [name, setName] = useState(user.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [phone, setPhone] = useState(formatPhone(user.phone || ""));

  // Papel
  const [role, setRole] = useState<UserRole>(user.activeRole || "student");

  // Dados de Aluno
  const [goal, setGoal] = useState<UserProfile["goal"]>(user.goal || "Hipertrofia");
  const [experienceLevel, setExperienceLevel] = useState<UserProfile["experienceLevel"]>(
    user.experienceLevel || "Iniciante"
  );
  const [weight, setWeight] = useState<string>(user.weight ? String(user.weight) : "");
  const [height, setHeight] = useState<string>(user.height ? String(user.height) : "");

  // Dados de Personal Trainer
  const [cref, setCref] = useState(user.cref || "");
  const [specialty, setSpecialty] = useState(
    user.specialty && SPECIALTY_OPTIONS.includes(user.specialty)
      ? user.specialty
      : user.specialty
      ? "outra"
      : "Musculação & Hipertrofia"
  );
  const [isCustomSpecialty, setIsCustomSpecialty] = useState(
    Boolean(user.specialty && !SPECIALTY_OPTIONS.includes(user.specialty))
  );
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState(
    user.specialty && !SPECIALTY_OPTIONS.includes(user.specialty) ? user.specialty : ""
  );
  const [bio, setBio] = useState(user.bio || "");

  // Termos & LGPD
  const [termsAccepted, setTermsAccepted] = useState(Boolean(user.termsAccepted));
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Estados auxiliares de Avatar
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
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
    if (user.goal) setGoal(user.goal);
    if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
    if (user.weight) setWeight(String(user.weight));
    if (user.height) setHeight(String(user.height));
    if (user.cref) setCref(user.cref);
    if (user.specialty) {
      if (SPECIALTY_OPTIONS.includes(user.specialty)) {
        setSpecialty(user.specialty);
        setIsCustomSpecialty(false);
      } else {
        setSpecialty("outra");
        setIsCustomSpecialty(true);
        setCustomSpecialtyInput(user.specialty);
      }
    }
    if (user.bio) setBio(user.bio);
    if (user.termsAccepted) setTermsAccepted(true);
  }, [user]);

  // Trava scroll do body de fundo enquanto o modal estiver aberto
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

  // Upload local de foto com compressão/leitura base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage("A imagem selecionada excede 3MB. Escolha uma foto menor.");
      triggerHaptic("warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        setAvatarImgError(false);
        setErrorMessage(null);
        triggerHaptic("success");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+/i.test(trimmed) && !trimmed.startsWith("data:image/")) {
      setErrorMessage("Informe uma URL de imagem válida (iniciando com https://).");
      triggerHaptic("warning");
      return;
    }
    setAvatarUrl(trimmed);
    setAvatarImgError(false);
    setCustomUrl("");
    setShowUrlInput(false);
    setErrorMessage(null);
    triggerHaptic("success");
  };

  const handleSelectPresetAvatar = (url: string) => {
    triggerHaptic("selection");
    setAvatarUrl(url);
    setAvatarImgError(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("Por favor, informe seu nome completo com pelo menos 2 letras.");
      triggerHaptic("warning");
      return;
    }

    let rawPhoneDigits = phone.replace(/\D/g, "");
    if (rawPhoneDigits.length > 11 && rawPhoneDigits.startsWith("55")) {
      rawPhoneDigits = rawPhoneDigits.slice(2);
    }
    rawPhoneDigits = rawPhoneDigits.slice(0, 11);

    if (rawPhoneDigits.length < 10) {
      setErrorMessage("WhatsApp obrigatório: informe seu DDD com o número (mínimo 10 dígitos).");
      triggerHaptic("warning");
      return;
    }

    const ddd = parseInt(rawPhoneDigits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) {
      setErrorMessage("DDD inválido. Informe um DDD brasileiro válido (ex: 11, 21, 31, 81...).");
      triggerHaptic("warning");
      return;
    }

    if (/^(\d)\1+$/.test(rawPhoneDigits)) {
      setErrorMessage("Por favor, informe um número de telefone real.");
      triggerHaptic("warning");
      return;
    }

    const finalSpecialty = isCustomSpecialty ? customSpecialtyInput.trim() : specialty.trim();

    if (role === "coach") {
      if (!cref.trim() || cref.trim().length < 3) {
        setErrorMessage("O registro CREF é obrigatório para contas de Personal Trainer (ex: 12345-G/SP).");
        triggerHaptic("warning");
        return;
      }
      if (!finalSpecialty || finalSpecialty.length < 2) {
        setErrorMessage("Selecione ou digite sua especialidade principal.");
        triggerHaptic("warning");
        return;
      }
    } else {
      if (!goal) {
        setErrorMessage("Selecione seu objetivo principal de treino.");
        triggerHaptic("warning");
        return;
      }
      if (!experienceLevel) {
        setErrorMessage("Selecione seu nível de experiência com musculação.");
        triggerHaptic("warning");
        return;
      }
    }

    if (!termsAccepted) {
      setErrorMessage("É obrigatório concordar com os Termos de Uso e Proteção de Dados LGPD.");
      triggerHaptic("warning");
      return;
    }

    const parsedWeight = weight ? parseFloat(weight.replace(",", ".")) : undefined;
    let parsedHeight = height ? parseFloat(height.replace(",", ".")) : undefined;

    if (parsedWeight !== undefined && (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 350)) {
      setErrorMessage("Peso inválido. Informe um valor em kg realista (ex: 75.5).");
      triggerHaptic("warning");
      return;
    }

    if (parsedHeight !== undefined && !isNaN(parsedHeight)) {
      // Converte automaticamente se o usuário digitou em metros (ex: 1.75 -> 175)
      if (parsedHeight > 0.5 && parsedHeight < 3.0) {
        parsedHeight = Math.round(parsedHeight * 100);
      }
      if (parsedHeight < 80 || parsedHeight > 260) {
        setErrorMessage("Altura inválida. Informe um valor em cm realista (ex: 175).");
        triggerHaptic("warning");
        return;
      }
    }

    setIsLoading(true);

    try {
      const updatedUserPayload: UserProfile = {
        ...user,
        id: user.id,
        email: user.email,
        name: trimmedName,
        avatarUrl: avatarUrl || undefined,
        phone: formatPhone(rawPhoneDigits),
        activeRole: role,
        enabledRoles: ["student", "coach"],
        goal: role === "student" ? goal : (user.goal || "Hipertrofia"),
        experienceLevel: role === "student" ? experienceLevel : (user.experienceLevel || "Avançado"),
        weight: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : user.weight,
        height: parsedHeight && !isNaN(parsedHeight) ? parsedHeight : user.height,
        cref: role === "coach" ? cref.trim().toUpperCase() : user.cref,
        specialty: role === "coach" ? finalSpecialty : user.specialty,
        bio: role === "coach" ? bio.trim() : user.bio,
        profileCompleted: true,
        termsAccepted: true,
        termsAcceptedAt: user.termsAcceptedAt || new Date().toISOString(),
        // Garante redirecionamento correto pós-onboarding
        subscriptionStatus:
          role === "coach"
            ? "active"
            : user.subscriptionStatus === "active" && user.subscriptionPlan
            ? "active"
            : "pending_choice",
      };

      // 1. Atualiza os metadados do Supabase Auth se conectado
      const client = getSupabase();
      if (client) {
        client.auth.updateUser({
          data: {
            name: updatedUserPayload.name,
            phone: updatedUserPayload.phone,
            role: updatedUserPayload.activeRole,
            goal: updatedUserPayload.goal,
            experience_level: updatedUserPayload.experienceLevel,
            cref: updatedUserPayload.cref,
            specialty: updatedUserPayload.specialty,
            bio: updatedUserPayload.bio,
            avatar_url: updatedUserPayload.avatarUrl,
            profile_completed: true,
            terms_accepted: true,
            terms_accepted_at: updatedUserPayload.termsAcceptedAt,
          },
        }).catch(() => {});
      }

      // 2. Salva no banco PostgreSQL (tabela 'profiles')
      await saveProfileToSupabase(updatedUserPayload);

      // 3. Celebração visual refinada com confetes
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: role === "coach" ? ["#f59e0b", "#fbbf24", "#d97706"] : ["#10b981", "#34d399", "#059669"],
        });
      } catch {}

      triggerHaptic("success");
      setIsSuccess(true);

      // 4. Aguarda microinteração visual antes de atualizar a sessão global e fechar
      setTimeout(() => {
        const saved = saveUserProfile(updatedUserPayload);

        if (role === "coach") {
          updateCoachPublicProfile(saved.id, {
            name: saved.name,
            cref: saved.cref,
            specialty: saved.specialty,
            bio: saved.bio,
            phone: saved.phone,
            avatarUrl: saved.avatarUrl,
          });
        } else {
          saveNewStudent({
            id: saved.id,
            name: saved.name,
            email: saved.email,
            goal: saved.goal || "Hipertrofia",
            phone: saved.phone,
            avatarUrl: saved.avatarUrl,
            isOfflineStudent: false,
          });
        }

        onComplete(saved);
      }, 600);
    } catch (err: any) {
      console.error("Erro ao salvar personalização:", err);
      setErrorMessage(err.message || "Erro ao salvar perfil. Tente novamente.");
      triggerHaptic("warning");
      setIsLoading(false);
      setIsSuccess(false);
    }
  };

  const isCoach = role === "coach";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-[#070709]/95 backdrop-blur-2xl animate-in fade-in duration-200 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Luz ambiente de fundo refinada */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none transition-colors duration-500 ${
          isCoach ? "bg-amber-500/[0.07]" : "bg-emerald-500/[0.08]"
        }`}
      />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Container de centralização resiliente para telas móveis e desktop */}
      <div className="flex min-h-full items-center justify-center py-4 sm:py-8">
        {/* Card Principal Linear/Apple Design */}
        <div className="relative w-full max-w-xl bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl text-zinc-100 animate-in zoom-in-95 duration-200">
        
        {/* Botão Fechar no modo sob demanda */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all active:scale-95 z-10"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-300">
            <Sparkles className={`w-3.5 h-3.5 ${isCoach ? "text-amber-400" : "text-emerald-400"}`} />
            <span>Personalização de Conta</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {onClose ? "Personalizar Perfil" : "Complete seu Perfil"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
            {onClose
              ? "Atualize suas informações de treino, biometria e contatos no GymFlow."
              : "Personalize suas informações para sincronizar seus treinos, lembretes de agenda e rotinas no GymFlow."}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ============================================================= */}
          {/* SEÇÃO 1: FOTO & NOME COMPLETO */}
          {/* ============================================================= */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className={`w-3.5 h-3.5 ${isCoach ? "text-amber-400" : "text-emerald-400"}`} />
                <span>Identidade & Foto</span>
              </span>
              <span className="text-[10px] text-zinc-500">Passo 1 de 4</span>
            </div>

            {/* Avatar & Ações */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 group">
                <div
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-zinc-900 shadow-xl transition-all ${
                    isCoach ? "border-amber-500/60 shadow-amber-500/10" : "border-emerald-500/60 shadow-emerald-500/10"
                  }`}
                >
                  {avatarUrl && !avatarImgError ? (
                    <img
                      src={avatarUrl}
                      alt={name || "Avatar"}
                      onError={() => setAvatarImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-2xl text-zinc-400">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-zinc-900 border border-white/20 text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
                  title="Alterar Foto"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Upload className="w-3 h-3 text-zinc-400" />
                    <span>Carregar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setShowUrlInput(!showUrlInput);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-transparent hover:bg-white/[0.04] transition-all flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? "Fechar Link" : "Colar Link"}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("warning");
                        setAvatarUrl("");
                      }}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Seletor rápido de 4 avatares fitness */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-500 mr-1 hidden sm:inline">Sugestões:</span>
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`w-7 h-7 rounded-xl overflow-hidden border transition-all hover:scale-105 active:scale-95 ${
                        avatarUrl === preset.url ? "border-emerald-400 ring-2 ring-emerald-500/30" : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input para colar URL de imagem externa */}
            {showUrlInput && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCustomUrl();
                    }
                  }}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition-all active:scale-95"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* Campo Nome Completo */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-zinc-300">
                Nome Completo <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* ============================================================= */}
          {/* SEÇÃO 2: WHATSAPP COM DDD (OBRIGATÓRIO) */}
          {/* ============================================================= */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp com DDD</span>
                <span className="text-rose-400 font-bold">*</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Lembretes de Treino
              </span>
            </div>

            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Utilizado para lembretes de treinos diários, confirmações de agendamento de personais e comprovantes do GymFlow.
            </p>
          </div>

          {/* ============================================================= */}
          {/* SEÇÃO 3: CONFIRMAÇÃO DO PAPEL (ALUNO vs PERSONAL) */}
          {/* ============================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Como você atuará no aplicativo? <span className="text-emerald-400">*</span>
              </label>
              <span className="text-[10px] text-zinc-500">Alternável a qualquer momento</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Opção Aluno */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setRole("student");
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-start text-left transition-all relative overflow-hidden ${
                  role === "student"
                    ? "bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      role === "student" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  {role === "student" && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <span className="text-xs sm:text-sm font-bold text-white">Sou Aluno(a)</span>
                <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Treinar, registrar biometria e agendar aulas
                </span>
              </button>

              {/* Opção Personal Trainer */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setRole("coach");
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-start text-left transition-all relative overflow-hidden ${
                  role === "coach"
                    ? "bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                    : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      role === "coach" ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  {role === "coach" && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <span className="text-xs sm:text-sm font-bold text-white">Sou Personal</span>
                <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Prescrever treinos e atender meus alunos
                </span>
              </button>
            </div>
          </div>

          {/* ============================================================= */}
          {/* SEÇÃO 4A: CAMPOS ESPECÍFICOS DE ALUNO */}
          {/* ============================================================= */}
          {role === "student" && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Objetivo & Nível de Treino</span>
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Modo Aluno</span>
              </div>

              {/* Objetivo Principal */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Objetivo Principal <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = goal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setGoal(opt.value);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500 text-white shadow-sm"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block truncate leading-tight">{opt.label}</span>
                          <span className="text-[10px] text-zinc-400 block truncate">{opt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nível de Experiência */}
              <div className="space-y-1.5">
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
                          triggerHaptic("selection");
                          setExperienceLevel(exp.value);
                        }}
                        className={`py-2 px-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                          isSelected
                            ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-500 shadow-sm"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-xs font-bold">{exp.label}</span>
                        <span className={`text-[9px] mt-0.5 ${isSelected ? "text-zinc-900" : "text-zinc-500"}`}>
                          {exp.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Biometria Inicial (Opcional) */}
              <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dados Corporais Iniciais</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">Opcional</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                      Peso Atual (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="250"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Ex: 78.5"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="100"
                      max="250"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Ex: 178"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SEÇÃO 4B: CAMPOS ESPECÍFICOS DE PERSONAL TRAINER */}
          {/* ============================================================= */}
          {role === "coach" && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Credenciais do Profissional</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">Modo Personal</span>
              </div>

              {/* Registro CREF */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  Registro CREF <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cref}
                  onChange={(e) => setCref(e.target.value.toUpperCase())}
                  placeholder="Ex: 12345-G/SP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white font-mono uppercase placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <p className="text-[10px] text-zinc-400">
                  Garante sua credibilidade perante alunos e academias parceiras no GymFlow.
                </p>
              </div>

              {/* Especialidade Principal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Especialidade Principal <span className="text-amber-400">*</span>
                </label>
                <select
                  value={isCustomSpecialty ? "outra" : specialty}
                  onChange={(e) => {
                    if (e.target.value === "outra") {
                      setIsCustomSpecialty(true);
                    } else {
                      setIsCustomSpecialty(false);
                      setSpecialty(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                >
                  {SPECIALTY_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                  <option value="outra">Outra especialidade (personalizada)...</option>
                </select>
                {isCustomSpecialty && (
                  <input
                    type="text"
                    required
                    value={customSpecialtyInput}
                    onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                    placeholder="Digite sua especialidade (ex: CrossFit, Calistenia, Pilates...)"
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 animate-in fade-in duration-150"
                  />
                )}
              </div>

              {/* Breve Bio / Apresentação */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">Breve Apresentação</label>
                  <span className="text-[10px] text-zinc-500">{bio.length}/300</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte sobre sua metodologia de treino, anos de atuação e diferenciais..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SEÇÃO 5: TERMOS DE USO & LGPD */}
          {/* ============================================================= */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
            <div className="flex items-start gap-3">
              <input
                id="terms_consent"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  triggerHaptic("selection");
                  setTermsAccepted(e.target.checked);
                }}
                className="w-4 h-4 mt-0.5 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer accent-emerald-500"
              />
              <div className="flex-1 text-xs leading-relaxed">
                <label htmlFor="terms_consent" className="text-zinc-300 cursor-pointer select-none">
                  Li e concordo com os{" "}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setShowTermsModal(true);
                    }}
                    className="text-emerald-400 font-semibold underline hover:text-emerald-300 transition-colors"
                  >
                    Termos de Uso e Política de Privacidade (LGPD)
                  </button>{" "}
                  do GymFlow.
                </label>
                {termsAccepted && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Consentimento legal registrado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* BOTÃO DE AÇÃO PRINCIPAL */}
          {/* ============================================================= */}
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-1/3 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || isSuccess || !termsAccepted}
              className={`${
                onClose ? "flex-1" : "w-full"
              } py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-zinc-950 flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuccess
                  ? "bg-emerald-400 text-zinc-950 shadow-emerald-500/30"
                  : isCoach
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-amber-500/20"
                  : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-emerald-500/20"
              }`}
            >
              {isSuccess ? (
                <div className="flex items-center gap-2 font-bold text-zinc-950">
                  <CheckCircle2 className="w-4 h-4 text-zinc-950 stroke-[3]" />
                  <span>Perfil Configurado!</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Salvando Perfil...</span>
                </div>
              ) : (
                <>
                  <span>{onClose ? "Salvar Alterações" : "Concluir e Começar"}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Rodapé: Opção de Trocar de Conta */}
        <div className="mt-4 pt-3 border-t border-zinc-900 text-center">
          <p className="text-[11px] text-zinc-500">
            Conectado como <strong className="text-zinc-400">{user.email || user.name}</strong>.{" "}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("warning");
                logoutUser();
              }}
              className="text-rose-400 hover:text-rose-300 hover:underline font-medium transition-colors inline-flex items-center gap-1"
            >
              <LogOut className="w-3 h-3 inline" />
              <span>Sair da conta</span>
            </button>
          </p>
        </div>
      </div>
    </div>

      {/* Modal Completo dos Termos de Uso e LGPD com leitura obrigatória */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setErrorMessage(null);
        }}
        hasAlreadyAccepted={termsAccepted}
      />
    </div>
  );
}
