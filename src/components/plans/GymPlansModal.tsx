"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  Zap,
  CreditCard,
  QrCode,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Flame,
  X,
  RotateCcw,
  Dumbbell,
  GraduationCap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { activatePaidPlanForUser, getCurrentUser, UserProfile } from "@/lib/auth-store";
import { getRemainingTrialDays } from "@/lib/subscription-features";
import { SubscriptionFAQ } from "../subscription/SubscriptionFAQ";
import { CancelSubscriptionModal } from "../subscription/CancelSubscriptionModal";

export interface PlanOption {
  id: string;
  name: string;
  tag?: string;
  price: string;
  billingPeriod: string;
  popular?: boolean;
  studentFeatures: string[];
  coachFeatures: string[];
  features?: string[];
}

export const UNIFIED_PLANS: PlanOption[] = [
  {
    id: "basico",
    name: "GymFlow Básico",
    price: "35,00",
    billingPeriod: "/mês",
    studentFeatures: [
      "Acesso à musculação, aeróbico e catraca digital",
      "Fichas de treino essenciais e registro de cargas",
      "Histórico de frequência e evolução",
      "Marketplace para contratar Personal",
    ],
    coachFeatures: [
      "Gestão de até 10 alunos particulares",
      "Prescrição de fichas digitais de musculação",
      "Agenda de atendimentos e horários",
      "Recebimento de pagamentos via PIX",
    ],
  },
  {
    id: "pro",
    name: "GymFlow Pro",
    popular: true,
    price: "45,00",
    billingPeriod: "/mês",
    studentFeatures: [
      "Tudo do Plano Básico incluso",
      "Biomecânica 3D postural & GIFs de 233+ exercícios",
      "GymBot IA 24/7 (Dúvidas de treino e dieta)",
      "Histórico ilimitado de PRs e cargas",
      "Aulas coletivas e rotinas funcionais",
    ],
    coachFeatures: [
      "Gestão de até 35 alunos particulares",
      "Prescrição 3D com análise biomecânica para alunos",
      "Catálogo ilimitado de rotinas salvas",
      "Perfil com Selo Verificado no Marketplace",
      "GymBot IA Copilot para prescrição rápida",
    ],
  },
  {
    id: "vip",
    name: "GymFlow VIP Black",
    price: "55,00",
    billingPeriod: "/mês",
    studentFeatures: [
      "Tudo do Plano Pro incluso",
      "Bioimpedância InBody mensal inclusa",
      "Módulo de Avaliação Física & Composição Corporal",
      "Acompanhamento comparativo de medidas e fotos",
      "Suporte VIP prioritário e recomendações exclusivas",
    ],
    coachFeatures: [
      "Alunos ilimitados no seu roster",
      "Máximo destaque no topo do Marketplace regional",
      "Relatórios de bioimpedância para seus alunos",
      "Link exclusivo de contratação de consultorias",
      "Suporte VIP prioritário individual",
    ],
  },
];

export const STUDENT_PLANS = UNIFIED_PLANS;
export const COACH_PLANS = UNIFIED_PLANS;
export const PLANS = UNIFIED_PLANS;

interface GymPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GymPlansModal({ isOpen, onClose }: GymPlansModalProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getCurrentUser());
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [checkoutStep, setCheckoutStep] = useState<"plans" | "payment" | "success">("plans");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixStatusMessage, setPixStatusMessage] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Dados do PIX dinâmico
  const [pixData, setPixData] = useState<{
    id?: string;
    qrCode?: string;
    qrCodeBase64?: string;
  } | null>(null);

  const [isMpConfigured, setIsMpConfigured] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const freshUser = getCurrentUser();
      setCurrentUser(freshUser);
      setCheckoutStep("plans");
      setCopiedPix(false);
      setPixData(null);
      setPixStatusMessage(null);
      setIsProcessing(false);

      if (freshUser.planTier === "vip" || freshUser.subscriptionPlan?.includes("vip")) {
        setSelectedPlanId("vip");
      } else if (freshUser.planTier === "basico" || freshUser.subscriptionPlan?.includes("basico")) {
        setSelectedPlanId("basico");
      } else {
        setSelectedPlanId("pro");
      }

      fetch("/api/payment/check")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.configured !== undefined) {
            setIsMpConfigured(Boolean(data.configured));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const currentPlan =
    UNIFIED_PLANS.find((p) => p.id === selectedPlanId) ||
    UNIFIED_PLANS[1] ||
    UNIFIED_PLANS[0];

  // Polling automático para confirmação imediata do PIX
  useEffect(() => {
    if (!isOpen || checkoutStep !== "payment" || paymentMethod !== "pix" || !pixData?.id) return;

    const interval = setInterval(async () => {
      try {
        const user = getCurrentUser();
        const res = await fetch(`/api/payment/check?id=${pixData.id}&userId=${user.id}`);
        const data = await res.json();

        if (data.success && data.status === "approved") {
          const determinedTier = currentPlan.id.includes("vip")
            ? "vip"
            : currentPlan.id.includes("basico") || currentPlan.id.includes("starter")
            ? "basico"
            : "pro";
          activatePaidPlanForUser(currentPlan.id, false, determinedTier);
          triggerHaptic("success");
          setCheckoutStep("success");
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, checkoutStep, paymentMethod, pixData?.id, selectedPlanId, currentPlan.id]);

  if (!isOpen) return null;

  const handleSelectPlan = (planId: string) => {
    triggerHaptic("selection");
    setSelectedPlanId(planId);
  };

  const handleProceedToPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic("medium");
    setPixStatusMessage(null);

    try {
      const user = getCurrentUser();
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const res = await fetch("/api/payment/mercadopago/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          planId: currentPlan.id,
          description: `GymFlow — ${currentPlan.name}`,
          payerEmail: user.email || "usuario@gymflow.com",
          payerName: user.name || "Membro GymFlow",
          userId: user.id,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (data.pix) {
        setPixData({
          id: data.pix.id ? String(data.pix.id) : undefined,
          qrCode: data.pix.qr_code,
          qrCodeBase64: data.pix.qr_code_base64,
        });
      }
      setCheckoutStep("payment");
    } catch (e) {
      console.warn("PIX local fallback:", e);
      setCheckoutStep("payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPix = () => {
    triggerHaptic("success");
    const code =
      pixData?.qrCode ||
      "00020126580014BR.GOV.BCB.PIX0136gymflow-sandbox-mp-checkout@gymflow.app5204000053039865405139.905802BR5915GYMFLOW BRASIL6009SAO PAULO62070503***6304D2E5";
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleVerifyPayment = async () => {
    if (isProcessing) return;
    triggerHaptic("heavy");
    setIsProcessing(true);
    setPixStatusMessage(null);

    const determinedTier = currentPlan.id.includes("vip")
      ? "vip"
      : currentPlan.id.includes("basico") || currentPlan.id.includes("starter")
      ? "basico"
      : "pro";

    try {
      const user = getCurrentUser();

      if (paymentMethod === "card") {
        const cardIdempotencyKey =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        const res = await fetch("/api/payment/mercadopago/preference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": cardIdempotencyKey,
          },
          body: JSON.stringify({
            planId: currentPlan.id,
            title: `GymFlow — ${currentPlan.name}`,
            payerEmail: user.email || "usuario@gymflow.com",
            payerName: user.name || "Membro GymFlow",
            userId: user.id,
            idempotencyKey: cardIdempotencyKey,
          }),
        });
        const data = await res.json();
        if (data.initPoint && !data.isSimulated) {
          window.location.href = data.initPoint;
          return;
        }

        activatePaidPlanForUser(currentPlan.id, true, determinedTier);
        setCheckoutStep("success");
        triggerHaptic("success");
        return;
      }

      if (pixData?.id) {
        const res = await fetch(`/api/payment/check?id=${pixData.id}&userId=${user.id}`);
        const data = await res.json();

        if (data.success && data.status === "approved") {
          activatePaidPlanForUser(currentPlan.id, false, determinedTier);
          setCheckoutStep("success");
          triggerHaptic("success");
          return;
        }

        if (data.status === "pending" || data.status === "in_process") {
          setPixStatusMessage(
            "Pagamento ainda não detectado pelo banco. Se já pagou, aguarde 10 a 30 segundos pela compensação do PIX e clique novamente."
          );
          triggerHaptic("warning");
          return;
        }
      }

      if (!isMpConfigured) {
        activatePaidPlanForUser(currentPlan.id, false, determinedTier);
        setCheckoutStep("success");
        triggerHaptic("success");
        return;
      }

      setPixStatusMessage("Aguardando confirmação bancária. Copie o código PIX e pague no app do seu banco.");
    } catch {
      setPixStatusMessage("Erro ao verificar pagamento. Tente novamente em instantes.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/[0.1] sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header do Modal */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Planos GymFlow Unificados</h2>
              <p className="text-[10px] text-zinc-400">Um plano único para treinar e prescrever</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo Conforme o Passo */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 no-scrollbar">
          {checkoutStep === "plans" && (
            <>
              {/* Banner Explicativo de Plano Unificado */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/70 to-amber-950/30 border border-white/[0.08] flex items-center gap-3 shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white">Assinatura Total em Dobro</p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Sua assinatura GymFlow libera simultaneamente o <strong>Lado Aluno</strong> (para o seu treino) e o <strong>Lado Professor</strong> (para atender e prescrever).
                  </p>
                </div>
              </div>

              {/* Status Atual da Assinatura / Trial */}
              {(() => {
                const isTrial =
                  currentUser.subscriptionStatus === "trial" &&
                  Boolean(currentUser.trialEndsAt) &&
                  new Date(currentUser.trialEndsAt!).getTime() > Date.now();
                const isPaid =
                  currentUser.subscriptionStatus === "active" &&
                  (!currentUser.subscriptionEndsAt ||
                    new Date(currentUser.subscriptionEndsAt).getTime() > Date.now());
                const isCanceled = currentUser.subscriptionStatus === "canceled";

                if (!isTrial && !isPaid && !isCanceled) return null;

                const remaining = isTrial ? getRemainingTrialDays(currentUser) : 0;
                const endRaw = currentUser.subscriptionEndsAt || currentUser.trialEndsAt;
                let formattedDate = "o término do ciclo";
                if (endRaw) {
                  try {
                    formattedDate = new Date(endRaw).toLocaleDateString("pt-BR");
                  } catch {}
                }

                return (
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-sm ${
                      isCanceled
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isCanceled
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {isCanceled ? (
                          <RotateCcw className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white">
                            {isCanceled
                              ? "Assinatura Cancelada"
                              : isTrial
                              ? "Período de Testes Pro"
                              : "Assinatura Ativa"}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                              isCanceled
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {isCanceled
                              ? `Até ${formattedDate}`
                              : isTrial
                              ? `${remaining}d restantes`
                              : "Renovação Ativa"}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {isCanceled
                            ? "Acesso garantido até o encerramento sem novas cobranças."
                            : "Cancele a qualquer momento sem taxas ou multas."}
                        </p>
                      </div>
                    </div>

                    {!isCanceled ? (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("warning");
                          setIsCancelModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 font-bold text-[10px] border border-white/[0.08] hover:border-rose-500/30 transition-colors shrink-0"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-[10px] transition-all active:scale-95 shadow-sm shrink-0"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Cards de Planos Unificados */}
              <div className="flex flex-col gap-3">
                {UNIFIED_PLANS.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                          : "bg-zinc-900/40 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">{plan.name}</h3>
                            {plan.popular && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Mais Escolhido
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xs text-zinc-400 font-medium">R$</span>
                            <span className="text-2xl font-black text-white font-mono">{plan.price}</span>
                            <span className="text-[11px] text-zinc-400">{plan.billingPeriod}</span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                              : "border-zinc-700 bg-zinc-800/60"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Bloco Duplo: Para Aluno e Para Professor */}
                      <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-2.5">
                        {/* Lado Aluno */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" /> Para Seu Treino Pessoal
                          </span>
                          <div className="space-y-1">
                            {plan.studentFeatures.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-300">
                                <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-snug">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Lado Professor */}
                        <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> Para Atender e Prescrever
                          </span>
                          <div className="space-y-1">
                            {plan.coachFeatures.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-300">
                                <Check className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                <span className="leading-snug">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de Assinar */}
              <button
                onClick={handleProceedToPayment}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Contratar {currentPlan.name} por R$ {currentPlan.price}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Seção de Perguntas Frequentes (FAQ) */}
              <SubscriptionFAQ className="mt-3 pt-3 border-t border-white/[0.08]" />
            </>
          )}

          {checkoutStep === "payment" && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Plano Selecionado</span>
                  <p className="text-xs font-black text-white">{currentPlan.name}</p>
                </div>
                <span className="text-base font-black text-emerald-400 font-mono">R$ {currentPlan.price}</span>
              </div>

              {/* Seletor PIX vs Cartão Mercado Pago */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setPaymentMethod("pix");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                    paymentMethod === "pix"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-zinc-900/60 border-white/[0.06] text-zinc-400"
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>PIX Instantâneo</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setPaymentMethod("card");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                    paymentMethod === "card"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-zinc-900/60 border-white/[0.06] text-zinc-400"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {/* Bloco do PIX */}
              {paymentMethod === "pix" && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex flex-col items-center gap-3">
                  <div className="w-44 h-44 rounded-xl bg-white p-2 flex items-center justify-center">
                    {pixData?.qrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-900 text-center p-2">
                        <QrCode className="w-12 h-12 text-zinc-800 mb-1" />
                        <span className="text-[10px] font-bold">QR Code Oficial PIX</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCopyPix}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Código PIX Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código PIX Copia e Cola</span>
                      </>
                    )}
                  </button>

                  {pixStatusMessage && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold text-center animate-in fade-in">
                      {pixStatusMessage}
                    </div>
                  )}

                  <button
                    onClick={handleVerifyPayment}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all active:scale-98 shadow-md shadow-emerald-500/20"
                  >
                    {isProcessing ? "Verificando com o Banco..." : "Já Fiz o Pagamento"}
                  </button>
                </div>
              )}

              {/* Bloco do Cartão */}
              {paymentMethod === "card" && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2.5 text-zinc-300 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transação segura processada diretamente pelo Mercado Pago.</span>
                  </div>

                  <button
                    onClick={handleVerifyPayment}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all active:scale-98 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Prosseguir para Pagamento com Cartão</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setCheckoutStep("plans")}
                className="text-xs text-zinc-400 hover:text-white transition-colors text-center"
              >
                Voltar e escolher outro plano
              </button>
            </div>
          )}

          {checkoutStep === "success" && (
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-emerald-500/30 flex flex-col items-center text-center gap-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-white">Plano Ativado com Sucesso!</h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs">
                Seu <strong>{currentPlan.name}</strong> está 100% ativo. Você pode treinar como aluno e atender como professor quando desejar.
              </p>
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider mt-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Começar a Usar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cancelamento de Assinatura */}
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
