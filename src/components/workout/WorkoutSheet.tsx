"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  Zap,
  Trash2,
  Search,
  X,
  HelpCircle,
  Edit3,
  Check,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStudentWorkout,
  subscribeToWorkoutChanges,
  StudentWorkoutPackage,
  addExerciseToStudentSplit,
  removeExerciseFromStudentSplit,
  updateStudentSplitExercises,
} from "@/lib/workout-store";
import {
  getExerciseDetails,
  PREFORMED_ROUTINES,
  ExerciseInWorkout,
  getAllExercises,
  saveCustomExercise,
  ExerciseDBItem,
  matchBodyPartCategory,
  normalizeSearchString,
  WorkoutSetType,
  SET_TYPES_METADATA,
} from "@/lib/exercisedb";
import { ExerciseGifModal, ExerciseModalData } from "./ExerciseGifModal";
import { FeatureGateModal } from "@/components/subscription/FeatureGateModal";
import { canAccessFeature } from "@/lib/subscription-features";

export interface ExerciseSet {
  setNumber: number;
  reps: number | string;
  weightKg: number;
  completed: boolean;
  type?: WorkoutSetType;
  rpe?: number;
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
  onOpenPlans?: () => void;
}

export function WorkoutSheet({ studentId = "student_me", onOpenTimer, onOpenPlans }: WorkoutSheetProps) {
  const [workoutPackage, setWorkoutPackage] = useState<StudentWorkoutPackage>(() =>
    getStudentWorkout(studentId)
  );
  const [selectedSplitId, setSelectedSplitId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`gymflow_active_split_${studentId}`);
        if (saved) return saved;
      } catch {}
    }
    return "A";
  });

  const handleSelectSplit = (id: string) => {
    triggerHaptic("selection");
    setSelectedSplitId(id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`gymflow_active_split_${studentId}`, id);
      } catch {}
    }
  };

  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

  // Modal de Animação GIF / Execução
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<ExerciseModalData | null>(null);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Modal de Adição de Exercício (Catálogo de Academia e Personalizado)
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"catalog" | "custom">("catalog");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogMuscleFilter, setCatalogMuscleFilter] = useState("todos");

  // Modal de Seleção de Tipo de Série
  const [setTypeModalData, setSetTypeModalData] = useState<{
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    currentType: WorkoutSetType;
  } | null>(null);

  // Modal de Guia Explicativo dos Tipos de Séries
  const [isTypesGuideOpen, setIsTypesGuideOpen] = useState(false);

  // Inline editing para reps e peso
  const [editingRepsKey, setEditingRepsKey] = useState<string | null>(null);
  const [editingWeightKey, setEditingWeightKey] = useState<string | null>(null);

  // Inputs para criação de exercício personalizado pelo aluno
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("Peitoral");
  const [customEquipment, setCustomEquipment] = useState("Halteres");
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState("10-12");
  const [customWeight, setCustomWeight] = useState(15);
  const [customRest, setCustomRest] = useState(60);
  const [customNotes, setCustomNotes] = useState("");

  // Memoização de busca ultra-rápida do catálogo de exercícios
  const filteredCatalogExercises = useMemo(() => {
    let list = getAllExercises();
    if (catalogMuscleFilter !== "todos") {
      list = list.filter((item) => matchBodyPartCategory(item.bodyPart, catalogMuscleFilter));
    }
    if (catalogSearch.trim()) {
      const normTokens = normalizeSearchString(catalogSearch).split(/\s+/).filter(Boolean);
      if (normTokens.length > 0) {
        list = list
          .map((item) => {
            const normName = normalizeSearchString(item.name);
            const normTarget = normalizeSearchString(item.target);
            const normBody = normalizeSearchString(item.bodyPart);
            const normEq = normalizeSearchString(item.equipment);

            let score = 0;
            let allMatch = true;

            for (const token of normTokens) {
              if (normName.includes(token)) {
                score += normName.startsWith(token) ? 10 : 5;
              } else if (normTarget.includes(token)) {
                score += 3;
              } else if (normBody.includes(token)) {
                score += 2;
              } else if (normEq.includes(token)) {
                score += 1;
              } else {
                allMatch = false;
                break;
              }
            }

            return { item, score, allMatch };
          })
          .filter((res) => res.allMatch)
          .sort((a, b) => b.score - a.score)
          .map((res) => res.item);
      }
    }
    return list.slice(0, 80);
  }, [catalogSearch, catalogMuscleFilter]);

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
          type: set.type || "normal",
          rpe: set.rpe,
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

  // Carrega treino oficial do aluno
  useEffect(() => {
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
      const savedSplit = typeof window !== "undefined" ? localStorage.getItem(`gymflow_active_split_${studentId}`) : null;
      if (savedSplit && mappedSplits.some((s) => s.id === savedSplit)) {
        setSelectedSplitId(savedSplit);
      } else if (mappedSplits.length > 0 && !mappedSplits.some((s) => s.id === selectedSplitId)) {
        const fallback = mappedSplits[0].id;
        setSelectedSplitId(fallback);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`gymflow_active_split_${studentId}`, fallback);
          } catch {}
        }
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

  // Persistência das alterações de séries e repetições
  const persistSplitsChange = (updatedSplits: WorkoutSplit[]) => {
    setSplits(updatedSplits);
    const targetSplit = updatedSplits.find((s) => s.id === selectedSplitId);
    if (targetSplit) {
      const rawExercises: ExerciseInWorkout[] = targetSplit.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId || ex.name,
        name: ex.name,
        muscle: ex.muscle,
        equipment: ex.equipment,
        target: ex.target,
        restSeconds: ex.restSeconds || 60,
        notes: ex.notes,
        gifUrl: ex.gifUrl,
        mediaFrames: ex.mediaFrames,
        instructions: ex.instructions,
        tips: ex.tips,
        isCustom: ex.isCustom,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
          completed: s.completed,
          type: s.type || "normal",
          rpe: s.rpe,
        })),
      }));
      updateStudentSplitExercises(studentId, selectedSplitId, rawExercises);
    }
  };

  // Toggle de conclusão de série
  const handleToggleSet = (exerciseId: string, setNumber: number) => {
    triggerHaptic("medium");
    const updated = splits.map((split) => {
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
    });
    persistSplitsChange(updated);
  };

  // Ajuste de carga (+/- delta kg)
  const handleAdjustWeight = (exerciseId: string, setNumber: number, delta: number) => {
    triggerHaptic("light");
    const updated = splits.map((split) => {
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
    });
    persistSplitsChange(updated);
  };

  // Definição direta de carga
  const handleSetWeight = (exerciseId: string, setNumber: number, weightKg: number) => {
    triggerHaptic("selection");
    const updated = splits.map((split) => {
      if (split.id !== selectedSplitId) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              return { ...s, weightKg: Math.max(0, Math.round(weightKg * 10) / 10) };
            }),
          };
        }),
      };
    });
    persistSplitsChange(updated);
  };

  // Ajuste de repetições (+/- 1)
  const handleAdjustReps = (exerciseId: string, setNumber: number, delta: number) => {
    triggerHaptic("light");
    const updated = splits.map((split) => {
      if (split.id !== selectedSplitId) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              let currentVal = 10;
              if (typeof s.reps === "number") {
                currentVal = s.reps;
              } else if (typeof s.reps === "string") {
                const match = s.reps.match(/\d+/);
                if (match) currentVal = parseInt(match[0], 10);
              }
              const nextVal = Math.max(1, currentVal + delta);
              return { ...s, reps: nextVal };
            }),
          };
        }),
      };
    });
    persistSplitsChange(updated);
  };

  // Definição direta de repetições
  const handleSetReps = (exerciseId: string, setNumber: number, rawVal: string | number) => {
    triggerHaptic("selection");
    const updated = splits.map((split) => {
      if (split.id !== selectedSplitId) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              let finalReps: string | number = rawVal;
              if (typeof rawVal === "string") {
                const trimmed = rawVal.trim();
                const asNum = Number(trimmed);
                if (!isNaN(asNum) && trimmed !== "") {
                  finalReps = Math.max(1, asNum);
                } else if (trimmed) {
                  finalReps = trimmed;
                } else {
                  finalReps = 10;
                }
              }
              return { ...s, reps: finalReps };
            }),
          };
        }),
      };
    });
    persistSplitsChange(updated);
  };

  // Alteração do tipo de série
  const handleSelectSetType = (newType: WorkoutSetType) => {
    if (!setTypeModalData) return;
    const { exerciseId, setNumber } = setTypeModalData;
    triggerHaptic("selection");

    const updated = splits.map((split) => {
      if (split.id !== selectedSplitId) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              return { ...s, type: newType };
            }),
          };
        }),
      };
    });
    persistSplitsChange(updated);
    setSetTypeModalData(null);
  };

  // Adicionar nova série ao exercício
  const handleAddSet = (exerciseId: string) => {
    triggerHaptic("success");
    const updated = splits.map((split) => {
      if (split.id !== selectedSplitId) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: ExerciseSet = {
            setNumber: ex.sets.length + 1,
            reps: lastSet ? lastSet.reps : 10,
            weightKg: lastSet ? lastSet.weightKg : 20,
            completed: false,
            type: "normal",
          };
          return {
            ...ex,
            sets: [...ex.sets, newSet],
          };
        }),
      };
    });
    persistSplitsChange(updated);
  };

  // Remover série do exercício
  const handleRemoveSet = (exerciseId: string, setNumber: number) => {
    triggerHaptic("heavy");
    const updated = splits.map((split) => {
      if (split.id !== selectedSplitId) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          if (ex.sets.length <= 1) return ex; // Mantém no mínimo 1 série
          const filtered = ex.sets.filter((s) => s.setNumber !== setNumber);
          const reindexed = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          return {
            ...ex,
            sets: reindexed,
          };
        }),
      };
    });
    persistSplitsChange(updated);
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

  // Abrir modal de GIF (com gating por assinatura)
  const handleOpenGifModal = (exercise: Exercise) => {
    triggerHaptic("selection");
    const access = canAccessFeature("advanced_workout");
    if (!access.allowed) {
      triggerHaptic("warning");
      setIsGateOpen(true);
      return;
    }

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
      {/* Card do Professor / Prescrição Oficial ou Treino Adaptado */}
      <div className="rounded-2xl p-3.5 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              {workoutPackage.prescribedBy ? <UserCheck className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                {workoutPackage.prescribedBy ? (
                  <>
                    <ShieldCheck className="w-3 h-3" /> Prescrição Profissional
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> Ficha de Treino Adaptada
                  </>
                )}
              </span>
              <h3 className="text-xs font-black text-white">{workoutPackage.routineTitle}</h3>
              <p className="text-[10px] text-zinc-400">
                {workoutPackage.prescribedBy
                  ? `${workoutPackage.prescribedBy} • ${workoutPackage.prescribedAt}`
                  : "Exercícios essenciais configurados para o seu objetivo"}
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

      {/* Header com Seletor de Divisões (A / B / C) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {splits.map((split) => {
            const isSelected = split.id === selectedSplitId;
            return (
              <button
                key={split.id}
                onClick={() => handleSelectSplit(split.id)}
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
            <span>Volume: <b className="text-zinc-200">{totalVolumeKg.toLocaleString()} kg</b></span>
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

                  <button
                    onClick={() => handleRemoveExercise(exercise.id, exercise.name)}
                    className="w-7 h-7 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all active:scale-90"
                    title="Remover exercício da ficha"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
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

              {/* Tabela de Séries */}
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-12 text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-2 pb-1 border-b border-white/[0.04]">
                  <span className="col-span-3">Série / Tipo</span>
                  <span className="col-span-3 text-center">Reps</span>
                  <span className="col-span-4 text-center">Carga (kg)</span>
                  <span className="col-span-2 text-right">Feito</span>
                </div>

                {exercise.sets.map((set) => {
                  const setType = set.type || "normal";
                  const meta = SET_TYPES_METADATA[setType] || SET_TYPES_METADATA.normal;
                  const repsKey = `${exercise.id}_${set.setNumber}`;
                  const weightKey = `${exercise.id}_${set.setNumber}`;
                  const isEditingReps = editingRepsKey === repsKey;
                  const isEditingWeight = editingWeightKey === weightKey;

                  return (
                    <div
                      key={set.setNumber}
                      className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-xl text-xs gap-1 transition-all ${
                        set.completed
                          ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-200"
                          : "bg-white/[0.02] hover:bg-white/[0.04] text-zinc-300"
                      }`}
                    >
                      {/* Coluna 1: Tipo / Número da Série */}
                      <div className="col-span-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("selection");
                            setSetTypeModalData({
                              exerciseId: exercise.id,
                              exerciseName: exercise.name,
                              setNumber: set.setNumber,
                              currentType: setType,
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all ${meta.badgeClass}`}
                          title={`Tipo: ${meta.label}. Toque para alterar.`}
                        >
                          <span className="font-mono">#{set.setNumber}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-black/25 font-black">
                            {meta.shortLabel}
                          </span>
                        </button>
                      </div>

                      {/* Coluna 2: Repetições com Stepper e Edição Direta */}
                      <div className="col-span-3 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustReps(exercise.id, set.setNumber, -1)}
                          className="w-4 h-4 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all shrink-0"
                          title="-1 rep"
                        >
                          <Minus className="w-2 h-2" />
                        </button>

                        {isEditingReps ? (
                          <input
                            type="text"
                            autoFocus
                            defaultValue={String(set.reps)}
                            onBlur={(e) => {
                              handleSetReps(exercise.id, set.setNumber, e.target.value.trim() || 10);
                              setEditingRepsKey(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSetReps(
                                  exercise.id,
                                  set.setNumber,
                                  (e.target as HTMLInputElement).value.trim() || 10
                                );
                                setEditingRepsKey(null);
                              }
                            }}
                            className="w-10 bg-zinc-950 border border-emerald-500 rounded px-1 py-0.5 text-center font-mono text-[11px] text-white focus:outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingRepsKey(repsKey)}
                            className="font-mono font-medium text-center text-white text-[11px] cursor-pointer hover:underline hover:text-emerald-300 min-w-[24px]"
                            title="Toque para digitar as repetições"
                          >
                            {set.reps}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAdjustReps(exercise.id, set.setNumber, 1)}
                          className="w-4 h-4 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all shrink-0"
                          title="+1 rep"
                        >
                          <Plus className="w-2 h-2" />
                        </button>
                      </div>

                      {/* Coluna 3: Carga (kg) com Stepper e Edição Direta */}
                      <div className="col-span-4 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(exercise.id, set.setNumber, -2)}
                          className="w-4 h-4 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all shrink-0"
                          title="-2 kg"
                        >
                          <Minus className="w-2 h-2" />
                        </button>

                        {isEditingWeight ? (
                          <input
                            type="number"
                            step="0.5"
                            autoFocus
                            defaultValue={set.weightKg}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              handleSetWeight(exercise.id, set.setNumber, isNaN(val) ? 0 : val);
                              setEditingWeightKey(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                handleSetWeight(exercise.id, set.setNumber, isNaN(val) ? 0 : val);
                                setEditingWeightKey(null);
                              }
                            }}
                            className="w-12 bg-zinc-950 border border-emerald-500 rounded px-1 py-0.5 text-center font-mono text-[11px] text-white focus:outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingWeightKey(weightKey)}
                            className="font-mono font-medium text-center text-white text-[11px] cursor-pointer hover:underline hover:text-emerald-300 min-w-[36px]"
                            title="Toque para digitar a carga"
                          >
                            {set.weightKg} kg
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(exercise.id, set.setNumber, 2)}
                          className="w-4 h-4 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all shrink-0"
                          title="+2 kg"
                        >
                          <Plus className="w-2 h-2" />
                        </button>
                      </div>

                      {/* Coluna 4: Feito + Remover Série */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSet(exercise.id, set.setNumber)}
                          className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                          title={set.completed ? "Desmarcar" : "Marcar como concluída"}
                        >
                          {set.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                          )}
                        </button>

                        {exercise.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exercise.id, set.setNumber)}
                            className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                            title="Remover série"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Ações Inferiores do Exercício: Adicionar Série e Guia */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exercise.id)}
                    className="py-1 px-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/30 text-[10px] font-bold text-zinc-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Adicionar Série</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setIsTypesGuideOpen(true);
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors px-1"
                  >
                    <HelpCircle className="w-3 h-3 text-zinc-500" />
                    <span>Tipos de série</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Botão Adicionar Exercício Minimalista */}
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
                    maxLength={80}
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
                    { id: "legs", label: "Pernas / Glúteos" },
                    { id: "shoulders", label: "Ombros" },
                    { id: "arms", label: "Braços" },
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
                  {filteredCatalogExercises.map((item) => (
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
                    maxLength={70}
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
                      max={12}
                      value={customSets}
                      onChange={(e) => setCustomSets(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Reps</label>
                    <input
                      type="text"
                      maxLength={20}
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
                      max={500}
                      value={customWeight}
                      onChange={(e) => setCustomWeight(Math.min(500, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Descanso</label>
                    <input
                      type="number"
                      min={15}
                      max={600}
                      step={15}
                      value={customRest}
                      onChange={(e) => setCustomRest(Math.min(600, Math.max(15, Number(e.target.value) || 15)))}
                      className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Observações / Dica Técnica</label>
                  <input
                    type="text"
                    maxLength={150}
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

      {/* Portão de Funcionalidade: Fichas com GIFs e Biomecânica Pro */}
      <FeatureGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        feature="advanced_workout"
        requiredPlan="pro"
        onOpenPlans={() => {
          setIsGateOpen(false);
          if (onOpenPlans) onOpenPlans();
        }}
      />

      {/* Modal de Seleção do Tipo de Série */}
      {setTypeModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Tipo da Série #{setTypeModalData.setNumber}</span>
                </h3>
                <p className="text-[10px] text-zinc-400 truncate max-w-[280px]">
                  {setTypeModalData.exerciseName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSetTypeModalData(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 my-2.5">
              Escolha a técnica ou objetivo desta série:
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 py-1">
              {(
                [
                  "normal",
                  "warmup",
                  "feeder",
                  "top",
                  "backoff",
                  "drop",
                  "rest_pause",
                  "failure",
                ] as WorkoutSetType[]
              ).map((typeKey) => {
                const meta = SET_TYPES_METADATA[typeKey];
                const isCurrent = setTypeModalData.currentType === typeKey;

                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => handleSelectSetType(typeKey)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 active:scale-[0.99] ${
                      isCurrent
                        ? "bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
                        : "bg-zinc-950 border-white/[0.06] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                        >
                          {meta.shortLabel} • {meta.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            (Atual)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {meta.description}
                      </p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent
                          ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                          : "border-white/20"
                      }`}
                    >
                      {isCurrent && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/[0.08] mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSetTypeModalData(null)}
                className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Guia Explicativo dos Tipos de Séries */}
      {isTypesGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Metodologia de Séries GymFlow</h3>
                  <p className="text-[10px] text-zinc-400">Guia de técnicas para hipertrofia e força</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTypesGuideOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 py-3 space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/30 inline-block">
                  W • Aquecimento (Warm-up)
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  1 a 2 séries com 40-50% da carga da série de trabalho. Prepara as articulações, aquece o músculo e ativa o sistema nervoso central sem gerar fadiga. Não conta para o volume hipertrófico total.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-sky-500/15 text-sky-400 border-sky-500/30 inline-block">
                  F • Preparatória (Feeder Set)
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  2 a 3 repetições com ~70-80% do peso da Top Set. Prepara a mente e a pegada para sentir a carga sem queimar energia e sem acumular ácido lático.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-amber-500/25 text-amber-300 border-amber-400/40 inline-block">
                  T • Top Set (Principal)
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  A série mais pesada do treino naquele exercício (geralmente entre 6 a 9 reps com alta intensidade e 1 rep na reserva). É o momento de aplicar sobrecarga progressiva e bater recordes de carga.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-indigo-500/15 text-indigo-400 border-indigo-500/30 inline-block">
                  B • Back-off Set
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Reduz 10% a 20% do peso da Top Set e executa entre 10 a 12 repetições com cadência controlada. Garante volume limpo e estímulo mecânico com menos risco de lesão.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-rose-500/20 text-rose-300 border-rose-500/35 inline-block">
                  D • Drop Set
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Execute até a falha muscular concêntrica. Sem descanso, reduza o peso em 20-30% imediatamente e continue até uma nova falha. Excelente como finalizador metabólico.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/35 inline-block">
                  R • Rest-Pause
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Chegue à falha com carga moderada/alta, descanse apenas 10 a 15 segundos respirando fundo e faça mais 3 a 5 reps com a mesma carga. Máximo recrutamento de unidades motoras.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-red-500/25 text-red-300 border-red-500/40 inline-block">
                  ⚡ • Até a Falha (AMRAP)
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  "As Many Reps As Possible". Realize o maior número de repetições completas possíveis com boa técnica até a falha mecânica momentânea (RPE 10 / RIR 0).
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] mt-2">
              <button
                type="button"
                onClick={() => setIsTypesGuideOpen(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20"
              >
                Entendi, voltar ao treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
