"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Award,
  Zap,
  Lock,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  HelpCircle,
  Shield,
  Star,
  X,
  UserCheck,
  GraduationCap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser } from "@/lib/auth-store";
import {
  getAllGamificationBadges,
  calculateSmartWorkoutStreak,
  EVENT_STREAK_UPDATED,
  StreakInfo,
  INITIAL_ALL_BADGES,
  BadgeItem,
  BadgeTier,
  BadgeRarity,
  BadgeCadence,
  BadgeDifficulty,
  BadgeLevelInfo,
  CADENCE_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/gamification-service";

export interface PRRecord {
  id: string;
  exercise: string;
  weight: number;
  date: string;
}

const TIER_META: Record<BadgeTier, { label: string; icon: string; border: string; glow: string; text: string }> = {
  bronze: {
    label: "Bronze",
    icon: "🥉",
    border: "border-amber-700/50",
    glow: "shadow-[0_0_15px_rgba(180,83,9,0.25)]",
    text: "text-amber-500",
  },
  prata: {
    label: "Prata",
    icon: "🥈",
    border: "border-slate-300/50",
    glow: "shadow-[0_0_18px_rgba(203,213,225,0.3)]",
    text: "text-slate-300",
  },
  ouro: {
    label: "Ouro",
    icon: "🥇",
    border: "border-amber-400/60",
    glow: "shadow-[0_0_22px_rgba(251,191,36,0.35)]",
    text: "text-amber-300",
  },
  diamante: {
    label: "Diamante",
    icon: "💎",
    border: "border-cyan-400/70",
    glow: "shadow-[0_0_25px_rgba(34,211,238,0.4)]",
    text: "text-cyan-300",
  },
};

const RARITY_META: Record<BadgeRarity, { label: string; color: string }> = {
  comum: { label: "Comum", color: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  raro: { label: "Raro", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  epico: { label: "Épico", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  lendario: { label: "Lendário", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  mitico: { label: "Mítico", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
};

const PR_RECORDS: PRRecord[] = [
  { id: "1", exercise: "Supino Reto Barra", weight: 104, date: "02/Set" },
  { id: "2", exercise: "Agachamento Livre", weight: 142, date: "28/Ago" },
  { id: "3", exercise: "Levantamento Terra", weight: 170, date: "15/Ago" },
  { id: "4", exercise: "Desenvolvimento Halteres", weight: 34, date: "05/Set" },
];

const INITIAL_PREVIEW_LIMIT = 6;

export function GymBadgesStreak() {
  const user = getCurrentUser();
  const [activeRole, setActiveRole] = useState<"student" | "coach">(() =>
    user.activeRole === "coach" ? "coach" : "student"
  );
  const [badges, setBadges] = useState<BadgeItem[]>(() => getAllGamificationBadges());
  const [streakInfo, setStreakInfo] = useState<StreakInfo>(() =>
    calculateSmartWorkoutStreak({ userId: user?.id })
  );
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [selectedTierLevel, setSelectedTierLevel] = useState<number>(1);
  const [cadenceFilter, setCadenceFilter] = useState<"todas" | BadgeCadence | "secretas">("todas");
  const [statusFilter, setStatusFilter] = useState<"todas" | "desbloqueadas" | "progresso">("todas");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const syncBadges = () => {
      setBadges(getAllGamificationBadges());
      setStreakInfo(calculateSmartWorkoutStreak({ userId: user?.id }));
    };

    syncBadges();
    window.addEventListener("gymflow:badges-updated", syncBadges);
    window.addEventListener("gymflow:streak-updated", syncBadges);
    window.addEventListener("storage", syncBadges);
    return () => {
      window.removeEventListener("gymflow:badges-updated", syncBadges);
      window.removeEventListener("gymflow:streak-updated", syncBadges);
      window.removeEventListener("storage", syncBadges);
    };
  }, [user?.id]);

  const streakCount = streakInfo.currentStreak;
  const nextMilestone = streakInfo.nextMilestone;

  const handleSelectBadge = (badge: BadgeItem) => {
    triggerHaptic(badge.unlocked ? "success" : "light");
    setSelectedBadge(badge);
    if (badge.currentLevel > 0 && badge.currentLevel < badge.maxLevel) {
      setSelectedTierLevel(badge.currentLevel + 1);
    } else if (badge.currentLevel >= badge.maxLevel) {
      setSelectedTierLevel(badge.maxLevel);
    } else {
      setSelectedTierLevel(1);
    }
  };

  const currentRoleBadges = badges.filter((b) => b.role === activeRole);

  const filteredBadges = currentRoleBadges.filter((badge) => {
    // 1. Filtro de Cadência Temporal / Segredos
    if (cadenceFilter === "secretas") {
      if (!badge.isSecret) return false;
    } else if (cadenceFilter !== "todas") {
      if (badge.cadence !== cadenceFilter) return false;
    }

    // 2. Filtro de Status de Desbloqueio
    if (statusFilter === "desbloqueadas") return badge.unlocked;
    if (statusFilter === "progresso") return !badge.unlocked && !badge.isSecret;

    return true;
  });

  const unlockedCount = currentRoleBadges.filter((b) => b.unlocked).length;
  const totalCount = currentRoleBadges.length;

  const countByCadence = (cadence: BadgeCadence) =>
    currentRoleBadges.filter((b) => b.cadence === cadence).length;
  const secretBadgesCount = currentRoleBadges.filter((b) => b.isSecret).length;

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Card Principal: Streak & Chama 3D */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Ícone 3D da Chama com Fundo Transparente */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0 overflow-hidden group">
              <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-xl pointer-events-none" />
              <motion.div
                animate={{
                  y: [-2, 2, -2],
                  scale: [1, 1.04, 1],
                  rotate: [-1.5, 1.5, -1.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 relative"
              >
                <Image
                  src="/images/flame_3d.png"
                  alt="Chama 3D Sequência"
                  fill
                  sizes="48px"
                  priority
                  className="object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]"
                />
              </motion.div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {streakCount} DIAS
                </span>
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [-3, 3, -3],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-7 h-7 relative shrink-0"
                >
                  <Image
                    src="/images/flame_3d.png"
                    alt="Chama 3D"
                    fill
                    sizes="28px"
                    className="object-contain drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]"
                  />
                </motion.div>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                {streakInfo.statusDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso para Próxima Meta */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] relative z-10">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Próxima Conquista: {nextMilestone} Dias
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {streakCount} / {nextMilestone} dias ({streakInfo.progressPercentToNextMilestone}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950/60 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${streakInfo.progressPercentToNextMilestone}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Seção: Recordes Pessoais (PRs) */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/60 border border-white/[0.08] shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recordes Pessoais (PRs)</h3>
              <p className="text-[10px] text-zinc-400">Cargas máximas registradas</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            1RM Estimado
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {PR_RECORDS.map((pr) => (
            <div
              key={pr.id}
              className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] transition-all flex flex-col justify-between"
            >
              <span className="text-[11px] text-zinc-400 font-medium truncate">{pr.exercise}</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-lg font-black text-white font-mono tracking-tight">
                  {pr.weight} <span className="text-xs font-normal text-zinc-400">kg</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">{pr.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção Principal: Medalhas & Insígnias 3D Reais */}
      <div className="rounded-3xl p-4 sm:p-5 bg-zinc-900/60 border border-white/[0.08] shadow-xl backdrop-blur-sm">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-md shadow-amber-500/5">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Medalhas & Insígnias 3D
              </h3>
              <p className="text-[11px] text-zinc-400">
                Conquistas de {activeRole === "student" ? "Alunos" : "Professores & Personais"} em múltiplos horizontes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {unlockedCount} / {totalCount} Desbloqueadas
            </span>
          </div>
        </div>

        {/* Alternador de Modo de Papel: Aluno vs Professor */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/50 rounded-2xl border border-white/[0.08] mb-3">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveRole("student");
              setCadenceFilter("todas");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeRole === "student"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Aluno ({badges.filter((b) => b.role === "student").length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveRole("coach");
              setCadenceFilter("todas");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeRole === "coach"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Professor ({badges.filter((b) => b.role === "coach").length})</span>
          </button>
        </div>

        {/* Abas de Cadência Temporal (Iniciais, Semanais, Mensais, Anuais, Carreira, Secretas) */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/[0.05] mb-2.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              triggerHaptic("light");
              setCadenceFilter("todas");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              cadenceFilter === "todas"
                ? "bg-white/15 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todas ({totalCount})
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setCadenceFilter("inicial");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              cadenceFilter === "inicial"
                ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>🎯 Iniciais</span>
            <span className="text-[10px] opacity-75 font-mono">({countByCadence("inicial")})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setCadenceFilter("semanal");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              cadenceFilter === "semanal"
                ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>⚡ Semanais</span>
            <span className="text-[10px] opacity-75 font-mono">({countByCadence("semanal")})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setCadenceFilter("mensal");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              cadenceFilter === "mensal"
                ? "bg-blue-500/20 text-blue-300 shadow-sm border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>📅 Mensais</span>
            <span className="text-[10px] opacity-75 font-mono">({countByCadence("mensal")})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setCadenceFilter("anual");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              cadenceFilter === "anual"
                ? "bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>👑 Anuais</span>
            <span className="text-[10px] opacity-75 font-mono">({countByCadence("anual")})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setCadenceFilter("permanente");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              cadenceFilter === "permanente"
                ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>🏆 Carreira</span>
            <span className="text-[10px] opacity-75 font-mono">({countByCadence("permanente")})</span>
          </button>

          {secretBadgesCount > 0 && (
            <button
              onClick={() => {
                triggerHaptic("light");
                setCadenceFilter("secretas");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                cadenceFilter === "secretas"
                  ? "bg-rose-500/20 text-rose-300 shadow-sm border border-rose-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Secretas ({secretBadgesCount})</span>
            </button>
          )}
        </div>

        {/* Sub-filtro de Status (Todas / Desbloqueadas / Em Progresso) */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold mr-1">Status:</span>
          {(["todas", "desbloqueadas", "progresso"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                triggerHaptic("light");
                setStatusFilter(st);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                statusFilter === st
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {st === "todas" ? "Todas" : st === "desbloqueadas" ? "Desbloqueadas" : "Em Progresso"}
            </button>
          ))}
        </div>

        {/* Grade de Medalhas 3D */}
        {(() => {
          const isLimited = cadenceFilter === "todas" && statusFilter === "todas" && !isExpanded;
          const displayedBadges = isLimited
            ? filteredBadges.slice(0, INITIAL_PREVIEW_LIMIT)
            : filteredBadges;

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {displayedBadges.map((badge) => {
                  const isSecretLocked = badge.isSecret && !badge.unlocked;
                  const currentTier = badge.currentLevel > 0 ? badge.levels[badge.currentLevel - 1].tier : "bronze";
                  const tierStyle = TIER_META[currentTier];
                  const diffMeta = DIFFICULTY_LABELS[badge.difficulty] || DIFFICULTY_LABELS.iniciante;
                  const cadMeta = CADENCE_LABELS[badge.cadence] || CADENCE_LABELS.permanente;

                  return (
                    <motion.button
                      key={badge.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectBadge(badge)}
                      className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between overflow-hidden ${
                        badge.unlocked
                          ? `bg-zinc-900/90 hover:bg-zinc-850 border-white/[0.1] hover:${tierStyle.border} ${tierStyle.glow}`
                          : isSecretLocked
                          ? "bg-purple-950/15 border-purple-500/20 hover:border-purple-500/40"
                          : "bg-zinc-950/40 border-white/[0.04] opacity-75 hover:opacity-95"
                      }`}
                    >
                      {/* Chip de Nível / Status no Topo do Card */}
                      <div className="w-full flex items-center justify-between mb-1.5">
                        {badge.unlocked ? (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              badge.currentLevel === 4
                                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                : badge.currentLevel === 3
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : badge.currentLevel === 2
                                ? "bg-slate-300/15 text-slate-300 border-slate-300/30"
                                : "bg-amber-700/15 text-amber-500 border-amber-700/30"
                            }`}
                          >
                            <span>{tierStyle.icon}</span>
                            <span>Nív. {badge.currentLevel}</span>
                          </span>
                        ) : isSecretLocked ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-purple-400" />
                            <span>Secreta</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <span>Bloqueada</span>
                          </span>
                        )}

                        {/* Tag de Dificuldade */}
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${diffMeta.bg} ${diffMeta.color}`}>
                          {diffMeta.label}
                        </span>
                      </div>

                      {/* Tag de Cadência Temporal */}
                      <div className="w-full flex items-center gap-1 text-[9px] text-zinc-400 font-mono mb-1">
                        <span>{cadMeta.icon}</span>
                        <span className="uppercase tracking-wider font-semibold">{cadMeta.label}</span>
                      </div>

                      {/* Imagem 3D Real com Fundo Transparente */}
                      <div className="relative w-full aspect-square max-w-[110px] mx-auto my-1 flex items-center justify-center">
                        {/* Brilho Atmosférico no Fundo */}
                        {badge.unlocked && (
                          <div
                            className={`absolute inset-0 rounded-full blur-xl opacity-35 group-hover:opacity-60 transition-opacity ${
                              badge.currentLevel === 4
                                ? "bg-cyan-500"
                                : badge.currentLevel === 3
                                ? "bg-amber-500"
                                : badge.currentLevel === 2
                                ? "bg-slate-300"
                                : "bg-amber-700"
                            }`}
                          />
                        )}
                        {isSecretLocked && (
                          <div className="absolute inset-0 rounded-full blur-xl opacity-40 bg-purple-600 animate-pulse pointer-events-none" />
                        )}

                        <div className="relative w-full h-full">
                          <Image
                            src={isSecretLocked ? "/badges/badge_secret_mystery.png" : badge.image}
                            alt={isSecretLocked ? "Medalha Secreta Misteriosa" : badge.name}
                            fill
                            sizes="(max-width: 640px) 100px, 110px"
                            className={`object-contain transition-all duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] ${
                              badge.unlocked
                                ? "group-hover:scale-105 group-hover:-translate-y-1"
                                : isSecretLocked
                                ? "group-hover:scale-105"
                                : "grayscale contrast-75 brightness-75 group-hover:grayscale-0 group-hover:brightness-90"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Título & Detalhes */}
                      <div className="mt-1.5 w-full">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                          {isSecretLocked ? "???" : badge.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 leading-snug">
                          {isSecretLocked ? "Conquista Secreta Oculta" : badge.description}
                        </p>

                        {/* Micro Barra de Progresso do Próximo Nível */}
                        <div className="mt-2 pt-1.5 border-t border-white/[0.05]">
                          <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono mb-1">
                            <span>
                              {badge.unlocked
                                ? badge.currentLevel === badge.maxLevel
                                ? "NÍVEL MÁXIMO"
                                : `Rumo ao Nív. ${badge.currentLevel + 1}`
                                : "Progresso"}
                            </span>
                            <span className="font-semibold text-zinc-300">
                              {isSecretLocked
                                ? `${badge.currentProgress} de ${badge.targetProgress}`
                                : `${badge.currentProgress.toLocaleString("pt-BR")} / ${badge.targetProgress.toLocaleString("pt-BR")} ${badge.unit}`}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/[0.04]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                badge.unlocked
                                  ? "bg-gradient-to-r from-emerald-500 to-amber-400"
                                  : isSecretLocked
                                  ? "bg-purple-500"
                                  : "bg-zinc-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((badge.currentProgress / badge.targetProgress) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Botão de Expandir / Recolher Conquistas */}
              {filteredBadges.length > INITIAL_PREVIEW_LIMIT && cadenceFilter === "todas" && statusFilter === "todas" && (
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setIsExpanded(!isExpanded);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 border border-white/[0.08] hover:border-emerald-500/30 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg group cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <span>Recolher Conquistas</span>
                        <ChevronUp className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
                      </>
                    ) : (
                      <>
                        <span>Ver todas as {filteredBadges.length} conquistas</span>
                        <ChevronDown className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                  {!isExpanded && (
                    <p className="text-[10px] text-zinc-500 font-mono text-center">
                      Exibindo {INITIAL_PREVIEW_LIMIT} de {filteredBadges.length} • Selecione as abas acima para filtrar por meta
                    </p>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Modal 3D Detalhado da Medalha com Inspetor de Leveis */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm sm:max-w-md bg-zinc-900 border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center max-h-[92vh] overflow-y-auto scrollbar-none"
            >
              {/* Fechar Modal */}
              <button
                onClick={() => setSelectedBadge(null)}
                aria-label="Fechar detalhes da medalha"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Rarity, Cadência & Dificuldade Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 flex items-center gap-1">
                  <span>{CADENCE_LABELS[selectedBadge.cadence]?.icon}</span>
                  <span>{CADENCE_LABELS[selectedBadge.cadence]?.label}</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    DIFFICULTY_LABELS[selectedBadge.difficulty]?.bg
                  } ${DIFFICULTY_LABELS[selectedBadge.difficulty]?.color}`}
                >
                  {DIFFICULTY_LABELS[selectedBadge.difficulty]?.label}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    RARITY_META[selectedBadge.rarity].color
                  }`}
                >
                  {RARITY_META[selectedBadge.rarity].label}
                </span>
              </div>

              {/* Medalha 3D em Destaque */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 my-3">
                <div
                  className={`absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse ${
                    selectedBadge.isSecret && !selectedBadge.unlocked
                      ? "bg-purple-600"
                      : selectedBadge.currentLevel === 4
                      ? "bg-cyan-500"
                      : selectedBadge.currentLevel === 3
                      ? "bg-amber-500"
                      : selectedBadge.currentLevel === 2
                      ? "bg-slate-300"
                      : "bg-emerald-500"
                  }`}
                />
                <motion.div
                  animate={{ y: [-4, 4, -4], rotate: [-1, 1, -1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={
                      selectedBadge.isSecret && !selectedBadge.unlocked
                        ? "/badges/badge_secret_mystery.png"
                        : selectedBadge.image
                    }
                    alt={selectedBadge.name}
                    fill
                    sizes="192px"
                    priority
                    className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                  />
                </motion.div>
              </div>

              {/* Nome & Descrição */}
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 font-mono">
                {selectedBadge.isSecret && !selectedBadge.unlocked ? "Medalha Secreta" : selectedBadge.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
                {selectedBadge.isSecret && !selectedBadge.unlocked
                  ? "Esta conquista permanece envolta em mistério até você atingir seus critérios secretos."
                  : selectedBadge.description}
              </p>

              {/* Pista Secreta (Caso seja secreta) */}
              {selectedBadge.isSecret && (
                <div className="w-full mt-3 p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-left">
                  <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Dica do Desafio Oculto:</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 italic leading-snug">
                    &ldquo;{selectedBadge.secretClue}&rdquo;
                  </p>
                </div>
              )}

              {/* Informação Amigável de Constância (Finais de Semana & Rotina) */}
              {(selectedBadge.category === "Constância" || selectedBadge.id === "streak-fire" || selectedBadge.id === "streak-30") && (
                <div className="w-full mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-left">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-snug">
                    <strong className="text-white">Ofensiva Flexível:</strong> Finais de semana e descansos da sua agenda não quebram sua chama. Se treinar no sábado/domingo, ganha bônus!
                  </p>
                </div>
              )}

              {/* Inspetor de Níveis / Tiers */}
              <div className="w-full mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Leveis & Requisitos
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Seu Nível:{" "}
                    <strong className="text-white">
                      {selectedBadge.currentLevel > 0 ? `Nível ${selectedBadge.currentLevel}` : "Não desbloqueado"}
                    </strong>
                  </span>
                </div>

                {/* Seletor de Níveis (Tabs 1, 2, 3, 4) */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {selectedBadge.levels.map((lvl) => {
                    const isCurrentTier = selectedBadge.currentLevel === lvl.level;
                    const isCompletedTier = selectedBadge.currentLevel >= lvl.level;
                    const isNextTarget = selectedBadge.currentLevel + 1 === lvl.level;
                    const isSelected = selectedTierLevel === lvl.level;
                    const tierMeta = TIER_META[lvl.tier];

                    return (
                      <button
                        key={lvl.level}
                        onClick={() => {
                          triggerHaptic("light");
                          setSelectedTierLevel(lvl.level);
                        }}
                        className={`p-1.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                          isSelected
                            ? `bg-white/10 ${tierMeta.border} shadow-sm ring-1 ring-white/20`
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="text-sm">{tierMeta.icon}</span>
                        <span className="text-[10px] font-bold text-white mt-0.5">Nív. {lvl.level}</span>
                        <span
                          className={`text-[8px] font-mono uppercase font-semibold ${
                            isCurrentTier
                              ? "text-emerald-400"
                              : isCompletedTier
                              ? "text-zinc-400"
                              : isNextTarget
                              ? "text-amber-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {isCurrentTier ? "Atual" : isCompletedTier ? "Feito" : isNextTarget ? "Alvo" : "Trava"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Detalhe do Nível Selecionado */}
                {(() => {
                  const targetLvl = selectedBadge.levels[selectedTierLevel - 1] || selectedBadge.levels[0];
                  const tierMeta = TIER_META[targetLvl.tier];
                  const isSecretLocked = selectedBadge.isSecret && !selectedBadge.unlocked;
                  const isTierDone = selectedBadge.currentLevel >= targetLvl.level || selectedBadge.currentProgress >= targetLvl.targetValue;
                  const percentTowardThisLevel = Math.min(100, Math.round((selectedBadge.currentProgress / targetLvl.targetValue) * 100));

                  return (
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${tierMeta.text} flex items-center gap-1.5`}>
                          <span>{tierMeta.icon}</span>
                          <span>
                            Nível {targetLvl.level} • {isSecretLocked ? "Desafio Oculto" : targetLvl.title} ({tierMeta.label})
                          </span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          +{targetLvl.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-snug">
                        <strong>Requisito:</strong>{" "}
                        {isSecretLocked
                          ? "Critério secreto oculto. Desvende a pista e continue treinando para descobrir!"
                          : targetLvl.requirement}
                      </p>

                      {/* Barra de Progresso Deste Nível Específico */}
                      <div className="mt-1 pt-2 border-t border-white/[0.05]">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className={isTierDone ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                            {isTierDone
                              ? `✅ Nível Concluído (${targetLvl.targetValue} ${selectedBadge.unit})`
                              : `Progresso: ${selectedBadge.currentProgress} / ${targetLvl.targetValue} ${selectedBadge.unit}`}
                          </span>
                          <span className={isTierDone ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                            {percentTowardThisLevel}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/[0.05]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTierDone
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : "bg-gradient-to-r from-amber-500 to-emerald-400"
                            }`}
                            style={{ width: `${percentTowardThisLevel}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Status Global da Conquista */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                {selectedBadge.currentLevel === selectedBadge.maxLevel ? (
                  <>
                    <span className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Nível Máximo Diamante Conquistado!
                    </span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </>
                ) : selectedBadge.currentLevel > 0 ? (
                  <>
                    <span className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Nív. {selectedBadge.currentLevel} Desbloqueado {selectedBadge.unlockedAt ? `(${selectedBadge.unlockedAt})` : ""}
                    </span>
                    <span className="text-amber-400 font-bold">
                      Rumo ao Nív. {selectedBadge.currentLevel + 1}: {Math.min(100, Math.round((selectedBadge.currentProgress / selectedBadge.targetProgress) * 100))}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-400 flex items-center gap-2">
                      <Lock className={`w-4 h-4 ${selectedBadge.isSecret ? "text-purple-400" : "text-zinc-500"}`} />
                      Progresso: {selectedBadge.currentProgress} / {selectedBadge.targetProgress} {selectedBadge.unit}
                    </span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((selectedBadge.currentProgress / selectedBadge.targetProgress) * 100))}%
                    </span>
                  </>
                )}
              </div>

              {/* Botão de Fechar */}
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full mt-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                Concluir Visualização
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
