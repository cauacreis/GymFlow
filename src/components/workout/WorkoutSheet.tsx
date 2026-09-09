"use client";

import React, { useState } from "react";
import { Dumbbell, CheckCircle2, Circle, Timer, Flame, ChevronRight, Award, Plus, Minus, RotateCcw } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  target: string;
  notes?: string;
  sets: ExerciseSet[];
}

export interface WorkoutSplit {
  id: "A" | "B" | "C";
  title: string;
  muscles: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

const INITIAL_SPLITS: WorkoutSplit[] = [
  {
    id: "A",
    title: "Treino A — Superior Anterior",
    muscles: "Peitoral, Deltoide Anterior & Tríceps",
    estimatedMinutes: 50,
    exercises: [
      {
        id: "ex-1",
        name: "Supino Reto com Barra",
        muscle: "Peitoral Maior",
        equipment: "Barra Olímpica",
        target: "4 séries × 8-10 reps",
        notes: "Descer a barra até tocar levemente o peito. Cotovelos a 75°.",
        sets: [
          { setNumber: 1, reps: 10, weightKg: 60, completed: true },
          { setNumber: 2, reps: 10, weightKg: 70, completed: true },
          { setNumber: 3, reps: 8, weightKg: 80, completed: false },
          { setNumber: 4, reps: 8, weightKg: 80, completed: false },
        ],
      },
      {
        id: "ex-2",
        name: "Supino Inclinado com Halteres",
        muscle: "Peitoral Superior",
        equipment: "Banco 30° + Halteres",
        target: "4 séries × 10-12 reps",
        notes: "Alongamento profundo na base sem estalar as articulações.",
        sets: [
          { setNumber: 1, reps: 12, weightKg: 24, completed: false },
          { setNumber: 2, reps: 10, weightKg: 26, completed: false },
          { setNumber: 3, reps: 10, weightKg: 28, completed: false },
          { setNumber: 4, reps: 10, weightKg: 28, completed: false },
        ],
      },
      {
        id: "ex-3",
        name: "Crossover no Pulley Médio",
        muscle: "Peitoral Médio",
        equipment: "Polia Dupla",
        target: "3 séries × 12-15 reps",
        notes: "Aperte e segure 1 segundo no pico de contração.",
        sets: [
          { setNumber: 1, reps: 15, weightKg: 15, completed: false },
          { setNumber: 2, reps: 12, weightKg: 20, completed: false },
          { setNumber: 3, reps: 12, weightKg: 20, completed: false },
        ],
      },
      {
        id: "ex-4",
        name: "Desenvolvimento com Halteres",
        muscle: "Deltoide",
        equipment: "Banco 75°",
        target: "4 séries × 10 reps",
        notes: "Controle na descida até a altura das orelhas.",
        sets: [
          { setNumber: 1, reps: 10, weightKg: 18, completed: false },
          { setNumber: 2, reps: 10, weightKg: 20, completed: false },
          { setNumber: 3, reps: 10, weightKg: 22, completed: false },
          { setNumber: 4, reps: 8, weightKg: 22, completed: false },
        ],
      },
      {
        id: "ex-5",
        name: "Tríceps Corda no Pulley",
        muscle: "Tríceps Braquial",
        equipment: "Polia Alta + Corda",
        target: "4 séries × 12 reps",
        notes: "Afaste a ponta da corda na fase final do movimento.",
        sets: [
          { setNumber: 1, reps: 12, weightKg: 25, completed: false },
          { setNumber: 2, reps: 12, weightKg: 30, completed: false },
          { setNumber: 3, reps: 10, weightKg: 35, completed: false },
          { setNumber: 4, reps: 10, weightKg: 35, completed: false },
        ],
      },
    ],
  },
  {
    id: "B",
    title: "Treino B — Superior Posterior",
    muscles: "Dorsais, Deltoide Posterior & Bíceps",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "ex-b1",
        name: "Puxada Frontal Aberta",
        muscle: "Latíssimo do Dorso",
        equipment: "Polia Alta",
        target: "4 séries × 10 reps",
        notes: "Puxe direcionando os cotovelos para os bolsos.",
        sets: [
          { setNumber: 1, reps: 10, weightKg: 55, completed: false },
          { setNumber: 2, reps: 10, weightKg: 65, completed: false },
          { setNumber: 3, reps: 8, weightKg: 70, completed: false },
          { setNumber: 4, reps: 8, weightKg: 70, completed: false },
        ],
      },
      {
        id: "ex-b2",
        name: "Remada Curvada com Barra",
        muscle: "Espessura Dorsal",
        equipment: "Barra + Anilhas",
        target: "4 séries × 8-10 reps",
        notes: "Coluna lombar travada em 45 graus.",
        sets: [
          { setNumber: 1, reps: 10, weightKg: 50, completed: false },
          { setNumber: 2, reps: 10, weightKg: 60, completed: false },
          { setNumber: 3, reps: 8, weightKg: 70, completed: false },
          { setNumber: 4, reps: 8, weightKg: 70, completed: false },
        ],
      },
      {
        id: "ex-b3",
        name: "Rosca Direta com Barra W",
        muscle: "Bíceps Braquial",
        equipment: "Barra W",
        target: "4 séries × 10 reps",
        notes: "Cotovelos fixos ao lado do tronco.",
        sets: [
          { setNumber: 1, reps: 10, weightKg: 20, completed: false },
          { setNumber: 2, reps: 10, weightKg: 25, completed: false },
          { setNumber: 3, reps: 8, weightKg: 30, completed: false },
          { setNumber: 4, reps: 8, weightKg: 30, completed: false },
        ],
      },
    ],
  },
  {
    id: "C",
    title: "Treino C — Membros Inferiores & Core",
    muscles: "Quadríceps, Glúteos, Isquiotibiais & Abdômen",
    estimatedMinutes: 60,
    exercises: [
      {
        id: "ex-c1",
        name: "Agachamento Livre com Barra",
        muscle: "Quadríceps & Glúteos",
        equipment: "Gaiola de Agachamento",
        target: "4 séries × 8 reps",
        notes: "Descida profunda controlada, joelhos apontando na linha dos pés.",
        sets: [
          { setNumber: 1, reps: 10, weightKg: 60, completed: false },
          { setNumber: 2, reps: 8, weightKg: 80, completed: false },
          { setNumber: 3, reps: 8, weightKg: 90, completed: false },
          { setNumber: 4, reps: 6, weightKg: 100, completed: false },
        ],
      },
      {
        id: "ex-c2",
        name: "Leg Press 45°",
        muscle: "Pernas Completo",
        equipment: "Máquina 45°",
        target: "4 séries × 12 reps",
        notes: "Sem hiperextender os joelhos no topo.",
        sets: [
          { setNumber: 1, reps: 12, weightKg: 160, completed: false },
          { setNumber: 2, reps: 12, weightKg: 200, completed: false },
          { setNumber: 3, reps: 10, weightKg: 240, completed: false },
          { setNumber: 4, reps: 10, weightKg: 260, completed: false },
        ],
      },
      {
        id: "ex-c3",
        name: "Mesa Flexora",
        muscle: "Isquiotibiais",
        equipment: "Mesa Flexora",
        target: "4 séries × 12 reps",
        notes: "Quadril colado no banco durante toda a flexão.",
        sets: [
          { setNumber: 1, reps: 12, weightKg: 35, completed: false },
          { setNumber: 2, reps: 12, weightKg: 40, completed: false },
          { setNumber: 3, reps: 10, weightKg: 45, completed: false },
          { setNumber: 4, reps: 10, weightKg: 45, completed: false },
        ],
      },
    ],
  },
];

interface WorkoutSheetProps {
  onOpenTimer: () => void;
}

export function WorkoutSheet({ onOpenTimer }: WorkoutSheetProps) {
  const [selectedSplit, setSelectedSplit] = useState<"A" | "B" | "C">("A");
  const [splits, setSplits] = useState<WorkoutSplit[]>(INITIAL_SPLITS);

  const currentSplit = splits.find((s) => s.id === selectedSplit) || splits[0];

  // Cálculo de progresso
  const totalSets = currentSplit.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = currentSplit.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Carga total levantada
  const totalVolumeKg = currentSplit.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weightKg * s.reps, 0)
    );
  }, 0);

  // Toggle de conclusão de série
  const handleToggleSet = (exerciseId: string, setNumber: number) => {
    triggerHaptic("medium");
    setSplits((prev) =>
      prev.map((split) => {
        if (split.id !== selectedSplit) return split;
        return {
          ...split,
          exercises: split.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, completed: !s.completed } : s
              ),
            };
          }),
        };
      })
    );
  };

  // Ajuste de peso
  const handleAdjustWeight = (exerciseId: string, setNumber: number, delta: number) => {
    triggerHaptic("light");
    setSplits((prev) =>
      prev.map((split) => {
        if (split.id !== selectedSplit) return split;
        return {
          ...split,
          exercises: split.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.setNumber === setNumber
                  ? { ...s, weightKg: Math.max(0, s.weightKg + delta) }
                  : s
              ),
            };
          }),
        };
      })
    );
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Seletor de Divisão de Treino (Tabs A, B, C) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] shadow-inner">
        {(["A", "B", "C"] as const).map((splitId) => (
          <button
            key={splitId}
            onClick={() => {
              triggerHaptic("light");
              setSelectedSplit(splitId);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedSplit === splitId
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Treino {splitId}</span>
          </button>
        ))}
      </div>

      {/* Card Resumo do Treino Atual */}
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-white/[0.08] shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Ficha Ativa
            </span>
            <h2 className="text-base font-extrabold text-white mt-0.5">{currentSplit.title}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{currentSplit.muscles}</p>
          </div>
          <button
            onClick={onOpenTimer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 active:scale-95 transition-all shadow-sm"
          >
            <Timer className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Descanso</span>
          </button>
        </div>

        {/* Barra de Progresso do Treino */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              Progresso ({completedSets}/{totalSets} séries)
            </span>
            <span className="font-mono font-bold text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Volume: <strong className="text-zinc-200">{totalVolumeKg.toLocaleString("pt-BR")} kg</strong>
            </span>
            <span>Tempo Médio: ~{currentSplit.estimatedMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Lista de Exercícios */}
      <div className="flex flex-col gap-3">
        {currentSplit.exercises.map((exercise, exIndex) => {
          const isAllCompleted = exercise.sets.every((s) => s.completed);

          return (
            <div
              key={exercise.id}
              className={`rounded-2xl p-4 transition-all duration-300 border ${
                isAllCompleted
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-zinc-900/60 border-white/[0.08]"
              }`}
            >
              {/* Header do Exercício */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/[0.06] text-zinc-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      {exIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">{exercise.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-medium">
                      {exercise.muscle}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {exercise.equipment}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-1 rounded-lg">
                  {exercise.target}
                </span>
              </div>

              {exercise.notes && (
                <p className="text-[11px] text-zinc-400 italic bg-white/[0.02] p-2 rounded-lg mb-3 border-l-2 border-emerald-500/40">
                  💡 {exercise.notes}
                </p>
              )}

              {/* Tabela de Séries com Interação Tátil */}
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-12 text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">
                  <span className="col-span-2">Série</span>
                  <span className="col-span-3 text-center">Reps</span>
                  <span className="col-span-5 text-center">Carga (kg)</span>
                  <span className="col-span-2 text-right">Feito</span>
                </div>

                {exercise.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-xl text-xs transition-all ${
                      set.completed
                        ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-200"
                        : "bg-white/[0.02] hover:bg-white/[0.04] text-zinc-300"
                    }`}
                  >
                    <span className="col-span-2 font-mono font-bold text-[11px]">
                      #{set.setNumber}
                    </span>
                    <span className="col-span-3 text-center font-mono font-medium">
                      {set.reps} reps
                    </span>

                    {/* Controle de Carga com Botões +/- */}
                    <div className="col-span-5 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleAdjustWeight(exercise.id, set.setNumber, -2)}
                        className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center justify-center active:scale-90 transition-all"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-mono font-bold w-12 text-center text-white">
                        {set.weightKg} kg
                      </span>
                      <button
                        onClick={() => handleAdjustWeight(exercise.id, set.setNumber, 2)}
                        className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center justify-center active:scale-90 transition-all"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Botão de Conclusão da Série */}
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => handleToggleSet(exercise.id, set.setNumber)}
                        className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                      >
                        {set.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
