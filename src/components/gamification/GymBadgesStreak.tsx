"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Award,
  Zap,
  Lock,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  ChevronRight,
  Eye,
  HelpCircle,
  Shield,
  Star,
  X,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export type BadgeTier = "bronze" | "prata" | "ouro" | "diamante";
export type BadgeRarity = "comum" | "raro" | "epico" | "lendario" | "mitico";

export interface BadgeLevelInfo {
  level: number;
  tier: BadgeTier;
  title: string;
  requirement: string;
  targetValue: number;
  xpReward: number;
}

export interface BadgeItem {
  id: string;
  name: string;
  category: "Constância" | "Disciplina" | "Dedicação" | "Força" | "Frequência" | "Resistência" | "Volume" | "Secreta";
  description: string;
  image: string;
  unlocked: boolean;
  unlockedAt?: string;
  currentLevel: number;
  maxLevel: number;
  currentProgress: number; // valor atual
  targetProgress: number; // valor para o próximo nível
  unit: string;
  isSecret?: boolean;
  secretClue?: string;
  rarity: BadgeRarity;
  levels: BadgeLevelInfo[];
}

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

const BADGES: BadgeItem[] = [
  {
    id: "streak-fire",
    name: "Fogo Sagrado",
    category: "Constância",
    description: "Mantenha a chama acesa comparecendo à academia em dias consecutivos sem quebrar o ritmo.",
    image: "/badges/badge_fogo_sagrado.png",
    unlocked: true,
    unlockedAt: "Hoje",
    currentLevel: 2,
    maxLevel: 4,
    currentProgress: 16,
    targetProgress: 30,
    unit: "dias",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Chama Inicial", requirement: "7 dias seguidos de treino", targetValue: 7, xpReward: 100 },
      { level: 2, tier: "prata", title: "Fogo Consagrado", requirement: "15 dias seguidos de treino", targetValue: 15, xpReward: 250 },
      { level: 3, tier: "ouro", title: "Inferno Ardente", requirement: "30 dias seguidos de treino", targetValue: 30, xpReward: 600 },
      { level: 4, tier: "diamante", title: "Chama Eterna", requirement: "60 dias seguidos de treino", targetValue: 60, xpReward: 1500 },
    ],
  },
  {
    id: "early-bird",
    name: "Clube das 06h",
    category: "Disciplina",
    description: "Vença a cama e conclua suas sessões antes das 07:00 da manhã com dedicação inabalável.",
    image: "/badges/badge_clube_06h.png",
    unlocked: true,
    unlockedAt: "Ontem",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 5,
    targetProgress: 10,
    unit: "treinos",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Madrugador", requirement: "3 treinos antes das 07:00", targetValue: 3, xpReward: 100 },
      { level: 2, tier: "prata", title: "Aurora de Aço", requirement: "10 treinos antes das 07:00", targetValue: 10, xpReward: 300 },
      { level: 3, tier: "ouro", title: "Sentinela do Alvorecer", requirement: "25 treinos antes das 07:00", targetValue: 25, xpReward: 750 },
      { level: 4, tier: "diamante", title: "Soberano da Alvorada", requirement: "50 treinos antes das 07:00", targetValue: 50, xpReward: 2000 },
    ],
  },
  {
    id: "century-club",
    name: "Centurião",
    category: "Dedicação",
    description: "Acumule centenas de treinos registrados com disciplina e evolução consistente no GymFlow.",
    image: "/badges/badge_centuriao.png",
    unlocked: true,
    unlockedAt: "01/Set",
    currentLevel: 3,
    maxLevel: 4,
    currentProgress: 104,
    targetProgress: 250,
    unit: "treinos",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Gladiador Iniciante", requirement: "25 treinos registrados", targetValue: 25, xpReward: 150 },
      { level: 2, tier: "prata", title: "Veterano de Ferro", requirement: "50 treinos registrados", targetValue: 50, xpReward: 400 },
      { level: 3, tier: "ouro", title: "Centurião Romano", requirement: "100 treinos registrados", targetValue: 100, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Comandante Lendário", requirement: "250 treinos registrados", targetValue: 250, xpReward: 3000 },
    ],
  },
  {
    id: "pr-breaker",
    name: "Batedor de PR",
    category: "Força",
    description: "Quebre recordes pessoais de carga máxima em exercícios livres e demonstre pura sobrecarga progressiva.",
    image: "/badges/badge_batedor_pr.png",
    unlocked: true,
    unlockedAt: "28/Ago",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 4,
    targetProgress: 5,
    unit: "recordes",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Quebrador de Limites", requirement: "1 novo Recorde Pessoal (PR)", targetValue: 1, xpReward: 100 },
      { level: 2, tier: "prata", title: "Demolidor de Cargas", requirement: "5 novos Recordes Pessoais (PR)", targetValue: 5, xpReward: 350 },
      { level: 3, tier: "ouro", title: "Força Sísmica", requirement: "15 novos Recordes Pessoais (PR)", targetValue: 15, xpReward: 900 },
      { level: 4, tier: "diamante", title: "Titã da Sobrecarga", requirement: "30 novos Recordes Pessoais (PR)", targetValue: 30, xpReward: 2500 },
    ],
  },
  {
    id: "streak-30",
    name: "Titã da Disciplina",
    category: "Constância",
    description: "Atinja o ápice da regularidade inabalável completando 30 dias de treinos consecutivos sem desculpas.",
    image: "/badges/badge_tita_disciplina.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 16,
    targetProgress: 20,
    unit: "dias",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Determinação de Ferro", requirement: "20 dias consecutivos", targetValue: 20, xpReward: 200 },
      { level: 2, tier: "prata", title: "Titã Inquebrável", requirement: "30 dias consecutivos", targetValue: 30, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Mente Impenetrável", requirement: "45 dias consecutivos", targetValue: 45, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Imortal da Frequência", requirement: "90 dias consecutivos", targetValue: 90, xpReward: 3500 },
    ],
  },
  {
    id: "beast-mode",
    name: "Semana Perfeita",
    category: "Frequência",
    description: "Conclua 6 dias de treino na mesma semana com 100% das séries prescritas executadas até o final.",
    image: "/badges/badge_semana_perfeita.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 1,
    unit: "semanas",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Semana Impecável", requirement: "1 semana com 6 treinos e 100% séries", targetValue: 1, xpReward: 150 },
      { level: 2, tier: "prata", title: "Fera Indomável", requirement: "3 semanas perfeitas", targetValue: 3, xpReward: 450 },
      { level: 3, tier: "ouro", title: "Modo Monstro Ativo", requirement: "8 semanas perfeitas", targetValue: 8, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Rei da Selva de Ferro", requirement: "16 semanas perfeitas", targetValue: 16, xpReward: 3000 },
    ],
  },
  {
    id: "cardio-master",
    name: "Mestre do Cárdio",
    category: "Resistência",
    description: "Queime calorias e amplie sua capacidade cardiovascular com sessões consistentes de esteira, bike ou escada.",
    image: "/badges/badge_mestre_cardio.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 980,
    targetProgress: 1500,
    unit: "kcal",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Coração Turbinado", requirement: "1.500 kcal queimadas em cárdio", targetValue: 1500, xpReward: 120 },
      { level: 2, tier: "prata", title: "Pulmões de Aço", requirement: "5.000 kcal queimadas em cárdio", targetValue: 5000, xpReward: 350 },
      { level: 3, tier: "ouro", title: "Motor Hiperbólico", requirement: "15.000 kcal queimadas em cárdio", targetValue: 15000, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Lenda Aeróbica", requirement: "50.000 kcal queimadas em cárdio", targetValue: 50000, xpReward: 2800 },
    ],
  },
  // MEDALHAS SECRETAS
  {
    id: "secret-night-owl",
    name: "Coruja Noturna",
    category: "Secreta",
    description: "Treine no silêncio da noite quando a maioria dorme. Completou sessões intensas após as 22h30.",
    image: "/badges/badge_coruja_noturna.png",
    unlocked: true,
    unlockedAt: "12/Set",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 2,
    targetProgress: 3,
    unit: "noites",
    isSecret: true,
    secretClue: "Há quem diga que o silêncio após as 22h30 reserva a calmaria perfeita para os guerreiros da noite...",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Vigilante Noturno", requirement: "1 treino concluído após as 22h30", targetValue: 1, xpReward: 200 },
      { level: 2, tier: "prata", title: "Guardião da Meia-Noite", requirement: "3 treinos concluídos após as 22h30", targetValue: 3, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Sombra da Sala de Pesos", requirement: "10 treinos concluídos após as 22h30", targetValue: 10, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Ascendente das Trevas", requirement: "25 treinos concluídos após as 22h30", targetValue: 25, xpReward: 3000 },
    ],
  },
  {
    id: "secret-berserk",
    name: "Modo Berserk",
    category: "Secreta",
    description: "Sem feriado para o progresso. Treinou com vigor destemido em dias comemorativos ou domingos.",
    image: "/badges/badge_modo_berserk.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 1,
    unit: "feriados",
    isSecret: true,
    secretClue: "Quando as portas das academias quase se fecham nos feriados e domingos, a disciplina inabalável forja o verdadeiro guerreiro.",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Fúria Espartana", requirement: "1 treino em feriado nacional ou domingo", targetValue: 1, xpReward: 300 },
      { level: 2, tier: "prata", title: "Fúria Imparável", requirement: "3 treinos em feriados ou domingos", targetValue: 3, xpReward: 700 },
      { level: 3, tier: "ouro", title: "Ira dos Deuses Nórdicos", requirement: "8 treinos em feriados ou domingos", targetValue: 8, xpReward: 1600 },
      { level: 4, tier: "diamante", title: "Lorde Berserker", requirement: "20 treinos em feriados ou domingos", targetValue: 20, xpReward: 4000 },
    ],
  },
  {
    id: "secret-cyborg",
    name: "Ciborgue da Sobrecarga",
    category: "Secreta",
    description: "Engenharia biomecânica pura: progrediu a carga em 4 exercícios compostos na mesma sessão de treino.",
    image: "/badges/badge_ciborgue_sobrecarga.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 1,
    targetProgress: 2,
    unit: "sessões",
    isSecret: true,
    secretClue: "A progressão contínua não é sorte, é precisão cirúrgica de elevar as cargas de 4 exercícios na mesma sessão.",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "Protocolo Biomecânico", requirement: "Subir carga em 4 exercícios em 1 treino", targetValue: 1, xpReward: 500 },
      { level: 2, tier: "prata", title: "Circuito Quântico", requirement: "Subir carga em 4 exercícios em 3 treinos", targetValue: 3, xpReward: 1200 },
      { level: 3, tier: "ouro", title: "Núcleo de Titânio", requirement: "Subir carga em 4 exercícios em 8 treinos", targetValue: 8, xpReward: 2500 },
      { level: 4, tier: "diamante", title: "Singularidade Biônica", requirement: "Subir carga em 4 exercícios em 20 treinos", targetValue: 20, xpReward: 6000 },
    ],
  },
  {
    id: "secret-glitch-404",
    name: "Dimensão 404",
    category: "Secreta",
    description: "Praticamente impossível: encontrou uma fenda na realidade do GymFlow e sobreviveu à lendária página de erro 404.",
    image: "/badges/badge_secret_404.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 1,
    unit: "anomalias",
    isSecret: true,
    secretClue: "Praticamente impossível. Dizem que apenas quem se perde nas fendas do sistema e falha uma repetição dimensional encontra esta relíquia...",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "Fenda Dimensional", requirement: "Acessar a página 404 de erro do sistema", targetValue: 1, xpReward: 500 },
      { level: 2, tier: "prata", title: "Caçador de Glitches", requirement: "Descobrir 2 anomalias ou rotas ocultas", targetValue: 2, xpReward: 1200 },
      { level: 3, tier: "ouro", title: "Lorde do Vazio", requirement: "Dominar 5 anomalias do sistema", targetValue: 5, xpReward: 3000 },
      { level: 4, tier: "diamante", title: "Singularidade Cósmica", requirement: "Trascender os limites do código", targetValue: 10, xpReward: 10000 },
    ],
  },
];

const PR_RECORDS: PRRecord[] = [
  { id: "1", exercise: "Supino Reto Barra", weight: 104, date: "02/Set" },
  { id: "2", exercise: "Agachamento Livre", weight: 142, date: "28/Ago" },
  { id: "3", exercise: "Levantamento Terra", weight: 170, date: "15/Ago" },
  { id: "4", exercise: "Desenvolvimento Halteres", weight: 34, date: "05/Set" },
];

export function GymBadgesStreak() {
  const [badges, setBadges] = useState<BadgeItem[]>(BADGES);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [selectedTierLevel, setSelectedTierLevel] = useState<number>(1);
  const [filterTab, setFilterTab] = useState<"todas" | "desbloqueadas" | "progresso" | "secretas">("todas");

  useEffect(() => {
    const syncBadges = () => {
      if (typeof window === "undefined") return;
      const is404Unlocked = localStorage.getItem("gymflow_badge_secret_404_unlocked") === "true";
      const unlockDate = localStorage.getItem("gymflow_badge_secret_404_date") || "Hoje";

      setBadges((prev) =>
        prev.map((b) => {
          if (b.id === "secret-glitch-404" && is404Unlocked) {
            return {
              ...b,
              unlocked: true,
              currentLevel: 1,
              currentProgress: 1,
              unlockedAt: unlockDate,
            };
          }
          return b;
        })
      );
    };

    syncBadges();
    window.addEventListener("gymflow:badges-updated", syncBadges);
    window.addEventListener("storage", syncBadges);
    return () => {
      window.removeEventListener("gymflow:badges-updated", syncBadges);
      window.removeEventListener("storage", syncBadges);
    };
  }, []);

  const streakCount = 16;
  const nextMilestone = 20;

  const handleSelectBadge = (badge: BadgeItem) => {
    triggerHaptic(badge.unlocked ? "success" : "light");
    setSelectedBadge(badge);
    setSelectedTierLevel(badge.currentLevel > 0 ? badge.currentLevel : 1);
  };

  const filteredBadges = badges.filter((badge) => {
    if (filterTab === "desbloqueadas") return badge.unlocked;
    if (filterTab === "progresso") return !badge.unlocked && !badge.isSecret;
    if (filterTab === "secretas") return badge.isSecret;
    return true;
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Card Principal: Streak & Chamas 3D */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {streakCount} DIAS
                </span>
                <span className="text-[11px] font-bold uppercase text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  On Fire 🔥
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                Sua maior sequência na história do GymFlow!
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso para Próxima Meta */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] relative z-10">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Próxima Conquista: 20 Dias
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {streakCount} / {nextMilestone} dias ({Math.round((streakCount / nextMilestone) * 100)}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950/60 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(streakCount / nextMilestone) * 100}%` }}
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
                Conquistas com leveis progressivos e medalhas secretas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {unlockedCount} / {totalCount} Desbloqueadas
            </span>
          </div>
        </div>

        {/* Abas de Filtragem Rápida */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/[0.05] mb-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterTab("todas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterTab === "todas"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todas ({totalCount})
          </button>
          <button
            onClick={() => setFilterTab("desbloqueadas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterTab === "desbloqueadas"
                ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Desbloqueadas ({unlockedCount})
          </button>
          <button
            onClick={() => setFilterTab("progresso")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterTab === "progresso"
                ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Em Progresso ({totalCount - unlockedCount - 2})
          </button>
          <button
            onClick={() => setFilterTab("secretas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterTab === "secretas"
                ? "bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Lock className="w-3 h-3 text-purple-400" />
            Secretas (3)
          </button>
        </div>

        {/* Grade de Medalhas 3D */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {filteredBadges.map((badge) => {
            const isSecretLocked = badge.isSecret && !badge.unlocked;
            const currentTier = badge.currentLevel > 0 ? badge.levels[badge.currentLevel - 1].tier : "bronze";
            const tierStyle = TIER_META[currentTier];

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
                    : "bg-zinc-950/40 border-white/[0.04] opacity-65 hover:opacity-85"
                }`}
              >
                {/* Chip de Nível / Status no Topo do Card */}
                <div className="w-full flex items-center justify-between mb-2">
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

                  <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
                    {badge.isSecret ? "Easter Egg" : badge.category}
                  </span>
                </div>

                {/* Imagem 3D Real com Fundo Transparente */}
                <div className="relative w-full aspect-square max-w-[120px] mx-auto my-1 flex items-center justify-center">
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
                      sizes="(max-width: 640px) 100px, 120px"
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
                <div className="mt-2 w-full">
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
                        {badge.currentProgress} / {badge.targetProgress} {badge.unit}
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

              {/* Rarity & Categoria Chip */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                    RARITY_META[selectedBadge.rarity].color
                  }`}
                >
                  {RARITY_META[selectedBadge.rarity].label}
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                  {selectedBadge.category}
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
                    const isUnlockedTier = selectedBadge.currentLevel >= lvl.level;
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
                            ? `bg-white/10 ${tierMeta.border} shadow-sm`
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="text-sm">{tierMeta.icon}</span>
                        <span className="text-[10px] font-bold text-white mt-0.5">Nív. {lvl.level}</span>
                        <span
                          className={`text-[8px] font-mono uppercase font-semibold ${
                            isCurrentTier
                              ? "text-emerald-400"
                              : isUnlockedTier
                              ? "text-zinc-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {isCurrentTier ? "Atual" : isUnlockedTier ? "Feito" : "Trava"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Detalhe do Nível Selecionado */}
                {(() => {
                  const targetLvl = selectedBadge.levels[selectedTierLevel - 1];
                  const tierMeta = TIER_META[targetLvl.tier];

                  return (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${tierMeta.text} flex items-center gap-1.5`}>
                          <span>{tierMeta.icon}</span>
                          <span>
                            Nível {targetLvl.level} • {targetLvl.title} ({tierMeta.label})
                          </span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          +{targetLvl.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-snug">
                        <strong>Requisito:</strong> {targetLvl.requirement}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Status de Conclusão / Progresso */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                {selectedBadge.unlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Desbloqueado {selectedBadge.unlockedAt}
                  </span>
                ) : (
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    Progresso: {selectedBadge.currentProgress} / {selectedBadge.targetProgress} {selectedBadge.unit}
                  </span>
                )}
                <span className="text-amber-400 font-bold">
                  {Math.min(
                    100,
                    Math.round((selectedBadge.currentProgress / selectedBadge.targetProgress) * 100)
                  )}
                  %
                </span>
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
