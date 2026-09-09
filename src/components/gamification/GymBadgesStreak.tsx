"use client";

import React, { useState } from "react";
import { Flame, Trophy, Award, Zap, Lock, CheckCircle2, Dumbbell, Sparkles } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface BadgeItem {
  id: string;
  name: string;
  category: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "comum" | "raro" | "lendario";
}

export interface PRRecord {
  id: string;
  exercise: string;
  weight: number;
  date: string;
}

const BADGES: BadgeItem[] = [
  {
    id: "streak-15",
    name: "Fogo Sagrado",
    category: "Constância",
    description: "Treinou 15 dias consecutivos sem quebrar o ritmo.",
    unlocked: true,
    unlockedAt: "Hoje",
    rarity: "raro",
  },
  {
    id: "early-bird",
    name: "Clube das 06h",
    category: "Disciplina",
    description: "Completou 5 treinos antes das 07:00 da manhã.",
    unlocked: true,
    unlockedAt: "Ontem",
    rarity: "comum",
  },
  {
    id: "century-club",
    name: "Centurião",
    category: "Dedicação",
    description: "Completou 100 treinos registrados no GymFlow.",
    unlocked: true,
    unlockedAt: "01/Set",
    rarity: "lendario",
  },
  {
    id: "pr-breaker",
    name: "Batedor de PR",
    category: "Força",
    description: "Superou sua carga máxima em qualquer exercício composto.",
    unlocked: true,
    unlockedAt: "28/Ago",
    rarity: "raro",
  },
  {
    id: "streak-30",
    name: "Titã da Disciplina",
    category: "Constância",
    description: "Atinja 30 dias de treinos consecutivos.",
    unlocked: false,
    rarity: "lendario",
  },
  {
    id: "beast-mode",
    name: "Semana Perfeita",
    category: "Frequência",
    description: "Treine 6 dias na mesma semana com 100% das séries completadas.",
    unlocked: false,
    rarity: "raro",
  },
];

const PR_RECORDS: PRRecord[] = [
  { id: "1", exercise: "Supino Reto Barra", weight: 104, date: "02/Set" },
  { id: "2", exercise: "Agachamento Livre", weight: 142, date: "28/Ago" },
  { id: "3", exercise: "Levantamento Terra", weight: 170, date: "15/Ago" },
  { id: "4", exercise: "Desenvolvimento Halteres", weight: 34, date: "05/Set" },
];

export function GymBadgesStreak() {
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const streakCount = 16;
  const nextMilestone = 20;

  const handleSelectBadge = (badge: BadgeItem) => {
    triggerHaptic(badge.unlocked ? "success" : "light");
    setSelectedBadge(badge);
  };

  const getRarityBadge = (rarity: BadgeItem["rarity"]) => {
    switch (rarity) {
      case "lendario":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "raro":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Card Principal: Streak & Chamas */}
      <div className="relative rounded-2xl p-4 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-xl overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white font-mono tracking-tight">{streakCount} DIAS</span>
                <span className="text-[11px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  On Fire 🔥
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Sua maior sequência na história da academia!</p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso para Próxima Meta */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] font-medium mb-1.5">
            <span className="text-zinc-400">Próxima Conquista: 20 Dias</span>
            <span className="text-amber-400 font-mono font-bold">{streakCount} / {nextMilestone} dias</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${(streakCount / nextMilestone) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Seção: Recordes Pessoais (PRs) */}
      <div className="rounded-2xl p-4 bg-zinc-900/60 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recordes Pessoais (PRs)</h3>
          </div>
          <span className="text-[10px] text-zinc-400">1RM Estimado</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PR_RECORDS.map((pr) => (
            <div
              key={pr.id}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between"
            >
              <span className="text-[10px] text-zinc-400 font-medium truncate">{pr.exercise}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-black text-white font-mono">
                  {pr.weight} <span className="text-[10px] font-normal text-zinc-400">kg</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-mono">{pr.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção: Conquistas & Medalhas */}
      <div className="rounded-2xl p-4 bg-zinc-900/60 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Medalhas & Insígnias</h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} Desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => (
            <button
              key={badge.id}
              onClick={() => handleSelectBadge(badge)}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all relative ${
                badge.unlocked
                  ? "bg-zinc-900/90 border-white/[0.1] hover:border-emerald-500/40 active:scale-95"
                  : "bg-zinc-950/40 border-white/[0.03] opacity-40 grayscale"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                  badge.unlocked
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner"
                    : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {badge.unlocked ? (
                  <Sparkles className="w-5 h-5 text-amber-400" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-600" />
                )}
              </div>
              <span className="text-[11px] font-bold text-zinc-200 line-clamp-1">{badge.name}</span>
              <span className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5">{badge.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes da Medalha Selecionada */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-zinc-900 border border-white/[0.12] rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center relative">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
                selectedBadge.unlocked
                  ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              <Trophy className="w-8 h-8" />
            </div>

            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border mb-1.5 ${getRarityBadge(selectedBadge.rarity)}`}>
              {selectedBadge.rarity}
            </span>

            <h4 className="text-base font-black text-white">{selectedBadge.name}</h4>
            <p className="text-xs text-zinc-400 mt-1 mb-4 leading-relaxed">{selectedBadge.description}</p>

            <div className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-mono mb-4 text-zinc-300">
              {selectedBadge.unlocked ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Desbloqueado {selectedBadge.unlockedAt}
                </span>
              ) : (
                <span className="text-zinc-500 flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" /> Em andamento
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] active:scale-98 text-xs font-bold text-white transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
