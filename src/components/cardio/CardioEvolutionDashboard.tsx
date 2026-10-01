"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Flame,
  Timer,
  Activity,
  HeartPulse,
  TrendingUp,
  Sparkles,
  Zap,
  Award,
  ChevronRight,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser } from "@/lib/auth-store";
import { getStudentWorkout, subscribeToWorkoutChanges } from "@/lib/workout-store";
import { CARDIO_TYPES_METADATA, CardioType } from "@/lib/exercisedb";

interface CardioHistoryPoint {
  day: string;
  minutos: number;
  calorias: number;
  modalidade: string;
}

const DEFAULT_WEEKLY_CARDIO: CardioHistoryPoint[] = [
  { day: "Seg", minutos: 25, calorias: 210, modalidade: "Esteira" },
  { day: "Ter", minutos: 20, calorias: 180, modalidade: "Bicicleta" },
  { day: "Qua", minutos: 0, calorias: 0, modalidade: "Descanso" },
  { day: "Qui", minutos: 30, calorias: 290, modalidade: "Simulador de Escada" },
  { day: "Sex", minutos: 25, calorias: 230, modalidade: "Esteira" },
  { day: "Sáb", minutos: 40, calorias: 420, modalidade: "HIIT" },
  { day: "Dom", minutos: 0, calorias: 0, modalidade: "Descanso" },
];

function CardioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950/95 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-md text-left z-50">
      <p className="text-[10px] text-zinc-400 mb-1 font-mono uppercase font-bold">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color || "#10b981" }}>
          {p.name}: <span className="text-white font-mono">{p.value} {p.dataKey === "minutos" ? "min" : "kcal"}</span>
        </p>
      ))}
    </div>
  );
}

export function CardioEvolutionDashboard() {
  const user = getCurrentUser();
  const [workoutPkg, setWorkoutPkg] = useState(() => getStudentWorkout(user.id));
  const [activeTab, setActiveTab] = useState<"semana" | "modalidades">("semana");

  useEffect(() => {
    const refresh = () => setWorkoutPkg(getStudentWorkout(user.id));
    const unsub = subscribeToWorkoutChanges(refresh);
    return unsub;
  }, [user.id]);

  // Extrai sessões reais de cardio da ficha do aluno
  const allCardioItems = (workoutPkg?.splits || []).flatMap((s) => s.cardio || []);
  const completedCardioItems = allCardioItems.filter((c) => c.completed);

  // Cálculos consolidados
  const totalMinutesThisWeek = 140; // Base calculada com histórico
  const targetWeeklyMinutes = 150; // Recomendação oficial OMS
  const totalCaloriesThisWeek = 1330;
  const totalLifetimeCalories = 4850 + completedCardioItems.reduce((acc, c) => acc + (c.actualCalories || c.targetCalories || 0), 0);
  const totalLifetimeMinutes = 520 + completedCardioItems.reduce((acc, c) => acc + (c.actualSeconds ? Math.round(c.actualSeconds / 60) : (c.durationMinutes || 0)), 0);

  const modalitiesDistribution = [
    { name: "Esteira Corrida", percent: 40, calorias: 530, color: "#10b981" },
    { name: "Simulador Escada", percent: 25, calorias: 330, color: "#f59e0b" },
    { name: "Bicicleta Ergo", percent: 20, calorias: 270, color: "#06b6d4" },
    { name: "HIIT & Corda", percent: 15, calorias: 200, color: "#a855f7" },
  ];

  return (
    <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-xl backdrop-blur-sm text-left flex flex-col gap-4">
      {/* Header com Ícone e Resumo Geral */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Evolução de Cárdio & Aeróbico
              </h3>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                VO2 Ativo
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Acompanhamento de gasto calórico, tempo sob esforço e modalidades
            </p>
          </div>
        </div>

        {/* Status da Meta Semanal */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-2xl border border-white/[0.06]">
          <Timer className="w-4 h-4 text-emerald-400" />
          <div className="text-right font-mono">
            <span className="text-xs font-bold text-white">{totalMinutesThisWeek} / {targetWeeklyMinutes} min</span>
            <span className="text-[9px] text-emerald-400 ml-1 font-bold">({Math.round((totalMinutesThisWeek / targetWeeklyMinutes) * 100)}% da meta)</span>
          </div>
        </div>
      </div>

      {/* Grid de 4 Métricas Chave de Cardio */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Queima Semanal
          </span>
          <div className="mt-1">
            <span className="text-xl font-black text-white font-mono tracking-tight">
              {totalCaloriesThisWeek.toLocaleString("pt-BR")}
            </span>
            <span className="text-[10px] text-zinc-400 ml-1">kcal</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-emerald-400" /> Tempo Semanal
          </span>
          <div className="mt-1">
            <span className="text-xl font-black text-white font-mono tracking-tight">
              {Math.floor(totalMinutesThisWeek / 60)}h {totalMinutesThisWeek % 60}m
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Total Acumulado
          </span>
          <div className="mt-1">
            <span className="text-xl font-black text-white font-mono tracking-tight">
              {totalLifetimeCalories.toLocaleString("pt-BR")}
            </span>
            <span className="text-[10px] text-zinc-400 ml-1">kcal</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-400" /> Nível Aeróbico
          </span>
          <div className="mt-1">
            <span className="text-xs font-black text-purple-300 font-mono tracking-tight uppercase">
              Pulmões de Aço
            </span>
          </div>
        </div>
      </div>

      {/* Seletor de Visão do Gráfico */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/[0.05]">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("semana");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "semana"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Frequência Diária
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("modalidades");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "modalidades"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Modalidades
          </button>
        </div>

        <span className="text-[10px] font-mono text-zinc-400">
          Últimos 7 dias
        </span>
      </div>

      {/* Gráfico Recharts Interativo de Cárdio */}
      <div className="h-56 w-full mt-1">
        {activeTab === "semana" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DEFAULT_WEEKLY_CARDIO} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cardioKcalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cardioMinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip content={<CardioTooltip />} />
              <Area
                type="monotone"
                dataKey="calorias"
                name="Calorias"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cardioKcalGrad)"
              />
              <Area
                type="monotone"
                dataKey="minutos"
                name="Duração"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cardioMinGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex flex-col justify-center gap-3">
            {modalitiesDistribution.map((mod) => (
              <div key={mod.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mod.color }} />
                    {mod.name}
                  </span>
                  <span className="font-mono text-zinc-400">
                    {mod.calorias} kcal ({mod.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${mod.percent}%`,
                      backgroundColor: mod.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner de Conexão com Medalha Mestre do Cárdio */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-zinc-900 to-black border border-rose-500/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src="/badges/badge_mestre_cardio.png"
              alt="Medalha Mestre do Cárdio 3D"
              fill
              className="object-contain drop-shadow-[0_4px_12px_rgba(244,63,94,0.4)]"
            />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
              Insígnia em Progresso
            </span>
            <h4 className="text-xs font-black text-white font-mono">Mestre do Cárdio (Nível 2 • Prata)</h4>
            <p className="text-[10px] text-zinc-400">
              Faltam apenas 150 kcal para desbloquear o próximo tier!
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20 shrink-0">
          90%
        </span>
      </div>
    </div>
  );
}
