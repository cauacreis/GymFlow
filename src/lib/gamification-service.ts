/**
 * GymFlow Central Gamification & Achievement Engine
 * Gerencia o progresso das conquistas em múltiplos horizontes temporais (Iniciais, Semanais, Mensais, Anuais, Carreira),
 * leveis progressivos (Bronze, Prata, Ouro, Diamante), acionamento de celebrações e notificações no perfil.
 */

import { addNotification } from "./booking-store";
import { triggerHaptic } from "./haptic";
import { upsertAchievementToSupabase } from "./supabase-service";
import {
  calculateSmartWorkoutStreak,
  recordWorkoutAttendanceDate,
  getStoredAttendanceDates,
  getLocalDateKey,
  StreakInfo,
  EVENT_STREAK_UPDATED,
} from "./streak-service";

export * from "./streak-service";

export type BadgeTier = "bronze" | "prata" | "ouro" | "diamante";
export type BadgeRarity = "comum" | "raro" | "epico" | "lendario" | "mitico";
export type BadgeCadence = "inicial" | "semanal" | "mensal" | "anual" | "permanente";
export type BadgeDifficulty = "iniciante" | "intermediario" | "avancado" | "lendario" | "mitico";

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
  cadence: BadgeCadence;
  difficulty: BadgeDifficulty;
  category:
    | "Iniciação"
    | "Desafio Semanal"
    | "Meta Mensal"
    | "Lenda Anual"
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

export interface AchievementUnlockEventData {
  badge: BadgeItem;
  unlockedLevel: number;
  tier: BadgeTier;
  tierName: string;
  xpReward: number;
  reason: string;
  timestamp: string;
}

export interface StoredBadgeProgress {
  currentProgress: number;
  currentLevel: number;
  unlocked: boolean;
  unlockedAt?: string;
  lastNotifiedLevel: number;
}

export const TIER_NAMES: Record<BadgeTier, string> = {
  bronze: "Bronze 🥉",
  prata: "Prata 🥈",
  ouro: "Ouro 🥇",
  diamante: "Diamante 💎",
};

export const CADENCE_LABELS: Record<BadgeCadence, { label: string; icon: string; description: string }> = {
  inicial: { label: "Iniciais", icon: "🎯", description: "Conquistas rápidas de primeiros passos" },
  semanal: { label: "Semanais", icon: "⚡", description: "Desafios com meta de fechamento semanal" },
  mensal: { label: "Mensais", icon: "📅", description: "Metas de consistência e transformação mensal" },
  anual: { label: "Anuais", icon: "👑", description: "Grandes marcos de longevidade e status lendário" },
  permanente: { label: "Carreira", icon: "🏆", description: "Evolução contínua acumulada ao longo do tempo" },
};

export const DIFFICULTY_LABELS: Record<BadgeDifficulty, { label: string; color: string; bg: string }> = {
  iniciante: { label: "Iniciante", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  intermediario: { label: "Intermediário", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  avancado: { label: "Avançado", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  lendario: { label: "Lendário", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  mitico: { label: "Mítico", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" },
};

const STORAGE_GAMIFICATION = "gymflow_gamification_progress_v2";
export const EVENT_BADGES_UPDATED = "gymflow:badges-updated";
export const EVENT_SHOW_CELEBRATION = "gymflow:show-achievement-celebration";

export const INITIAL_ALL_BADGES: BadgeItem[] = [
  // ==========================================
  // 1. CONQUISTAS INICIAIS (PRIMEIROS PASSOS)
  // ==========================================
  {
    id: "welcome-gymflow",
    name: "Bem-vindo ao GymFlow",
    role: "student",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Você deu o pontapé inicial na sua jornada criando sua conta e entrando na comunidade GymFlow!",
    image: "/badges/badge_fogo_sagrado.png",
    unlocked: true,
    unlockedAt: "Hoje",
    currentLevel: 1,
    maxLevel: 1,
    currentProgress: 1,
    targetProgress: 1,
    unit: "conta",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Entrada na Tribo", requirement: "Cadastrar e entrar no GymFlow", targetValue: 1, xpReward: 50 },
    ],
  },
  {
    id: "first-workout",
    name: "Primeira Gota de Suor",
    role: "student",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Dê o primeiro passo oficial na sua transformação concluindo seu 1º treino no GymFlow.",
    image: "/badges/badge_fogo_sagrado.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 1,
    currentProgress: 0,
    targetProgress: 1,
    unit: "treino",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Primeiro Treino Concluído", requirement: "1 treino registrado", targetValue: 1, xpReward: 100 },
    ],
  },
  {
    id: "first-checkin",
    name: "Passaporte de Aço",
    role: "student",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Faça seu primeiro check-in digital na catraca da academia usando o QR Code do app.",
    image: "/badges/badge_clube_06h.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 1,
    currentProgress: 0,
    targetProgress: 1,
    unit: "check-in",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Entrada Liberada", requirement: "1 check-in na catraca", targetValue: 1, xpReward: 100 },
    ],
  },
  {
    id: "profile-complete",
    name: "Identidade do Atleta",
    role: "student",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Personalize seu perfil com foto, medidas antropométricas, objetivo e telefone para suporte.",
    image: "/badges/badge_tita_disciplina.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 1,
    currentProgress: 0,
    targetProgress: 1,
    unit: "perfil",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Cadastro Completo", requirement: "Completar perfil 100%", targetValue: 1, xpReward: 150 },
    ],
  },
  {
    id: "first-cardio",
    name: "Ignição Aeróbica",
    role: "student",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Coloque o coração para bater forte completando sua primeira sessão de esteira, escada ou bike.",
    image: "/badges/badge_mestre_cardio.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 1,
    currentProgress: 0,
    targetProgress: 100,
    unit: "kcal",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Primeiro Cárdio", requirement: "100 kcal em sessão aeróbica", targetValue: 100, xpReward: 100 },
    ],
  },
  {
    id: "hydration-starter",
    name: "Primeiro Gole",
    role: "student",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Registre o primeiro copo ou garrafa de água no monitor de hidratação do GymFlow.",
    image: "/badges/badge_hydro_titan.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 1,
    currentProgress: 0,
    targetProgress: 500,
    unit: "ml",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Hidratação Inicial", requirement: "500 ml de água registrados", targetValue: 500, xpReward: 80 },
    ],
  },

  // ==========================================
  // 2. CONQUISTAS SEMANAIS (DESAFIOS SEMANAIS)
  // ==========================================
  {
    id: "weekly-warrior",
    name: "Guerreiro da Semana",
    role: "student",
    cadence: "semanal",
    difficulty: "intermediario",
    category: "Desafio Semanal",
    description: "Cumpra sua meta de frequência acumulando múltiplos dias de treino dentro da mesma semana.",
    image: "/badges/badge_semana_perfeita.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 3,
    unit: "dias",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Meta Básica", requirement: "3 dias de treino na semana", targetValue: 3, xpReward: 120 },
      { level: 2, tier: "prata", title: "Ritmo Forte", requirement: "4 dias de treino na semana", targetValue: 4, xpReward: 250 },
      { level: 3, tier: "ouro", title: "Quase Imbatível", requirement: "5 dias de treino na semana", targetValue: 5, xpReward: 500 },
      { level: 4, tier: "diamante", title: "Semana Lendária", requirement: "6 dias de treino na semana", targetValue: 6, xpReward: 1000 },
    ],
  },
  {
    id: "weekly-cardio-burn",
    name: "Incinerador Semanal",
    role: "student",
    cadence: "semanal",
    difficulty: "intermediario",
    category: "Desafio Semanal",
    description: "Queime gordura e aumente o VO2 Max acumulando calorias aeróbicas ao longo dos 7 dias da semana.",
    image: "/badges/badge_cardio_master.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 500,
    unit: "kcal",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Aquecimento Semanal", requirement: "500 kcal queimadas na semana", targetValue: 500, xpReward: 100 },
      { level: 2, tier: "prata", title: "Queima Intensa", requirement: "1.000 kcal queimadas na semana", targetValue: 1000, xpReward: 250 },
      { level: 3, tier: "ouro", title: "Fornalha Metabólica", requirement: "2.500 kcal queimadas na semana", targetValue: 2500, xpReward: 600 },
      { level: 4, tier: "diamante", title: "Motor Inesgotável", requirement: "5.000 kcal queimadas na semana", targetValue: 5000, xpReward: 1500 },
    ],
  },
  {
    id: "weekly-volume-load",
    name: "Carga da Semana",
    role: "student",
    cadence: "semanal",
    difficulty: "intermediario",
    category: "Desafio Semanal",
    description: "Acumule tonelagem bruta nos exercícios de musculação somando todas as séries concluídas da semana.",
    image: "/badges/badge_raw_tonnage.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 10000,
    unit: "kg",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Carga Sólida", requirement: "10.000 kg movimentados na semana", targetValue: 10000, xpReward: 150 },
      { level: 2, tier: "prata", title: "Sobrecarga Notável", requirement: "25.000 kg movimentados na semana", targetValue: 25000, xpReward: 350 },
      { level: 3, tier: "ouro", title: "Força Bruta", requirement: "50.000 kg movimentados na semana", targetValue: 50000, xpReward: 800 },
      { level: 4, tier: "diamante", title: "Monstro do Volume", requirement: "100.000 kg movimentados na semana", targetValue: 100000, xpReward: 2000 },
    ],
  },
  {
    id: "weekly-hydration",
    name: "Semana Hiper-Hidratada",
    role: "student",
    cadence: "semanal",
    difficulty: "intermediario",
    category: "Desafio Semanal",
    description: "Garanta anabolismo celular batendo a meta saudável de 3 litros de água em múltiplos dias da semana.",
    image: "/badges/badge_hydro_titan.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 3,
    currentProgress: 0,
    targetProgress: 3,
    unit: "dias",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Hidratação Parcial", requirement: "3 dias com 3L na semana", targetValue: 3, xpReward: 100 },
      { level: 2, tier: "prata", title: "Consistência Aquosa", requirement: "5 dias com 3L na semana", targetValue: 5, xpReward: 250 },
      { level: 3, tier: "ouro", title: "Semana 100% Hidratada", requirement: "7 dias com 3L na semana", targetValue: 7, xpReward: 700 },
    ],
  },
  {
    id: "beast-mode",
    name: "Semana Perfeita",
    role: "student",
    cadence: "semanal",
    difficulty: "avancado",
    category: "Desafio Semanal",
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

  // ==========================================
  // 3. CONQUISTAS MENSAIS (METAS MENSAIS)
  // ==========================================
  {
    id: "monthly-iron-attendance",
    name: "Mês de Ferro",
    role: "student",
    cadence: "mensal",
    difficulty: "avancado",
    category: "Meta Mensal",
    description: "Mantenha disciplina inabalável no mês acumulando frequência constante no calendário.",
    image: "/badges/badge_centuriao.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 12,
    unit: "treinos",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Frequência Sólida", requirement: "12 treinos no mês", targetValue: 12, xpReward: 200 },
      { level: 2, tier: "prata", title: "Disciplina de Aço", requirement: "16 treinos no mês", targetValue: 16, xpReward: 450 },
      { level: 3, tier: "ouro", title: "Guerreiro do Mês", requirement: "20 treinos no mês", targetValue: 20, xpReward: 900 },
      { level: 4, tier: "diamante", title: "Presença Perfeita", requirement: "24 treinos no mês", targetValue: 24, xpReward: 2200 },
    ],
  },
  {
    id: "monthly-body-evolution",
    name: "Metamorfose Mensal",
    role: "student",
    cadence: "mensal",
    difficulty: "intermediario",
    category: "Meta Mensal",
    description: "Acompanhe sua composição corporal registrando bioimpedâncias e medidas antropométricas no mês.",
    image: "/badges/badge_tita_disciplina.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 3,
    currentProgress: 0,
    targetProgress: 1,
    unit: "avaliações",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Checkup Mensal", requirement: "1 avaliação física no mês", targetValue: 1, xpReward: 150 },
      { level: 2, tier: "prata", title: "Controle Rigoroso", requirement: "2 avaliações físicas no mês", targetValue: 2, xpReward: 350 },
      { level: 3, tier: "ouro", title: "Mapeamento Completo", requirement: "4 avaliações físicas no mês", targetValue: 4, xpReward: 800 },
    ],
  },
  {
    id: "monthly-pr-hunter",
    name: "Caçador de Cargas",
    role: "student",
    cadence: "mensal",
    difficulty: "avancado",
    category: "Meta Mensal",
    description: "Supere seus limites e quebre novos Recordes Pessoais (PRs) no decorrer do ciclo de 30 dias.",
    image: "/badges/badge_batedor_pr.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 2,
    unit: "recordes",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Nova Marca", requirement: "2 recordes pessoais no mês", targetValue: 2, xpReward: 200 },
      { level: 2, tier: "prata", title: "Progressão Notável", requirement: "5 recordes pessoais no mês", targetValue: 5, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Explosão de Força", requirement: "8 recordes pessoais no mês", targetValue: 8, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Demolidor Mensal", requirement: "12 recordes pessoais no mês", targetValue: 12, xpReward: 2500 },
    ],
  },
  {
    id: "monthly-distance-king",
    name: "Maratona Mensal",
    role: "student",
    cadence: "mensal",
    difficulty: "avancado",
    category: "Meta Mensal",
    description: "Acumule quilômetros percorridos em esteiras e bicicletas ergométricas no mês corrente.",
    image: "/badges/badge_cardio_master.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 20.0,
    unit: "km",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "20 Quilômetros", requirement: "20 km de cárdio no mês", targetValue: 20, xpReward: 150 },
      { level: 2, tier: "prata", title: "50 Quilômetros", requirement: "50 km de cárdio no mês", targetValue: 50, xpReward: 400 },
      { level: 3, tier: "ouro", title: "100 Quilômetros", requirement: "100 km de cárdio no mês", targetValue: 100, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "200 Quilômetros", requirement: "200 km de cárdio no mês", targetValue: 200, xpReward: 2800 },
    ],
  },

  // ==========================================
  // 4. CONQUISTAS ANUAIS & LENDÁRIAS (LONGEVIDADE)
  // ==========================================
  {
    id: "annual-titan-365",
    name: "Jornada 365",
    role: "student",
    cadence: "anual",
    difficulty: "lendario",
    category: "Lenda Anual",
    description: "Construa um estilo de vida permanente atingindo marcos centenários de treinos no ano.",
    image: "/badges/badge_centuriao.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 100,
    unit: "treinos",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "Centurião do Ano", requirement: "100 treinos registrados no ano", targetValue: 100, xpReward: 500 },
      { level: 2, tier: "prata", title: "Guerreiro Semestral", requirement: "180 treinos registrados no ano", targetValue: 180, xpReward: 1200 },
      { level: 3, tier: "ouro", title: "Atleta de Elite", requirement: "250 treinos registrados no ano", targetValue: 250, xpReward: 3000 },
      { level: 4, tier: "diamante", title: "Lenda dos 365 Dias", requirement: "365 treinos no ano", targetValue: 365, xpReward: 10000 },
    ],
  },
  {
    id: "annual-megaton",
    name: "Megatonelada Anual",
    role: "student",
    cadence: "anual",
    difficulty: "mitico",
    category: "Lenda Anual",
    description: "Mova montanhas e atinja o ápice da sobrecarga com centenas de toneladas erguidas no ano.",
    image: "/badges/badge_raw_tonnage.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 250000,
    unit: "kg",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "250 Toneladas", requirement: "250.000 kg acumulados no ano", targetValue: 250000, xpReward: 800 },
      { level: 2, tier: "prata", title: "Meio Milhão de Quilos", requirement: "500.000 kg acumulados no ano", targetValue: 500000, xpReward: 2000 },
      { level: 3, tier: "ouro", title: "1 Megatonelada", requirement: "1.000.000 kg acumulados no ano", targetValue: 1000000, xpReward: 5000 },
      { level: 4, tier: "diamante", title: "Titã Cósmico", requirement: "2.500.000 kg acumulados no ano", targetValue: 2500000, xpReward: 15000 },
    ],
  },
  {
    id: "annual-ultra-endurance",
    name: "Ultra-Resistência Anual",
    role: "student",
    cadence: "anual",
    difficulty: "lendario",
    category: "Lenda Anual",
    description: "Transforme seu sistema cardiorrespiratório acumulando dezenas de milhares de calorias no ano.",
    image: "/badges/badge_mestre_cardio.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 25000,
    unit: "kcal",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "25.000 kcal Anuais", requirement: "25.000 kcal queimadas no ano", targetValue: 25000, xpReward: 600 },
      { level: 2, tier: "prata", title: "60.000 kcal Anuais", requirement: "60.000 kcal queimadas no ano", targetValue: 60000, xpReward: 1500 },
      { level: 3, tier: "ouro", title: "120.000 kcal Anuais", requirement: "120.000 kcal queimadas no ano", targetValue: 120000, xpReward: 3500 },
      { level: 4, tier: "diamante", title: "Coração Biônico", requirement: "250.000 kcal queimadas no ano", targetValue: 250000, xpReward: 9000 },
    ],
  },
  {
    id: "annual-unbroken-spirit",
    name: "Espírito Indomável",
    role: "student",
    cadence: "anual",
    difficulty: "mitico",
    category: "Lenda Anual",
    description: "Mantenha frequência contínua em todos os meses do ano sem desistir da sua rotina.",
    image: "/badges/badge_fogo_sagrado.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 3,
    unit: "meses",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "Trimestre Blindado", requirement: "3 meses com 12+ treinos", targetValue: 3, xpReward: 400 },
      { level: 2, tier: "prata", title: "Semestre Consagrado", requirement: "6 meses com 12+ treinos", targetValue: 6, xpReward: 1000 },
      { level: 3, tier: "ouro", title: "Três Trimestres", requirement: "9 meses com 12+ treinos", targetValue: 9, xpReward: 2500 },
      { level: 4, tier: "diamante", title: "Ano Inquebrável", requirement: "12 meses ininterruptos", targetValue: 12, xpReward: 8000 },
    ],
  },

  // ==========================================
  // 5. CONQUISTAS PERMANENTES DE CARREIRA (ALUNO)
  // ==========================================
  {
    id: "streak-fire",
    name: "Fogo Sagrado",
    role: "student",
    cadence: "permanente",
    difficulty: "avancado",
    category: "Constância",
    description: "Mantenha a chama acesa comparecendo à academia em dias consecutivos sem quebrar o ritmo. Finais de semana e descansos programados não quebram sua ofensiva!",
    image: "/badges/badge_fogo_sagrado.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 7,
    unit: "dias",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Chama Inicial", requirement: "7 dias de treino na ofensiva", targetValue: 7, xpReward: 100 },
      { level: 2, tier: "prata", title: "Fogo Consagrado", requirement: "15 dias de treino na ofensiva", targetValue: 15, xpReward: 250 },
      { level: 3, tier: "ouro", title: "Inferno Ardente", requirement: "30 dias de treino na ofensiva", targetValue: 30, xpReward: 600 },
      { level: 4, tier: "diamante", title: "Chama Eterna", requirement: "60 dias de treino na ofensiva", targetValue: 60, xpReward: 1500 },
    ],
  },
  {
    id: "early-bird",
    name: "Clube das 06h",
    role: "student",
    cadence: "permanente",
    difficulty: "intermediario",
    category: "Disciplina",
    description: "Vença a cama e conclua suas sessões antes das 07:00 da manhã com dedicação inabalável.",
    image: "/badges/badge_clube_06h.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 3,
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
    cadence: "permanente",
    difficulty: "lendario",
    category: "Dedicação",
    description: "Acumule centenas de treinos registrados com disciplina e evolução consistente no GymFlow.",
    image: "/badges/badge_centuriao.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 25,
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
    cadence: "permanente",
    difficulty: "avancado",
    category: "Força",
    description: "Quebre recordes pessoais de carga máxima em exercícios livres e demonstre pura sobrecarga progressiva.",
    image: "/badges/badge_batedor_pr.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 1,
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
    cadence: "permanente",
    difficulty: "avancado",
    category: "Resistência",
    description: "Queime calorias e amplie sua capacidade cardiovascular com esteira, bike, simulador de escada e HIIT.",
    image: "/badges/badge_mestre_cardio.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
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
  {
    id: "hydro-titan",
    name: "Hidratação de Titã",
    role: "student",
    cadence: "permanente",
    difficulty: "intermediario",
    category: "Saúde",
    description: "Mantenha a célula muscular hiper-hidratada atingindo a meta saudável de 3 litros de água diários.",
    image: "/badges/badge_hydro_titan.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 5,
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
    cadence: "permanente",
    difficulty: "lendario",
    category: "Volume",
    description: "Some o volume bruto total de todas as repetições e séries levantadas na academia no GymFlow.",
    image: "/badges/badge_raw_tonnage.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
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
    cadence: "permanente",
    difficulty: "intermediario",
    category: "Disciplina",
    description: "Respeite rigorosamente o timer de descanso entre as séries sem dispersão para máxima intensidade.",
    image: "/badges/badge_rest_master.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
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
    cadence: "permanente",
    difficulty: "avancado",
    category: "Constância",
    description: "Atinja o ápice da regularidade completando 30 dias de treinos na sua rotina sem quebrar o ritmo.",
    image: "/badges/badge_tita_disciplina.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 20,
    unit: "dias",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Determinação de Ferro", requirement: "20 dias de rotina mantida", targetValue: 20, xpReward: 200 },
      { level: 2, tier: "prata", title: "Titã Inquebrável", requirement: "30 dias de rotina mantida", targetValue: 30, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Mente Impenetrável", requirement: "45 dias de rotina mantida", targetValue: 45, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Imortal da Frequência", requirement: "90 dias de rotina mantida", targetValue: 90, xpReward: 3500 },
    ],
  },

  // Medalhas Secretas de Aluno
  {
    id: "secret-night-owl",
    name: "Coruja Noturna",
    role: "student",
    cadence: "permanente",
    difficulty: "avancado",
    category: "Secreta",
    description: "Treine no silêncio da noite quando a maioria dorme. Concluiu sessões intensas após as 22h30.",
    image: "/badges/badge_coruja_noturna.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 1,
    unit: "noites",
    isSecret: true,
    secretClue: "Quando a lua estiver no ápice e o relógio marcar mais de 22:30, conclua seu treino no silêncio...",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Sombra da Meia-Noite", requirement: "1 treino após 22:30", targetValue: 1, xpReward: 200 },
      { level: 2, tier: "prata", title: "Guardião Noturno", requirement: "3 treinos após 22:30", targetValue: 3, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Fantasma do Ferro", requirement: "10 treinos após 22:30", targetValue: 10, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Senhor das Trevas", requirement: "25 treinos após 22:30", targetValue: 25, xpReward: 3000 },
    ],
  },
  {
    id: "secret-berserk",
    name: "Modo Berserk",
    role: "student",
    cadence: "permanente",
    difficulty: "lendario",
    category: "Secreta",
    description: "Eleve a frequência ao nível extremo completando mais de 30 séries totais de alta intensidade numa única sessão.",
    image: "/badges/badge_modo_berserk.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 30,
    unit: "séries",
    isSecret: true,
    secretClue: "Empilhe mais de 30 séries de musculação numa única sessão sem pestanejar...",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Fúria Controlada", requirement: "1 treino com 30+ séries", targetValue: 30, xpReward: 250 },
      { level: 2, tier: "prata", title: "Espírito Berserk", requirement: "3 treinos com 30+ séries", targetValue: 90, xpReward: 700 },
      { level: 3, tier: "ouro", title: "Carnificina de Aço", requirement: "10 treinos com 30+ séries", targetValue: 300, xpReward: 1800 },
      { level: 4, tier: "diamante", title: "Avatar da Destruição", requirement: "25 treinos com 30+ séries", targetValue: 750, xpReward: 4500 },
    ],
  },
  {
    id: "secret-cyborg",
    name: "Frequência Ciborgue",
    role: "student",
    cadence: "permanente",
    difficulty: "mitico",
    category: "Secreta",
    description: "Sem falhas, sem desculpas: 21 dias de treinos na rotina com execução impecável.",
    image: "/badges/badge_ciborgue_sobrecarga.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 21,
    unit: "dias",
    isSecret: true,
    secretClue: "Mantenha sua regularidade por 21 dias na rotina sem nenhuma falta...",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "Circuito Ativado", requirement: "21 dias na rotina", targetValue: 21, xpReward: 500 },
      { level: 2, tier: "prata", title: "Processador Quântico", requirement: "45 dias na rotina", targetValue: 45, xpReward: 1200 },
      { level: 3, tier: "ouro", title: "Androide Biomecânico", requirement: "90 dias na rotina", targetValue: 90, xpReward: 3000 },
      { level: 4, tier: "diamante", title: "Ciborgue Imortal", requirement: "180 dias na rotina", targetValue: 180, xpReward: 8000 },
    ],
  },
  {
    id: "secret-glitch-404",
    name: "Falha na Matrix 404",
    role: "student",
    cadence: "permanente",
    difficulty: "mitico",
    category: "Secreta",
    description: "Você rompeu a barreira da realidade e encontrou a página 404 perdida do GymFlow.",
    image: "/badges/badge_secret_404.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 1,
    unit: "glitches",
    isSecret: true,
    secretClue: "Tente acessar uma rota inexistente ou provocar um erro misterioso no sistema...",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "diamante", title: "Bug Hunter Lendário", requirement: "Descobrir a página secreta 404", targetValue: 1, xpReward: 999 },
    ],
  },

  // ==========================================
  // 6. CONQUISTAS DO PROFESSOR (COACH)
  // ==========================================
  {
    id: "coach-welcome",
    name: "Bem-vindo Treinador",
    role: "coach",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Seu perfil profissional no GymFlow está ativo para prescrever treinos e gerenciar alunos.",
    image: "/badges/badge_coach_mentor.png",
    unlocked: true,
    unlockedAt: "Hoje",
    currentLevel: 1,
    maxLevel: 1,
    currentProgress: 1,
    targetProgress: 1,
    unit: "conta",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Treinador Oficial", requirement: "Ativar perfil profissional", targetValue: 1, xpReward: 50 },
    ],
  },
  {
    id: "coach-starter",
    name: "Primeiro Pupilo",
    role: "coach",
    cadence: "inicial",
    difficulty: "iniciante",
    category: "Iniciação",
    description: "Inicie sua carreira de consultoria conectando seu 1º aluno ao aplicativo.",
    image: "/badges/badge_coach_mentor.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 1,
    currentProgress: 0,
    targetProgress: 1,
    unit: "aluno",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Estreia na Consultoria", requirement: "1 aluno matriculado", targetValue: 1, xpReward: 150 },
    ],
  },
  {
    id: "coach-weekly-active",
    name: "Agenda Semanal de Elite",
    role: "coach",
    cadence: "semanal",
    difficulty: "intermediario",
    category: "Desafio Semanal",
    description: "Cumpra sua grade realizando e confirmando sessões com alunos na semana corrente.",
    image: "/badges/badge_coach_punctual.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 5,
    unit: "sessões",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Agenda Aberta", requirement: "5 sessões na semana", targetValue: 5, xpReward: 150 },
      { level: 2, tier: "prata", title: "Treinador Solicitado", requirement: "10 sessões na semana", targetValue: 10, xpReward: 350 },
      { level: 3, tier: "ouro", title: "Grade Cheia", requirement: "20 sessões na semana", targetValue: 20, xpReward: 800 },
      { level: 4, tier: "diamante", title: "Capacidade Máxima", requirement: "35 sessões na semana", targetValue: 35, xpReward: 2000 },
    ],
  },
  {
    id: "coach-monthly-prescriptions",
    name: "Mestre das Fichas",
    role: "coach",
    cadence: "mensal",
    difficulty: "avancado",
    category: "Meta Mensal",
    description: "Mantenha seus alunos em constante sobrecarga prescrevendo e atualizando rotinas no mês.",
    image: "/badges/badge_coach_monster_factory.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 5,
    unit: "fichas",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Planejador Mensal", requirement: "5 fichas prescritas no mês", targetValue: 5, xpReward: 200 },
      { level: 2, tier: "prata", title: "Periodizador Ativo", requirement: "15 fichas prescritas no mês", targetValue: 15, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Engenheiro de Treinos", requirement: "30 fichas prescritas no mês", targetValue: 30, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Mestre da Periodização", requirement: "60 fichas prescritas no mês", targetValue: 60, xpReward: 3000 },
    ],
  },
  {
    id: "coach-annual-legend",
    name: "Treinador do Ano",
    role: "coach",
    cadence: "anual",
    difficulty: "lendario",
    category: "Lenda Anual",
    description: "Atinja o ápice da autoridade fitness mantendo meses consecutivos de consultoria ativa.",
    image: "/badges/badge_coach_legend.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 3,
    unit: "meses",
    rarity: "mitico",
    levels: [
      { level: 1, tier: "bronze", title: "Trimestre Ativo", requirement: "3 meses de consultoria ativa", targetValue: 3, xpReward: 500 },
      { level: 2, tier: "prata", title: "Semestre Consagrado", requirement: "6 meses de consultoria ativa", targetValue: 6, xpReward: 1200 },
      { level: 3, tier: "ouro", title: "Referência Anual", requirement: "9 meses de consultoria ativa", targetValue: 9, xpReward: 3000 },
      { level: 4, tier: "diamante", title: "Lenda da Consultoria", requirement: "12 meses ininterruptos", targetValue: 12, xpReward: 8000 },
    ],
  },
  {
    id: "coach-mentor",
    name: "Mentor de Elite",
    role: "coach",
    cadence: "permanente",
    difficulty: "lendario",
    category: "Consultoria",
    description: "Gerencie alunos ativos com acompanhamento contínuo e retenção excepcional na plataforma.",
    image: "/badges/badge_coach_mentor.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 5,
    unit: "alunos",
    rarity: "epico",
    levels: [
      { level: 1, tier: "bronze", title: "Treinador Pessoal", requirement: "5 alunos ativos sob sua consultoria", targetValue: 5, xpReward: 200 },
      { level: 2, tier: "prata", title: "Mentor Reconhecido", requirement: "10 alunos ativos", targetValue: 10, xpReward: 500 },
      { level: 3, tier: "ouro", title: "Mestre da Retenção", requirement: "25 alunos ativos", targetValue: 25, xpReward: 1200 },
      { level: 4, tier: "diamante", title: "Guru do Fitness", requirement: "50 alunos ativos", targetValue: 50, xpReward: 3000 },
    ],
  },
  {
    id: "coach-five-stars",
    name: "Sensei 5 Estrelas",
    role: "coach",
    cadence: "permanente",
    difficulty: "lendario",
    category: "Excelência",
    description: "Mantenha a nota máxima em avaliações de alunos com atendimento atencioso e técnico.",
    image: "/badges/badge_coach_five_stars.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 4.8,
    unit: "avaliação",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Avaliação Ouro", requirement: "Nota média 4.8 com 10+ avaliações", targetValue: 4.8, xpReward: 250 },
      { level: 2, tier: "prata", title: "Sensei Supremo", requirement: "Nota média 4.9 com 25+ avaliações", targetValue: 4.9, xpReward: 600 },
      { level: 3, tier: "ouro", title: "Impecável", requirement: "Nota 5.0 com 50+ avaliações", targetValue: 5.0, xpReward: 1500 },
      { level: 4, tier: "diamante", title: "Lenda Viva", requirement: "Nota 5.0 com 100+ avaliações", targetValue: 5.0, xpReward: 4000 },
    ],
  },
  {
    id: "coach-monster-factory",
    name: "Fábrica de Monstros",
    role: "coach",
    cadence: "permanente",
    difficulty: "avancado",
    category: "Prescrição",
    description: "Prescreva fichas de treino periodizadas que geram resultados transformadores nos seus alunos.",
    image: "/badges/badge_coach_monster_factory.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 5,
    unit: "fichas",
    rarity: "raro",
    levels: [
      { level: 1, tier: "bronze", title: "Criador de Treinos", requirement: "5 fichas completas prescritas", targetValue: 5, xpReward: 150 },
      { level: 2, tier: "prata", title: "Forja de Atletas", requirement: "15 fichas completas prescritas", targetValue: 15, xpReward: 400 },
      { level: 3, tier: "ouro", title: "Engenheiro da Hipertrofia", requirement: "30 fichas completas prescritas", targetValue: 30, xpReward: 1000 },
      { level: 4, tier: "diamante", title: "Fábrica de Campeões", requirement: "75 fichas completas prescritas", targetValue: 75, xpReward: 2500 },
    ],
  },
  {
    id: "coach-punctual",
    name: "Relógio Suíço",
    role: "coach",
    cadence: "permanente",
    difficulty: "intermediario",
    category: "Disciplina",
    description: "Realize e confirme todas as sessões agendadas no horário exato com pontualidade impecável.",
    image: "/badges/badge_coach_punctual.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 10,
    unit: "aulas",
    rarity: "comum",
    levels: [
      { level: 1, tier: "bronze", title: "Pontualidade Básica", requirement: "10 sessões no horário", targetValue: 10, xpReward: 100 },
      { level: 2, tier: "prata", title: "Precisão Militar", requirement: "30 sessões no horário", targetValue: 30, xpReward: 300 },
      { level: 3, tier: "ouro", title: "Compromisso de Ferro", requirement: "75 sessões no horário", targetValue: 75, xpReward: 800 },
      { level: 4, tier: "diamante", title: "Maestro do Tempo", requirement: "150 sessões no horário", targetValue: 150, xpReward: 2000 },
    ],
  },
  {
    id: "coach-legend",
    name: "Consultor Lendário",
    role: "coach",
    cadence: "permanente",
    difficulty: "lendario",
    category: "Excelência",
    description: "Mantenha alunos por mais de 6 meses consecutivos com evolução física documentada.",
    image: "/badges/badge_coach_legend.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
    targetProgress: 2,
    unit: "alunos fiéis",
    rarity: "lendario",
    levels: [
      { level: 1, tier: "bronze", title: "Vínculo Forte", requirement: "2 alunos por 6+ meses", targetValue: 2, xpReward: 300 },
      { level: 2, tier: "prata", title: "Fidelidade de Ouro", requirement: "5 alunos por 6+ meses", targetValue: 5, xpReward: 800 },
      { level: 3, tier: "ouro", title: "Transformador de Vidas", requirement: "12 alunos por 6+ meses", targetValue: 12, xpReward: 2000 },
      { level: 4, tier: "diamante", title: "Mestre Supremo", requirement: "25 alunos por 6+ meses", targetValue: 25, xpReward: 5000 },
    ],
  },
  {
    id: "coach-architect",
    name: "Arquiteto Biomecânico",
    role: "coach",
    cadence: "permanente",
    difficulty: "avancado",
    category: "Prescrição",
    description: "Crie rotinas customizadas avançadas com exercícios especiais e técnicas de intensidade.",
    image: "/badges/badge_coach_architect.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 0,
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

/**
 * Lê o progresso consolidado de todas as conquistas do localStorage
 */
export function getStoredGamificationProgress(): Record<string, StoredBadgeProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_GAMIFICATION);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Salva o progresso consolidado das conquistas
 */
export function saveGamificationProgress(progress: Record<string, StoredBadgeProgress>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_GAMIFICATION, JSON.stringify(progress));
    window.dispatchEvent(new Event(EVENT_BADGES_UPDATED));
  } catch {}
}

/**
 * Retorna a lista completa de conquistas mescladas com os dados locais
 */
export function getAllGamificationBadges(role?: "student" | "coach", cadence?: BadgeCadence): BadgeItem[] {
  const stored = getStoredGamificationProgress();

  const badges = INITIAL_ALL_BADGES.map((b) => {
    const userProg = stored[b.id];
    if (!userProg) return b;

    const currentLevel = userProg.currentLevel ?? b.currentLevel;
    const currentProgress = userProg.currentProgress ?? b.currentProgress;
    const unlocked = userProg.unlocked ?? b.unlocked;
    const unlockedAt = userProg.unlockedAt ?? b.unlockedAt;

    // Próximo targetProgress baseado no nível
    const nextLevelInfo = b.levels.find((l) => l.level === (currentLevel > 0 ? currentLevel + 1 : 1)) || b.levels[b.levels.length - 1];

    return {
      ...b,
      currentLevel,
      currentProgress,
      unlocked,
      unlockedAt,
      targetProgress: nextLevelInfo?.targetValue || b.targetProgress,
    };
  });

  let result = badges;
  if (role) {
    result = result.filter((b) => b.role === role);
  }
  if (cadence) {
    result = result.filter((b) => b.cadence === cadence);
  }
  return result;
}

/**
 * Incrementa ou define o progresso de uma conquista e avalia se subiu de nível
 */
export function awardBadgeProgress(
  badgeId: string,
  amount: number,
  options?: {
    isAbsoluteValue?: boolean;
    reason?: string;
    triggerCelebration?: boolean;
  }
): { unlockedNow: boolean; levelUpNow: boolean; badge: BadgeItem | null } {
  const stored = getStoredGamificationProgress();
  const baseBadge = INITIAL_ALL_BADGES.find((b) => b.id === badgeId);
  if (!baseBadge) return { unlockedNow: false, levelUpNow: false, badge: null };

  const currentProg = stored[badgeId] || {
    currentProgress: baseBadge.currentProgress,
    currentLevel: baseBadge.currentLevel,
    unlocked: baseBadge.unlocked,
    unlockedAt: baseBadge.unlockedAt,
    lastNotifiedLevel: baseBadge.currentLevel,
  };

  const newProgressValue = options?.isAbsoluteValue
    ? amount
    : currentProg.currentProgress + amount;

  currentProg.currentProgress = newProgressValue;

  // Avalia níveis alcançados
  let calculatedLevel = 0;
  for (const lvl of baseBadge.levels) {
    if (newProgressValue >= lvl.targetValue) {
      calculatedLevel = lvl.level;
    }
  }

  const isNowUnlocked = calculatedLevel > 0;
  const levelUpNow = calculatedLevel > (currentProg.currentLevel || 0);
  const wasUnlockedBefore = currentProg.unlocked;

  currentProg.unlocked = isNowUnlocked;
  if (isNowUnlocked && !wasUnlockedBefore) {
    currentProg.unlockedAt = "Hoje";
  }

  currentProg.currentLevel = calculatedLevel;

  // Salva no storage local e sincroniza com o Supabase
  stored[badgeId] = currentProg;
  saveGamificationProgress(stored);
  upsertAchievementToSupabase(badgeId, currentProg, undefined, baseBadge.role).catch(() => {});

  // Se subiu de nível ou desbloqueou agora, dispara Notificação + Modal de Celebração
  if ((levelUpNow || (!wasUnlockedBefore && isNowUnlocked)) && currentProg.currentLevel > (currentProg.lastNotifiedLevel || 0)) {
    const reachedLevelInfo = baseBadge.levels.find((l) => l.level === currentProg.currentLevel) || baseBadge.levels[0];
    const tierName = TIER_NAMES[reachedLevelInfo.tier];
    const reasonText = options?.reason || `ao atingir ${newProgressValue} ${baseBadge.unit}`;

    // Atualiza o nível notificado
    currentProg.lastNotifiedLevel = currentProg.currentLevel;
    stored[badgeId] = currentProg;
    saveGamificationProgress(stored);

    // 1. Gera notificação persistente na Central de Alertas
    addNotification({
      targetRole: baseBadge.role,
      studentId: baseBadge.role === "student" ? "student_carlos" : undefined,
      coachId: baseBadge.role === "coach" ? "coach_rodrigo" : undefined,
      type: "achievement_unlocked",
      title: `🏆 Conquista Desbloqueada: ${baseBadge.name} (${tierName})`,
      message: `Você alcançou a insígnia ${baseBadge.name} (${tierName}) ${reasonText}! +${reachedLevelInfo.xpReward} XP adicionados ao seu perfil.`,
    });

    // 2. Dispara celebração na tela se ativado (padrão true)
    if (options?.triggerCelebration !== false && typeof window !== "undefined") {
      triggerHaptic("success");
      const eventData: AchievementUnlockEventData = {
        badge: {
          ...baseBadge,
          currentLevel: currentProg.currentLevel,
          currentProgress: currentProg.currentProgress,
          unlocked: true,
          unlockedAt: "Hoje",
        },
        unlockedLevel: currentProg.currentLevel,
        tier: reachedLevelInfo.tier,
        tierName,
        xpReward: reachedLevelInfo.xpReward,
        reason: reasonText,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      window.dispatchEvent(
        new CustomEvent(EVENT_SHOW_CELEBRATION, { detail: eventData })
      );
    }
  }

  const updatedBadge = getAllGamificationBadges().find((b) => b.id === badgeId) || null;
  return {
    unlockedNow: !wasUnlockedBefore && isNowUnlocked,
    levelUpNow,
    badge: updatedBadge,
  };
}

/**
 * Sincroniza o progresso de conquistas cadenciadas após conclusão de treino
 */
export function syncCadencedWorkoutProgress(stats: {
  totalExercises: number;
  totalVolumeKg: number;
  isBefore7Am?: boolean;
}): void {
  // 1. Conquista Inicial: Primeiro Treino
  awardBadgeProgress("first-workout", 1, {
    isAbsoluteValue: true,
    reason: "ao concluir seu primeiro treino no GymFlow",
  });

  const dates = getStoredAttendanceDates();
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = now.getFullYear();

  // 2. Conquistas Semanais
  // Calcula treinos na semana atual (Segunda a Domingo)
  const currentWeekDays = dates.filter((d) => {
    const parts = d.split("-");
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const itemDate = new Date(Date.UTC(y, m, day));
    const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayOfWeek = nowUtc.getUTCDay() || 7;
    const monday = new Date(nowUtc);
    monday.setUTCDate(monday.getUTCDate() - dayOfWeek + 1);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    return itemDate >= monday && itemDate <= sunday;
  });

  awardBadgeProgress("weekly-warrior", currentWeekDays.length, {
    isAbsoluteValue: true,
    reason: `ao acumular ${currentWeekDays.length} dias de treino nesta semana`,
  });

  if (stats.totalVolumeKg > 0) {
    awardBadgeProgress("weekly-volume-load", Math.round(stats.totalVolumeKg), {
      reason: `ao somar ${Math.round(stats.totalVolumeKg).toLocaleString("pt-BR")} kg de volume na semana`,
    });
  }

  // 3. Conquistas Mensais
  const currentMonthWorkouts = dates.filter((d) => d.startsWith(currentMonthKey));
  awardBadgeProgress("monthly-iron-attendance", currentMonthWorkouts.length, {
    isAbsoluteValue: true,
    reason: `ao acumular ${currentMonthWorkouts.length} treinos neste mês`,
  });

  // 4. Conquistas Anuais
  const currentYearWorkouts = dates.filter((d) => d.startsWith(String(currentYear)));
  awardBadgeProgress("annual-titan-365", currentYearWorkouts.length, {
    isAbsoluteValue: true,
    reason: `ao somar ${currentYearWorkouts.length} treinos no ano corrente`,
  });

  if (stats.totalVolumeKg > 0) {
    awardBadgeProgress("annual-megaton", Math.round(stats.totalVolumeKg), {
      reason: `ao acumular ${Math.round(stats.totalVolumeKg).toLocaleString("pt-BR")} kg no ano`,
    });
  }
}

/**
 * Sincroniza o progresso de conquistas cadenciadas após conclusão de cárdio
 */
export function syncCadencedCardioProgress(stats: {
  caloriesBurned: number;
  durationMinutes: number;
  distanceKm?: number;
}): void {
  // 1. Conquista Inicial: Primeiro Cárdio
  awardBadgeProgress("first-cardio", Math.round(stats.caloriesBurned), {
    isAbsoluteValue: true,
    reason: "ao concluir sua primeira sessão cardiovascular",
  });

  // 2. Conquistas Semanais: Queima da Semana
  if (stats.caloriesBurned > 0) {
    awardBadgeProgress("weekly-cardio-burn", Math.round(stats.caloriesBurned), {
      reason: `ao queimar ${Math.round(stats.caloriesBurned)} kcal de cárdio na semana`,
    });
  }

  // 3. Conquistas Mensais: Distância
  if (stats.distanceKm && stats.distanceKm > 0) {
    awardBadgeProgress("monthly-distance-king", Number(stats.distanceKm.toFixed(1)), {
      reason: `ao percorrer ${stats.distanceKm.toFixed(1)} km em treino aeróbico no mês`,
    });
  }

  // 4. Conquistas Anuais: Queima Anual
  if (stats.caloriesBurned > 0) {
    awardBadgeProgress("annual-ultra-endurance", Math.round(stats.caloriesBurned), {
      reason: `ao acumular ${Math.round(stats.caloriesBurned)} kcal no ano`,
    });
  }
}

/**
 * Sincroniza o progresso de conquistas ao registrar consumo de água
 */
export function syncCadencedHydrationProgress(amountMl: number, totalTodayMl: number): void {
  // 1. Conquista Inicial: Primeiro Gole
  awardBadgeProgress("hydration-starter", amountMl, {
    reason: "ao registrar consumo de água no aplicativo",
  });

  // 2. Conquista Semanal: Semana Hiper-Hidratada
  if (totalTodayMl >= 3000) {
    awardBadgeProgress("weekly-hydration", 1, {
      reason: "ao cumprir a meta de 3L de água hoje",
    });
  }
}

/**
 * Registra um treino de musculação concluído
 */
export function recordWorkoutCompleted(stats: {
  totalExercises: number;
  totalVolumeKg: number;
  isBefore7Am?: boolean;
}): void {
  // 0. Atualiza a ofensiva inteligente e sincroniza Fogo Sagrado
  recordWorkoutAttendanceDate(undefined, undefined, false);

  // 1. Conquistas Cadenciadas (Inicial, Semanal, Mensal, Anual)
  syncCadencedWorkoutProgress(stats);

  // 2. Centurião (Total de treinos de carreira)
  awardBadgeProgress("century-club", 1, {
    reason: "ao concluir seu treino de hoje com consistência",
  });

  // 3. Volume Bruto (Clube do Milhão)
  if (stats.totalVolumeKg > 0) {
    awardBadgeProgress("raw-tonnage", Math.round(stats.totalVolumeKg), {
      reason: `ao movimentar ${Math.round(stats.totalVolumeKg).toLocaleString("pt-BR")} kg neste treino`,
    });
  }

  // 4. Madrugador (Clube das 06h)
  const currentHour = new Date().getHours();
  if (stats.isBefore7Am || currentHour < 7) {
    awardBadgeProgress("early-bird", 1, {
      reason: "ao treinar antes das 07:00 da manhã com dedicação",
    });
  }

  // 5. Coruja Noturna (Após as 22h30)
  const currentMinutes = new Date().getMinutes();
  if (currentHour > 22 || (currentHour === 22 && currentMinutes >= 30)) {
    awardBadgeProgress("secret-night-owl", 1, {
      reason: "ao treinar no silêncio da noite após as 22:30",
    });
  }
}

/**
 * Registra um cárdio concluído
 */
export function recordCardioCompleted(stats: {
  caloriesBurned: number;
  durationMinutes: number;
  distanceKm?: number;
}): void {
  // Atualiza a ofensiva inteligente
  recordWorkoutAttendanceDate(undefined, undefined, false);

  // Sincroniza cadências
  syncCadencedCardioProgress(stats);

  if (stats.caloriesBurned > 0) {
    awardBadgeProgress("cardio-master", Math.round(stats.caloriesBurned), {
      reason: `ao queimar ${Math.round(stats.caloriesBurned)} kcal em treino cardiovascular`,
    });
  }
}

/**
 * Registra uma aula em vídeo ou coletiva concluída
 */
export function recordClassCompleted(classTitle: string, calories: number): void {
  // Atualiza a ofensiva inteligente
  recordWorkoutAttendanceDate(undefined, undefined, false);

  // Incrementa queima no cárdio
  if (calories > 0) {
    awardBadgeProgress("cardio-master", calories, {
      reason: `ao concluir a aula guiada '${classTitle}'`,
    });
    awardBadgeProgress("weekly-cardio-burn", calories, {
      reason: `ao queimar calorias na aula '${classTitle}'`,
    });
  }

  // Incrementa contagem de treinos
  awardBadgeProgress("century-club", 1, {
    reason: `ao concluir a aula '${classTitle}'`,
  });
}

/**
 * Registra check-in na catraca
 */
export function recordCheckinAchievement(): void {
  awardBadgeProgress("first-checkin", 1, {
    isAbsoluteValue: true,
    reason: "ao realizar check-in digital na catraca",
  });
}

/**
 * Registra perfil completado
 */
export function recordProfileCompletionAchievement(): void {
  awardBadgeProgress("profile-complete", 1, {
    isAbsoluteValue: true,
    reason: "ao completar seu perfil de atleta com todas as informações",
  });
}

/**
 * Registra medição física ou bioimpedância adicionada
 */
export function recordBodyMetricAchievement(): void {
  awardBadgeProgress("monthly-body-evolution", 1, {
    reason: "ao registrar nova avaliação física e bioimpedância",
  });
}

/**
 * Registra quebra de Recorde Pessoal (PR)
 */
export function recordPRBreaker(exerciseName: string, weightKg: number): void {
  awardBadgeProgress("pr-breaker", 1, {
    reason: `ao quebrar seu Recorde Pessoal em ${exerciseName} com ${weightKg} kg`,
  });
  awardBadgeProgress("monthly-pr-hunter", 1, {
    reason: `ao superar sua carga máxima em ${exerciseName}`,
  });
}

/**
 * Registra sessão em Modo Berserk (30+ séries em um único treino)
 */
export function recordBerserkSession(totalSets: number): void {
  if (totalSets >= 30) {
    awardBadgeProgress("secret-berserk", totalSets, {
      reason: `ao completar ${totalSets} séries intensas em uma única sessão destruidora`,
    });
  }
}

/**
 * Avalia se o aluno concluiu a Semana Perfeita (6 treinos na mesma semana)
 */
export function evaluateWeeklyBeastMode(attendanceDates: string[]): void {
  if (!attendanceDates || attendanceDates.length < 6) return;

  // Agrupa treinos por semana do ano (ISO week)
  const weeksCountMap: Record<string, Set<string>> = {};
  for (const dateStr of attendanceDates) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) continue;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

    // Obtém número canônico da semana ISO (segunda a domingo)
    const tempDate = new Date(Date.UTC(year, month, day));
    const dayNum = tempDate.getUTCDay() || 7; // 1 (Seg) a 7 (Dom)
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    const weekKey = `${tempDate.getUTCFullYear()}_W${weekNo}`;

    if (!weeksCountMap[weekKey]) weeksCountMap[weekKey] = new Set();
    weeksCountMap[weekKey].add(dateStr);
  }

  const perfectWeeks = Object.values(weeksCountMap).filter((set) => set.size >= 6).length;
  if (perfectWeeks > 0) {
    awardBadgeProgress("beast-mode", perfectWeeks, {
      isAbsoluteValue: true,
      reason: `ao completar ${perfectWeeks} ${perfectWeeks === 1 ? "semana impecável" : "semanas impecáveis"} com 6 treinos na semana`,
    });
  }
}

/**
 * Registra prescrição de ficha de treino pelo treinador (Fábrica de Monstros & Mestre das Fichas)
 */
export function recordCoachPrescription(studentName?: string): void {
  awardBadgeProgress("coach-monster-factory", 1, {
    reason: `ao prescrever uma nova ficha completa de treino periodizado${studentName ? ` para ${studentName}` : ""}`,
  });
  awardBadgeProgress("coach-monthly-prescriptions", 1, {
    reason: `ao elaborar e periodizar ficha técnica no mês`,
  });
}

/**
 * Registra sessão pontual realizada e confirmada pelo treinador (Relógio Suíço & Agenda Semanal)
 */
export function recordCoachPunctualSession(): void {
  awardBadgeProgress("coach-punctual", 1, {
    reason: "ao realizar e confirmar sessão agendada no horário com pontualidade suíça",
  });
  awardBadgeProgress("coach-weekly-active", 1, {
    reason: "ao concluir sessão semanal com aluno",
  });
}

/**
 * Registra protocolo avançado de treino salvo pelo treinador (Arquiteto Biomecânico)
 */
export function recordCoachRoutineCreated(routineTitle?: string): void {
  awardBadgeProgress("coach-architect", 1, {
    reason: `ao elaborar e salvar a rotina técnica "${routineTitle || "Personalizada"}" na biblioteca`,
  });
}

/**
 * Sincroniza o número de alunos ativos sob consultoria do treinador (Mentor de Elite & Primeiro Pupilo)
 */
export function syncCoachActiveStudents(activeStudentsCount: number): void {
  if (activeStudentsCount > 0) {
    awardBadgeProgress("coach-starter", 1, {
      isAbsoluteValue: true,
      reason: "ao matricular seu primeiro aluno sob consultoria",
    });
    awardBadgeProgress("coach-mentor", activeStudentsCount, {
      isAbsoluteValue: true,
      reason: `ao gerenciar ${activeStudentsCount} alunos ativos sob sua consultoria`,
    });
  }
}

/**
 * Sincroniza a nota média e total de avaliações do treinador (Sensei 5 Estrelas)
 */
export function syncCoachReviewsRating(avgRating: number, totalReviews: number): void {
  if (totalReviews >= 1 && avgRating > 0) {
    awardBadgeProgress("coach-five-stars", Math.min(5.0, Number(avgRating.toFixed(1))), {
      isAbsoluteValue: true,
      reason: `com média ${avgRating.toFixed(1)} estrelas baseada em ${totalReviews} avaliações`,
    });
  }
}

/**
 * Sincroniza retenção de alunos fiéis com mais de 6 meses (Consultor Lendário & Treinador do Ano)
 */
export function syncCoachStudentRetention(loyalStudentsCount: number): void {
  if (loyalStudentsCount > 0) {
    awardBadgeProgress("coach-legend", loyalStudentsCount, {
      isAbsoluteValue: true,
      reason: `ao manter ${loyalStudentsCount} alunos por mais de 6 meses consecutivos`,
    });
    awardBadgeProgress("coach-annual-legend", loyalStudentsCount, {
      isAbsoluteValue: true,
      reason: `ao acumular retenção de longo prazo com alunos fiéis`,
    });
  }
}

/**
 * Registra desbloqueio de conquista secreta (ex: 404)
 */
export function recordSecretAchievement(badgeId: string, reason: string): void {
  awardBadgeProgress(badgeId, 1, {
    isAbsoluteValue: true,
    reason,
  });
}

/**
 * Registra a conquista de Boas-Vindas ao GymFlow
 */
export function recordWelcomeAchievement(role: "student" | "coach" = "student"): void {
  const badgeId = role === "coach" ? "coach-welcome" : "welcome-gymflow";
  awardBadgeProgress(badgeId, 1, {
    isAbsoluteValue: true,
    reason: "ao entrar na comunidade GymFlow",
  });
}

