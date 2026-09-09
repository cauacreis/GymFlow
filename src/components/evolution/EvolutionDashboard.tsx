"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, Scale, Percent, Zap, Award, Calendar, HeartPulse } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface BioMetric {
  date: string;
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
}

const BIO_HISTORY: BioMetric[] = [
  { date: "Mai/26", weightKg: 82.5, bodyFatPercent: 17.2, muscleMassKg: 36.8 },
  { date: "Jun/26", weightKg: 81.2, bodyFatPercent: 16.0, muscleMassKg: 37.2 },
  { date: "Jul/26", weightKg: 80.0, bodyFatPercent: 15.1, muscleMassKg: 37.8 },
  { date: "Ago/26", weightKg: 79.1, bodyFatPercent: 14.4, muscleMassKg: 38.2 },
  { date: "Set/26", weightKg: 78.4, bodyFatPercent: 13.8, muscleMassKg: 38.6 },
];

export function EvolutionDashboard() {
  const [history] = useState<BioMetric[]>(BIO_HISTORY);
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];

  const weightDiff = (latest.weightKg - previous.weightKg).toFixed(1);
  const fatDiff = (latest.bodyFatPercent - previous.bodyFatPercent).toFixed(1);
  const muscleDiff = (latest.muscleMassKg - previous.muscleMassKg).toFixed(1);

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Header com Resumo Geral */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/[0.08] shadow-xl relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Bioimpedância & Avaliação Física
            </span>
            <h2 className="text-base font-black text-white mt-0.5">Evolução Corporal</h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/[0.06]">
            Última: {latest.date}
          </span>
        </div>

        {/* 3 Métricas Principais (Peso, Gordura, Massa Magra) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Peso */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
            <span className="text-[10px] text-zinc-400 font-medium">Peso Corporal</span>
            <span className="text-base font-black text-white font-mono mt-1">
              {latest.weightKg} <span className="text-[10px] font-sans text-zinc-400">kg</span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold mt-1">
              <TrendingDown className="w-3 h-3" />
              {weightDiff} kg
            </span>
          </div>

          {/* % Gordura */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
            <span className="text-[10px] text-zinc-400 font-medium">% Gordura</span>
            <span className="text-base font-black text-white font-mono mt-1">
              {latest.bodyFatPercent}
              <span className="text-[10px] font-sans text-zinc-400">%</span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold mt-1">
              <TrendingDown className="w-3 h-3" />
              {fatDiff}%
            </span>
          </div>

          {/* Massa Magra */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
            <span className="text-[10px] text-zinc-400 font-medium">Massa Magra</span>
            <span className="text-base font-black text-white font-mono mt-1">
              {latest.muscleMassKg} <span className="text-[10px] font-sans text-zinc-400">kg</span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-teal-400 font-bold mt-1">
              <TrendingUp className="w-3 h-3" />
              +{muscleDiff} kg
            </span>
          </div>
        </div>
      </div>

      {/* Histórico e Curva de Progresso */}
      <div className="rounded-2xl p-4 bg-zinc-900/60 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Histórico dos Últimos 5 Meses</span>
          </h3>
          <span className="text-[10px] text-zinc-400">Medição InBody</span>
        </div>

        <div className="flex flex-col gap-2">
          {history.map((item, idx) => (
            <div
              key={item.date}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
            >
              <span className="font-mono font-bold text-zinc-300 w-16">{item.date}</span>
              <div className="flex items-center gap-4 text-right font-mono">
                <div>
                  <span className="text-zinc-500 text-[9px] block">PESO</span>
                  <span className="text-white font-bold">{item.weightKg}kg</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[9px] block">% GORD</span>
                  <span className="text-emerald-400 font-bold">{item.bodyFatPercent}%</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[9px] block">MAGRA</span>
                  <span className="text-teal-400 font-bold">{item.muscleMassKg}kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
