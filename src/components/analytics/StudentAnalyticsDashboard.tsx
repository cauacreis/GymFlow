"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  Trophy,
  Dumbbell,
  Scale,
  Calendar,
  Zap,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { studentAnalyticsData } from "@/lib/analytics-data";
import { triggerHaptic } from "@/lib/haptic";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md text-left z-50">
      <p className="text-[10px] text-zinc-400 mb-1 font-mono uppercase font-bold">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color || "#10b981" }}>
          {p.name}: <span className="text-white font-mono">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function StudentAnalyticsDashboard() {
  const { kpis, strengthProgression, bodyComposition, muscleVolumeDistribution, monthlyAttendance, personalRecords } = studentAnalyticsData;
  const [selectedLift, setSelectedLift] = useState<"todos" | "supino" | "agachamento" | "terra">("todos");

  return (
    <div className="flex flex-col gap-4 text-left w-full animate-in fade-in duration-300">
      {/* Header com Resumo Geral do Aluno */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Performance & Evolução Física
            </span>
            <h2 className="text-lg font-black text-white mt-1">Analytics do Aluno</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Progressão de cargas, bioimpedância e consistência de treinos
            </p>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {/* Volume de Carga */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {kpis.volumeChange}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-sm sm:text-base font-black text-white font-mono">{kpis.totalVolumeKg}</span>
              <span className="text-[9px] text-zinc-400 block">Carga Acumulada</span>
            </div>
          </div>

          {/* Streak de Consistência */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                Ativo 🔥
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">{kpis.streakDays} dias</span>
              <span className="text-[9px] text-zinc-400 block">Ofensiva Sem Falhar</span>
            </div>
          </div>

          {/* Recordes Pessoais */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                {kpis.prsChange}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">{kpis.prsCount} PRs</span>
              <span className="text-[9px] text-zinc-400 block">Recordes Batidos</span>
            </div>
          </div>

          {/* Bioimpedância BF% */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {kpis.bodyFatChange}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">{kpis.bodyFatCurrent}</span>
              <span className="text-[9px] text-zinc-400 block">Gordura Corporal</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: PROGRESSÃO DE FORÇA NOS COMPOSTOS (1RM) */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Curva de Força nos Compostos (1RM em kg)
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Evolução progressiva nos grandes levantamentos</p>
          </div>
        </div>

        <div className="h-52 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={strengthProgression}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 180]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="supino"
                name="Supino Reto"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="agachamento"
                name="Agachamento"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#38bdf8" }}
              />
              <Line
                type="monotone"
                dataKey="terra"
                name="Lev. Terra"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: COMPOSIÇÃO CORPORAL & BIOIMPEDÂNCIA */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" /> Composição Corporal InBody
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Peso total (kg) e Massa Magra (kg)</p>
          </div>
          <span className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-lg">
            Recomposição Ativa
          </span>
        </div>

        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bodyComposition}>
              <defs>
                <linearGradient id="bodyWeightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="muscleMassGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 90]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="peso"
                name="Peso Total (kg)"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#bodyWeightGrad)"
              />
              <Area
                type="monotone"
                dataKey="massaMagra"
                name="Massa Magra (kg)"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#muscleMassGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 3: VOLUME SEMANAL POR GRUPO MUSCULAR */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-amber-400" /> Volume de Séries Semanais por Músculo
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Séries semanais executadas vs Meta do treino</p>
          </div>
        </div>

        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={muscleVolumeDistribution} barGap={4}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 24]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={22} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="series" name="Séries Feitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="alvo" name="Meta Semanal" fill="#ffffff15" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 4: FREQUÊNCIA MENSAL & CONSISTÊNCIA */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" /> Consistência de Frequência Mensal
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Sessões concluídas vs Meta do mês</p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
            92% de Aderência
          </span>
        </div>

        <div className="h-44 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyAttendance}>
              <defs>
                <linearGradient id="studentAttendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[10, 25]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="treinos"
                name="Treinos Concluídos"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#studentAttendGrad)"
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VITRINE DE RECORDES PESSOAIS (PRs) */}
      <div className="rounded-3xl p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Galeria de Recordes Pessoais (PRs)
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Cargas máximas históricas superadas</p>
          </div>
          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            6 Recordes Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {personalRecords.map((pr, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white truncate block">{pr.exercise}</span>
                  <span className="text-[10px] text-zinc-400 font-mono block">{pr.date} • {pr.reps}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-white font-mono">{pr.weight} kg</span>
                <span className="text-[9px] font-bold text-emerald-400 block">{pr.increase}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
