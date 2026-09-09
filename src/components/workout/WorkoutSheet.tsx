"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  CheckCircle2,
  Circle,
  Timer,
  Flame,
  RotateCcw,
  UserCheck,
  MessageSquareQuote,
  ShieldCheck,
  Plus,
  Minus,
  Play,
  Home,
  Sparkles,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getStudentWorkout, subscribeToWorkoutChanges, StudentWorkoutPackage } from "@/lib/workout-store";
import { getExerciseDetails, PREFORMED_ROUTINES, ExerciseInWorkout } from "@/lib/exercisedb";
import { ExerciseGifModal, ExerciseModalData } from "./ExerciseGifModal";

export interface ExerciseSet {
  setNumber: number;
  reps: number | string;
  weightKg: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  exerciseId?: string;
  name: string;
  muscle: string;
  equipment: string;
  target: string;
  restSeconds?: number;
  notes?: string;
  gifUrl?: string;
  mediaFrames?: string[];
  instructions?: string[];
  tips?: string[];
  sets: ExerciseSet[];
}

export interface WorkoutSplit {
  id: "A" | "B" | "C" | "D";
  title: string;
  muscles: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

interface WorkoutSheetProps {
  studentId?: string;
  onOpenTimer: (defaultSeconds?: number) => void;
}

export function WorkoutSheet({ studentId = "student_carlos", onOpenTimer }: WorkoutSheetProps) {
  const [workoutMode, setWorkoutMode] = useState<"gym" | "home">("gym");
  const [workoutPackage, setWorkoutPackage] = useState<StudentWorkoutPackage>(() =>
    getStudentWorkout(studentId)
  );
  const [selectedSplitId, setSelectedSplitId] = useState<string>("A");
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

  // Modal de Animação GIF / Execução
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<ExerciseModalData | null>(null);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);

  // Mapeia exercícios enriquecendo com o catálogo ExerciseDB
  const mapExercises = (rawExercises: ExerciseInWorkout[]): Exercise[] => {
    return rawExercises.map((ex) => {
      const details = getExerciseDetails(ex.exerciseId || ex.name);
      return {
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.name,
        muscle: ex.muscle || details?.target || "Geral",
        equipment: ex.equipment || details?.equipment || "Livre",
        target: ex.target,
        restSeconds: ex.restSeconds || 60,
        notes: ex.notes || details?.instructions?.[0],
        gifUrl: ex.gifUrl || details?.gifUrl,
        mediaFrames: ex.mediaFrames || details?.mediaFrames,
        instructions: ex.instructions || details?.instructions,
        tips: ex.tips || details?.tips,
        sets: ex.sets.map((set, idx) => ({
          setNumber: set.setNumber || idx + 1,
          reps: set.reps,
          weightKg: set.weightKg,
          completed: set.completed || false,
        })),
      };
    });
  };

  // Carrega treino de acordo com o modo ("gym" ou "home")
  useEffect(() => {
    if (workoutMode === "home") {
      const homeRoutine = PREFORMED_ROUTINES.find((r) => r.id === "routine_home_calisthenics");
      if (homeRoutine) {
        const mappedSplits: WorkoutSplit[] = homeRoutine.splits.map((s) => ({
          id: s.id,
          title: s.title,
          muscles: s.muscles,
          estimatedMinutes: s.estimatedMinutes,
          exercises: mapExercises(s.exercises),
        }));
        setSplits(mappedSplits);
        setSelectedSplitId(mappedSplits[0]?.id || "A");
      }
      return;
    }

    // Modo Academia
    const loadWorkout = () => {
      const pkg = getStudentWorkout(studentId);
      setWorkoutPackage(pkg);

      const mappedSplits: WorkoutSplit[] = pkg.splits.map((s) => ({
        id: s.id,
        title: s.title,
        muscles: s.muscles,
        estimatedMinutes: s.estimatedMinutes,
        exercises: mapExercises(s.exercises),
      }));

      setSplits(mappedSplits);
      if (mappedSplits.length > 0 && !mappedSplits.some((s) => s.id === selectedSplitId)) {
        setSelectedSplitId(mappedSplits[0].id);
      }
    };

    loadWorkout();
    const unsubscribe = subscribeToWorkoutChanges(loadWorkout);
    return () => unsubscribe();
  }, [studentId, workoutMode]);

  const currentSplit = splits.find((s) => s.id === selectedSplitId) || splits[0];

  if (!currentSplit) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs">
        Carregando ficha de treino do aluno...
      </div>
    );
  }

  // Cálculo de progresso do treino
  const totalSets = currentSplit.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = currentSplit.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Carga total acumulada no treino
  const totalVolumeKg = currentSplit.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weightKg * (typeof s.reps === "number" ? s.reps : 10), 0)
    );
  }, 0);

  // Toggle de conclusão de série
  const handleToggleSet = (exerciseId: string, setNumber: number) => {
    triggerHaptic("medium");
    setSplits((prev) =>
      prev.map((split) => {
        if (split.id !== selectedSplitId) return split;
        return {
          ...split,
          exercises: split.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.setNumber !== setNumber) return s;
                return { ...s, completed: !s.completed };
              }),
            };
          }),
        };
      })
    );
  };

  // Ajuste de carga (+/- 2kg)
  const handleAdjustWeight = (exerciseId: string, setNumber: number, delta: number) => {
    triggerHaptic("light");
    setSplits((prev) =>
      prev.map((split) => {
        if (split.id !== selectedSplitId) return split;
        return {
          ...split,
          exercises: split.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.setNumber !== setNumber) return s;
                const newWeight = Math.max(0, s.weightKg + delta);
                return { ...s, weightKg: newWeight };
              }),
            };
          }),
        };
      })
    );
  };

  // Reset do split atual
  const handleResetWorkout = () => {
    triggerHaptic("heavy");
    if (confirm("Deseja desmarcar todas as séries deste treino?")) {
      setSplits((prev) =>
        prev.map((split) => {
          if (split.id !== selectedSplitId) return split;
          return {
            ...split,
            exercises: split.exercises.map((ex) => ({
              ...ex,
              sets: ex.sets.map((s) => ({ ...s, completed: false })),
            })),
          };
        })
      );
    }
  };

  // Abrir modal de GIF
  const handleOpenGifModal = (exercise: Exercise) => {
    triggerHaptic("selection");
    setSelectedExerciseModal({
      id: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      target: exercise.target,
      equipment: exercise.equipment,
      notes: exercise.notes,
      gifUrl: exercise.gifUrl,
      mediaFrames: exercise.mediaFrames,
      instructions: exercise.instructions,
      tips: exercise.tips,
    });
    setIsGifModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Seletor Rápido: Ficha da Academia vs Treino em Casa (0 Equipamento) */}
      <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl border border-white/[0.08] shadow-md">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setWorkoutMode("gym");
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            workoutMode === "gym"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Ficha Academia</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setWorkoutMode("home");
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            workoutMode === "home"
              ? "bg-teal-400 text-zinc-950 shadow-md shadow-teal-400/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Treino em Casa (GIFs)</span>
        </button>
      </div>

      {/* Card do Professor / Prescrição Oficial */}
      {workoutMode === "gym" ? (
        <div className="rounded-2xl p-3.5 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Prescrição Profissional
                </span>
                <h3 className="text-xs font-black text-white">{workoutPackage.routineTitle}</h3>
                <p className="text-[10px] text-zinc-400">
                  {workoutPackage.prescribedBy} • {workoutPackage.prescribedAt}
                </p>
              </div>
            </div>
          </div>

          {workoutPackage.coachNotes && (
            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-start gap-1.5 text-[10px] text-zinc-300">
              <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-snug italic">"{workoutPackage.coachNotes}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-3.5 bg-gradient-to-br from-teal-950/50 via-zinc-900 to-zinc-950 border border-teal-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 100% Calistenia • 0 Equipamentos
              </span>
              <h3 className="text-xs font-black text-white">Treino Funcional em Casa</h3>
              <p className="text-[10px] text-zinc-400">
                Animações ExerciseDB passo a passo para sala ou quarto
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header com Seletor de Divisões (A / B / C) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {splits.map((split) => {
            const isSelected = split.id === selectedSplitId;
            return (
              <button
                key={split.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedSplitId(split.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25"
                    : "bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white"
                }`}
              >
                Treino {split.id}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleResetWorkout}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          title="Reiniciar Treino"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status do Treino: Progresso & Volume */}
      <div className="rounded-2xl p-3.5 bg-zinc-900/60 border border-white/[0.08] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white">{currentSplit.title}</h3>
            <span className="text-[10px] text-emerald-400 font-medium">{currentSplit.muscles}</span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono font-bold text-white">
              {completedSets}/{totalSets} séries
            </span>
            <span className="text-[9px] text-zinc-400 block">~{currentSplit.estimatedMinutes} min</span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            {workoutMode === "home" ? (
              <span>Intensidade: <b className="text-teal-300">Peso Corporal</b></span>
            ) : (
              <span>Volume: <b className="text-zinc-200">{totalVolumeKg.toLocaleString()} kg</b></span>
            )}
          </span>
          <span className="text-emerald-400 font-bold">{progressPercent}% concluído</span>
        </div>
      </div>

      {/* Lista de Exercícios do Treino Ativo */}
      <div className="flex flex-col gap-3">
        {currentSplit.exercises.map((exercise, exIndex) => {
          const allCompleted =
            exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);
          const firstFrame = exercise.mediaFrames?.[0];

          return (
            <div
              key={exercise.id}
              className={`rounded-2xl p-3.5 border transition-all ${
                allCompleted
                  ? "bg-zinc-900/40 border-emerald-500/30 opacity-80"
                  : "bg-zinc-900/90 border-white/[0.08]"
              }`}
            >
              {/* Topo do Exercício */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Thumbnail com botão de play */}
                  {firstFrame ? (
                    <button
                      onClick={() => handleOpenGifModal(exercise)}
                      className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 group active:scale-95 transition-all"
                      title="Ver demonstração animada"
                    >
                      <img
                        src={firstFrame}
                        alt={exercise.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-md">
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <span className="w-6 h-6 rounded-md bg-white/[0.06] text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {exIndex + 1}
                    </span>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white leading-tight truncate">
                      {exercise.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                      <span className="text-emerald-400 font-medium">{exercise.muscle}</span>
                      <span>•</span>
                      <span className="truncate">{exercise.equipment}</span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas: Ver GIF & Timer */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenGifModal(exercise)}
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                    title="Ver GIF e execução"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>GIF</span>
                  </button>

                  <button
                    onClick={() => onOpenTimer(exercise.restSeconds || 60)}
                    className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-[10px] font-mono flex items-center gap-1 border border-white/[0.06] active:scale-95 transition-all"
                    title="Cronômetro de descanso"
                  >
                    <Timer className="w-3 h-3 text-amber-400" />
                    <span>{exercise.restSeconds || 60}s</span>
                  </button>
                </div>
              </div>

              {/* Dica / Notas técnicas */}
              {exercise.notes && (
                <div
                  onClick={() => handleOpenGifModal(exercise)}
                  className="text-[10px] text-zinc-300 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer p-2 rounded-xl border border-white/[0.04] mb-2.5 leading-relaxed flex items-center justify-between gap-1 transition-colors"
                >
                  <span className="line-clamp-1">💡 {exercise.notes}</span>
                  <span className="text-emerald-400 font-bold text-[9px] shrink-0">Ver técnica →</span>
                </div>
              )}

              {/* Tabela de Séries */}
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-12 text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-2">
                  <span className="col-span-2">Série</span>
                  <span className="col-span-3 text-center">Reps</span>
                  <span className="col-span-5 text-center">
                    {workoutMode === "home" ? "Carga / Tipo" : "Carga (kg)"}
                  </span>
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
                    <span className="col-span-3 text-center font-mono font-medium text-[11px]">
                      {set.reps}
                    </span>

                    {/* Controle de Carga com Botões +/- ou Peso Corporal */}
                    <div className="col-span-5 flex items-center justify-center gap-1.5">
                      {workoutMode === "home" && set.weightKg === 0 ? (
                        <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                          Peso do Corpo
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAdjustWeight(exercise.id, set.setNumber, -2)}
                            className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="font-mono font-bold w-12 text-center text-white text-[11px]">
                            {set.weightKg} kg
                          </span>
                          <button
                            onClick={() => handleAdjustWeight(exercise.id, set.setNumber, 2)}
                            className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </>
                      )}
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

      {/* Modal de GIF & Execução */}
      <ExerciseGifModal
        exercise={selectedExerciseModal}
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
      />
    </div>
  );
}
