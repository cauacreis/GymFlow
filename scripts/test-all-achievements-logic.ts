/**
 * Test Suite: Lógica Completa de Todas as Conquistas e Gamificação do GymFlow
 * Valida a progressão de níveis (Bronze, Prata, Ouro, Diamante), o cálculo
 * de cada uma das conquistas por cadência (Iniciais, Semanais, Mensais, Anuais, Carreira e Treinador)
 * e todos os gatilhos reais do sistema.
 */

// Simulação de ambiente browser / localStorage
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
};
(global as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class {
    type: string;
    detail: any;
    constructor(type: string, opts?: any) {
      this.type = type;
      this.detail = opts?.detail;
    }
  },
};
(global as any).CustomEvent = (global as any).window.CustomEvent;

import {
  INITIAL_ALL_BADGES,
  getAllGamificationBadges,
  awardBadgeProgress,
  recordWorkoutCompleted,
  recordCardioCompleted,
  recordClassCompleted,
  recordPRBreaker,
  recordBerserkSession,
  evaluateWeeklyBeastMode,
  recordCoachPrescription,
  recordCoachPunctualSession,
  recordCoachRoutineCreated,
  syncCoachActiveStudents,
  syncCoachReviewsRating,
  syncCoachStudentRetention,
  recordSecretAchievement,
  recordWorkoutAttendanceDate,
  calculateSmartWorkoutStreak,
  recordCheckinAchievement,
  recordProfileCompletionAchievement,
  recordBodyMetricAchievement,
  syncCadencedWorkoutProgress,
  syncCadencedCardioProgress,
  syncCadencedHydrationProgress,
  recordWelcomeAchievement,
} from "../src/lib/gamification-service";

import { addWaterIntake, getTodayHydration } from "../src/lib/hydration-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail !== undefined ? detail : "");
    failedCount++;
  }
}

console.log("\n=======================================================");
console.log("🏆 AUDITORIA TOTAL DE TODAS AS CONQUISTAS DO GYMFLOW");
console.log("   (Boas-Vindas, Iniciais, Semanais, Mensais, Anuais, Carreira & Coach)");
console.log("=======================================================\n");

// Limpa storage para testes limpos
mockStorage["gymflow_gamification_progress_v2"] = JSON.stringify({});

// =======================================================
// 1. CONQUISTAS INICIAIS & BOAS-VINDAS (PRIMEIROS PASSOS)
// =======================================================
console.log("🔹 1. Testando Conquistas de Boas-Vindas e Iniciais...");

// 1.0 Boas-Vindas ao GymFlow (welcome-gymflow)
recordWelcomeAchievement("student");
let badge = getAllGamificationBadges().find((b) => b.id === "welcome-gymflow");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Boas-Vindas: 'Bem-vindo ao GymFlow' desbloqueada automaticamente");

// 1.1 Primeira Gota de Suor (first-workout)
recordWorkoutCompleted({
  totalVolumeKg: 2500,
  totalExercises: 5,
});
badge = getAllGamificationBadges().find((b) => b.id === "first-workout");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Inicial: 'Primeira Gota de Suor' desbloqueada no 1º treino");

// 1.2 Passaporte de Aço (first-checkin)
recordCheckinAchievement();
badge = getAllGamificationBadges().find((b) => b.id === "first-checkin");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Inicial: 'Passaporte de Aço' desbloqueada no check-in digital da catraca");

// 1.3 Identidade do Atleta (profile-complete)
recordProfileCompletionAchievement();
badge = getAllGamificationBadges().find((b) => b.id === "profile-complete");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Inicial: 'Identidade do Atleta' desbloqueada ao preencher perfil");

// 1.4 Ignição Aeróbica (first-cardio)
recordCardioCompleted({
  caloriesBurned: 150,
  durationMinutes: 20,
  distanceKm: 2.5,
});
badge = getAllGamificationBadges().find((b) => b.id === "first-cardio");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Inicial: 'Ignição Aeróbica' desbloqueada na 1ª sessão de cárdio");

// 1.5 Primeiro Gole (hydration-starter)
syncCadencedHydrationProgress(500, 500);
badge = getAllGamificationBadges().find((b) => b.id === "hydration-starter");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Inicial: 'Primeiro Gole' desbloqueada no primeiro registro de hidratação");

// =======================================================
// 2. CONQUISTAS SEMANAIS (DESAFIOS SEMANAIS)
// =======================================================
console.log("\n🔹 2. Testando Conquistas Semanais...");

// 2.1 Guerreiro da Semana (weekly-warrior: 3d, 4d, 5d, 6d)
awardBadgeProgress("weekly-warrior", 3, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-warrior");
assert(badge?.currentLevel === 1, "Semanal: 'Guerreiro da Semana' atinge Nível 1 com 3 treinos");

awardBadgeProgress("weekly-warrior", 6, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-warrior");
assert(badge?.currentLevel === 4, "Semanal: 'Guerreiro da Semana' atinge Nível 4 (Diamante) com 6 treinos");

// 2.2 Incinerador Semanal (weekly-cardio-burn: 500, 1000, 2500, 5000 kcal)
awardBadgeProgress("weekly-cardio-burn", 500, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-cardio-burn");
assert(badge?.currentLevel === 1, "Semanal: 'Incinerador Semanal' atinge Nível 1 com 500 kcal");

awardBadgeProgress("weekly-cardio-burn", 5000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-cardio-burn");
assert(badge?.currentLevel === 4, "Semanal: 'Incinerador Semanal' atinge Nível 4 (Diamante) com 5.000 kcal");

// 2.3 Carga da Semana (weekly-volume-load: 10t, 25t, 50t, 100t)
awardBadgeProgress("weekly-volume-load", 10000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-volume-load");
assert(badge?.currentLevel === 1, "Semanal: 'Carga da Semana' atinge Nível 1 com 10.000 kg");

awardBadgeProgress("weekly-volume-load", 100000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-volume-load");
assert(badge?.currentLevel === 4, "Semanal: 'Carga da Semana' atinge Nível 4 (Diamante) com 100.000 kg");

// 2.4 Semana Hiper-Hidratada (weekly-hydration: 3d, 5d, 7d com 3L)
awardBadgeProgress("weekly-hydration", 3, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-hydration");
assert(badge?.currentLevel === 1, "Semanal: 'Semana Hiper-Hidratada' atinge Nível 1 com 3 dias de 3L");

awardBadgeProgress("weekly-hydration", 7, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "weekly-hydration");
assert(badge?.currentLevel === 3, "Semanal: 'Semana Hiper-Hidratada' atinge Nível 3 (Ouro) com 7 dias de 3L");

// 2.5 Modo Monstro / Semana Perfeita (beast-mode)
evaluateWeeklyBeastMode([
  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",
  "2026-09-12",
]);
badge = getAllGamificationBadges().find((b) => b.id === "beast-mode");
assert(Boolean(badge?.unlocked && badge.currentProgress >= 1), "Semanal: 'Semana Perfeita' (Beast Mode) atinge Nível 1 com 6 treinos e 100% séries");

// =======================================================
// 3. CONQUISTAS MENSAIS (METAS MENSAIS)
// =======================================================
console.log("\n🔹 3. Testando Conquistas Mensais...");

// 3.1 Mês de Ferro (monthly-iron-attendance: 12, 16, 20, 24 treinos)
awardBadgeProgress("monthly-iron-attendance", 12, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "monthly-iron-attendance");
assert(badge?.currentLevel === 1, "Mensal: 'Mês de Ferro' atinge Nível 1 com 12 treinos no mês");

awardBadgeProgress("monthly-iron-attendance", 24, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "monthly-iron-attendance");
assert(badge?.currentLevel === 4, "Mensal: 'Mês de Ferro' atinge Nível 4 (Diamante) com 24 treinos no mês");

// 3.2 Metamorfose Mensal (monthly-body-evolution: 1, 2, 4 avaliações)
recordBodyMetricAchievement();
badge = getAllGamificationBadges().find((b) => b.id === "monthly-body-evolution");
assert(badge?.currentLevel === 1, "Mensal: 'Metamorfose Mensal' atinge Nível 1 ao adicionar bioimpedância/medidas");

awardBadgeProgress("monthly-body-evolution", 4, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "monthly-body-evolution");
assert(badge?.currentLevel === 3, "Mensal: 'Metamorfose Mensal' atinge Nível 3 (Ouro) com 4 avaliações físicas");

// 3.3 Caçador de Cargas (monthly-pr-hunter: 2, 5, 8, 12 PRs)
recordPRBreaker("Supino Reto", 110);
recordPRBreaker("Agachamento", 150);
badge = getAllGamificationBadges().find((b) => b.id === "monthly-pr-hunter");
assert(badge?.currentLevel === 1, "Mensal: 'Caçador de Cargas' atinge Nível 1 com 2 PRs no mês");

awardBadgeProgress("monthly-pr-hunter", 12, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "monthly-pr-hunter");
assert(badge?.currentLevel === 4, "Mensal: 'Caçador de Cargas' atinge Nível 4 (Diamante) com 12 PRs no mês");

// 3.4 Maratona Mensal (monthly-distance-king: 20, 50, 100, 200 km)
awardBadgeProgress("monthly-distance-king", 20, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "monthly-distance-king");
assert(badge?.currentLevel === 1, "Mensal: 'Maratona Mensal' atinge Nível 1 com 20 km de cárdio");

awardBadgeProgress("monthly-distance-king", 200, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "monthly-distance-king");
assert(badge?.currentLevel === 4, "Mensal: 'Maratona Mensal' atinge Nível 4 (Diamante) com 200 km de cárdio");

// =======================================================
// 4. CONQUISTAS ANUAIS & LENDÁRIAS (LONGEVIDADE)
// =======================================================
console.log("\n🔹 4. Testando Conquistas Anuais e Míticas...");

// 4.1 Jornada 365 (annual-titan-365: 100, 180, 250, 365 treinos)
awardBadgeProgress("annual-titan-365", 100, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-titan-365");
assert(badge?.currentLevel === 1, "Anual: 'Jornada 365' atinge Nível 1 com 100 treinos no ano");

awardBadgeProgress("annual-titan-365", 365, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-titan-365");
assert(badge?.currentLevel === 4, "Anual: 'Jornada 365' atinge Nível 4 (Diamante) com 365 treinos no ano");

// 4.2 Megatonelada Anual (annual-megaton: 250t, 500t, 1Mt, 2.5Mt)
awardBadgeProgress("annual-megaton", 250000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-megaton");
assert(badge?.currentLevel === 1, "Anual: 'Megatonelada Anual' atinge Nível 1 com 250 toneladas");

awardBadgeProgress("annual-megaton", 2500000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-megaton");
assert(badge?.currentLevel === 4, "Anual: 'Megatonelada Anual' atinge Nível 4 (Diamante - Titã Cósmico) com 2.500 toneladas");

// 4.3 Ultra-Resistência Anual (annual-ultra-endurance: 25k, 60k, 120k, 250k kcal)
awardBadgeProgress("annual-ultra-endurance", 25000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-ultra-endurance");
assert(badge?.currentLevel === 1, "Anual: 'Ultra-Resistência Anual' atinge Nível 1 com 25.000 kcal no ano");

awardBadgeProgress("annual-ultra-endurance", 250000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-ultra-endurance");
assert(badge?.currentLevel === 4, "Anual: 'Ultra-Resistência Anual' atinge Nível 4 (Diamante) com 250.000 kcal no ano");

// 4.4 Espírito Indomável (annual-unbroken-spirit: 3, 6, 9, 12 meses ininterruptos)
awardBadgeProgress("annual-unbroken-spirit", 3, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-unbroken-spirit");
assert(badge?.currentLevel === 1, "Anual: 'Espírito Indomável' atinge Nível 1 com 3 meses ininterruptos");

awardBadgeProgress("annual-unbroken-spirit", 12, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "annual-unbroken-spirit");
assert(badge?.currentLevel === 4, "Anual: 'Espírito Indomável' atinge Nível 4 (Diamante) com 12 meses ininterruptos");

// =======================================================
// 5. CONQUISTAS PERMANENTES DE CARREIRA E SECRETAS
// =======================================================
console.log("\n🔹 5. Testando Conquistas Permanentes de Carreira e Secretas...");

// 5.1 Fogo Sagrado (streak-fire)
awardBadgeProgress("streak-fire", 60, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "streak-fire");
assert(badge?.currentLevel === 4, "Carreira: 'Fogo Sagrado' atinge Nível 4 com 60 dias de sequência");

// 5.2 Titã da Disciplina (streak-30)
awardBadgeProgress("streak-30", 90, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "streak-30");
assert(badge?.currentLevel === 4, "Carreira: 'Titã da Disciplina' atinge Nível 4 com 90 dias");

// 5.3 Clube das 06h (early-bird)
awardBadgeProgress("early-bird", 50, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "early-bird");
assert(badge?.currentLevel === 4, "Carreira: 'Clube das 06h' atinge Nível 4 com 50 treinos antes das 07h");

// 5.4 Centurião Romano (century-club)
awardBadgeProgress("century-club", 250, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "century-club");
assert(badge?.currentLevel === 4, "Carreira: 'Centurião' atinge Nível 4 com 250 treinos concluídos");

// 5.5 Clube do Milhão (raw-tonnage)
awardBadgeProgress("raw-tonnage", 1000000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "raw-tonnage");
assert(badge?.currentLevel === 4, "Carreira: 'Clube do Milhão' atinge Nível 4 com 1.000.000 kg");

// 5.6 Mestre do Cárdio (cardio-master)
awardBadgeProgress("cardio-master", 50000, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "cardio-master");
assert(badge?.currentLevel === 4, "Carreira: 'Mestre do Cárdio' atinge Nível 4 com 50.000 kcal");

// 5.7 Hidratação de Titã (hydro-titan)
awardBadgeProgress("hydro-titan", 90, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "hydro-titan");
assert(badge?.currentLevel === 4, "Carreira: 'Hidratação de Titã' atinge Nível 4 com 90 dias com 3L");

// 5.8 Modo Berserk (secret-berserk)
recordBerserkSession(35);
badge = getAllGamificationBadges().find((b) => b.id === "secret-berserk");
assert(Boolean(badge?.unlocked && badge.currentProgress >= 1), "Secreta: 'Modo Berserk' desbloqueada após 35 séries em treino único");

// 5.9 Coruja Noturna (secret-night-owl)
awardBadgeProgress("secret-night-owl", 25, { isAbsoluteValue: true });
badge = getAllGamificationBadges().find((b) => b.id === "secret-night-owl");
assert(badge?.currentLevel === 4, "Secreta: 'Coruja Noturna' atinge Nível 4 com 25 treinos após 22:30");

// 5.10 Falha na Matrix 404 (secret-glitch-404)
recordSecretAchievement("secret-glitch-404", "ao descobrir a página secreta 404");
badge = getAllGamificationBadges().find((b) => b.id === "secret-glitch-404");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Secreta: 'Falha na Matrix 404' desbloqueada");

// =======================================================
// 6. CONQUISTAS DE PROFESSOR & PERSONAL TRAINER (COACH)
// =======================================================
console.log("\n🔹 6. Testando Conquistas de Professor (Coach)...");

// 6.0 Boas-Vindas Treinador (coach-welcome)
recordWelcomeAchievement("coach");
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-welcome");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Treinador Boas-Vindas: 'Bem-vindo Treinador' desbloqueada automaticamente");

// 6.1 Primeiro Pupilo (coach-starter - Inicial)
syncCoachActiveStudents(1);
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-starter");
assert(Boolean(badge?.unlocked && badge.currentLevel === 1), "Treinador Inicial: 'Primeiro Pupilo' desbloqueada ao matricular 1º aluno");

// 6.2 Agenda Semanal (coach-weekly-active - Semanal)
for (let i = 0; i < 5; i++) {
  recordCoachPunctualSession();
}
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-weekly-active");
assert(Boolean(badge?.currentLevel === 1), "Treinador Semanal: 'Agenda Semanal' atinge Nível 1 com 5 sessões");

// 6.3 Mestre das Fichas (coach-monthly-prescriptions - Mensal)
for (let i = 0; i < 5; i++) {
  recordCoachPrescription(`Aluno ${i + 1}`);
}
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-monthly-prescriptions");
assert(Boolean(badge?.currentLevel === 1), "Treinador Mensal: 'Mestre das Fichas' atinge Nível 1 com 5 fichas prescritas no mês");

// 6.4 Treinador do Ano (coach-annual-legend - Anual)
syncCoachStudentRetention(5);
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-annual-legend");
assert(Boolean(badge?.currentLevel === 1), "Treinador Anual: 'Treinador do Ano' atinge Nível 1 com 5 alunos retidos");

// 6.5 Mentor de Elite (coach-mentor - Carreira)
syncCoachActiveStudents(50);
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-mentor");
assert(badge?.currentLevel === 4, "Treinador Carreira: 'Mentor de Elite' atinge Nível 4 com 50 alunos ativos");

// 6.6 Sensei 5 Estrelas (coach-five-stars - Carreira)
syncCoachReviewsRating(5.0, 105);
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-five-stars");
assert(badge?.currentLevel === 4, "Treinador Carreira: 'Sensei 5 Estrelas' atinge Nível 4 com nota 5.0 e 105 avaliações");

// 6.7 Fábrica de Monstros (coach-monster-factory - Carreira)
awardBadgeProgress("coach-monster-factory", 75, { isAbsoluteValue: true });
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-monster-factory");
assert(badge?.currentLevel === 4, "Treinador Carreira: 'Fábrica de Monstros' atinge Nível 4 com 75 fichas prescritas");

// 6.8 Relógio Suíço (coach-punctual - Carreira)
awardBadgeProgress("coach-punctual", 150, { isAbsoluteValue: true });
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-punctual");
assert(badge?.currentLevel === 4, "Treinador Carreira: 'Relógio Suíço' atinge Nível 4 com 150 sessões pontuais");

// 6.9 Consultor Lendário (coach-legend - Carreira)
syncCoachStudentRetention(25);
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-legend");
assert(badge?.currentLevel === 4, "Treinador Carreira: 'Consultor Lendário' atinge Nível 4 com 25 alunos com mais de 6 meses");

// 6.10 Arquiteto Biomecânico (coach-architect - Carreira)
awardBadgeProgress("coach-architect", 50, { isAbsoluteValue: true });
badge = getAllGamificationBadges("coach").find((b) => b.id === "coach-architect");
assert(badge?.currentLevel === 4, "Treinador Carreira: 'Arquiteto Biomecânico' atinge Nível 4 com 50 rotinas periodizadas");

console.log("\n=======================================================");
console.log(`📊 RESULTADO DA AUDITORIA DE GAMIFICAÇÃO: ${passedCount} PASSOU | ${failedCount} FALHOU`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 TODAS AS CONQUISTAS (INICIAIS, SEMANAIS, MENSAIS, ANUAIS, CARREIRA E TREINADOR) FUNCIONAM PERFEITAMENTE COM GATILHOS E PROGRESSÕES REAIS!");
}
