"use client";

import React from "react";
import {
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Crown,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { FeatureKey, FEATURES_METADATA, PlanTier } from "@/lib/subscription-features";

interface FeatureGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: FeatureKey;
  requiredPlan?: PlanTier;
  onOpenPlans: () => void;
}

export function FeatureGateModal({
  isOpen,
  onClose,
  feature,
  requiredPlan = "pro",
  onOpenPlans,
}: FeatureGateModalProps) {
  if (!isOpen) return null;

  const featureInfo = FEATURES_METADATA[feature] || {
    name: "Recurso Exclusivo",
    description: "Faça upgrade do seu plano para liberar este recurso.",
    minTier: "pro",
  };

  const planName =
    requiredPlan === "vip"
      ? "Plano VIP (R$ 55,00/mês)"
      : "Plano Pro (R$ 45,00/mês)";

  const planPerks =
    requiredPlan === "vip"
      ? [
          "Acompanhamento presencial prioritário com Personal Trainer",
          "Remanejamento flexível de horários de treino",
          "Bioimpedância InBody gratuita todo mês",
          "Leve 1 amigo para treinar 4x ao mês",
        ]
      : [
          "Acesso irrestrito a todas as Aulas Coletivas (Spinning, Muay Thai, WOD)",
          "GymBot IA 24/7 com suporte nutricional e biomecânico",
          "Fichas completas com guia de execução postural em tempo real",
          "Acesso total à rede GymFlow",
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden text-zinc-100">
        {/* Glow de Fundo */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-3xl pointer-events-none ${
            requiredPlan === "vip"
              ? "bg-amber-500/20"
              : "bg-emerald-500/20"
          }`}
        />

        {/* Botão Fechar */}
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header com Ícone de Cadeado */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
              requiredPlan === "vip"
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/10"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
            }`}
          >
            {requiredPlan === "vip" ? (
              <Crown className="w-7 h-7" />
            ) : (
              <Lock className="w-7 h-7" />
            )}
          </div>

          <div>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                requiredPlan === "vip"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              Exclusivo {requiredPlan === "vip" ? "Plano VIP" : "Plano Pro & VIP"}
            </span>
            <h3 className="text-lg font-black text-white mt-1.5">
              {featureInfo.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {featureInfo.description}
            </p>
          </div>
        </div>

        {/* Caixa de Benefícios do Plano Superior */}
        <div className="mt-5 p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.06]">
            <span className="font-bold text-zinc-400">Liberado no:</span>
            <span
              className={`font-black ${
                requiredPlan === "vip" ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {planName}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {planPerks.map((perk, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    requiredPlan === "vip" ? "text-amber-400" : "text-emerald-400"
                  }`}
                />
                <span className="leading-tight">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => {
              triggerHaptic("heavy");
              onClose();
              onOpenPlans();
            }}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all ${
              requiredPlan === "vip"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-emerald-500/20"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Fazer Upgrade de Plano</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Continuar no Plano Atual
          </button>
        </div>

        <div className="mt-3 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Troque ou cancele seu plano a qualquer momento sem taxas.</span>
        </div>
      </div>
    </div>
  );
}
