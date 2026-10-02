/**
 * GymFlow Central Gamification & Achievement Engine
 * Gerencia o progresso das conquistas, leveis progressivos (Bronze, Prata, Ouro, Diamante),
 * acionamento de animações em tempo real e geração automática de notificações no perfil.
 */

import { addNotification } from "./booking-store";
import { triggerHaptic } from "./haptic";
import { upsertAchievementToSupabase } from "./supabase-service";
import {
  calculateSmartWorkoutStreak,
  recordWorkoutAttendanceDate,
  StreakInfo,
  EVENT_STREAK_UPDATED,
} from "./streak-service";

export * from "./streak-service";

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

const STORAGE_GAMIFICATION = "gymflow_gamification_progress_v2";
export const EVENT_BADGES_UPDATED = "gymflow:badges-updated";
export const EVENT_SHOW_CELEBRATION = "gymflow:show-achievement-celebration";

export const INITIAL_ALL_BADGES: BadgeItem[] = [
  // ==========================================
  // CONQUISTAS DO ALUNO
  // ==========================================
  {
    id: "streak-fire",
    name: "Fogo Sagrado",
    role: "student",
    category: "Constância",
    description: "Mantenha a chama acesa comparecendo à academia em dias consecutivos sem quebrar o ritmo. Finais de semana e descansos programados não quebram sua ofensiva!",
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
    description: "Atinja o ápice da regularidade completando 30 dias de treinos na sua rotina sem quebrar o ritmo.",
    image: "/badges/badge_tita_disciplina.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 16,
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
    category: "Secreta",
    description: "Eleve a frequência ao nível extremo completando mais de 30 séries totais de alta intensidade numa única sessão.",
    image: "/badges/badge_modo_berserk.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 22,
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
    category: "Secreta",
    description: "Sem falhas, sem desculpas: 21 dias de treinos na rotina com execução impecável.",
    image: "/badges/badge_frequencia_ciborgue.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 16,
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
  // CONQUISTAS DO PROFESSOR (COACH)
  // ==========================================
  {
    id: "coach-mentor",
    name: "Mentor de Elite",
    role: "coach",
    category: "Consultoria",
    description: "Gerencie alunos ativos com acompanhamento contínuo e retenção excepcional na plataforma.",
    image: "/badges/badge_coach_mentor.png",
    unlocked: true,
    unlockedAt: "Hoje",
    currentLevel: 2,
    maxLevel: 4,
    currentProgress: 12,
    targetProgress: 25,
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
    category: "Excelência",
    description: "Mantenha a nota máxima em avaliações de alunos com atendimento atencioso e técnico.",
    image: "/badges/badge_coach_five_stars.png",
    unlocked: true,
    unlockedAt: "Ontem",
    currentLevel: 1,
    maxLevel: 4,
    currentProgress: 4.9,
    targetProgress: 5.0,
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
    category: "Prescrição",
    description: "Prescreva fichas de treino periodizadas que geram resultados transformadores nos seus alunos.",
    image: "/badges/badge_coach_monster_factory.png",
    unlocked: true,
    unlockedAt: "01/Set",
    currentLevel: 2,
    maxLevel: 4,
    currentProgress: 18,
    targetProgress: 30,
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
    category: "Disciplina",
    description: "Realize e confirme todas as sessões agendadas no horário exato com pontualidade impecável.",
    image: "/badges/badge_coach_punctual.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 8,
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
    category: "Excelência",
    description: "Mantenha alunos por mais de 6 meses consecutivos com evolução física documentada.",
    image: "/badges/badge_coach_legend.png",
    unlocked: false,
    currentLevel: 0,
    maxLevel: 4,
    currentProgress: 3,
    targetProgress: 5,
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
    category: "Prescrição",
    description: "Crie rotinas customizadas avançadas com exercícios especiais e técnicas de intensidade.",
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
export function getAllGamificationBadges(role?: "student" | "coach"): BadgeItem[] {
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

  if (role) {
    return badges.filter((b) => b.role === role);
  }
  return badges;
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
 * Registra um treino de musculação concluído
 */
export function recordWorkoutCompleted(stats: {
  totalExercises: number;
  totalVolumeKg: number;
  isBefore7Am?: boolean;
}): void {
  // 0. Atualiza a ofensiva inteligente e sincroniza Fogo Sagrado
  recordWorkoutAttendanceDate(undefined, undefined, false);

  // 1. Centurião (Total de treinos)
  awardBadgeProgress("century-club", 1, {
    reason: "ao concluir seu treino de hoje com consistência",
  });

  // 2. Volume Bruto (Clube do Milhão)
  if (stats.totalVolumeKg > 0) {
    awardBadgeProgress("raw-tonnage", Math.round(stats.totalVolumeKg), {
      reason: `ao movimentar ${Math.round(stats.totalVolumeKg).toLocaleString("pt-BR")} kg neste treino`,
    });
  }

  // 3. Madrugador (Clube das 06h)
  const currentHour = new Date().getHours();
  if (stats.isBefore7Am || currentHour < 7) {
    awardBadgeProgress("early-bird", 1, {
      reason: "ao treinar antes das 07:00 da manhã com dedicação",
    });
  }

  // 4. Coruja Noturna (Após as 22h30)
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
}): void {
  // Atualiza a ofensiva inteligente
  recordWorkoutAttendanceDate(undefined, undefined, false);

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
  }

  // Incrementa contagem de treinos
  awardBadgeProgress("century-club", 1, {
    reason: `ao concluir a aula '${classTitle}'`,
  });
}

/**
 * Registra quebra de Recorde Pessoal (PR)
 */
export function recordPRBreaker(exerciseName: string, weightKg: number): void {
  awardBadgeProgress("pr-breaker", 1, {
    reason: `ao quebrar seu Recorde Pessoal em ${exerciseName} com ${weightKg} kg`,
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
 * Registra prescrição de ficha de treino pelo treinador (Fábrica de Monstros)
 */
export function recordCoachPrescription(studentName?: string): void {
  awardBadgeProgress("coach-monster-factory", 1, {
    reason: `ao prescrever uma nova ficha completa de treino periodizado${studentName ? ` para ${studentName}` : ""}`,
  });
}

/**
 * Registra sessão pontual realizada e confirmada pelo treinador (Relógio Suíço)
 */
export function recordCoachPunctualSession(): void {
  awardBadgeProgress("coach-punctual", 1, {
    reason: "ao realizar e confirmar sessão agendada no horário com pontualidade suíça",
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
 * Sincroniza o número de alunos ativos sob consultoria do treinador (Mentor de Elite)
 */
export function syncCoachActiveStudents(activeStudentsCount: number): void {
  if (activeStudentsCount > 0) {
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
 * Sincroniza retenção de alunos fiéis com mais de 6 meses (Consultor Lendário)
 */
export function syncCoachStudentRetention(loyalStudentsCount: number): void {
  if (loyalStudentsCount > 0) {
    awardBadgeProgress("coach-legend", loyalStudentsCount, {
      isAbsoluteValue: true,
      reason: `ao manter ${loyalStudentsCount} alunos por mais de 6 meses consecutivos`,
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

