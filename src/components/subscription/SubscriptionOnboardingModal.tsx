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
  X,
  Users,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getCurrentUser,
  activateTrialForUser,
  activatePaidPlanForUser,
  logoutUser,
  UserProfile,
} from "@/lib/auth-store";
import { maskEmail } from "@/lib/security";
import {
  isTrialAvailableForDevice,
  markTrialAsUsedOnDevice,
} from "@/lib/device-lockout";

interface SubscriptionOnboardingModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  user?: UserProfile;
}

type PlanKey = "trial" | "basico" | "pro" | "vip";
type BillingType = "recurring" | "pix";

interface PlanConfig {
  id: PlanKey;
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

const PLANS: PlanConfig[] = [
  {
    id: "trial",
    tier: "pro",
    badge: "EXPERIMENTE GRÁTIS",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    name: "7 Dias Grátis",
    tagline: "Desbloqueia todos os recursos do Plano Pro sem pagar nada hoje.",
    recurringPrice: 0,
    pixPrice: 0,
    includedUsability: [
      "Acesso completo ao Plano Pro por 7 dias",
      "Biomecânica 3D & GIFs de 233+ exercícios",
      "GymBot IA 24/7 (Substituições & Dieta)",
      "Reserva de vagas em Aulas Coletivas",
      "Sem cobrança imediata (Cancele quando quiser)",
    ],
  },
  {
    id: "basico",
    tier: "basico",
    badge: "ESSENCIAL",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    name: "Plano Básico",
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
    tier: "pro",
    badge: "MAIS ESCOLHIDO 🔥",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    name: "Plano Pro",
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
    tier: "vip",
    badge: "MÁXIMA PERFORMANCE 👑",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    name: "Plano VIP Black",
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

const COMPARISON_ROWS = [
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

export function SubscriptionOnboardingModal({
  isOpen,
  onSuccess,
  user,
}: SubscriptionOnboardingModalProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => user || getCurrentUser());
  const [isTrialAvailable, setIsTrialAvailable] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro");
  const [billingMethod, setBillingMethod] = useState<BillingType>("recurring");
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (isOpen) {
      const active = user || getCurrentUser();
      setCurrentUser(active);
      isTrialAvailableForDevice().then((available) => {
        setIsTrialAvailable(available);
        if (available) {
          setSelectedPlan("trial");
        } else {
          setSelectedPlan("pro");
        }
      });
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
          activatePaidPlanForUser(selectedPlan, false, pixData.planTier);
          triggerHaptic("success");
          onSuccess();
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, pixData, selectedPlan, onSuccess]);

  if (!isOpen) return null;

  const currentPlanConfig = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];

  // --------------------------------------------------------------------------
  // 1. ATIVAR TESTE DE 7 DIAS GRÁTIS
  // --------------------------------------------------------------------------
  const handleStartFreeTrial = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      const allowed = await isTrialAvailableForDevice();
      if (!allowed) {
        throw new Error(
          "Aviso: Este aparelho já utilizou o período de 7 dias grátis anteriormente. Por favor, selecione um plano para continuar."
        );
      }

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
            reason: "GymFlow Pro — 7 Dias Grátis com Cobrança Posterior",
            price: 39.9,
            payerEmail: currentUser.email || "aluno@gymflow.com",
            freeTrialDays: 7,
            userId: currentUser.id,
            planId: "trial_7d",
            idempotencyKey,
          }),
        });

        const data = await res.json();
        if (data.initPoint && !data.isSimulated) {
          await markTrialAsUsedOnDevice();
          activateTrialForUser(7);
          window.location.href = data.initPoint;
          return;
        }
      } catch (err) {
        console.warn("Mercado Pago em modo direto local:", err);
      }

      // Ativação direta local do trial de 7 dias
      await markTrialAsUsedOnDevice();
      activateTrialForUser(7);
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

      const res = await fetch("/api/payment/mercadopago/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          reason: `GymFlow ${plan.name} — Assinatura Recorrente`,
          price: plan.recurringPrice,
          payerEmail: currentUser.email || "aluno@gymflow.com",
          freeTrialDays: 0,
          userId: currentUser.id,
          planId: plan.id,
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
        activatePaidPlanForUser(plan.id, true, plan.tier);
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
          payerEmail: currentUser.email || "aluno@gymflow.com",
          payerName: currentUser.name || "Aluno GymFlow",
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
                      setSelectedPlan("pro");
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
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const isTrial = plan.id === "trial";
                  const isTrialDisabled = isTrial && !isTrialAvailable;

                  // Se o usuário selecionou a aba PIX, 7 dias grátis fica visualmente desabilitado
                  const isPixDisabled = isTrial && billingMethod === "pix";

                  let priceDisplay = "";
                  let periodDisplay = "";

                  if (isTrial) {
                    priceDisplay = "R$ 0,00";
                    periodDisplay = "hoje (7 dias grátis)";
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
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${plan.badgeColor}`}
                          >
                            {plan.badge}
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
                          {plan.tagline}
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

                      {isTrialDisabled && (
                        <div className="mt-2 text-[10px] font-bold text-rose-400">
                          Trial de 7 dias já foi utilizado neste aparelho.
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
                          <th className="py-2 pr-2 font-bold">Recurso no GymFlow</th>
                          <th className="py-2 px-2 text-center font-bold">Básico</th>
                          <th className="py-2 px-2 text-center font-bold text-emerald-400">Pro</th>
                          <th className="py-2 pl-2 text-center font-bold text-amber-400">VIP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {COMPARISON_ROWS.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-2 pr-2 text-zinc-300 font-medium">{row.feature}</td>
                            <td className="py-2 px-2 text-center">
                              {row.basico ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto stroke-[3]" />
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {row.pro ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto stroke-[3]" />
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="py-2 pl-2 text-center">
                              {row.vip ? (
                                <Check className="w-3.5 h-3.5 text-amber-400 mx-auto stroke-[3]" />
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* BOTÃO DE AÇÃO DINÂMICO PRINCIPAL */}
              <div className="pt-2">
                {selectedPlan === "trial" ? (
                  <button
                    onClick={handleStartFreeTrial}
                    disabled={isLoading || !isTrialAvailable}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isLoading ? "Ativando acesso..." : "Começar 7 Dias Grátis Agora (R$ 0,00)"}</span>
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
    </div>
  );
}
