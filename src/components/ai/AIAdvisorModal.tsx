"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { generateNutritionPlan, UserFitnessProfile, RecommendationResult } from "@/lib/ai-advisor";
import { PresetMeal } from "@/lib/data";
import { Bot, Sparkles, Flame, Dumbbell, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal: (meal: PresetMeal) => void;
}

export function AIAdvisorModal({
  isOpen,
  onClose,
  onSelectMeal,
}: AIAdvisorModalProps) {
  const [weightKg, setWeightKg] = useState<number>(75);
  const [heightCm, setHeightCm] = useState<number>(178);
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [goal, setGoal] = useState<"fat_loss" | "muscle_gain" | "maintenance">("muscle_gain");
  const [activityLevel, setActivityLevel] = useState<"sedentary" | "moderate" | "intense" | "athlete">("intense");
  const [plan, setPlan] = useState<RecommendationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = generateNutritionPlan({
      weightKg,
      heightCm,
      age,
      gender,
      goal,
      activityLevel,
    });

    setPlan(result);
    setIsGenerating(false);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="IA Nutricionista Esportiva">
      <div className="relative flex flex-col gap-4">
        {/* Glow de Destaque */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-60 h-28 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Intro */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">GymBot AI • Prescrição Sob Medida</h4>
            <p className="text-[11px] text-zinc-300">
              Insira seus dados para calcular seu gasto calórico real e receber a refeição ideal.
            </p>
          </div>
        </div>

        {/* Formulário de Métricas */}
        {!plan ? (
          <div className="flex flex-col gap-3">
            {/* Peso e Altura */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-300">Peso Atual (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-300">Altura (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 font-bold"
                />
              </div>
            </div>

            {/* Objetivo */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-300">Objetivo Atual</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "fat_loss" as const, label: "Secar (Cutting)" },
                  { id: "muscle_gain" as const, label: "Hipertrofia" },
                  { id: "maintenance" as const, label: "Manutenção" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id)}
                    className={`py-2 px-1 rounded-xl text-center text-[10px] font-bold transition-all border ${
                      goal === item.id
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                        : "bg-white/[0.03] text-zinc-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nível de Atividade */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-300">Frequência de Treinos</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "moderate" as const, label: "3 a 4x por semana" },
                  { id: "intense" as const, label: "5 a 6x por semana" },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setActivityLevel(act.id)}
                    className={`py-2 px-2 rounded-xl text-left text-xs font-medium transition-all border ${
                      activityLevel === act.id
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/[0.03] text-zinc-400 border-white/5"
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              disabled={isGenerating}
              icon={<Sparkles className="w-4 h-4 text-black" />}
              onClick={handleGenerate}
              className="mt-2"
            >
              {isGenerating ? "Calculando Macros..." : "Calcular com GymBot AI"}
            </Button>
          </div>
        ) : (
          /* Resultado do Plano Gerado */
          <div className="flex flex-col gap-3">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-medium">Metabolismo</span>
                <p className="text-sm font-black text-white">{plan.bmr} kcal</p>
              </div>
              <div className="border-x border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-medium">Gasto Diário</span>
                <p className="text-sm font-black text-emerald-400">{plan.tdee} kcal</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-medium">Alvo da Dieta</span>
                <p className="text-sm font-black text-amber-400">{plan.targetDailyCalories} kcal</p>
              </div>
            </div>

            {/* Rationale da IA */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 flex flex-col gap-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recomendação Personalizada
              </span>
              <p className="text-xs leading-relaxed">{plan.rationale}</p>
              <span className="text-[10px] text-zinc-400 mt-1">💡 Dica: {plan.actionTip}</span>
            </div>

            {/* Card do Prato Recomendado */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={plan.recommendedMeal.image}
                  alt={plan.recommendedMeal.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              <div className="flex flex-col flex-1">
                <span className="text-xs font-bold text-white">{plan.recommendedMeal.name}</span>
                <span className="text-[10px] text-emerald-300 font-semibold">
                  {plan.recommendedMeal.protein}g proteína • {plan.recommendedMeal.calories} kcal
                </span>
                <span className="text-xs font-extrabold text-white mt-0.5">
                  {formatCurrency(plan.recommendedMeal.price)}
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setPlan(null)}
                className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Recalcular
              </button>
              <Button
                size="md"
                variant="primary"
                className="flex-1"
                icon={<ArrowRight className="w-4 h-4 text-black" />}
                onClick={() => {
                  onSelectMeal(plan.recommendedMeal);
                  onClose();
                }}
              >
                Adicionar à Sacola
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
