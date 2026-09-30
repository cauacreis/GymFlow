"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  CreditCard,
  Zap,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  Shield,
  QrCode,
  Flame,
  AlertCircle,
  LogOut,
  Crown,
  Dumbbell,
  Bot,
  Activity,
  ChevronDown,
  ChevronUp,
  Users,
  RotateCcw,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getCurrentUser,
  activateTrialForUser,
  activatePaidPlanForUser,
  logoutUser,
  UserProfile,
} from "@/lib/auth-store";
import { saveProfileToSupabase } from "@/lib/supabase-service";
import { getRemainingTrialDays } from "@/lib/subscription-features";
import { maskEmail } from "@/lib/security";
import {
  isTrialAvailableForDevice,
  markTrialAsUsedOnDevice,
} from "@/lib/device-lockout";
import { SubscriptionFAQ } from "./SubscriptionFAQ";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

interface SubscriptionOnboardingModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  user?: UserProfile;
}

type RoleType = "student" | "coach";
type BillingType = "recurring" | "pix";

export interface PlanConfig {
  id: string;
  role: RoleType;
  tier: "basico" | "pro" | "vip";
  badge: string;
  badgeColor: string;
  name: string;
  tagline: string;
  recurringPrice: number;
  pixPrice: number;
  featured?: boolean;
  includedUsability: string[];
  lockedUsability?: string[];
}

export const STUDENT_PLANS: PlanConfig[] = [
  {
    id: "trial",
    role: "student",
    tier: "pro",
    badge: "EXPERIMENTE GRÁTIS",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    name: "7 Dias Grátis Aluno Pro",
    tagline: "Desbloqueia Biomecânica 3D, GymBot IA e aulas coletivas sem pagar nada hoje.",
    recurringPrice: 0,
    pixPrice: 0,
    includedUsability: [
      "Acesso completo ao Plano Pro de Aluno por 7 dias",
      "Biomecânica 3D & GIFs de 233+ exercícios",
      "GymBot IA 24/7 (Substituições & Dieta)",
      "Reserva de vagas em Aulas Coletivas",
      "Sem cobrança imediata (Cancele quando quiser)",
    ],
  },
  {
    id: "basico",
    role: "student",
    tier: "basico",
    badge: "ESSENCIAL",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    name: "Aluno Básico",
    tagline: "A base sólida para registrar treinos e acessar a academia.",
    recurringPrice: 29.9,
    pixPrice: 35.0,
    includedUsability: [
      "Fichas de musculação (séries, reps e cargas)",
      "Catraca Digital QR Code na portaria",
      "Agenda de treinos, presenças e faltas",
      "Marketplace para contratar Personais",
    ],
    lockedUsability: [
      "Sem animações de biomecânica postural 3D",
      "Sem acesso às aulas coletivas de ginástica",
      "Sem assistente GymBot IA de treino e dieta",
    ],
  },
  {
    id: "pro",
    role: "student",
    tier: "pro",
    badge: "MAIS ESCOLHIDO 🔥",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    name: "Aluno Pro",
    tagline: "A experiência completa de treino inteligente e alta performance.",
    recurringPrice: 39.9,
    pixPrice: 45.0,
    featured: true,
    includedUsability: [
      "Tudo do Plano Básico incluso",
      "Biomecânica 3D postural & GIFs de 233+ exercícios",
      "Aulas Coletivas (Spinning, Muay Thai, Funcional, Cross)",
      "GymBot IA 24/7 para ajustes de séries e macros",
      "Gráficos detalhados de evolução de cargas e PRs",
    ],
  },
  {
    id: "vip",
    role: "student",
    tier: "vip",
    badge: "MÁXIMA PERFORMANCE 👑",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    name: "Aluno VIP Black",
    tagline: "Acompanhamento de elite, bioimpedância e exclusividade total.",
    recurringPrice: 49.9,
    pixPrice: 55.0,
    includedUsability: [
      "Tudo do Plano Pro incluso",
      "1 Consultoria/treino presencial com Personal incluso/mês",
      "Bioimpedância InBody Mensal Gratuita (% gordura/músculo)",
      "Remarcação e reserva prioritária de vagas",
      "Convite cortesia para 1 amigo treinar junto 2x/mês",
    ],
  },
];

export const COACH_PLANS: PlanConfig[] = [
  {
    id: "trial",
    role: "coach",
    tier: "pro",
    badge: "EXPERIMENTE GRÁTIS 🚀",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    name: "7 Dias Grátis Personal Pro",
    tagline: "Atenda até 35 alunos, monte treinos 3D e teste sem nenhum custo hoje.",
    recurringPrice: 0,
    pixPrice: 0,
    includedUsability: [
      "Até 35 alunos ativos simultâneos durante 7 dias",
      "Prescrição completa com Biomecânica 3D para alunos",
      "Envio de fichas digitais direto no app dos alunos",
      "Agenda de atendimentos e perfil no marketplace",
      "GymBot IA Copilot para montagem rápida de treinos",
    ],
  },
  {
    id: "coach_starter",
    role: "coach",
    tier: "basico",
    badge: "START NA CARREIRA",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    name: "Personal Starter",
    tagline: "Ideal para começar a gerenciar seus primeiros alunos com profissionalismo.",
    recurringPrice: 39.9,
    pixPrice: 49.0,
    includedUsability: [
      "Gestão de até 10 alunos ativos simultâneos",
      "Prescrição de fichas de treino digitais completas",
      "Agenda de aulas e agendamentos com alunos",
      "Perfil ativo no Marketplace GymFlow da região",
      "Envio de treinos direto no celular do aluno",
    ],
    lockedUsability: [
      "Limite de 10 alunos (upgrade para expandir)",
      "Sem animações 3D interativas nos treinos dos alunos",
      "Sem GymBot IA Copilot de montagem de fichas",
    ],
  },
  {
    id: "coach_pro",
    role: "coach",
    tier: "pro",
    badge: "MAIS ESCOLHIDO 🔥",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    name: "Personal Pro",
    tagline: "A ferramenta definitiva para o Personal Trainer moderno de alta renda.",
    recurringPrice: 69.9,
    pixPrice: 79.0,
    featured: true,
    includedUsability: [
      "Gestão de até 35 alunos ativos simultâneos",
      "Prescrição completa com Biomecânica 3D postural para alunos",
      "Selo Verificado e destaque nas buscas do Marketplace",
      "Controle financeiro de mensalidades e recebimento PIX",
      "GymBot IA Copilot para montagem ágil de periodização",
      "Gráficos comparativos de evolução de força de cada aluno",
    ],
  },
  {
    id: "coach_vip",
    role: "coach",
    tier: "vip",
    badge: "ESCALA TOTAL 👑",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    name: "Personal Elite VIP",
    tagline: "Consultoria sem limites com máximo destaque regional e suporte VIP.",
    recurringPrice: 99.9,
    pixPrice: 119.0,
    includedUsability: [
      "Alunos ilimitados (escala total da sua consultoria)",
      "Destaque no topo do ranking do Marketplace na sua região",
      "Módulo de Avaliação Física & Bioimpedância para alunos",
      "Link exclusivo de contratação de consultorias",
      "Lembretes e cobrança automática de alunos via WhatsApp",
      "Suporte individual prioritário via WhatsApp",
    ],
  },
];

const STUDENT_COMPARISON_ROWS = [
  { feature: "Musculação, Séries e Cargas", basico: true, pro: true, vip: true },
  { feature: "Catraca Digital QR Code", basico: true, pro: true, vip: true },
  { feature: "Agenda de Presenças e Histórico", basico: true, pro: true, vip: true },
  { feature: "Marketplace de Personais", basico: true, pro: true, vip: true },
  { feature: "Biomecânica 3D & GIFs Posturais", basico: false, pro: true, vip: true },
  { feature: "Aulas Coletivas com Reserva", basico: false, pro: true, vip: true },
  { feature: "GymBot IA 24/7 (Treino & Macros)", basico: false, pro: true, vip: true },
  { feature: "Bioimpedância InBody Mensal", basico: false, pro: false, vip: true },
  { feature: "Sessão Presencial com Personal", basico: false, pro: false, vip: true },
  { feature: "Convite Cortesia para Amigo", basico: false, pro: false, vip: true },
];

const COACH_COMPARISON_ROWS = [
  { feature: "Capacidade de Alunos Ativos", starter: "10 alunos", pro: "35 alunos", vip: "Ilimitados" },
  { feature: "Prescrição de Fichas Digitais", starter: true, pro: true, vip: true },
  { feature: "Agenda & Agendamentos", starter: true, pro: true, vip: true },
  { feature: "Marketplace da Cidade", starter: "Básico", pro: "Selo Verificado", vip: "Topo do Ranking" },
  { feature: "Biomecânica 3D para Alunos", starter: false, pro: true, vip: true },
  { feature: "Gestão Financeira & PIX", starter: false, pro: true, vip: true },
  { feature: "GymBot IA Copilot de Fichas", starter: false, pro: true, vip: true },
  { feature: "Módulo Avaliação & InBody", starter: false, pro: false, vip: true },
  { feature: "Link Direto de Contratação", starter: false, pro: false, vip: true },
  { feature: "WhatsApp Automático para Alunos", starter: false, pro: false, vip: true },
  { feature: "Suporte Prioritário Individual", starter: false, pro: false, vip: true },
];

export function SubscriptionOnboardingModal({
  isOpen,
  onSuccess,
  user,
}: SubscriptionOnboardingModalProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => user || getCurrentUser());
  const initialRole: RoleType = (user?.activeRole || currentUser?.activeRole) === "coach" ? "coach" : "student";
  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);
  const [isTrialAvailable, setIsTrialAvailable] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<string>(() =>
    initialRole === "coach" ? "coach_pro" : "pro"
  );
  const [billingMethod, setBillingMethod] = useState<BillingType>("recurring");
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  const activePlans = selectedRole === "coach" ? COACH_PLANS : STUDENT_PLANS;
  const currentPlanConfig = activePlans.find((p) => p.id === selectedPlan) || activePlans[1] || activePlans[0];

  const handleSwitchRole = (role: RoleType) => {
    triggerHaptic("selection");
    setSelectedRole(role);
    if (role === "coach") {
      setSelectedPlan("coach_pro");
    } else {
      setSelectedPlan("pro");
    }
  };

  // PIX direto gerado pelo Mercado Pago
  const [pixData, setPixData] = useState<{
    id?: string;
    qrCode: string;
    qrCodeBase64?: string;
    amount: number;
    planName: string;
    planTier: "basico" | "pro" | "vip";
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const userHasActiveTrial =
    currentUser.subscriptionStatus === "trial" &&
    Boolean(currentUser.trialEndsAt) &&
    new Date(currentUser.trialEndsAt!).getTime() > Date.now();

  const remainingDays = userHasActiveTrial ? getRemainingTrialDays(currentUser) : 0;

  useEffect(() => {
    if (isOpen) {
      const active = user || getCurrentUser();
      setCurrentUser(active);

      const hasActive =
        active.subscriptionStatus === "trial" &&
        Boolean(active.trialEndsAt) &&
        new Date(active.trialEndsAt!).getTime() > Date.now();

      if (hasActive) {
        setIsTrialAvailable(true);
        setSelectedPlan("trial");
      } else {
        isTrialAvailableForDevice().then((available) => {
          setIsTrialAvailable(available);
          if (available) {
            setSelectedPlan("trial");
          } else {
            setSelectedPlan("pro");
          }
        });
      }
    }
  }, [isOpen, user]);

  // Polling automático da compensação do PIX a cada 4 segundos
  useEffect(() => {
    if (!isOpen || !pixData?.id) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const u = getCurrentUser();
        const res = await fetch(`/api/payment/check?id=${pixData.id}&userId=${u.id}`);
        const data = await res.json();
        if (data.success && data.status === "approved") {
          activatePaidPlanForUser(selectedPlan, false, pixData.planTier, u);
          triggerHaptic("success");
          onSuccess();
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, pixData, selectedPlan, onSuccess]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // 1. ATIVAR TESTE DE 7 DIAS GRÁTIS
  // --------------------------------------------------------------------------
  const handleStartFreeTrial = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      if (!userHasActiveTrial) {
        const allowed = await isTrialAvailableForDevice();
        if (!allowed) {
          throw new Error(
            "Aviso: Este aparelho já utilizou o período de 7 dias grátis anteriormente. Por favor, selecione um plano para continuar."
          );
        }
      }

      const trialPlanId = selectedRole === "coach" ? "trial_coach_7d" : "trial_7d";
      const trialReason =
        selectedRole === "coach"
          ? "GymFlow Personal Pro — 7 Dias Grátis com Cobrança Posterior"
          : "GymFlow Aluno Pro — 7 Dias Grátis com Cobrança Posterior";
      const trialPrice = selectedRole === "coach" ? 69.9 : 39.9;

      // Tenta acionar o checkout de assinatura recorrente com free trial no Mercado Pago
      try {
        const idempotencyKey =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `trial_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        const res = await fetch("/api/payment/mercadopago/subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            reason: trialReason,
            price: trialPrice,
            payerEmail: currentUser.email || "usuario@gymflow.com",
            freeTrialDays: 7,
            userId: currentUser.id,
            planId: trialPlanId,
            idempotencyKey,
          }),
        });

        const data = await res.json();
        if (data.initPoint && !data.isSimulated) {
          await markTrialAsUsedOnDevice();
          const activated = activateTrialForUser(7, currentUser, trialPlanId);
          await saveProfileToSupabase(activated);
          window.location.href = data.initPoint;
          return;
        }
      } catch (err) {
        console.warn("Mercado Pago em modo direto local:", err);
      }

      // Ativação direta local do trial de 7 dias com persistência garantida no Supabase
      await markTrialAsUsedOnDevice();
      const activated = activateTrialForUser(7, currentUser, trialPlanId);
      await saveProfileToSupabase(activated);
      setCurrentUser(activated);
      triggerHaptic("success");
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao ativar período de teste.");
      triggerHaptic("warning");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // 2. ASSINATURA RECORRENTE NO MERCADO PAGO (CARTÃO)
  // --------------------------------------------------------------------------
  const handleStartRecurringSubscription = async (plan: PlanConfig) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sub_${plan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const targetPlanId =
        plan.id === "trial"
          ? selectedRole === "coach"
            ? "trial_coach_7d"
            : "trial_7d"
          : selectedRole === "coach" && !plan.id.endsWith("_rec")
          ? `${plan.id}_rec`
          : plan.id;

      const res = await fetch("/api/payment/mercadopago/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          reason: `GymFlow ${plan.name} — Assinatura Recorrente`,
          price: plan.recurringPrice,
          payerEmail: currentUser.email || "usuario@gymflow.com",
          freeTrialDays: 0,
          userId: currentUser.id,
          planId: targetPlanId,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Falha ao gerar link de assinatura");
      }

      if (data.initPoint && !data.isSimulated) {
        window.location.href = data.initPoint;
      } else {
        // Homologação / Simulado
        activatePaidPlanForUser(targetPlanId, true, plan.tier);
        triggerHaptic("success");
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Não foi possível conectar ao Mercado Pago.");
      triggerHaptic("warning");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // 3. PAGAMENTO DIRETO VIA PIX NO MERCADO PAGO
  // --------------------------------------------------------------------------
  const handleGeneratePixPayment = async (plan: PlanConfig) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `pix_${plan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const res = await fetch("/api/payment/mercadopago/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          amount: plan.pixPrice,
          description: `GymFlow ${plan.name} (30 Dias de Acesso)`,
          payerEmail: currentUser.email || "usuario@gymflow.com",
          payerName: currentUser.name || (selectedRole === "coach" ? "Personal GymFlow" : "Aluno GymFlow"),
          userId: currentUser.id,
          planId: plan.id,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.pix) {
        throw new Error(data.error || "Falha ao gerar código PIX.");
      }

      setPixData({
        id: data.pix.id ? String(data.pix.id) : undefined,
        qrCode: data.pix.qr_code,
        qrCodeBase64: data.pix.qr_code_base64,
        amount: data.pix.amount || plan.pixPrice,
        planName: plan.name,
        planTier: plan.tier,
      });

      triggerHaptic("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao gerar cobrança PIX.");
      triggerHaptic("warning");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmação manual de PIX
  const handleConfirmPixPaid = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (pixData?.id) {
        const u = getCurrentUser();
        const res = await fetch(`/api/payment/check?id=${pixData.id}&userId=${u.id}`);
        const data = await res.json();

        if (data.success && data.status === "approved") {
          activatePaidPlanForUser(selectedPlan, false, pixData.planTier);
          triggerHaptic("success");
          onSuccess();
          return;
        }

        if (data.status === "pending" || data.status === "in_process") {
          setErrorMessage("Pagamento ainda em processamento pelo banco. Se já realizou a transferência, aguarde alguns instantes.");
          triggerHaptic("warning");
          return;
        }

        setErrorMessage(data.message || "Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.");
        triggerHaptic("warning");
        return;
      }

      // Em modo de demonstração local
      activatePaidPlanForUser(selectedPlan, false, pixData?.planTier || "pro");
      triggerHaptic("success");
      onSuccess();
    } catch {
      setErrorMessage("Erro ao verificar pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qrCode && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopiedPix(true);
      triggerHaptic("light");
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#09090b] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden text-zinc-100 my-auto flex flex-col max-h-[92vh]">
        {/* Glow de Iluminação Superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />

        {/* Header Elegante */}
        <div className="p-5 sm:p-7 border-b border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent text-center relative z-10 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passo Final • Ativação da Sua Conta</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Escolha como deseja começar no GymFlow
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
            Selecione o plano ideal para a sua rotina de treinos. Desbloqueie recursos de acordo com o seu objetivo físico.
          </p>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {errorMessage && (
          <div className="mx-5 sm:mx-7 mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Conteúdo com Scroll Suave */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {/* ============================================================= */}
          {/* SE PIX FOI GERADO: EXIBE TELA DE PAGAMENTO PIX */}
          {/* ============================================================= */}
          {pixData ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                  PIX Instantâneo Mercado Pago
                </span>
                <h3 className="text-xl font-black text-white pt-1">
                  Total a pagar: R$ {pixData.amount.toFixed(2).replace(".", ",")}
                </h3>
                <p className="text-xs text-zinc-400">
                  {pixData.planName} • Acesso liberado automaticamente após a transferência.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-zinc-950 mx-auto max-w-[240px] shadow-xl">
                {pixData.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX Mercado Pago"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-2">
                    <QrCode className="w-24 h-24 text-zinc-800 mb-2" />
                    <span className="text-[11px] font-mono text-zinc-600">
                      Use a Chave Copia e Cola abaixo
                    </span>
                  </div>
                )}
                <span className="text-[10px] font-bold text-zinc-500 mt-2 tracking-wide uppercase">
                  Aponte a câmera do seu banco
                </span>
              </div>

              {/* Chave Copia e Cola */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">
                  Chave PIX Copia e Cola:
                </label>
                <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-white/[0.08] flex items-center justify-between gap-2">
                  <input
                    type="text"
                    readOnly
                    maxLength={500}
                    value={pixData.qrCode}
                    className="w-full bg-transparent text-[11px] font-mono text-zinc-300 truncate focus:outline-none px-1"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shrink-0 flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 animate-pulse text-emerald-400" />
                <span>Aguardando confirmação do banco... Esta tela atualiza automaticamente assim que o pagamento for recebido.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => setPixData(null)}
                  className="w-full py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-bold text-xs transition-colors"
                >
                  Voltar e Escolher Outro Plano
                </button>
                <button
                  onClick={handleConfirmPixPaid}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isLoading ? "Verificando..." : "Já fiz o pagamento PIX"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================= */
            /* SELETOR DE MÉTODO DE PAGAMENTO & LISTA DE PLANOS */
            /* ============================================================= */
            <div className="space-y-4">
              {/* Seletor de Perfil: Aluno vs Professor */}
              <div className="space-y-1.5">
                <div className="flex items-center p-1 rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole("student")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === "student"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black shadow-md"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Planos para Alunos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole("coach")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === "coach"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black shadow-md"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Planos para Professores & Personais</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 px-1 text-center">
                  {selectedRole === "student"
                    ? "Treinos inteligentes, Biomecânica 3D, catraca digital, aulas coletivas e GymBot IA."
                    : "Gestão completa de alunos, prescrição digital com 3D, marketplace regional e controle de mensalidades."}
                </p>
              </div>

              {/* Seletor de Tipo de Pagamento: Cartão Recorrente vs PIX */}
              <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setBillingMethod("recurring");
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    billingMethod === "recurring"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão Recorrente Mensal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setBillingMethod("pix");
                    if (selectedPlan === "trial") {
                      setSelectedPlan(selectedRole === "coach" ? "coach_pro" : "pro");
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    billingMethod === "pix"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>PIX Instantâneo (Avulso 30 Dias)</span>
                </button>
              </div>

              {/* Informação do Método Escolhido */}
              <div className="text-[11px] text-zinc-400 px-1 flex items-center justify-between">
                {billingMethod === "recurring" ? (
                  <span>
                    💡 <strong>Cobrança recorrente no cartão:</strong> Não ocupa o limite total do cartão, apenas a mensalidade. Cancele a qualquer momento.
                  </span>
                ) : (
                  <span>
                    💡 <strong>PIX Avulso de 30 dias:</strong> Sem renovação automática. Pague quando desejar continuar.
                  </span>
                )}
              </div>

              {/* Grid de Cards dos Planos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePlans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const isTrial = plan.id === "trial";
                  const isTrialDisabled = isTrial && !isTrialAvailable && !userHasActiveTrial;

                  // Se o usuário selecionou a aba PIX, 7 dias grátis fica visualmente desabilitado
                  const isPixDisabled = isTrial && billingMethod === "pix" && !userHasActiveTrial;

                  let priceDisplay = "";
                  let periodDisplay = "";

                  if (isTrial) {
                    if (userHasActiveTrial) {
                      priceDisplay = "R$ 0,00";
                      periodDisplay = `${remainingDays}d restantes`;
                    } else {
                      priceDisplay = "R$ 0,00";
                      periodDisplay = "hoje (7 dias grátis)";
                    }
                  } else if (billingMethod === "recurring") {
                    priceDisplay = `R$ ${plan.recurringPrice.toFixed(2).replace(".", ",")}`;
                    periodDisplay = "/mês no cartão";
                  } else {
                    priceDisplay = `R$ ${plan.pixPrice.toFixed(2).replace(".", ",")}`;
                    periodDisplay = "30 dias no PIX";
                  }

                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        if (isTrialDisabled || isPixDisabled) return;
                        triggerHaptic("selection");
                        setSelectedPlan(plan.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? plan.id === "vip"
                            ? "bg-amber-950/20 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
                            : "bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                          : isTrialDisabled || isPixDisabled
                          ? "bg-zinc-900/30 border-white/[0.04] opacity-40 cursor-not-allowed"
                          : "bg-zinc-900/60 border-white/[0.08] hover:border-white/[0.18]"
                      }`}
                    >
                      {/* Topo do Card */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isTrial && userHasActiveTrial
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : plan.badgeColor
                            }`}
                          >
                            {isTrial && userHasActiveTrial
                              ? `TESTE ATIVO (${remainingDays} ${remainingDays === 1 ? "DIA" : "DIAS"})`
                              : plan.badge}
                          </span>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? plan.id === "vip"
                                  ? "border-amber-500 bg-amber-500 text-zinc-950"
                                  : "border-emerald-500 bg-emerald-500 text-zinc-950"
                                : "border-white/20"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="flex items-baseline justify-between gap-1">
                          <h4 className="text-base font-black text-white">{plan.name}</h4>
                          <div className="text-right">
                            <span className="text-base font-black text-white">{priceDisplay}</span>
                            <span className="text-[10px] text-zinc-400 ml-1">{periodDisplay}</span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 mt-1 leading-snug">
                          {isTrial && userHasActiveTrial
                            ? "Seu período de teste Pro está em andamento. Aproveite todos os recursos."
                            : plan.tagline}
                        </p>
                      </div>

                      {/* Lista de Recursos e Usabilidade no App */}
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5 text-xs">
                        {plan.includedUsability.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-zinc-300">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                plan.id === "vip" ? "text-amber-400" : "text-emerald-400"
                              }`}
                            />
                            <span className="leading-tight">{item}</span>
                          </div>
                        ))}

                        {plan.lockedUsability?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-zinc-500">
                            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-600" />
                            <span className="leading-tight line-through opacity-80">{item}</span>
                          </div>
                        ))}
                      </div>

                      {isTrial && userHasActiveTrial && (
                        <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Período de teste ativo. Restam {remainingDays} {remainingDays === 1 ? "dia" : "dias"}.</span>
                        </div>
                      )}

                      {isTrialDisabled && (
                        <div className="mt-2 text-[10px] font-bold text-rose-400">
                          {currentUser.subscriptionStatus === "trial"
                            ? "Seu período de 7 dias grátis terminou. Selecione um plano para continuar."
                            : "Trial de 7 dias já foi utilizado neste aparelho."}
                        </div>
                      )}

                      {isPixDisabled && (
                        <div className="mt-2 text-[10px] font-bold text-zinc-400">
                          O teste grátis é exclusivo para cadastro com Cartão.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botão de Toggle da Matriz de Usabilidade */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setShowComparison((prev) => !prev);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-semibold text-zinc-300 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Ver tabela comparativa de recursos dentro do app</span>
                  </span>
                  {showComparison ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>

                {showComparison && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] overflow-x-auto animate-in fade-in duration-200">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-zinc-400">
                          <th className="py-2 pr-2 font-bold">
                            {selectedRole === "coach" ? "Recurso de Consultoria & Gestão" : "Recurso no GymFlow"}
                          </th>
                          <th className="py-2 px-2 text-center font-bold">
                            {selectedRole === "coach" ? "Starter" : "Básico"}
                          </th>
                          <th className="py-2 px-2 text-center font-bold text-emerald-400">Pro</th>
                          <th className="py-2 pl-2 text-center font-bold text-amber-400">
                            {selectedRole === "coach" ? "Elite VIP" : "VIP"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {(selectedRole === "coach" ? COACH_COMPARISON_ROWS : STUDENT_COMPARISON_ROWS).map((row: any, idx: number) => {
                          const valBasico = selectedRole === "coach" ? row.starter : row.basico;
                          const valPro = row.pro;
                          const valVip = row.vip;

                          const renderCell = (val: any, isVip = false) => {
                            if (typeof val === "boolean") {
                              return val ? (
                                <Check className={`w-3.5 h-3.5 mx-auto stroke-[3] ${isVip ? "text-amber-400" : "text-emerald-400"}`} />
                              ) : (
                                <span className="text-zinc-600">—</span>
                              );
                            }
                            return <span className={`text-[10px] font-bold ${isVip ? "text-amber-300" : "text-zinc-300"}`}>{val}</span>;
                          };

                          return (
                            <tr key={idx} className="hover:bg-white/[0.02]">
                              <td className="py-2 pr-2 text-zinc-300 font-medium">{row.feature}</td>
                              <td className="py-2 px-2 text-center">{renderCell(valBasico)}</td>
                              <td className="py-2 px-2 text-center">{renderCell(valPro)}</td>
                              <td className="py-2 pl-2 text-center">{renderCell(valVip, true)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* BOTÃO DE AÇÃO DINÂMICO PRINCIPAL */}
              <div className="pt-2">
                {selectedPlan === "trial" ? (
                  <button
                    onClick={userHasActiveTrial ? onSuccess : handleStartFreeTrial}
                    disabled={isLoading || (!isTrialAvailable && !userHasActiveTrial)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? "Ativando acesso..."
                        : userHasActiveTrial
                        ? `Continuar no App (Teste Ativo • ${remainingDays}d restantes)`
                        : "Começar 7 Dias Grátis Agora (R$ 0,00)"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : billingMethod === "recurring" ? (
                  <button
                    onClick={() => handleStartRecurringSubscription(currentPlanConfig)}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50 ${
                      currentPlanConfig.id === "vip"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-emerald-500/25"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? "Conectando ao Mercado Pago..."
                        : `Assinar ${currentPlanConfig.name} no Cartão (R$ ${currentPlanConfig.recurringPrice.toFixed(2).replace(".", ",")}/mês)`}
                    </span>
                    <ExternalLink className="w-4 h-4 opacity-75" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleGeneratePixPayment(currentPlanConfig)}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-zinc-950" />
                    <span>
                      {isLoading
                        ? "Gerando código PIX..."
                        : `Gerar QR Code PIX (R$ ${currentPlanConfig.pixPrice.toFixed(2).replace(".", ",")})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Barra de Gestão & Cancelamento de Inscrição */}
              {(currentUser.subscriptionStatus === "active" ||
                currentUser.subscriptionStatus === "trial" ||
                currentUser.subscriptionStatus === "canceled") && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        currentUser.subscriptionStatus === "canceled"
                          ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                          : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {currentUser.subscriptionStatus === "canceled" ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">
                          {currentUser.subscriptionStatus === "canceled"
                            ? "Assinatura Cancelada"
                            : currentUser.subscriptionStatus === "trial"
                            ? "Período de Testes Pro Ativo"
                            : `Assinatura Ativa (${currentPlanConfig.name})`}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            currentUser.subscriptionStatus === "canceled"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {currentUser.subscriptionStatus === "canceled"
                            ? "Não renovará"
                            : "Ativa"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {currentUser.subscriptionStatus === "canceled"
                          ? `Acesso liberado até ${
                              currentUser.subscriptionEndsAt || currentUser.trialEndsAt
                                ? new Date(
                                    currentUser.subscriptionEndsAt || currentUser.trialEndsAt!
                                  ).toLocaleDateString("pt-BR")
                                : "o fim do período"
                            }. Zero cobranças futuras.`
                          : "Você pode cancelar a qualquer momento sem taxas ou fidelidade."}
                      </p>
                    </div>
                  </div>

                  {currentUser.subscriptionStatus !== "canceled" ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("warning");
                        setIsCancelModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-300 font-bold text-xs border border-white/[0.08] hover:border-rose-500/30 transition-all active:scale-95"
                    >
                      Cancelar Inscrição
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        handleStartRecurringSubscription(currentPlanConfig);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                    >
                      Reativar Assinatura
                    </button>
                  )}
                </div>
              )}

              {/* Seção Completa de Perguntas Frequentes (FAQ) */}
              <div className="pt-4 border-t border-white/[0.08]">
                <SubscriptionFAQ />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Segurança & Conta Conectada */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-zinc-950/80 text-center space-y-2 shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ambiente Seguro • Processamento protegido pelo Mercado Pago</span>
          </div>

          {currentUser?.email && currentUser.id !== "user_me" && (
            <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-center gap-2 text-xs text-zinc-400 flex-wrap">
              <span>
                Conectado como{" "}
                <strong className="text-zinc-200 font-mono font-medium">
                  {maskEmail(currentUser.email)}
                </strong>
              </span>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("warning");
                  logoutUser();
                  window.location.reload();
                }}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors font-medium hover:underline"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
      <CancelSubscriptionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          const fresh = getCurrentUser();
          setCurrentUser(fresh);
          setIsCancelModalOpen(false);
        }}
        user={currentUser}
      />
    </div>
  );
}
