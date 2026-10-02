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
} from "@/lib/gamification-service";

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
  role: "student" | "coach";
  category:
    | "Constância"
    | "Disciplina"
    | "Dedicação"
    | "Força"
    | "Frequência"
    | "Resistência"
    | "Volume"
    | "Saúde"
    | "Consultoria"
    | "Prescrição"
    | "Excelência"
    | "Secreta";
  description: string;
  image: string;
  unlocked: boolean;
  unlockedAt?: string;
  currentLevel: number;
  maxLevel: number;
  currentProgress: number;
  targetProgress: number;
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

export const INITIAL_ALL_BADGES: BadgeItem[] = [
  // ==========================================
  // CONQUISTAS DO ALUNO
  // ==========================================
  {
    id: "streak-fire",
    name: "Fogo Sagrado",
    role: "student",
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
    role: "student",
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
    role: "student",
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
    role: "student",
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
    id: "cardio-master",
    name: "Mestre do Cárdio",
    role: "student",
    category: "Resistência",
    description: "Queime calorias e amplie sua capacidade cardiovascular com esteira, bike, simulador de escada e HIIT.",
    image: "/badges/badge_mestre_cardio.png",
    unlocked: true,
    unlockedAt: "15/Set",
    currentLevel: 2,
    maxLevel: 4,
    currentProgress: 4850,
    targetProgress: 5000,
    unit: "kcal",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Coração Turbinado", requirement: "1.500 kcal queimadas em cárdio", targetValue: 1500, xpReward: 120 },
      { level: 2, tier: "prata", title: "Pulmões de Aço", requirement: "5.000 kcal queimadas em cárdio", targetValue: 5000, xpReward: 350 },
      { level: 3, tier: "ouro", title: "Motor Hiperbólico", requirement: "15.000 kcal queimadas em cárdio", targetValue: 15000, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Lenda Aeróbica", requirement: "50.000 kcal queimadas em cárdio", targetValue: 50000, xpReward: 2800 },
    ],
  },
  {
    id: "hydro-titan",
    name: "Hidratação de Titã",
    role: "student",
    category: "Saúde",
    description: "Mantenha a célula muscular hiper-hidratada atingindo a meta saudável de 3 litros de água diários.",
    image: "/badges/badge_hydro_titan.png",
    unlocked: true,
    unlockedAt: "Ontem",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 12,
    targetProgress: 15,
    unit: "dias",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Fonte Vital", requirement: "5 dias com 3L de água", targetValue: 5, xpReward: 80 },
      { level: 2, tier: "prata", title: "Célula Anabólica", requirement: "15 dias com 3L de água", targetValue: 15, xpReward: 220 },
      { level: 3, tier: "ouro", title: "Oceano Muscular", requirement: "30 dias com 3L de água", targetValue: 30, xpReward: 500 },
      { level: 4, tier: "diamante", title: "Hidratação Perfeita", requirement: "90 dias com 3L de água", targetValue: 90, xpReward: 1400 },
    ],
  },
  {
    id: "raw-tonnage",
    name: "Clube do Milhão",
    role: "student",
    category: "Volume",
    description: "Some o volume bruto total de todas as repetições e séries levantadas na academia no GymFlow.",
    image: "/badges/badge_raw_tonnage.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 8400,
    targetProgress: 10000,
    unit: "kg",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "10 Toneladas", requirement: "10.000 kg acumulados", targetValue: 10000, xpReward: 200 },
      { level: 2, tier: "prata", title: "50 Toneladas", requirement: "50.000 kg acumulados", targetValue: 50000, xpReward: 600 },
      { level: 3, tier: "ouro", title: "200 Toneladas", requirement: "200.000 kg acumulados", targetValue: 200000, xpReward: 1800 },
      { level: 4, tier: "diamante", title: "1 Milhão de Quilos", requirement: "1.000.000 kg acumulados", targetValue: 1000000, xpReward: 5000 },
    ],
  },
  {
    id: "rest-master",
    name: "Cronometrista de Aço",
    role: "student",
    category: "Disciplina",
    description: "Respeite rigorosamente o timer de descanso entre as séries sem dispersão para máxima intensidade.",
    image: "/badges/badge_rest_master.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 6,
    targetProgress: 10,
    unit: "treinos",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Foco no Timer", requirement: "10 treinos com descanso cronometrado", targetValue: 10, xpReward: 150 },
      { level: 2, tier: "prata", title: "Precisão Cirúrgica", requirement: "30 treinos com descanso cronometrado", targetValue: 30, xpReward: 400 },
      { level: 3, tier: "ouro", title: "Ritmo Inflexível", requirement: "75 treinos com descanso cronometrado", targetValue: 75, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Maestro do Tempo", requirement: "150 treinos com descanso cronometrado", targetValue: 150, xpReward: 2500 },
    ],
  },
  {
    id: "streak-30",
    name: "Titã da Disciplina",
    role: "student",
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
    role: "student",
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
  // Medalhas Secretas de Aluno
  {
    id: "secret-night-owl",
    name: "Coruja Noturna",
    role: "student",
    category: "Secreta",
    description: "Treine no silêncio da noite quando a maioria dorme. Concluiu sessões intensas após as 22h30.",
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
    role: "student",
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
    role: "student",
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
    role: "student",
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

  // ==========================================
  // CONQUISTAS DO PROFESSOR / PERSONAL TRAINER
  // ==========================================
  {
    id: "coach-mentor",
    name: "Mentor de Elite",
    role: "coach",
    category: "Prescrição",
    description: "Prescreva rotinas e divisões técnicas de musculação e cárdio personalizadas para seus alunos.",
    image: "/badges/badge_coach_mentor.png",
    unlocked: true,
    unlockedAt: "Hoje",
    currentLevel: 2,
    maxLevel: 4,
    currentProgress: 6,
    targetProgress: 15,
    unit: "fichas",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Primeiro Aluno", requirement: "1 ficha técnica prescrita", targetValue: 1, xpReward: 200 },
      { level: 2, tier: "prata", title: "Orientador Técnico", requirement: "5 fichas técnicas prescritas", targetValue: 5, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Mestre da Periodização", requirement: "15 fichas técnicas prescritas", targetValue: 15, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Guru da Hipertrofia", requirement: "50 fichas técnicas prescritas", targetValue: 50, xpReward: 3000 },
    ],
  },
  {
    id: "coach-five-stars",
    name: "Sensei 5 Estrelas",
    role: "coach",
    category: "Excelência",
    description: "Mantenha o padrão máximo de satisfação com avaliações 5 estrelas e feedbacks elogiosos de alunos.",
    image: "/badges/badge_coach_five_stars.png",
    unlocked: true,
    unlockedAt: "Ontem",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 4,
    targetProgress: 10,
    unit: "avaliações",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Padrão de Ouro", requirement: "3 avaliações 5 estrelas", targetValue: 3, xpReward: 250 },
      { level: 2, tier: "prata", title: "Mentor Aclamado", requirement: "10 avaliações 5 estrelas", targetValue: 10, xpReward: 600 },
      { level: 3, tier: "ouro", title: "Estrela do Marketplace", requirement: "25 avaliações 5 estrelas", targetValue: 25, xpReward: 1500 },
      { level: 4, tier: "diamante", title: "Lenda da Consultoria", requirement: "75 avaliações 5 estrelas", targetValue: 75, xpReward: 4000 },
    ],
  },
  {
    id: "coach-monster-factory",
    name: "Fábrica de Monstros",
    role: "coach",
    category: "Consultoria",
    description: "Conduza seus alunos a quebrarem recordes pessoais de carga máxima sob sua supervisão técnica.",
    image: "/badges/badge_coach_monster_factory.png",
    unlocked: true,
    unlockedAt: "20/Set",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 8,
    targetProgress: 20,
    unit: "PRs",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Forja de Titãs", requirement: "Alunos bateram 5 recordes de carga", targetValue: 5, xpReward: 300 },
      { level: 2, tier: "prata", title: "Fábrica em Alta", requirement: "Alunos bateram 20 recordes de carga", targetValue: 20, xpReward: 800 },
      { level: 3, tier: "ouro", title: "Usina de Força", requirement: "Alunos bateram 50 recordes de carga", targetValue: 50, xpReward: 2000 },
      { level: 4, tier: "diamante", title: "Templo dos Recordistas", requirement: "Alunos bateram 150 recordes de carga", targetValue: 150, xpReward: 5000 },
    ],
  },
  {
    id: "coach-punctual",
    name: "Pontualidade Real",
    role: "coach",
    category: "Excelência",
    description: "Ministre aulas presenciais e consultorias pontualmente na grade de horários da agenda.",
    image: "/badges/badge_coach_punctual.png",
    unlocked: true,
    unlockedAt: "10/Set",
    currentLevel: 2,
    maxLevel: 4,
    currentProgress: 24,
    targetProgress: 60,
    unit: "aulas",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Pontualidade Britânica", requirement: "5 aulas ministradas pontualmente", targetValue: 5, xpReward: 150 },
      { level: 2, tier: "prata", title: "Compromisso de Ferro", requirement: "20 aulas ministradas pontualmente", targetValue: 20, xpReward: 450 },
      { level: 3, tier: "ouro", title: "Relógio Suíço", requirement: "60 aulas ministradas pontualmente", targetValue: 60, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Pontualidade Absoluta", requirement: "150 aulas ministradas pontualmente", targetValue: 150, xpReward: 3500 },
    ],
  },
  {
    id: "coach-legend",
    name: "Treinador Lendário",
    role: "coach",
    category: "Consultoria",
    description: "Construa uma carteira sólida e fidelizada de alunos ativos na plataforma GymFlow.",
    image: "/badges/badge_coach_legend.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 2,
    targetProgress: 3,
    unit: "alunos",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Time Formado", requirement: "3 alunos ativos simultâneos", targetValue: 3, xpReward: 200 },
      { level: 2, tier: "prata", title: "Esquadrão de Elite", requirement: "8 alunos ativos simultâneos", targetValue: 8, xpReward: 600 },
      { level: 3, tier: "ouro", title: "Comunidade de Campeões", requirement: "15 alunos ativos simultâneos", targetValue: 15, xpReward: 1500 },
      { level: 4, tier: "diamante", title: "Império do Treinador", requirement: "30 alunos ativos simultâneos", targetValue: 30, xpReward: 4500 },
    ],
  },
  {
    id: "coach-architect",
    name: "Arquiteto Biomecânico",
    role: "coach",
    category: "Prescrição",
    description: "Crie rotinas avançadas combinando musculação pesada, cárdio intervalado e técnicas especiais.",
    image: "/badges/badge_coach_architect.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 1,
    targetProgress: 2,
    unit: "rotinas",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Estrutura Sólida", requirement: "2 rotinas complexas criadas", targetValue: 2, xpReward: 150 },
      { level: 2, tier: "prata", title: "Engenharia Corporal", requirement: "8 rotinas complexas criadas", targetValue: 8, xpReward: 400 },
      { level: 3, tier: "ouro", title: "Biomecânica Quântica", requirement: "20 rotinas complexas criadas", targetValue: 20, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Mestre da Fisiologia", requirement: "50 rotinas complexas criadas", targetValue: 50, xpReward: 2800 },
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
  const [filterTab, setFilterTab] = useState<"todas" | "desbloqueadas" | "progresso" | "secretas">("todas");

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
    setSelectedTierLevel(badge.currentLevel > 0 ? badge.currentLevel : 1);
  };

  const currentRoleBadges = badges.filter((b) => b.role === activeRole);

  const filteredBadges = currentRoleBadges.filter((badge) => {
    if (filterTab === "desbloqueadas") return badge.unlocked;
    if (filterTab === "progresso") return !badge.unlocked && !badge.isSecret;
    if (filterTab === "secretas") return badge.isSecret;
    return true;
  });

  const unlockedCount = currentRoleBadges.filter((b) => b.unlocked).length;
  const totalCount = currentRoleBadges.length;

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
                Conquistas de {activeRole === "student" ? "Alunos" : "Professores & Personais"} com leveis progressivos
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
              setFilterTab("todas");
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
              setFilterTab("todas");
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
            Em Progresso ({totalCount - unlockedCount - (activeRole === "student" ? 2 : 0)})
          </button>
          {activeRole === "student" && (
            <button
              onClick={() => setFilterTab("secretas")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterTab === "secretas"
                  ? "bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Lock className="w-3 h-3 text-purple-400" />
              Secretas (4)
            </button>
          )}
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
                        {isSecretLocked
                          ? `${badge.currentProgress} de ${badge.targetProgress}`
                          : `${badge.currentProgress} / ${badge.targetProgress} ${badge.unit}`}
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
                  const isSecretLocked = selectedBadge.isSecret && !selectedBadge.unlocked;

                  return (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5">
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
                    <Lock className={`w-4 h-4 ${selectedBadge.isSecret ? "text-purple-400" : "text-zinc-500"}`} />
                    Progresso:{" "}
                    {selectedBadge.isSecret
                      ? `${selectedBadge.currentProgress} de ${selectedBadge.targetProgress}`
                      : `${selectedBadge.currentProgress} / ${selectedBadge.targetProgress} ${selectedBadge.unit}`}
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
