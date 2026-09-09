"use client";

import React, { useState } from "react";
import { Flame, Dumbbell, Wheat, Droplets } from "lucide-react";

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroEngineProps {
  macros: MacroTotals;
  multiplier?: number;
}

export function MacroEngine({ macros, multiplier = 1 }: MacroEngineProps) {
  const [targetGoal, setTargetGoal] = useState<"cutting" | "maintenance" | "bulking">("bulking");

  const totalCalories = macros.calories * multiplier;
  const totalProtein = macros.protein * multiplier;
  const totalCarbs = macros.carbs * multiplier;
  const totalFat = macros.fat * multiplier;

  // Metas de referência padrão por refeição
  const GOALS = {
    cutting: { label: "Definição / Cutting", targetKcal: 450, targetProtein: 45, targetCarbs: 30, targetFat: 12 },
    maintenance: { label: "Manutenção", targetKcal: 550, targetProtein: 40, targetCarbs: 55, targetFat: 15 },
    bulking: { label: "Hipertrofia / Bulking", targetKcal: 700, targetProtein: 55, targetCarbs: 75, targetFat: 18 },
  };

  const currentGoal = GOALS[targetGoal];

  // Cálculo percentual para as barras
  const kcalPercent = Math.min(100, Math.round((totalCalories / currentGoal.targetKcal) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / currentGoal.targetProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / currentGoal.targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / currentGoal.targetFat) * 100));

  return (
    <div className="w-full p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] shadow-inner flex flex-col">
      {/* Seletor de Meta Esportiva */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold text-white tracking-tight">Macro Engine</span>
        </div>

        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-full border border-white/5 text-[10px]">
          <button
            onClick={() => setTargetGoal("cutting")}
            className={`px-2 py-0.5 rounded-full transition-colors ${
              targetGoal === "cutting" ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Cut
          </button>
          <button
            onClick={() => setTargetGoal("maintenance")}
            className={`px-2 py-0.5 rounded-full transition-colors ${
              targetGoal === "maintenance" ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Manut
          </button>
          <button
            onClick={() => setTargetGoal("bulking")}
            className={`px-2 py-0.5 rounded-full transition-colors ${
              targetGoal === "bulking" ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Bulk
          </button>
        </div>
      </div>

      {/* Visor de Calorias Totais */}
      <div className="flex items-baseline justify-between py-1 border-b border-white/5">
        <span className="text-xs text-zinc-400">Total Estimado</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-emerald-400">{totalCalories}</span>
          <span className="text-xs font-semibold text-zinc-400">/ {currentGoal.targetKcal} kcal</span>
        </div>
      </div>

      {/* Barras de Progresso Nutricional em Tempo Real */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {/* Proteína */}
        <div className="flex flex-col p-2 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Dumbbell className="w-3 h-3" /> Prot
            </span>
            <span className="font-bold text-white">{totalProtein}g</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Carboidratos */}
        <div className="flex flex-col p-2 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Wheat className="w-3 h-3" /> Carb
            </span>
            <span className="font-bold text-white">{totalCarbs}g</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Gorduras Boas */}
        <div className="flex flex-col p-2 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="flex items-center gap-1 text-teal-400 font-medium">
              <Droplets className="w-3 h-3" /> Gord
            </span>
            <span className="font-bold text-white">{totalFat}g</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
