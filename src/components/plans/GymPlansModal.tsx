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
  features: string[];
}

export const STUDENT_PLANS: PlanOption[] = [
  {
    id: "student_basico",
    name: "Aluno Básico",
    price: "35,00",
    billingPeriod: "/mês",
    features: [
      "Acesso à musculação e aeróbico",
      "Fichas de treino essenciais",
      "Registro e evolução de cargas em tempo real",
      "Histórico de presenças e frequência",
      "Marketplace para contratar Personal",
    ],
  },
  {
    id: "student_pro",
    name: "Aluno Pro",
    popular: true,
    price: "45,00",
    billingPeriod: "/mês",
    features: [
      "Tudo do Plano Básico incluso",
      "Biomecânica 3D postural & GIFs de 233+ exercícios",
      "Calculadora de descanso e substituição de exercícios",
      "GymBot IA 24/7 para dúvidas de treino e dieta",
      "Gráficos de evolução de força e PRs",
    ],
  },
  {
    id: "student_vip",
    name: "Aluno VIP Black",
    price: "55,00",
    billingPeriod: "/mês",
    features: [
      "Tudo do Plano Pro incluso",
      "Bioimpedância InBody mensal inclusa",
      "Módulo de Avaliação Física & Bioimpedância",
      "Acompanhamento comparativo de medidas e fotos",
      "Suporte VIP prioritário e recomendações exclusivas",
    ],
  },
];

export const COACH_PLANS: PlanOption[] = [
  {
    id: "coach_starter",
    name: "Personal Starter",
    price: "49,00",
    billingPeriod: "/mês",
    features: [
      "Gestão de até 10 alunos ativos simultâneos",
      "Prescrição de fichas digitais de musculação",
      "Agenda de aulas e agendamentos de sessões",
      "Perfil ativo no Marketplace GymFlow da região",
      "Envio de treinos direto no app do aluno",
    ],
  },
  {
    id: "coach_pro",
    name: "Personal Pro",
    popular: true,
    price: "79,00",
    billingPeriod: "/mês",
    features: [
      "Gestão de até 35 alunos ativos simultâneos",
      "Prescrição completa com Biomecânica 3D para alunos",
      "Perfil com Selo Verificado e destaque nas buscas",
      "Controle financeiro de mensalidades e recebimento via PIX",
      "GymBot IA Copilot (Periodização e fichas ágeis)",
      "Gráficos de evolução de força de cada aluno",
    ],
  },
  {
    id: "coach_vip",
    name: "Personal Elite VIP",
    price: "119,00",
    billingPeriod: "/mês",
    features: [
      "Alunos ilimitados (escala total da consultoria)",
      "Máximo destaque no topo do Marketplace regional",
      "Módulo de Avaliação Física & Bioimpedância para alunos",
      "Link exclusivo de contratação de consultorias",
      "Lembretes e cobrança automática no WhatsApp",
      "Suporte prioritário individual no WhatsApp",
    ],
  },
];

export const PLANS = STUDENT_PLANS;

interface GymPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GymPlansModal({ isOpen, onClose }: GymPlansModalProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getCurrentUser());
  const initialRole = currentUser.activeRole === "coach" ? "coach" : "student";
  const [selectedRole, setSelectedRole] = useState<"student" | "coach">(initialRole);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialRole === "coach" ? "coach_pro" : "student_pro"
  );
  const [checkoutStep, setCheckoutStep] = useState<"plans" | "payment" | "success">("plans");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ id?: string; qrCode: string; qrCodeBase64?: string } | null>(null);
  const [pixStatusMessage, setPixStatusMessage] = useState<string | null>(null);
  const [isMpConfigured, setIsMpConfigured] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  const currentPlans = selectedRole === "coach" ? COACH_PLANS : STUDENT_PLANS;
  const currentPlan =
    currentPlans.find((p) => p.id === selectedPlanId) ||
    currentPlans[1] ||
    currentPlans[0];

  const handleSwitchRole = (role: "student" | "coach") => {
    triggerHaptic("selection");
    setSelectedRole(role);
    setSelectedPlanId(role === "coach" ? "coach_pro" : "student_pro");
  };

  useEffect(() => {
    if (isOpen) {
      const freshUser = getCurrentUser();
      setCurrentUser(freshUser);
      const role = freshUser.activeRole === "coach" ? "coach" : "student";
      setSelectedRole(role);
      setSelectedPlanId(role === "coach" ? "coach_pro" : "student_pro");
      setCheckoutStep("plans");
      fetch("/api/payment/status")
        .then((res) => res.json())
        .then((data) => {
          if (data?.mercadopago?.configured) {
            setIsMpConfigured(true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Polling automático da compensação do PIX a cada 4 segundos
  useEffect(() => {
    if (!isOpen || checkoutStep !== "payment" || paymentMethod !== "pix" || !pixData?.id) {
      return;
    }

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
          activatePaidPlanForUser(selectedPlanId, false, determinedTier);
          setCheckoutStep("success");
          triggerHaptic("success");
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

    // Gera cobrança PIX no backend do Mercado Pago
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
          payerName: user.name || (selectedRole === "coach" ? "Personal GymFlow" : "Aluno GymFlow"),
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

      // Fluxo Cartão de Crédito: Checkout Pro oficial do Mercado Pago
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
            payerName: user.name || (selectedRole === "coach" ? "Personal GymFlow" : "Aluno GymFlow"),
            userId: user.id,
            idempotencyKey: cardIdempotencyKey,
          }),
        });
        const data = await res.json();
        if (data.initPoint && !data.isSimulated) {
          // Redireciona para o checkout oficial do Mercado Pago
          window.location.href = data.initPoint;
          return;
        }

        // Em modo simulado (sem credenciais), ativa diretamente
        activatePaidPlanForUser(currentPlan.id, true, determinedTier);
        setCheckoutStep("success");
        triggerHaptic("success");
        return;
      }

      // Fluxo PIX: Consulta se já foi compensado no Mercado Pago
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

      // Fallback para modo simulação quando não há credenciais no .env
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
      <div className="w-full max-w-md bg-zinc-950 border border-white/[0.1] sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header do Modal */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Planos de Acesso</h2>
              <p className="text-[10px] text-zinc-400">Checkout Mercado Pago Oficial</p>
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
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {checkoutStep === "plans" && (
            <>
              {/* Status Atual da Assinatura / Trial / Cancelamento */}
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

              {/* Seletor de Perfil: Planos para Alunos vs Treinadores */}
              <div className="space-y-1.5">
                <div className="flex items-center p-1 rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole("student")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === "student"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black shadow-md"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>🏋️‍♂️ Planos para Alunos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole("coach")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === "coach"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black shadow-md"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>👨‍🏫 Planos para Treinadores</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 px-1 text-center">
                  {selectedRole === "student"
                    ? "Planos para treinar, ver fichas 3D, periodização e GymBot IA."
                    : "Planos profissionais para prescrever treinos 3D, gerenciar alunos e captar clientes."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {currentPlans.map((plan) => {
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
                          <h3 className="text-sm font-black text-white">{plan.name}</h3>
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

                      <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex flex-col gap-1.5">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </div>
                        ))}
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

              {/* Bloco PIX */}
              {paymentMethod === "pix" && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.08] flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-white rounded-xl shadow-lg">
                    {pixData?.qrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="PIX QR Code"
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center p-2">
                        <QrCode className="w-24 h-24 text-zinc-900" />
                        <span className="text-[9px] font-mono font-bold text-zinc-700 mt-1">PIX MERCADO PAGO</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Abra o app do seu banco, escolha <b>Pagar com PIX</b> e aponte a câmera ou use o código Copia e Cola.
                  </p>

                  {pixStatusMessage && (
                    <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] text-left">
                      {pixStatusMessage}
                    </div>
                  )}

                  <button
                    onClick={handleCopyPix}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-98 border border-white/[0.08] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
                  >
                    {copiedPix ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Código PIX Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-400" />
                        <span>Copiar Código PIX Copia e Cola</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Bloco Cartão */}
              {paymentMethod === "card" && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.08] flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Checkout Seguro Mercado Pago</h4>
                      <p className="text-[10px] text-zinc-400">Cartão de Crédito em até 12x ou Débito</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Você será redirecionado para a tela segura do Mercado Pago para concluir o pagamento.
                  </p>

                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Plano selecionado:</span>
                    <span className="font-bold text-white">{currentPlan.name} — R$ {currentPlan.price}{currentPlan.billingPeriod}</span>
                  </div>
                </div>
              )}

              {/* Status de Ambiente */}
              {!isMpConfigured && (
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 text-center">
                  ⚙️ Ambiente de Simulação Local (Chaves MP não configuradas no .env.local)
                </div>
              )}

              {/* Botão de confirmação */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCheckoutStep("plans")}
                  className="w-1/3 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs font-bold text-zinc-300"
                >
                  Voltar
                </button>
                <button
                  onClick={handleVerifyPayment}
                  disabled={isProcessing}
                  className="w-2/3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs tracking-wide shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : paymentMethod === "card" ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Ir para Checkout Seguro</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isMpConfigured ? "Verificar PIX Pago" : "Confirmar Pagamento"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {checkoutStep === "success" && (
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Plano Ativado com Sucesso!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Seu acesso ao <b>{currentPlan.name}</b> foi liberado no app com sucesso.
                </p>
              </div>

              <div className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-left font-mono">
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold">ATIVO</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>Plano:</span>
                  <span className="text-white">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>Gateway:</span>
                  <span className="text-white">Mercado Pago</span>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Ir para o Treino
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
