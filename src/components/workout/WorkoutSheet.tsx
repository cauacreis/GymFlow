"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  CheckCircle2,
  Circle,
  Timer,
  Flame,
  Award,
  Plus,
  Minus,
  RotateCcw,
  UserCheck,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getStudentWorkout, subscribeToWorkoutChanges, StudentWorkoutPackage } from "@/lib/workout-store";

export interface ExerciseSet {
  setNumber: number;
  reps: number | string;
  weightKg: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  target: string;
  restSeconds?: number;
  notes?: string;
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
  const [workoutPackage, setWorkoutPackage] = useState<StudentWorkoutPackage>(() =>
    getStudentWorkout(studentId)
  );
  const [selectedSplitId, setSelectedSplitId] = useState<string>("A");
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

  // Sincronização reativa com prescrições do professor
  useEffect(() => {
    const loadWorkout = () => {
      const pkg = getStudentWorkout(studentId);
      setWorkoutPackage(pkg);

      // Converte os splits do pacote para o formato interno com estado de checkboxes
      const mappedSplits: WorkoutSplit[] = pkg.splits.map((s) => ({
        id: s.id,
        title: s.title,
        muscles: s.muscles,
        estimatedMinutes: s.estimatedMinutes,
        exercises: s.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          muscle: ex.muscle,
          equipment: ex.equipment,
          target: ex.target,
          restSeconds: ex.restSeconds || 60,
          notes: ex.notes,
          sets: ex.sets.map((set, idx) => ({
            setNumber: set.setNumber || idx + 1,
            reps: set.reps,
            weightKg: set.weightKg,
            completed: set.completed || false,
          })),
        })),
      }));

      setSplits(mappedSplits);
      if (mappedSplits.length > 0 && !mappedSplits.some((s) => s.id === selectedSplitId)) {
        setSelectedSplitId(mappedSplits[0].id);
      }
    };

    loadWorkout();
    const unsubscribe = subscribeToWorkoutChanges(loadWorkout);
    return () => unsubscribe();
  }, [studentId]);

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

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Card do Professor / Prescrição Oficial */}
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

      {/* Header com Seletor de Divisões (A / B / C / D) */}
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

      {/* Status do Treino: Progresso & Volume de Carga */}
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
            Volume: <b className="text-zinc-200">{totalVolumeKg.toLocaleString()} kg</b>
          </span>
          <span className="text-emerald-400 font-bold">{progressPercent}% concluído</span>
        </div>
      </div>

      {/* Lista de Exercícios do Treino Ativo */}
      <div className="flex flex-col gap-3">
        {currentSplit.exercises.map((exercise, exIndex) => {
          const allCompleted =
            exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);

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
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white/[0.06] text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center">
                      {exIndex + 1}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {exercise.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                    <span className="text-emerald-400 font-medium">{exercise.muscle}</span>
                    <span>•</span>
                    <span>{exercise.equipment}</span>
                  </div>
                </div>

                {/* Botão de Timer específico do exercício */}
                <button
                  onClick={() => onOpenTimer(exercise.restSeconds || 60)}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-[10px] font-mono flex items-center gap-1 border border-white/[0.06] shrink-0 active:scale-95 transition-all"
                  title="Cronômetro de descanso"
                >
                  <Timer className="w-3 h-3 text-amber-400" />
                  <span>{exercise.restSeconds || 60}s</span>
                </button>
              </div>

              {/* Notas técnicas do exercício */}
              {exercise.notes && (
                <p className="text-[10px] text-zinc-400 bg-white/[0.02] p-2 rounded-xl border border-white/[0.04] mb-2.5 leading-relaxed">
                  💡 {exercise.notes}
                </p>
              )}

              {/* Tabela de Séries */}
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-12 text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-2">
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
                    <span className="col-span-3 text-center font-mono font-medium text-[11px]">
                      {set.reps}
                    </span>

                    {/* Controle de Carga com Botões +/- */}
                    <div className="col-span-5 flex items-center justify-center gap-1.5">
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
