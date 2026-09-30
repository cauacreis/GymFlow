"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Calendar,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  cancelSubscriptionForUser,
  getCurrentUser,
  UserProfile,
} from "@/lib/auth-store";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserProfile;
}

const CANCEL_REASONS = [
  "Achei o valor mensal elevado",
  "Falta de tempo para treinar",
  "Dificuldades no aplicativo",
  "Mudança de rotina ou viagem",
  "Vou treinar de outra forma",
  "Outro motivo",
];

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: CancelSubscriptionModalProps) {
  const [currentUser] = useState<UserProfile>(() => user || getCurrentUser());
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0]);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTrial = currentUser.subscriptionStatus === "trial";
  const rawEndDate = currentUser.subscriptionEndsAt || currentUser.trialEndsAt;

  let formattedEndDate = "o término do ciclo atual";
  if (rawEndDate) {
    try {
      const d = new Date(rawEndDate);
      formattedEndDate = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {}
  }

  const handleConfirmCancel = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    triggerHaptic("warning");

    try {
      await cancelSubscriptionForUser(selectedReason, feedback, currentUser);
      setIsDone(true);
      triggerHaptic("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao processar cancelamento. Tente novamente.");
      triggerHaptic("warning");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#09090b] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
        {/* Glow Superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-rose-500/10 blur-[70px] pointer-events-none rounded-full" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent flex items-start justify-between gap-3 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {isDone ? "Assinatura Cancelada" : "Cancelar Assinatura"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isDone
                  ? "Seu plano permanecerá ativo até a data final do ciclo"
                  : "Sem multas ou taxas. Veja o que acontece com a sua conta:"}
              </p>
            </div>
          </div>

          {!isLoading && !isDone && (
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {isDone ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h4 className="text-base font-black text-white">Cancelamento Confirmado</h4>
              <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                Você continuará com acesso total aos recursos do GymFlow até{" "}
                <strong className="text-emerald-400 font-bold">{formattedEndDate}</strong>.
                Nenhuma nova cobrança será realizada.
              </p>
              <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.06] text-xs text-zinc-400 max-w-sm mx-auto">
                Seus treinos e histórico estão preservados. Você poderá reativar seu plano quando quiser.
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Card de Benefícios e Retenção do Período */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Acesso garantido até:{" "}
                    <span className="text-emerald-400 font-mono">{formattedEndDate}</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isTrial
                    ? "Durante os 7 dias grátis, você não paga nada. Ao cancelar agora, o seu teste continuará ativo até o fim do prazo sem nenhuma cobrança no cartão."
                    : "Como este ciclo já foi pago, você continua utilizando normalmente todas as ferramentas até a data acima. Nenhuma nova mensalidade será cobrada."}
                </p>

                <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero novas cobranças no cartão ou PIX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Fichas de musculação e histórico permanecem salvos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Reativação disponível a qualquer momento em 1 clique</span>
                  </div>
                </div>
              </div>

              {/* Seletor de Motivo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  Poderia nos contar o motivo do cancelamento?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CANCEL_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setSelectedReason(reason);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-rose-500/15 border-rose-500/50 text-white ring-1 ring-rose-500/30"
                            : "bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
                        }`}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comentário Opcional */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400">
                  Sugestão ou comentário (opcional):
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Como podemos melhorar o GymFlow para você?"
                  className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 resize-none"
                />
              </div>

              {/* Ações */}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    onClose();
                  }}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manter Minha Assinatura</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-white/[0.05] hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 font-bold text-xs border border-white/[0.08] hover:border-rose-500/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirmar Cancelamento</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Rodapé Seguro */}
        <div className="p-3.5 border-t border-white/[0.06] bg-zinc-950/80 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Cancelamento imediato sem retenção forçada</span>
        </div>
      </div>
    </div>
  );
}
