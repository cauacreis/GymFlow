"use client";

import React, { useState, useEffect } from "react";

import { motion } from "framer-motion";
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
  Cell,
} from "recharts";
import {
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Trophy,
  Calendar,
  Activity,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { coachAnalyticsData } from "@/lib/analytics-data";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser } from "@/lib/auth-store";
import { getStoredStudents } from "@/lib/workout-store";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = ["06:00", "07:00", "08:00", "09:00", "17:00", "18:00", "19:00", "20:00"];

function getHeatmapColor(value: number): string {
  if (value === 0) return "rgba(255,255,255,0.03)";
  const intensity = Math.min(value / 10, 1);
  return `rgba(245, 158, 11, ${0.15 + intensity * 0.75})`;
}

// Tooltip estilizado com Glassmorphism
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

export function CoachAnalyticsDashboard() {
  const [students, setStudents] = useState(() => getStoredStudents());
  const [isMounted, setIsMounted] = useState(false);
  const { kpis, monthlyRevenueHistory, weeklyAttendance, busiestHours, agendaHeatmap, recentCoachActivity } = coachAnalyticsData;
  const [selectedTimeframe, setSelectedTimeframe] = useState<"mes" | "ano">("mes");

  useEffect(() => {
    setIsMounted(true);
  }, []);


  // Cálculos dinâmicos com dados reais
  const activeStudentsCount = students.filter((s) => (s.status || "ativo") === "ativo").length;
  const totalPresences = students.reduce((acc, s) => acc + (s.monthlyPresence || 0), 0);
  const totalAbsences = students.reduce((acc, s) => acc + (s.monthlyAbsences || 0), 0);
  const totalSessions = totalPresences + totalAbsences;
  const presenceRate = totalSessions > 0 ? Math.round((totalPresences / totalSessions) * 100) : (students.length > 0 ? 100 : 0);

  const realRevenue = students.reduce((acc, s) => {
    const planName = (s.plan || "").toLowerCase();
    let price = 45;
    if (planName.includes("básico") || planName.includes("basico")) price = 35;
    else if (planName.includes("vip")) price = 55;
    else if (planName.includes("diária") || planName.includes("diaria")) price = 35;
    return acc + price;
  }, 0);

  const dynamicTopStudents = students
    .map((s) => {
      const p = s.monthlyPresence || 0;
      const a = s.monthlyAbsences || 0;
      const total = p + a;
      const rate = total > 0 ? Math.round((p / total) * 100) : 100;
      const initials = s.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return {
        id: s.id,
        name: s.name,
        plan: s.plan || "Mensal Pro",
        totalSessions: s.totalClasses || p,
        presenceRate: rate,
        avatar: initials || "AL",
      };
    })
    .sort((a, b) => b.presenceRate - a.presenceRate)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 text-left w-full animate-in fade-in duration-300">
      {/* Header do Dashboard do Professor */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Performance do Treinador {getCurrentUser().cref ? `• CREF ${getCurrentUser().cref}` : "• Painel de Gestão"}
            </span>
            <h2 className="text-lg font-black text-white mt-1">Analytics do Professor</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Métricas financeiras, retenção de alunos e taxa de ocupação da agenda
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setSelectedTimeframe("mes");
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedTimeframe === "mes" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setSelectedTimeframe("ano");
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedTimeframe === "ano" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"
              }`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {/* Receita */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {kpis.revenueChange}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">
                {realRevenue > 0 ? `R$ ${realRevenue.toLocaleString("pt-BR")}` : "R$ 0"}
              </span>
              <span className="text-[9px] text-zinc-400 block">Receita Estimada</span>
            </div>
          </div>

          {/* Alunos Ativos */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {activeStudentsCount > 0 ? `${activeStudentsCount} na carteira` : "Sem alunos"}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">{activeStudentsCount}</span>
              <span className="text-[9px] text-zinc-400 block">Alunos Ativos</span>
            </div>
          </div>

          {/* Presença */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                {totalSessions > 0 ? `${totalSessions} sessões` : "Sem sessões"}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">{presenceRate}%</span>
              <span className="text-[9px] text-zinc-400 block">Taxa de Presença</span>
            </div>
          </div>

          {/* Horas Ministradas */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                {kpis.hoursChange}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-base font-black text-white font-mono">{kpis.hoursCoached}</span>
              <span className="text-[9px] text-zinc-400 block">Horas no Salão</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: Faturamento & Receita Mensal */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Evolução de Faturamento (R$)
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Mensalidades regulares + Diárias avulsas</p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
            +14.2% MoM
          </span>
        </div>

        <div className="h-48 w-full mt-2">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueHistory}>
                <defs>
                  <linearGradient id="coachRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Receita (R$)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#coachRevGrad)"
                  activeDot={{ r: 4, fill: "#f59e0b" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Carregando métricas...</div>
          )}
        </div>
      </div>

      {/* GRÁFICO 2: Presenças vs Faltas por Dia */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" /> Presenças vs Faltas na Semana
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Distribuição diária de comparecimentos</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-medium">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Presenças
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Faltas
            </span>
          </div>
        </div>

        <div className="h-44 w-full mt-2">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance} barGap={4}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Presenças" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="secondary" name="Faltas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Carregando métricas...</div>
          )}
        </div>
      </div>


      {/* GRÁFICO 3: HEATMAP DE OCUPAÇÃO DA AGENDA (Seg-Sáb x Horários) */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Heatmap de Ocupação da Agenda
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Densidade de alunos por horário de atendimento</p>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-1">
          <div className="min-w-[340px]">
            {/* Cabeçalho das Horas */}
            <div className="flex mb-1.5 ml-8">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-zinc-500 font-mono font-medium">
                  {h}
                </div>
              ))}
            </div>

            {/* Linhas de Dias */}
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <span className="w-8 text-[10px] font-mono text-zinc-400 font-bold shrink-0">{day}</span>
                {HOURS.map((hour) => {
                  const cell = agendaHeatmap.find((c) => c.day === day && c.hour === hour);
                  const val = cell?.value ?? 0;
                  return (
                    <div
                      key={hour}
                      className="flex-1 h-7 rounded-md flex items-center justify-center text-[9px] font-mono font-bold transition-transform hover:scale-105"
                      style={{ background: getHeatmapColor(val) }}
                      title={`${day} às ${hour}: ${val} alunos`}
                    >
                      {val > 0 && <span className="text-white opacity-90">{val}</span>}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legenda */}
            <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-zinc-500">
              <span>Livre</span>
              {[0, 3, 6, 8, 10].map((lvl) => (
                <div key={lvl} className="w-3.5 h-3.5 rounded" style={{ background: getHeatmapColor(lvl) }} />
              ))}
              <span>Lotado</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 4: HORÁRIOS MAIS MOVIMENTADOS */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Horários de Pico Mais Procurados
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Demanda média de alunos por faixa de horário</p>
          </div>
        </div>

        <div className="h-44 w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busiestHours} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Alunos" radius={[0, 4, 4, 0]} maxBarSize={14}>
                  {busiestHours.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value >= 16 ? "#f59e0b" : entry.value >= 12 ? "#10b981" : "#38bdf8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Carregando métricas...</div>
          )}
        </div>
      </div>


      {/* RANKING DOS TOP ALUNOS */}
      <div className="rounded-3xl p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Ranking de Frequência dos Alunos
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Alunos mais consistentes na agenda presencial</p>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Últimos 30 dias</span>
        </div>

        <div className="space-y-2.5">
          {dynamicTopStudents.length === 0 ? (
            <div className="py-6 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-zinc-400">
              Nenhum aluno cadastrado na carteira ainda para calcular o ranking.
            </div>
          ) : (
            dynamicTopStudents.map((st, i) => (
              <div
                key={st.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <span className="w-6 text-center text-sm font-black shrink-0">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                </span>

                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {st.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{st.name}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">{st.presenceRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                    <span>{st.plan}</span>
                    <span>{st.totalSessions} treinos</span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                      style={{ width: `${st.presenceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FEED DE ATIVIDADES RECENTES */}
      <div className="rounded-3xl p-5 bg-zinc-900/70 border border-white/[0.08] shadow-lg space-y-3">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-400" /> Atividades Recentes do Treinador
        </h3>

        <div className="space-y-2">
          {recentCoachActivity.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  act.color === "emerald"
                    ? "bg-emerald-400"
                    : act.color === "amber"
                    ? "bg-amber-400"
                    : act.color === "sky"
                    ? "bg-sky-400"
                    : "bg-teal-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{act.title}</span>
                  <span className="text-[9px] text-zinc-500 font-mono shrink-0">{act.time}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">{act.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
