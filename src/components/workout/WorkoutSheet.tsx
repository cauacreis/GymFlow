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
  Trash2,
  Search,
  X,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStudentWorkout,
  subscribeToWorkoutChanges,
  StudentWorkoutPackage,
  addExerciseToStudentSplit,
  removeExerciseFromStudentSplit,
} from "@/lib/workout-store";
import {
  getExerciseDetails,
  PREFORMED_ROUTINES,
  ExerciseInWorkout,
  getAllExercises,
  saveCustomExercise,
  ExerciseDBItem,
} from "@/lib/exercisedb";
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
  isCustom?: boolean;
}

export interface WorkoutSplit {
  id: string;
  title: string;
  muscles: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

interface WorkoutSheetProps {
  studentId?: string;
  onOpenTimer: (defaultSeconds?: number) => void;
}

export function WorkoutSheet({ studentId = "student_me", onOpenTimer }: WorkoutSheetProps) {
  const [workoutMode, setWorkoutMode] = useState<"gym" | "home">("gym");
  const [workoutPackage, setWorkoutPackage] = useState<StudentWorkoutPackage>(() =>
    getStudentWorkout(studentId)
  );
  const [selectedSplitId, setSelectedSplitId] = useState<string>("A");
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

  // Modal de Animação GIF / Execução
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<ExerciseModalData | null>(null);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);

  // Modal de Adição de Exercício (Catálogo de Academia e Personalizado)
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"catalog" | "custom">("catalog");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogMuscleFilter, setCatalogMuscleFilter] = useState("todos");

  // Inputs para criação de exercício personalizado pelo aluno
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("Peitoral");
  const [customEquipment, setCustomEquipment] = useState("Halteres");
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState("10-12");
  const [customWeight, setCustomWeight] = useState(15);
  const [customRest, setCustomRest] = useState(60);
  const [customNotes, setCustomNotes] = useState("");

  // Mapeia exercícios enriquecendo com o catálogo
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
        isCustom: ex.isCustom || ex.exerciseId?.startsWith("custom") || false,
        sets: ex.sets.map((set, idx) => ({
          setNumber: set.setNumber || idx + 1,
          reps: set.reps,
          weightKg: set.weightKg,
          completed: set.completed || false,
        })),
      };
    });
  };

  // Remover exercício da ficha do aluno
  const handleRemoveExercise = (exerciseId: string, exerciseName: string) => {
    triggerHaptic("heavy");
    if (confirm(`Deseja remover "${exerciseName}" do Treino ${selectedSplitId}?`)) {
      removeExerciseFromStudentSplit(studentId, selectedSplitId, exerciseId);
    }
  };

  // Adicionar exercício do catálogo oficial ao split
  const handleAddCatalogExercise = (item: ExerciseDBItem) => {
    triggerHaptic("medium");
    const isBodyWeight = item.equipment === "body weight";
    const newEx: ExerciseInWorkout = {
      id: `ex_${Date.now()}`,
      exerciseId: item.id,
      name: item.name,
      muscle: item.target,
      equipment: item.equipment,
      target: "3 séries × 10-12 reps",
      restSeconds: 60,
      notes: item.instructions?.[0] || "Execução com cadência controlada.",
      mediaFrames: item.mediaFrames,
      gifUrl: item.gifUrl,
      instructions: item.instructions,
      tips: item.tips,
      sets: [
        { setNumber: 1, reps: "10-12", weightKg: isBodyWeight ? 0 : 20 },
        { setNumber: 2, reps: "10-12", weightKg: isBodyWeight ? 0 : 20 },
        { setNumber: 3, reps: "10-12", weightKg: isBodyWeight ? 0 : 20 },
      ],
    };

    addExerciseToStudentSplit(studentId, selectedSplitId, newEx);
    setIsAddExerciseModalOpen(false);
  };

  // Criar e adicionar exercício personalizado ao split
  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert("Por favor, digite o nome do exercício!");
      return;
    }
    triggerHaptic("success");

    const createdItem = saveCustomExercise({
      name: customName.trim(),
      bodyPart: customMuscle.toLowerCase().includes("peito") ? "chest" :
                customMuscle.toLowerCase().includes("costa") ? "back" :
                customMuscle.toLowerCase().includes("perna") || customMuscle.toLowerCase().includes("quadr") ? "upper legs" :
                customMuscle.toLowerCase().includes("ombro") ? "shoulders" :
                customMuscle.toLowerCase().includes("bíceps") || customMuscle.toLowerCase().includes("tríceps") || customMuscle.toLowerCase().includes("braço") ? "upper arms" :
                customMuscle.toLowerCase().includes("glúteo") ? "upper legs" :
                customMuscle.toLowerCase().includes("abd") ? "waist" : "upper legs",
      target: customMuscle,
      equipment: customEquipment,
      instructions: [customNotes.trim() || "Execução personalizada individualizada."],
      difficulty: "Intermediário",
    });

    const newEx: ExerciseInWorkout = {
      id: `ex_${Date.now()}`,
      exerciseId: createdItem.id,
      name: createdItem.name,
      muscle: customMuscle,
      equipment: customEquipment,
      target: `${customSets} séries × ${customReps}`,
      restSeconds: customRest,
      notes: customNotes.trim() || undefined,
      isCustom: true,
      sets: Array.from({ length: customSets }).map((_, idx) => ({
        setNumber: idx + 1,
        reps: customReps,
        weightKg: customWeight,
        completed: false,
      })),
    };

    addExerciseToStudentSplit(studentId, selectedSplitId, newEx);
    setIsAddExerciseModalOpen(false);
    setCustomName("");
    setCustomNotes("");
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
      {/* Seletor Segmentado Minimalista: Academia vs Treino em Casa */}
      <div className="grid grid-cols-2 p-1 bg-zinc-900/60 rounded-2xl border border-white/[0.06] shadow-sm backdrop-blur-md">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setWorkoutMode("gym");
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            workoutMode === "gym"
              ? "bg-emerald-500 text-zinc-950 shadow-sm"
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
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            workoutMode === "home"
              ? "bg-teal-400 text-zinc-950 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Treino em Casa</span>
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
                Animações e guia passo a passo para sala ou quarto
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
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400 flex-wrap">
                      <span className="text-emerald-400 font-medium">{exercise.muscle}</span>
                      <span>•</span>
                      <span className="truncate">{exercise.equipment}</span>
                      {exercise.isCustom && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[9px] font-bold">
                          Personalizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas em Pílula Unificada */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] shadow-inner">
                    <button
                      onClick={() => handleOpenGifModal(exercise)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 transition-all active:scale-95"
                      title="Ver demonstração e execução"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Guia</span>
                    </button>

                    <button
                      onClick={() => onOpenTimer(exercise.restSeconds || 60)}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-1 transition-all active:scale-95"
                      title="Cronômetro de descanso"
                    >
                      <Timer className="w-2.5 h-2.5 text-amber-400" />
                      <span>{exercise.restSeconds || 60}s</span>
                    </button>
                  </div>

                  {workoutMode === "gym" && (
                    <button
                      onClick={() => handleRemoveExercise(exercise.id, exercise.name)}
                      className="w-7 h-7 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all active:scale-90"
                      title="Remover exercício da ficha"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dica técnica compacta */}
              {exercise.notes && (
                <div
                  onClick={() => handleOpenGifModal(exercise)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer px-2.5 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] mb-2 leading-relaxed flex items-center justify-between gap-1 transition-colors"
                >
                  <span className="truncate">💡 {exercise.notes}</span>
                  <span className="text-emerald-400 font-medium text-[9px] shrink-0">Técnica →</span>
                </div>
              )}

              {/* Tabela de Séries Minimalista */}
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
                    className={`grid grid-cols-12 items-center px-2 py-1 rounded-xl text-xs transition-all ${
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

                    {/* Controle de Carga com Micro Botões +/- ou Peso Corporal */}
                    <div className="col-span-5 flex items-center justify-center gap-1.5">
                      {workoutMode === "home" && set.weightKg === 0 ? (
                        <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                          Peso do Corpo
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAdjustWeight(exercise.id, set.setNumber, -2)}
                            className="w-4 h-4 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="font-mono font-medium w-12 text-center text-white text-[11px]">
                            {set.weightKg} kg
                          </span>
                          <button
                            onClick={() => handleAdjustWeight(exercise.id, set.setNumber, 2)}
                            className="w-4 h-4 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Plus className="w-2 h-2" />
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
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Botão Adicionar Exercício Minimalista */}
        {workoutMode === "gym" && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsAddExerciseModalOpen(true);
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-dashed border-white/[0.12] hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-1"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Adicionar Exercício ao Treino {currentSplit.id}</span>
          </button>
        )}
      </div>

      {/* Modal de Adicionar Exercício (Catálogo Oficial + Criar Personalizado) */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">
                  Adicionar ao Treino {currentSplit.id}
                </h3>
              </div>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Abas: Catálogo vs Criar Personalizado */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-white/[0.06] my-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setAddModalTab("catalog");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  addModalTab === "catalog"
                    ? "bg-emerald-500 text-zinc-950 shadow font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Banco de Exercícios</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setAddModalTab("custom");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  addModalTab === "custom"
                    ? "bg-emerald-500 text-zinc-950 shadow font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Criar Personalizado</span>
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: BANCO DE EXERCÍCIOS */}
            {addModalTab === "catalog" && (
              <div className="flex flex-col gap-2.5 overflow-hidden flex-1 min-h-0">
                {/* Campo de Busca */}
                <div className="relative shrink-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Buscar no banco (ex: Supino, Puxada, Crossover...)"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Filtro Muscular Rápido */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
                  {[
                    { id: "todos", label: "Todos" },
                    { id: "chest", label: "Peito" },
                    { id: "back", label: "Costas" },
                    { id: "upper legs", label: "Pernas / Glúteos" },
                    { id: "shoulders", label: "Ombros" },
                    { id: "upper arms", label: "Braços" },
                    { id: "waist", label: "Abdômen" },
                    { id: "cardio", label: "Cardio" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setCatalogMuscleFilter(filter.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                        catalogMuscleFilter === filter.id
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Lista de Exercícios Filtrados */}
                <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
                  {getAllExercises()
                    .filter((item) => {
                      if (
                        catalogMuscleFilter !== "todos" &&
                        item.bodyPart?.toLowerCase() !== catalogMuscleFilter.toLowerCase()
                      ) {
                        return false;
                      }
                      if (catalogSearch.trim()) {
                        const term = catalogSearch.toLowerCase().trim();
                        return (
                          item.name.toLowerCase().includes(term) ||
                          item.target.toLowerCase().includes(term) ||
                          item.equipment.toLowerCase().includes(term)
                        );
                      }
                      return true;
                    })
                    .slice(0, 40)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between gap-2 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.mediaFrames?.[0] ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0">
                              <img
                                src={item.mediaFrames[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 text-zinc-400">
                              <Dumbbell className="w-4 h-4" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <span className="text-emerald-400">{item.target}</span>
                              <span>•</span>
                              <span>{item.equipment}</span>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddCatalogExercise(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shrink-0 active:scale-95 transition-all flex items-center gap-1 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: CRIAR PERSONALIZADO */}
            {addModalTab === "custom" && (
              <form onSubmit={handleCreateCustomExercise} className="space-y-3 overflow-y-auto flex-1 pr-1">
                <p className="text-[11px] text-zinc-400">
                  Não encontrou o exercício ou faz uma variação específica? Preencha os dados abaixo:
                </p>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Exercício *</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Tríceps Francês na Polia com Barra W"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Grupo Muscular</label>
                    <select
                      value={customMuscle}
                      onChange={(e) => setCustomMuscle(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="Peitoral">Peitoral</option>
                      <option value="Costas / Dorsal">Costas / Dorsal</option>
                      <option value="Quadríceps">Quadríceps</option>
                      <option value="Posterior de Coxa">Posterior de Coxa</option>
                      <option value="Glúteos">Glúteos</option>
                      <option value="Ombros / Deltoides">Ombros / Deltoides</option>
                      <option value="Bíceps">Bíceps</option>
                      <option value="Tríceps">Tríceps</option>
                      <option value="Panturrilhas">Panturrilhas</option>
                      <option value="Abdômen / Core">Abdômen / Core</option>
                      <option value="Cardio / Aeróbico">Cardio / Aeróbico</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Equipamento</label>
                    <select
                      value={customEquipment}
                      onChange={(e) => setCustomEquipment(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="Halteres">Halteres</option>
                      <option value="Barra Olímpica">Barra Olímpica</option>
                      <option value="Polia / Cabo">Polia / Cabo</option>
                      <option value="Máquina / Articulado">Máquina / Articulado</option>
                      <option value="Smith Machine">Smith Machine</option>
                      <option value="Peso do Corpo">Peso do Corpo</option>
                      <option value="Kettlebell / Acessório">Kettlebell / Acessório</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Séries</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={customSets}
                      onChange={(e) => setCustomSets(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Reps</label>
                    <input
                      type="text"
                      value={customReps}
                      onChange={(e) => setCustomReps(e.target.value)}
                      placeholder="10-12"
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Carga (kg)</label>
                    <input
                      type="number"
                      min={0}
                      value={customWeight}
                      onChange={(e) => setCustomWeight(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Descanso</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={customRest}
                      onChange={(e) => setCustomRest(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Observações / Dica Técnica</label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Ex: Segurar 2s no pico de contração"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExerciseModalOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300 active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20"
                  >
                    Salvar e Inserir
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de GIF & Execução */}
      <ExerciseGifModal
        exercise={selectedExerciseModal}
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
      />
    </div>
  );
}
