/**
 * Suíte de Testes Automatizados — Smart Streak & Flexible Schedule Engine
 *
 * Valida com rigor:
 * 1. Finais de semana (Sábado e Domingo) como descanso opcional protegido (não quebram a ofensiva).
 * 2. Treinos em fins de semana como bônus acumulativo (+1 dia para cada dia treinado).
 * 3. Agenda personalizada de Personal Trainer (ex: 3x na semana - Seg/Qua/Sex) onde dias de folga não quebram o ritmo.
 * 4. Quebra de sequência em caso de falta real em dia programado.
 * 5. Marcos de progresso e sincronização com conquistas (Fogo Sagrado, Titã da Disciplina, Ciborgue).
 */

import {
  calculateSmartWorkoutStreak,
  getLocalDateKey,
  parseDateKey,
  parseScheduleDaysToNumbers,
  getNextMilestone,
} from "../src/lib/streak-service";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Detalhes: ${details}`);
    totalFailed++;
  }
}

console.log("\n=======================================================");
console.log("🔥 TESTES DE OFENSIVA INTELIGENTE & DIAS DE TREINO FLEXÍVEIS");
console.log("=======================================================\n");

// ----------------------------------------------------
// 1. Testes de Parsing e Chaves de Data
// ----------------------------------------------------
console.log("🔹 1. Testando Chaves Canônicas de Data e Parsing...");

const date1 = new Date(2026, 9, 2); // 02/10/2026 (Sexta-feira)
const key1 = getLocalDateKey(date1);
assert(key1 === "2026-10-02", "getLocalDateKey formata YYYY-MM-DD em horário local com zero à esquerda");

const parsed1 = parseDateKey("2026-10-02");
assert(parsed1.getFullYear() === 2026 && parsed1.getMonth() === 9 && parsed1.getDate() === 2, "parseDateKey reconverte chave YYYY-MM-DD para objeto Date");

const scheduleNums = parseScheduleDaysToNumbers(["Seg", "Qua", "Sex"]);
assert(
  scheduleNums.length === 3 && scheduleNums.includes(1) && scheduleNums.includes(3) && scheduleNums.includes(5),
  "parseScheduleDaysToNumbers converte ['Seg', 'Qua', 'Sex'] para [1, 3, 5]"
);

const defaultNums = parseScheduleDaysToNumbers([]);
assert(defaultNums.length === 5 && defaultNums.includes(1) && defaultNums.includes(5), "parseScheduleDaysToNumbers aplica padrão Segunda a Sexta quando vazio");

// ----------------------------------------------------
// 2. Testes de Finais de Semana (Descanso Protegido vs Bônus)
// ----------------------------------------------------
console.log("\n🔹 2. Testando Regra de Finais de Semana (Sáb/Dom)...");

// Cenário A: Treinou Quarta, Quinta, Sexta. Descansou Sábado e Domingo. Hoje é Segunda (05/10/2026) e treinou hoje.
// 2026-09-30 (Qua), 2026-10-01 (Qui), 2026-10-02 (Sex), 2026-10-05 (Seg)
const datesA = ["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-05"];
const mondayRef = new Date(2026, 9, 5); // 05/10/2026 (Segunda-feira)

const streakA = calculateSmartWorkoutStreak({
  dates: datesA,
  referenceDate: mondayRef,
});

assert(
  streakA.currentStreak === 4,
  "Fim de semana sem treino NÃO quebra a ofensiva (Qua + Qui + Sex + Seg = 4 dias)",
  `Esperado 4, obtido: ${streakA.currentStreak}`
);
assert(streakA.hasTrainedToday === true, "Identifica que o aluno já treinou na data de referência");

// Cenário B: Treinou Quarta, Quinta, Sexta. No Sábado fez cárdio bônus. Descansou no Domingo. Treinou na Segunda.
const datesB = ["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05"];
const streakB = calculateSmartWorkoutStreak({
  dates: datesB,
  referenceDate: mondayRef,
});

assert(
  streakB.currentStreak === 5,
  "Treino bônus de Sábado soma +1 na sequência contínua (Qua + Qui + Sex + Sáb + Seg = 5 dias)",
  `Esperado 5, obtido: ${streakB.currentStreak}`
);

// Cenário C: Treinou Sexta, Sábado e Domingo. Treinou na Segunda.
const datesC = ["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"];
const streakC = calculateSmartWorkoutStreak({
  dates: datesC,
  referenceDate: mondayRef,
});

assert(
  streakC.currentStreak === 4,
  "Treinos em ambos os dias do fim de semana somam +2 bônus (Sex + Sáb + Dom + Seg = 4 dias)",
  `Esperado 4, obtido: ${streakC.currentStreak}`
);

// Cenário D: Hoje é Domingo (04/10/2026), aluno treinou na Sexta (02/10/2026) e descansou Sáb/Dom.
const sundayRef = new Date(2026, 9, 4); // 04/10/2026 (Domingo)
const datesD = ["2026-10-02"];
const streakD = calculateSmartWorkoutStreak({
  dates: datesD,
  referenceDate: sundayRef,
});

assert(
  streakD.isWeekendGrace === true,
  "No domingo sem treino, ativa o estado de Descanso de Fim de Semana Protegido (isWeekendGrace)"
);
assert(
  streakD.currentStreak === 1,
  "A sequência da Sexta-feira permanece viva durante o fim de semana (streak = 1)",
  `Esperado 1, obtido: ${streakD.currentStreak}`
);

// ----------------------------------------------------
// 3. Testes de Agenda com Personal Trainer (Dias Programados)
// ----------------------------------------------------
console.log("\n🔹 3. Testando Agenda com Personal Trainer (Seg/Qua/Sex)...");

// Aluno com contrato 3x na semana (Seg, Qua, Sex)
// Treinou: Seg (28/09), Qua (30/09), Sex (02/10), Seg (05/10)
const personalSchedule = ["Seg", "Qua", "Sex"];
const datesPersonal = ["2026-09-28", "2026-09-30", "2026-10-02", "2026-10-05"];

const streakPersonal = calculateSmartWorkoutStreak({
  dates: datesPersonal,
  weeklySchedule: personalSchedule,
  referenceDate: mondayRef,
});

assert(
  streakPersonal.currentStreak === 4,
  "Dias de descanso entre sessões com personal (Terça e Quinta) NÃO quebram o streak",
  `Esperado 4, obtido: ${streakPersonal.currentStreak}`
);

// Terça-feira (29/09): Dia de descanso programado
const tuesdayRef = new Date(2026, 8, 29); // 29/09/2026 (Terça-feira)
const streakTuesday = calculateSmartWorkoutStreak({
  dates: ["2026-09-28"], // Treinou Segunda
  weeklySchedule: personalSchedule,
  referenceDate: tuesdayRef,
});

assert(
  streakTuesday.isRestDayGrace === true,
  "Na Terça-feira de folga da agenda com personal, identifica isRestDayGrace"
);
assert(
  streakTuesday.currentStreak === 1,
  "Ofensiva da Segunda-feira permanece ativa na Terça-feira de descanso programado"
);

// Treino extra em dia livre (ex: Cárdio na Terça-feira)
const datesWithExtra = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-02", "2026-10-05"];
const streakWithExtra = calculateSmartWorkoutStreak({
  dates: datesWithExtra,
  weeklySchedule: personalSchedule,
  referenceDate: mondayRef,
});

assert(
  streakWithExtra.currentStreak === 5,
  "Treino extra em dia de folga da agenda (Terça) soma bônus na sequência (streak = 5)",
  `Esperado 5, obtido: ${streakWithExtra.currentStreak}`
);

// Falta injustificada em dia obrigatório (faltou na Quarta 30/09 sem treinar)
const datesWithMissed = ["2026-09-28", /* faltou 30/09 */ "2026-10-02", "2026-10-05"];
const streakWithMissed = calculateSmartWorkoutStreak({
  dates: datesWithMissed,
  weeklySchedule: personalSchedule,
  referenceDate: mondayRef,
});

assert(
  streakWithMissed.currentStreak === 2,
  "Falta em dia programado com personal (Quarta) encerra a sequência anterior (recomeça em Sex + Seg = 2)",
  `Esperado 2, obtido: ${streakWithMissed.currentStreak}`
);

// ----------------------------------------------------
// 4. Testes de Marcos e Conquistas (Fogo Sagrado, 30 Dias, etc.)
// ----------------------------------------------------
console.log("\n🔹 4. Testando Marcos de Progresso & Conquistas...");

const milestone16 = getNextMilestone(16);
assert(
  milestone16.nextMilestone === 20 && milestone16.progressPercent === 80,
  "Streak 16 dias aponta para próximo marco de 20 dias (80% concluído)"
);

const milestone4 = getNextMilestone(4);
assert(
  milestone4.nextMilestone === 7 && milestone4.progressPercent === 57,
  "Streak 4 dias aponta para próximo marco de 7 dias (Chama Inicial Bronze)"
);

const milestone25 = getNextMilestone(25);
assert(
  milestone25.nextMilestone === 30 && milestone25.progressPercent === 83,
  "Streak 25 dias aponta para próximo marco de 30 dias (Inferno Ardente Ouro)"
);

// ----------------------------------------------------
// RESULTADOS CONSOLIDADOS
// ----------------------------------------------------
console.log("\n=======================================================");
console.log(`📊 RESULTADO DOS TESTES: ${totalPassed} PASSOU | ${totalFailed} FALHOU`);
console.log("=======================================================\n");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("🎉 TODOS OS TESTES DE OFENSIVA INTELIGENTE PASSARAM COM SUCESSO!\n");
  process.exit(0);
}
