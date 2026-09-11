/**
 * Coach Routines Store — Biblioteca de Fichas e Protocolos Salvos pelo Treinador
 * Permite criar fichas personalizadas com X dias (A, B, C, D, E, F...) e deixá-las
 * salvas para prescrever a qualquer aluno da carteira a qualquer momento.
 */

import { WorkoutSplitTemplate, PreFormedWorkoutRoutine, PREFORMED_ROUTINES } from "./exercisedb";

export type CoachWorkoutRoutine = PreFormedWorkoutRoutine;

const STORAGE_KEY_COACH_ROUTINES = "gymflow_coach_custom_routines_v1";
const EVENT_COACH_ROUTINES_CHANGED = "gymflow:coach-routines-updated";

// Rotina inicial de exemplo para o treinador já ter um modelo ABCD de 4 dias pronto
const INITIAL_COACH_ROUTINES: CoachWorkoutRoutine[] = [
  {
    id: "routine_coach_abcd_hypertrophy",
    name: "Hipertrofia ABCD (4 Dias de Treino)",
    category: "Hipertrofia",
    difficulty: "Intermediário",
    description: "Periodização de 4 dias dividida em Upper/Lower e Push/Pull com descanso estratégico na quarta-feira.",
    frequency: "4 dias na semana",
    isCustom: true,
    createdAt: "10/09/2026",
    coachName: "Prof. Rodrigo Costa",
    splits: [
      {
        id: "A",
        title: "Treino A — Superior / Peitoral & Deltoides",
        muscles: "Peitoral Maior, Ombros e Tríceps",
        estimatedMinutes: 50,
        exercises: [
          {
            id: "ex_bench_press_init",
            exerciseId: "ex_bench_press",
            name: "Supino Reto com Barra",
            muscle: "Peitoral",
            equipment: "barbell",
            target: "4 séries × 8-10 reps",
            restSeconds: 90,
            notes: "Manter escápulas aduzidas e descida controlada em 3 segundos.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 60 },
              { setNumber: 2, reps: 10, weightKg: 70 },
              { setNumber: 3, reps: 8, weightKg: 75 },
              { setNumber: 4, reps: 8, weightKg: 80 },
            ],
          },
          {
            id: "ex_incline_dumbbell_press_init",
            exerciseId: "ex_incline_dumbbell_press",
            name: "Supino Inclinado com Halteres",
            muscle: "Peitoral Superior",
            equipment: "dumbbell",
            target: "3 séries × 10-12 reps",
            restSeconds: 60,
            notes: "Banco inclinado a 30° para ativação máxima da porção clavicular.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 22 },
              { setNumber: 2, reps: 10, weightKg: 24 },
              { setNumber: 3, reps: 10, weightKg: 24 },
            ],
          },
          {
            id: "ex_lateral_raise_init",
            exerciseId: "ex_lateral_raise",
            name: "Elevação Lateral com Halteres",
            muscle: "Deltoide Lateral",
            equipment: "dumbbell",
            target: "4 séries × 12-15 reps",
            restSeconds: 45,
            notes: "Cotovelos levemente flexionados, subir até a linha dos ombros.",
            sets: [
              { setNumber: 1, reps: 15, weightKg: 10 },
              { setNumber: 2, reps: 14, weightKg: 10 },
              { setNumber: 3, reps: 12, weightKg: 12 },
              { setNumber: 4, reps: 12, weightKg: 12 },
            ],
          },
        ],
      },
      {
        id: "B",
        title: "Treino B — Dorsal & Bíceps",
        muscles: "Latíssimo do Dorso, Romboides e Bíceps",
        estimatedMinutes: 50,
        exercises: [
          {
            id: "ex_pulley_front_init",
            exerciseId: "ex_pulley_front",
            name: "Puxada Frontal no Pulley",
            muscle: "Dorsais",
            equipment: "cable",
            target: "4 séries × 10-12 reps",
            restSeconds: 60,
            notes: "Puxar a barra em direção à parte superior do tórax.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 50 },
              { setNumber: 2, reps: 10, weightKg: 55 },
              { setNumber: 3, reps: 10, weightKg: 60 },
              { setNumber: 4, reps: 8, weightKg: 65 },
            ],
          },
          {
            id: "ex_bent_over_row_init",
            exerciseId: "ex_bent_over_row",
            name: "Remada Curvada com Barra",
            muscle: "Costas e Meio das Costas",
            equipment: "barbell",
            target: "4 séries × 8-10 reps",
            restSeconds: 75,
            notes: "Coluna alinhada em 45 graus e pegada pronada.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 40 },
              { setNumber: 2, reps: 10, weightKg: 50 },
              { setNumber: 3, reps: 8, weightKg: 55 },
              { setNumber: 4, reps: 8, weightKg: 60 },
            ],
          },
        ],
      },
      {
        id: "C",
        title: "Treino C — Membros Inferiores / Quadríceps",
        muscles: "Quadríceps, Panturrilhas e Core",
        estimatedMinutes: 55,
        exercises: [
          {
            id: "ex_squat_init",
            exerciseId: "ex_squat",
            name: "Agachamento Livre com Barra",
            muscle: "Quadríceps & Glúteos",
            equipment: "barbell",
            target: "4 séries × 8-10 reps",
            restSeconds: 90,
            notes: "Quebrar o ângulo de 90° e manter joelhos alinhados com a ponta dos pés.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 60 },
              { setNumber: 2, reps: 10, weightKg: 70 },
              { setNumber: 3, reps: 8, weightKg: 80 },
              { setNumber: 4, reps: 8, weightKg: 90 },
            ],
          },
          {
            id: "ex_leg_press_init",
            exerciseId: "ex_leg_press",
            name: "Leg Press 45°",
            muscle: "Quadríceps",
            equipment: "machine",
            target: "3 séries × 12 reps",
            restSeconds: 60,
            notes: "Amplitude profunda sem descolar a lombar do encosto.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 160 },
              { setNumber: 2, reps: 12, weightKg: 180 },
              { setNumber: 3, reps: 10, weightKg: 200 },
            ],
          },
        ],
      },
      {
        id: "D",
        title: "Treino D — Posterior de Coxa, Glúteos & Ombros",
        muscles: "Isquiotibiais, Glúteo Máximo e Deltoide Posterior",
        estimatedMinutes: 45,
        exercises: [
          {
            id: "ex_stiff_init",
            exerciseId: "ex_stiff",
            name: "Stiff com Halteres",
            muscle: "Posteriores & Glúteos",
            equipment: "dumbbell",
            target: "4 séries × 10-12 reps",
            restSeconds: 60,
            notes: "Empurrar o quadril para trás sentindo alongamento dos isquiotibiais.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 18 },
              { setNumber: 2, reps: 10, weightKg: 20 },
              { setNumber: 3, reps: 10, weightKg: 22 },
              { setNumber: 4, reps: 10, weightKg: 22 },
            ],
          },
          {
            id: "ex_hip_thrust_init",
            exerciseId: "ex_hip_thrust",
            name: "Elevação Pélvica com Barra",
            muscle: "Glúteos",
            equipment: "barbell",
            target: "4 séries × 10 reps",
            restSeconds: 60,
            notes: "Pausa de 2 segundos de contração isométrica no topo.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 60 },
              { setNumber: 2, reps: 10, weightKg: 70 },
              { setNumber: 3, reps: 10, weightKg: 80 },
              { setNumber: 4, reps: 8, weightKg: 90 },
            ],
          },
        ],
      },
    ],
  },
];

export function getStoredCoachRoutines(): CoachWorkoutRoutine[] {
  if (typeof window === "undefined") return INITIAL_COACH_ROUTINES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COACH_ROUTINES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COACH_ROUTINES, JSON.stringify(INITIAL_COACH_ROUTINES));
      return INITIAL_COACH_ROUTINES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao carregar fichas salvas do treinador:", err);
    return INITIAL_COACH_ROUTINES;
  }
}

export function saveCoachRoutine(routine: CoachWorkoutRoutine): CoachWorkoutRoutine {
  if (typeof window === "undefined") return routine;

  const current = getStoredCoachRoutines();
  const exists = current.some((r) => r.id === routine.id);

  let updated: CoachWorkoutRoutine[];
  if (exists) {
    updated = current.map((r) => (r.id === routine.id ? { ...routine, isCustom: true } : r));
  } else {
    const newRoutine: CoachWorkoutRoutine = {
      ...routine,
      id: routine.id || `routine_custom_${Date.now()}`,
      isCustom: true,
      createdAt: routine.createdAt || new Date().toLocaleDateString("pt-BR"),
    };
    updated = [newRoutine, ...current];
  }

  localStorage.setItem(STORAGE_KEY_COACH_ROUTINES, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EVENT_COACH_ROUTINES_CHANGED, { detail: updated }));
  return routine;
}

export function deleteCoachRoutine(routineId: string): void {
  if (typeof window === "undefined") return;

  const current = getStoredCoachRoutines();
  const updated = current.filter((r) => r.id !== routineId);

  localStorage.setItem(STORAGE_KEY_COACH_ROUTINES, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EVENT_COACH_ROUTINES_CHANGED, { detail: updated }));
}

export function subscribeToCoachRoutines(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(EVENT_COACH_ROUTINES_CHANGED, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_COACH_ROUTINES_CHANGED, callback);
    window.removeEventListener("storage", callback);
  };
}
