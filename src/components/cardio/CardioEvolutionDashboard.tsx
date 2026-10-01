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
} from "recharts";
import {
  Flame,
  Timer,
  Activity,
  HeartPulse,
  Award,
  Plus,
  X,
  TrendingUp,
  Sparkles,
  Zap,
  Bike,
  Footprints,
  Waves,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser, subscribeToAuth } from "@/lib/auth-store";
import {
  calculateRealWeeklyCardioStats,
  saveCardioSession,
  subscribeToCardioHistory,
  WeeklyCardioStats,
} from "@/lib/cardio-store";
import { CARDIO_TYPES_METADATA, CardioType } from "@/lib/exercisedb";

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
  const [stats, setStats] = useState<WeeklyCardioStats>(() => calculateRealWeeklyCardioStats());
  const [activeTab, setActiveTab] = useState<"semana" | "modalidades">("semana");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Formulário de registro rápido de cárdio
  const [selectedType, setSelectedType] = useState<CardioType>("esteira_corrida");
  const [duration, setDuration] = useState(25);
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [intensity, setIntensity] = useState<"leve" | "moderada" | "alta" | "hiit">("moderada");
  const [speedKmh, setSpeedKmh] = useState("");
  const [notes, setNotes] = useState("");

  const refreshStats = () => {
    const user = getCurrentUser();
    setStats(calculateRealWeeklyCardioStats(user?.id));
  };

  useEffect(() => {
    refreshStats();
    const unsubCardio = subscribeToCardioHistory(refreshStats);
    const unsubAuth = subscribeToAuth(refreshStats);
    return () => {
      unsubCardio();
      unsubAuth();
    };
  }, []);

  const handleTypeChange = (type: CardioType) => {
    setSelectedType(type);
    const meta = CARDIO_TYPES_METADATA[type];
    if (meta && typeof customCalories !== "number") {
      setCustomCalories(Math.round(duration * meta.defaultKcalPerMinute));
    }
  };

  const handleDurationChange = (val: number) => {
    const clamped = Math.max(1, Math.min(300, val));
    setDuration(clamped);
    const meta = CARDIO_TYPES_METADATA[selectedType];
    if (meta) {
      setCustomCalories(Math.round(clamped * meta.defaultKcalPerMinute));
    }
  };

  const handleSaveManualCardio = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("success");
    const meta = CARDIO_TYPES_METADATA[selectedType];
    const calcKcal = typeof customCalories === "number" && customCalories > 0
      ? customCalories
      : Math.round(duration * (meta?.defaultKcalPerMinute || 10));

    saveCardioSession({
      title: meta?.label || "Cárdio",
      modality: selectedType,
      modalityLabel: meta?.label || "Cárdio",
      durationMinutes: duration,
      actualCalories: calcKcal,
      intensity,
      speedKmh: speedKmh ? parseFloat(speedKmh) : undefined,
      notes: notes.trim() || undefined,
      source: "manual",
      completedAt: new Date().toISOString(),
    });

    setIsManualModalOpen(false);
    setNotes("");
    setSpeedKmh("");
  };

  const hasAnyCardioThisWeek = stats.totalMinutesThisWeek > 0 || stats.totalCaloriesThisWeek > 0;

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
              Gasto calórico real, tempo sob esforço e distribuição de modalidades
            </p>
          </div>
        </div>

        {/* Status da Meta Semanal e Botão Rápido */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-2xl border border-white/[0.06]">
            <Timer className="w-4 h-4 text-emerald-400" />
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-white">
                {stats.totalMinutesThisWeek} / {stats.targetWeeklyMinutes} min
              </span>
              <span className="text-[9px] text-emerald-400 ml-1 font-bold">
                ({stats.weeklyGoalPercent}% da meta)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("medium");
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar</span>
          </button>
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
              {stats.totalCaloriesThisWeek.toLocaleString("pt-BR")}
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
              {Math.floor(stats.totalMinutesThisWeek / 60)}h {stats.totalMinutesThisWeek % 60}m
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Total Acumulado
          </span>
          <div className="mt-1">
            <span className="text-xl font-black text-white font-mono tracking-tight">
              {stats.totalLifetimeCalories.toLocaleString("pt-BR")}
            </span>
            <span className="text-[10px] text-zinc-400 ml-1">kcal</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-400" /> Nível Aeróbico
          </span>
          <div className="mt-1">
            <span
              className="text-xs font-black font-mono tracking-tight uppercase truncate block"
              style={{ color: stats.aerobicLevel.color }}
            >
              {stats.aerobicLevel.title}
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
          Segunda a Domingo
        </span>
      </div>

      {/* Gráfico Recharts Interativo de Cárdio */}
      <div className="h-56 w-full mt-1">
        {activeTab === "semana" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {stats.modalitiesDistribution.map((mod) => (
              <div key={mod.key || mod.name} className="flex flex-col gap-1">
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src="/badges/badge_mestre_cardio.png"
              alt="Medalha Mestre do Cárdio 3D"
              fill
              className="object-contain drop-shadow-[0_4px_12px_rgba(244,63,94,0.4)]"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
              Insígnia em Progresso
            </span>
            <h4 className="text-xs font-black text-white font-mono truncate">
              Mestre do Cárdio • {stats.cardioBadgeInfo.nextTierName}
            </h4>
            <p className="text-[10px] text-zinc-400 truncate">
              {stats.cardioBadgeInfo.neededKcal > 0
                ? `Faltam ${stats.cardioBadgeInfo.neededKcal.toLocaleString("pt-BR")} kcal para o próximo nível!`
                : "Nível máximo alcançado nesta insígnia!"}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20 shrink-0">
          {stats.cardioBadgeInfo.progressPercent}%
        </span>
      </div>

      {/* Modal de Registro Manual de Cárdio */}
      {isManualModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsManualModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Registrar Cárdio</h3>
                  <p className="text-[10px] text-zinc-400">Gasto calórico e tempo real</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualCardio} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Modalidade
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value as CardioType)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {Object.entries(CARDIO_TYPES_METADATA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} (~{v.defaultKcalPerMinute} kcal/min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Calorias (kcal)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="Estimado"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Intensidade
                  </label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="leve">Leve (Aquecimento)</option>
                    <option value="moderada">Moderada (Zona 2/3)</option>
                    <option value="alta">Alta (Ritmo Forte)</option>
                    <option value="hiit">HIIT (Máximo / Tiros)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Velocidade (km/h opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={speedKmh}
                    onChange={(e) => setSpeedKmh(e.target.value)}
                    placeholder="Ex: 8.5"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Notas / Sensação (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pós-treino de perna, esteira com 5% de inclinação"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-xs font-black text-black transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
