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
  HelpCircle,
  ExternalLink,
  Shield,
  QrCode,
  Flame,
  AlertCircle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getCurrentUser,
  activateTrialForUser,
  activatePaidPlanForUser,
  UserProfile,
} from "@/lib/auth-store";
import {
  isTrialAvailableForDevice,
  markTrialAsUsedOnDevice,
} from "@/lib/device-lockout";

interface SubscriptionOnboardingModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  user?: UserProfile;
}

export function SubscriptionOnboardingModal({
  isOpen,
  onSuccess,
  user,
}: SubscriptionOnboardingModalProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => user || getCurrentUser());
  const [isTrialAvailable, setIsTrialAvailable] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<"trial" | "recurring" | "pix" | "annual">("trial");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PIX direto gerado pelo Mercado Pago
  const [pixData, setPixData] = useState<{
    id?: string;
    qrCode: string;
    qrCodeBase64?: string;
    amount: number;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentUser(user || getCurrentUser());
      isTrialAvailableForDevice().then((available) => {
        setIsTrialAvailable(available);
        if (!available) {
          setSelectedPlan("recurring");
        }
      });
    }
  }, [isOpen, user]);

  // Polling automático da compensação do PIX a cada 4 segundos
  useEffect(() => {
    if (!isOpen || selectedPlan !== "pix" || !pixData?.id) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const u = getCurrentUser();
        const res = await fetch(`/api/payment/check?id=${pixData.id}&userId=${u.id}`);
        const data = await res.json();
        if (data.success && data.status === "approved") {
          activatePaidPlanForUser("monthly_pix", false, "pro");
          triggerHaptic("success");
          onSuccess();
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, selectedPlan, pixData?.id, onSuccess]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // 1. ATIVAR TESTE DE 7 DIAS GRÁTIS
  // --------------------------------------------------------------------------
  const handleStartFreeTrial = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      const allowed = await isTrialAvailableForDevice();
      if (!allowed) {
        throw new Error(
          "Aviso: Este dispositivo já utilizou os 7 dias grátis anteriormente. Por favor, selecione um plano para continuar."
        );
      }

      // Se Mercado Pago estiver conectado, tenta gerar a assinatura com free_trial
      try {
        const res = await fetch("/api/payment/mercadopago/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "GymFlow Pro — 7 Dias Grátis com Cobrança Posterior",
            price: 39.9,
            payerEmail: currentUser.email || "aluno@gymflow.com",
            freeTrialDays: 7,
            userId: currentUser.id,
            planId: "trial_7d",
          }),
        });
        const data = await res.json();
        if (data.initPoint && !data.isSimulated) {
          // Marca no dispositivo que o trial foi usado
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
  const handleStartRecurringSubscription = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      const res = await fetch("/api/payment/mercadopago/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "GymFlow Pro — Assinatura Recorrente Mensal",
          price: 39.9,
          payerEmail: currentUser.email || "aluno@gymflow.com",
          freeTrialDays: 0,
          userId: currentUser.id,
          planId: "monthly_recurring",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Falha ao gerar link de assinatura");
      }

      if (data.initPoint && !data.isSimulated) {
        window.location.href = data.initPoint;
      } else {
        // Modo simulado / homologação
        activatePaidPlanForUser("monthly_recurring", true);
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
  // 3. PAGAMENTO AVULSO SEM RECORRÊNCIA VIA PIX (MERCADO PAGO)
  // --------------------------------------------------------------------------
  const handleGeneratePixPayment = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("selection");

    try {
      const res = await fetch("/api/payment/mercadopago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 45.0,
          description: "GymFlow Mensal Sem Recorrência (1 Mês Avulso)",
          payerEmail: currentUser.email || "aluno@gymflow.com",
          payerName: currentUser.name || "Aluno GymFlow",
          userId: currentUser.id,
          planId: "monthly_pix",
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
        amount: data.pix.amount || 45.0,
      });

      triggerHaptic("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao gerar cobrança PIX.");
      triggerHaptic("warning");
    } finally {
      setIsLoading(false);
    }
  };

  // Verificação e confirmação do PIX
  const handleConfirmPixPaid = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (pixData?.id) {
        const u = getCurrentUser();
        const res = await fetch(`/api/payment/check?id=${pixData.id}&userId=${u.id}`);
        const data = await res.json();

        if (data.success && data.status === "approved") {
          activatePaidPlanForUser("monthly_pix", false, "pro");
          triggerHaptic("success");
          onSuccess();
          return;
        }

        if (data.status === "pending" || data.status === "in_process") {
          setErrorMessage("Pagamento ainda não detectado pelo banco. Se já pagou, aguarde alguns instantes pela compensação do PIX e clique novamente.");
          triggerHaptic("warning");
          return;
        }

        if (!data.success || data.status !== "approved") {
          setErrorMessage(data.message || "Pagamento não confirmado pelo Mercado Pago. Aguarde alguns instantes e tente novamente.");
          triggerHaptic("warning");
          return;
        }
      }

      setErrorMessage("Aguardando geração e compensação do PIX. Copie o código e pague no app do seu banco.");
      triggerHaptic("warning");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 my-auto">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passo Final: Ativação da Sua Conta</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Escolha como deseja começar no GymFlow
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            Experimente 7 dias grátis ou garanta seu plano completo com Mercado Pago.
          </p>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {errorMessage && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* SE PIX FOI GERADO: EXIBE TELA DE PAGAMENTO PIX */}
        {/* ============================================================= */}
        {pixData ? (
          <div className="p-5 sm:p-6 space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                PIX Instantâneo Mercado Pago
              </span>
              <h3 className="text-lg font-black text-white pt-1">
                Total a pagar: R$ {pixData.amount.toFixed(2)}
              </h3>
              <p className="text-xs text-zinc-400">
                Abra o app do seu banco, escolha <strong>PIX Copia e Cola</strong> ou aponte a câmera para o QR Code:
              </p>
            </div>

            {/* Imagem do QR Code se fornecida ou chave copia e cola */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-zinc-950 mx-auto max-w-[240px]">
              {pixData.qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX Mercado Pago"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-2">
                  <QrCode className="w-24 h-24 text-zinc-800 mb-2" />
                  <span className="text-[10px] font-mono text-zinc-600">
                    Use a Chave Copia e Cola abaixo
                  </span>
                </div>
              )}
            </div>

            {/* Chave Copia e Cola */}
            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={pixData.qrCode}
                className="w-full bg-transparent text-[11px] font-mono text-zinc-300 truncate focus:outline-none"
              />
              <button
                onClick={handleCopyPix}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs shrink-0 flex items-center gap-1 active:scale-95 transition-all"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => setPixData(null)}
                className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-bold text-xs transition-colors"
              >
                Voltar aos Planos
              </button>
              <button
                onClick={handleConfirmPixPaid}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Já fiz o pagamento PIX</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================= */
          /* LISTA DE OPÇÕES DE ASSINATURA / TRIAL */
          /* ============================================================= */
          <div className="p-5 sm:p-6 space-y-3">
            {/* OPÇÃO 1: 7 DIAS GRÁTIS (TRIAL) */}
            <div
              onClick={() => {
                if (isTrialAvailable) {
                  triggerHaptic("selection");
                  setSelectedPlan("trial");
                }
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                selectedPlan === "trial"
                  ? "bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : isTrialAvailable
                  ? "bg-zinc-900/60 border-white/[0.08] hover:border-white/[0.15]"
                  : "bg-zinc-900/30 border-white/[0.04] opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      selectedPlan === "trial"
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-white/20"
                    }`}
                  >
                    {selectedPlan === "trial" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">
                        Testar 7 Dias Grátis
                      </span>
                      {isTrialAvailable ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          R$ 0,00 Hoje
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Trial já usado neste aparelho
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Acesso completo por 7 dias. Começa a cobrar R$ 39,90/mês somente a partir do 8º dia. Cancele quando quiser com 1 toque.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-black text-emerald-400 shrink-0">
                  Grátis
                </span>
              </div>
            </div>

            {/* OPÇÃO 2: ASSINATURA RECORRENTE MENSAL (MERCADO PAGO) */}
            <div
              onClick={() => {
                triggerHaptic("selection");
                setSelectedPlan("recurring");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                selectedPlan === "recurring"
                  ? "bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30"
                  : "bg-zinc-900/60 border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      selectedPlan === "recurring"
                        ? "border-purple-500 bg-purple-500 text-white"
                        : "border-white/20"
                    }`}
                  >
                    {selectedPlan === "recurring" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">
                        Assinatura Recorrente Mensal
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Mercado Pago Cartão
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Cobrança automática mensal no cartão pelo Mercado Pago. Não precisa lembrar de pagar todo mês.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-white">R$ 39,90</span>
                  <span className="text-[10px] text-zinc-400 block">/mês</span>
                </div>
              </div>
            </div>

            {/* OPÇÃO 3: ASSINATURA SEM RECORRÊNCIA (PIX / BOLETO) */}
            <div
              onClick={() => {
                triggerHaptic("selection");
                setSelectedPlan("pix");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                selectedPlan === "pix"
                  ? "bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "bg-zinc-900/60 border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      selectedPlan === "pix"
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-white/20"
                    }`}
                  >
                    {selectedPlan === "pix" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">
                        Assinatura Sem Recorrência (PIX Instantâneo)
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        1 Mês Avulso
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Pague 30 dias de acesso sem renovação automática. Liberação imediata via QR Code PIX.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-white">R$ 45,00</span>
                  <span className="text-[10px] text-zinc-400 block">avulso</span>
                </div>
              </div>
            </div>

            {/* BOTÃO DE AÇÃO DINÂMICO */}
            <div className="pt-3">
              {selectedPlan === "trial" && (
                <button
                  onClick={handleStartFreeTrial}
                  disabled={isLoading || !isTrialAvailable}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? "Ativando..." : "Começar 7 Dias Grátis Agora"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {selectedPlan === "recurring" && (
                <button
                  onClick={handleStartRecurringSubscription}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isLoading ? "Conectando..." : "Assinar com Cartão no Mercado Pago"}</span>
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </button>
              )}

              {selectedPlan === "pix" && (
                <button
                  onClick={handleGeneratePixPayment}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-zinc-950" />
                  <span>{isLoading ? "Gerando PIX..." : "Gerar QR Code PIX (R$ 45,00)"}</span>
                </button>
              )}
            </div>

            {/* Rodapé de Segurança */}
            <div className="pt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Pagamentos processados com criptografia bancária via Mercado Pago.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
