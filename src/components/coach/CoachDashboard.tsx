"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Calendar,
  Plus,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Search,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Trash2,
  Clock,
  Send,
  Zap,
  Flame,
  Layers,
  ArrowRight,
  Play,
  BarChart3,
  Users,
  X,
  Edit3,
  BookmarkCheck,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  LOCAL_EXERCISE_DB,
  PREFORMED_ROUTINES,
  searchExercises,
  saveCustomExercise,
  getAllExercises,
  ExerciseDBItem,
  WorkoutSplitTemplate,
  ExerciseInWorkout,
  PreFormedWorkoutRoutine,
} from "@/lib/exercisedb";
import {
  getStoredStudents,
  saveNewStudent,
  assignWorkoutToStudent,
  StudentProfile,
  getStudentWorkout,
} from "@/lib/workout-store";
import { getCurrentUser, subscribeToAuthChanges, UserProfile } from "@/lib/auth-store";
import {
  getStoredCoachRoutines,
  saveCoachRoutine,
  deleteCoachRoutine,
  subscribeToCoachRoutines,
  CoachWorkoutRoutine,
} from "@/lib/coach-routines-store";

import { CoachAgendaManager } from "./CoachAgendaManager";
import { CoachStudentsManager } from "./CoachStudentsManager";
import { ExerciseGifModal, ExerciseModalData } from "../workout/ExerciseGifModal";
import { CoachAnalyticsDashboard } from "../analytics/CoachAnalyticsDashboard";
import { PrescribeWorkoutModal } from "./PrescribeWorkoutModal";
import { GymTabType } from "../layout/BottomTabBar";

interface CoachDashboardProps {
  onSwitchToStudentView?: () => void;
  defaultTab?: "students" | "agenda" | "workouts" | "analytics";
  currentTab?: GymTabType;
  onSelectTab?: (tab: GymTabType) => void;
}

export function CoachDashboard({
  onSwitchToStudentView,
  defaultTab = "students",
  currentTab,
  onSelectTab,
}: CoachDashboardProps) {
  const [internalTab, setInternalTab] = useState<"students" | "agenda" | "workouts" | "analytics">(defaultTab);
  
  const effectiveTab: "students" | "agenda" | "workouts" | "analytics" = currentTab
    ? currentTab === "agenda"
      ? "agenda"
      : currentTab === "fichas"
      ? "workouts"
      : currentTab === "analytics" || currentTab === "evolucao"
      ? "analytics"
      : "students"
    : internalTab;

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("student_carlos");

  // Biblioteca de Fichas do Treinador & Filtros
  const [coachRoutines, setCoachRoutines] = useState<CoachWorkoutRoutine[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<"all" | "custom" | "system">("all");
  const [workoutSectionMode, setWorkoutSectionMode] = useState<"library" | "builder">("library");

  // Prescrição de Ficha para Aluno
  const [prescribeTargetRoutine, setPrescribeTargetRoutine] = useState<CoachWorkoutRoutine | null>(null);
  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);

  // Construtor de Ficha Personalizada com X Dias
  const [builderRoutineId, setBuilderRoutineId] = useState<string | null>(null);
  const [builderRoutineName, setBuilderRoutineName] = useState("Hipertrofia ABCD (4 Dias)");
  const [builderCategory, setBuilderCategory] = useState("Hipertrofia");
  const [builderDifficulty, setBuilderDifficulty] = useState<"Iniciante" | "Intermediário" | "Avançado">("Intermediário");
  const [builderFrequency, setBuilderFrequency] = useState("4 dias na semana");
  const [builderDescription, setBuilderDescription] = useState("Divisão estruturada para hipertrofia e progressão de carga.");

  // Modal Novo Aluno
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentGoal, setNewStudentGoal] = useState<StudentProfile["goal"]>("Hipertrofia");

  // Divisão ativa sendo editada no construtor
  const [activeSplitId, setActiveSplitId] = useState<string>("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("todos");
  const [searchResults, setSearchResults] = useState<ExerciseDBItem[]>([]);

  // Modal para Criar Exercício Personalizado pelo Professor
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [customExName, setCustomExName] = useState("");
  const [customExMuscle, setCustomExMuscle] = useState("Peitoral");
  const [customExEquipment, setCustomExEquipment] = useState("Halteres");
  const [customExSets, setCustomExSets] = useState(3);
  const [customExReps, setCustomExReps] = useState("10-12");
  const [customExWeight, setCustomExWeight] = useState(20);
  const [customExNotes, setCustomExNotes] = useState("");

  // Preview de Animação / GIF de Exercício
  const [previewExerciseModal, setPreviewExerciseModal] = useState<ExerciseModalData | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Splits customizados sendo construídos (X Dias dinâmicos)
  const [customSplits, setCustomSplits] = useState<WorkoutSplitTemplate[]>([
    {
      id: "A",
      title: "Treino A — Superior / Empurrar",
      muscles: "Peito, Ombros e Tríceps",
      estimatedMinutes: 50,
      exercises: [],
    },
    {
      id: "B",
      title: "Treino B — Superior / Puxar",
      muscles: "Dorsais, Trapézio e Bíceps",
      estimatedMinutes: 50,
      exercises: [],
    },
    {
      id: "C",
      title: "Treino C — Inferiores / Pernas",
      muscles: "Quadríceps, Glúteos e Panturrilhas",
      estimatedMinutes: 55,
      exercises: [],
    },
    {
      id: "D",
      title: "Treino D — Foco Ombros & Abdômen",
      muscles: "Deltoides, Trapézio e Core",
      estimatedMinutes: 45,
      exercises: [],
    },
  ]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [coachUser, setCoachUser] = useState<UserProfile>(getCurrentUser());

  // Carrega alunos, perfil do treinador e rotinas salvas
  useEffect(() => {
    setStudents(getStoredStudents());
    setCoachUser(getCurrentUser());
    setCoachRoutines(getStoredCoachRoutines());

    const unsubscribeAuth = subscribeToAuthChanges((u) => setCoachUser(u));
    const unsubscribeRoutines = subscribeToCoachRoutines(() => {
      setCoachRoutines(getStoredCoachRoutines());
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRoutines();
    };
  }, []);

  // Atualiza busca ExerciseDB
  useEffect(() => {
    const runSearch = async () => {
      const res = await searchExercises(searchQuery, {
        bodyPart: selectedBodyPart !== "todos" ? selectedBodyPart : undefined,
      });
      setSearchResults(res);
    };
    runSearch();
  }, [searchQuery, selectedBodyPart]);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    triggerHaptic("success");
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Adicionar nova divisão (Dia) dinamicamente à ficha
  const handleAddSplit = () => {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const nextIdx = customSplits.length;
    const nextLetter = letters[nextIdx] || `D${nextIdx + 1}`;
    const newSplit: WorkoutSplitTemplate = {
      id: nextLetter,
      title: `Treino ${nextLetter} — Divisão ${nextIdx + 1}`,
      muscles: "Grupos musculares específicos",
      estimatedMinutes: 50,
      exercises: [],
    };
    const updated = [...customSplits, newSplit];
    setCustomSplits(updated);
    setActiveSplitId(nextLetter);
    setBuilderFrequency(`${updated.length} dias na semana`);
    triggerHaptic("selection");
    showNotification(`Divisão ${nextLetter} adicionada à ficha!`);
  };

  // Remover divisão (Dia) da ficha
  const handleRemoveSplit = (splitId: string) => {
    if (customSplits.length <= 1) {
      alert("A ficha precisa ter pelo menos 1 divisão/dia de treino!");
      return;
    }
    const updated = customSplits.filter((s) => s.id !== splitId);
    setCustomSplits(updated);
    if (activeSplitId === splitId) {
      setActiveSplitId(updated[0].id);
    }
    setBuilderFrequency(`${updated.length} dias na semana`);
    triggerHaptic("light");
    showNotification(`Divisão ${splitId} removida.`);
  };

  // Iniciar criação de nova ficha limpa
  const handleStartNewRoutine = () => {
    triggerHaptic("selection");
    setBuilderRoutineId(null);
    setBuilderRoutineName("Nova Ficha Personalizada");
    setBuilderCategory("Hipertrofia");
    setBuilderDifficulty("Intermediário");
    setBuilderFrequency("4 dias na semana");
    setBuilderDescription("Protocolo estruturado para evolução progressiva.");
    setCustomSplits([
      { id: "A", title: "Treino A — Superior / Empurrar", muscles: "Peito, Ombros e Tríceps", estimatedMinutes: 50, exercises: [] },
      { id: "B", title: "Treino B — Superior / Puxar", muscles: "Dorsais, Trapézio e Bíceps", estimatedMinutes: 50, exercises: [] },
      { id: "C", title: "Treino C — Inferiores / Pernas", muscles: "Quadríceps e Glúteos", estimatedMinutes: 55, exercises: [] },
      { id: "D", title: "Treino D — Foco Específico", muscles: "Deltoides e Core", estimatedMinutes: 45, exercises: [] },
    ]);
    setActiveSplitId("A");
    setWorkoutSectionMode("builder");
  };

  // Carregar ficha existente para edição no construtor
  const handleEditExistingRoutine = (routine: CoachWorkoutRoutine) => {
    triggerHaptic("selection");
    setBuilderRoutineId(routine.id);
    setBuilderRoutineName(routine.name);
    setBuilderCategory(routine.category);
    setBuilderDifficulty(routine.difficulty);
    setBuilderFrequency(routine.frequency);
    setBuilderDescription(routine.description);
    setCustomSplits(routine.splits);
    setActiveSplitId(routine.splits[0]?.id || "A");
    setWorkoutSectionMode("builder");
    showNotification(`Editando ficha "${routine.name}".`);
  };

  // Salvar Ficha na Biblioteca Pessoal
  const handleSaveRoutineToLibrary = (andPrescribe = false) => {
    if (!builderRoutineName.trim()) {
      alert("Por favor, dê um nome para sua ficha!");
      return;
    }
    const totalExercises = customSplits.reduce((acc, s) => acc + s.exercises.length, 0);
    if (totalExercises === 0) {
      alert("Adicione pelo menos 1 exercício à ficha antes de salvar!");
      return;
    }

    const routineToSave: CoachWorkoutRoutine = {
      id: builderRoutineId || `routine_coach_${Date.now()}`,
      name: builderRoutineName.trim(),
      category: builderCategory,
      difficulty: builderDifficulty,
      frequency: builderFrequency,
      description: builderDescription.trim() || `Ficha personalizada com ${customSplits.length} divisões.`,
      splits: customSplits,
      isCustom: true,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      coachName: coachUser.name || "Prof. Rodrigo Costa",
    };

    saveCoachRoutine(routineToSave);
    setCoachRoutines(getStoredCoachRoutines());
    triggerHaptic("success");
    showNotification(`Ficha "${routineToSave.name}" salva com sucesso na sua biblioteca!`);

    if (andPrescribe) {
      setPrescribeTargetRoutine(routineToSave);
      setIsPrescribeModalOpen(true);
    } else {
      setWorkoutSectionMode("library");
    }
  };

  // Excluir ficha da biblioteca
  const handleDeleteRoutine = (routineId: string, routineName: string) => {
    if (confirm(`Deseja realmente excluir a ficha "${routineName}" da sua biblioteca?`)) {
      deleteCoachRoutine(routineId);
      setCoachRoutines(getStoredCoachRoutines());
      triggerHaptic("warning");
      showNotification(`Ficha "${routineName}" removida.`);
    }
  };

  // Abrir modal de prescrição para qualquer rotina
  const handleOpenPrescribeModal = (routine: CoachWorkoutRoutine) => {
    triggerHaptic("selection");
    setPrescribeTargetRoutine(routine);
    setIsPrescribeModalOpen(true);
  };

  // Adicionar exercício ao split customizado
  const handleAddExerciseToSplit = (ex: ExerciseDBItem) => {
    triggerHaptic("medium");
    const newExercise: ExerciseInWorkout = {
      id: `ex_${Date.now()}`,
      exerciseId: ex.id,
      name: ex.name,
      muscle: ex.target,
      equipment: ex.equipment,
      target: "4 séries × 10-12 reps",
      restSeconds: 60,
      notes: ex.instructions[0] || "Execução com cadência controlada.",
      sets: [
        { setNumber: 1, reps: 12, weightKg: 20 },
        { setNumber: 2, reps: 10, weightKg: 25 },
        { setNumber: 3, reps: 10, weightKg: 25 },
        { setNumber: 4, reps: 10, weightKg: 30 },
      ],
    };

    setCustomSplits((prev) =>
      prev.map((split) => {
        if (split.id === activeSplitId) {
          return {
            ...split,
            exercises: [...split.exercises, newExercise],
          };
        }
        return split;
      })
    );
  };

  // Remover exercício do split
  const handleRemoveExercise = (splitId: string, exId: string) => {
    triggerHaptic("light");
    setCustomSplits((prev) =>
      prev.map((split) => {
        if (split.id === splitId) {
          return {
            ...split,
            exercises: split.exercises.filter((e) => e.id !== exId),
          };
        }
        return split;
      })
    );
  };

  // Salvar Ficha Customizada para o Aluno
  const handleSaveCustomWorkout = () => {
    if (!currentStudent) return;
    const totalExercises = customSplits.reduce((acc, s) => acc + s.exercises.length, 0);
    if (totalExercises === 0) {
      alert("Adicione pelo menos 1 exercício à ficha antes de prescrever!");
      return;
    }

    assignWorkoutToStudent(currentStudent.id, {
      routineTitle: builderRoutineName.trim() || `Ficha Personalizada (${customSplits.length} Divisões)`,
      coachNotes: builderDescription.trim() || `Treino individualizado montado para ${currentStudent.name}.`,
      splits: customSplits,
      prescribedBy: coachUser.name ? `Prof. ${coachUser.name}` : "Prof. Rodrigo Costa (CREF 08412-SP)",
    });

    setStudents(getStoredStudents());
    showNotification(`Ficha personalizada prescrita para ${currentStudent.name}!`);
  };

  // Cadastrar Novo Aluno
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;

    const created = saveNewStudent({
      name: newStudentName.trim(),
      email: newStudentEmail.trim(),
      goal: newStudentGoal,
    });

    setStudents(getStoredStudents());
    setSelectedStudentId(created.id);
    setIsNewStudentModalOpen(false);
    setNewStudentName("");
    setNewStudentEmail("");
    showNotification(`Aluno ${created.name} (${created.matricula}) cadastrado com sucesso!`);
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full max-w-md md:max-w-5xl lg:max-w-7xl mx-auto pb-10 transition-all duration-200">
      {/* Toast de Notificação */}
      {notificationMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-3.5 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="leading-snug">{notificationMsg}</span>
        </div>
      )}

      {/* ABA PRINCIPAL 0: CARTEIRA DE ALUNOS & CRM (ONLINE E OFFLINE) */}
      {effectiveTab === "students" && (
        <CoachStudentsManager
          onPrescribeWorkoutForStudent={(id) => {
            setSelectedStudentId(id);
            if (onSelectTab) {
              onSelectTab("fichas");
            } else {
              setInternalTab("workouts");
            }
          }}
        />
      )}

      {/* ABA PRINCIPAL 1: AGENDA & GESTÃO DE HORÁRIOS / ALUNOS PRESENCIAIS */}
      {effectiveTab === "agenda" && <CoachAgendaManager coachId="coach_rodrigo" />}

      {/* ABA PRINCIPAL 2: ANALYTICS & DASHBOARD DE MÉTRICAS */}
      {effectiveTab === "analytics" && <CoachAnalyticsDashboard />}

      {/* ABA PRINCIPAL 3: BIBLIOTECA DE FICHAS & CONSTRUTOR PERSONALIZADO (X DIAS) */}
      {effectiveTab === "workouts" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          {/* Card do Aluno Ativo / Seletor Rápido */}
          <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-1">
                  Aluno em Destaque na Carteira:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    triggerHaptic("light");
                    setSelectedStudentId(e.target.value);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id} className="bg-zinc-950 text-white">
                      {st.name} — {st.matricula} ({st.goal})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setIsNewStudentModalOpen(true);
                }}
                className="mt-3.5 p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 active:scale-95 transition-all"
                title="Cadastrar Novo Aluno"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {currentStudent && (
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Ficha Ativa no App do Aluno:</span>
                  <span className="font-bold text-emerald-400 truncate max-w-[180px]">
                    {currentStudent.currentRoutineTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 text-[10px]">
                  <span>Última emissão: {currentStudent.prescribedAt}</span>
                  <span>Objetivo: {currentStudent.goal}</span>
                </div>
              </div>
            )}
          </div>

          {/* Alternador Principal: Biblioteca de Fichas vs Construtor Personalizado */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-white/[0.08]">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setWorkoutSectionMode("library");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                workoutSectionMode === "library"
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Biblioteca ({coachRoutines.length + PREFORMED_ROUTINES.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                handleStartNewRoutine();
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                workoutSectionMode === "builder"
                  ? "bg-emerald-500 text-zinc-950 shadow-md font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Criar Ficha ({customSplits.length} Dias)</span>
            </button>
          </div>

          {/* ============================================================= */}
          {/* MODO 1: BIBLIOTECA DE FICHAS (CRIADAS PELO TREINADOR + SISTEMA) */}
          {/* ============================================================= */}
          {workoutSectionMode === "library" && (
            <div className="flex flex-col gap-3">
              {/* Barra de Filtros da Biblioteca */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setLibraryFilter("all");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      libraryFilter === "all"
                        ? "bg-white text-zinc-950 shadow-sm"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white"
                    }`}
                  >
                    Todas ({coachRoutines.length + PREFORMED_ROUTINES.length})
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setLibraryFilter("custom");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                      libraryFilter === "custom"
                        ? "bg-emerald-500 text-zinc-950 font-black shadow-sm"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Criadas por Você ({coachRoutines.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setLibraryFilter("system");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      libraryFilter === "system"
                        ? "bg-white text-zinc-950 shadow-sm"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white"
                    }`}
                  >
                    Padrão do Sistema ({PREFORMED_ROUTINES.length})
                  </button>
                </div>

                <button
                  onClick={handleStartNewRoutine}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black shrink-0 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nova Ficha</span>
                </button>
              </div>

              {/* Lista de Fichas Disponíveis */}
              <div className="flex flex-col gap-3">
                {(() => {
                  const routinesToShow =
                    libraryFilter === "custom"
                      ? coachRoutines
                      : libraryFilter === "system"
                      ? PREFORMED_ROUTINES
                      : [...coachRoutines, ...PREFORMED_ROUTINES];

                  if (routinesToShow.length === 0) {
                    return (
                      <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/[0.06] text-center flex flex-col items-center gap-2">
                        <Dumbbell className="w-8 h-8 text-zinc-600 mb-1" />
                        <h4 className="text-sm font-bold text-white">Nenhuma ficha salva nesta categoria</h4>
                        <p className="text-xs text-zinc-400 max-w-xs">
                          Crie uma ficha personalizada com o número de dias desejado e salve na sua biblioteca para reutilizar sempre que quiser.
                        </p>
                        <button
                          onClick={handleStartNewRoutine}
                          className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Criar Minha Primeira Ficha</span>
                        </button>
                      </div>
                    );
                  }

                  return routinesToShow.map((routine) => {
                    const totalEx = routine.splits.reduce((acc, s) => acc + s.exercises.length, 0);

                    return (
                      <div
                        key={routine.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          routine.isCustom
                            ? "bg-zinc-900/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/5"
                            : "bg-zinc-900/50 border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {routine.isCustom ? (
                                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Criada por Você</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                  Modelo do Sistema
                                </span>
                              )}
                              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                {routine.category}
                              </span>
                              <span className="text-[10px] text-zinc-400">{routine.difficulty}</span>
                              {routine.createdAt && (
                                <span className="text-[10px] text-zinc-500">Salva em {routine.createdAt}</span>
                              )}
                            </div>

                            <h3 className="text-sm font-black text-white mt-1.5">{routine.name}</h3>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{routine.description}</p>
                          </div>
                        </div>

                        {/* Detalhes das Divisões da Ficha */}
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                            <span className="font-bold text-white flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-emerald-400" />
                              {routine.splits.length} Divisões ({routine.splits.map((s) => s.id).join(", ")})
                            </span>
                            <span>•</span>
                            <span>{totalEx} exercícios</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{routine.frequency}</span>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {routine.isCustom && (
                              <>
                                <button
                                  onClick={() => handleEditExistingRoutine(routine)}
                                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-white/[0.08] transition-colors"
                                  title="Editar esta ficha no construtor"
                                >
                                  <Edit3 className="w-3 h-3 text-sky-400" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteRoutine(routine.id, routine.name)}
                                  className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/[0.08] transition-colors"
                                  title="Excluir ficha salva"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleOpenPrescribeModal(routine)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                            >
                              <Send className="w-3 h-3 stroke-[2.5]" />
                              <span>Prescrever para Aluno</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODO 2: CONSTRUTOR DE FICHA PERSONALIZADA COM X DIAS */}
          {/* ============================================================= */}
          {workoutSectionMode === "builder" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              {/* Barra superior de navegação do Construtor */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setWorkoutSectionMode("library");
                  }}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para a Biblioteca</span>
                </button>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  {builderRoutineId ? "Editando Ficha Salva" : "Nova Ficha Personalizada"}
                </span>
              </div>

              {/* Informações Gerais da Ficha */}
              <div className="p-4 rounded-3xl bg-zinc-900 border border-white/[0.08] space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nome da Ficha / Protocolo:
                  </label>
                  <input
                    type="text"
                    required
                    value={builderRoutineName}
                    onChange={(e) => setBuilderRoutineName(e.target.value)}
                    placeholder="Ex: Hipertrofia Glúteos & Pernas ABCD (4 Dias)"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                      Objetivo:
                    </label>
                    <select
                      value={builderCategory}
                      onChange={(e) => setBuilderCategory(e.target.value)}
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="Hipertrofia">Hipertrofia & Massa</option>
                      <option value="Definição">Emagrecimento & Definição</option>
                      <option value="Força">Força & Performance 5×5</option>
                      <option value="Feminino / Glúteos">Foco Glúteos & Coxas</option>
                      <option value="Iniciante">Adaptação / Iniciante</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                      Nível de Dificuldade:
                    </label>
                    <select
                      value={builderDifficulty}
                      onChange={(e) => setBuilderDifficulty(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                      Frequência Semanal:
                    </label>
                    <input
                      type="text"
                      value={builderFrequency}
                      onChange={(e) => setBuilderFrequency(e.target.value)}
                      placeholder="Ex: 4 dias na semana"
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Descrição ou Metodologia da Ficha:
                  </label>
                  <textarea
                    rows={2}
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)}
                    placeholder="Ex: Foco no aumento de volume semanal com intervalo de descanso entre treinos pesados..."
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* SEÇÃO DINÂMICA DE DIVISÕES (X DIAS DE TREINO) */}
              <div className="p-4 rounded-3xl bg-zinc-900 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Divisões de Treino da Ficha ({customSplits.length} Dias):
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      Adicione quantos dias desejar (A, B, C, D, E, F...) e monte cada treino individualmente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSplit}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Dia</span>
                  </button>
                </div>

                {/* Chips com todos os dias da ficha */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {customSplits.map((split, idx) => {
                    const isSelected = activeSplitId === split.id;
                    const exCount = split.exercises.length;

                    return (
                      <button
                        key={split.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setActiveSplitId(split.id);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                            : "bg-zinc-950 border border-white/[0.08] text-zinc-400 hover:text-white"
                        }`}
                      >
                        <span>Dia {split.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                            isSelected ? "bg-zinc-950/30 text-zinc-950 font-bold" : "bg-white/[0.08] text-zinc-400"
                          }`}
                        >
                          {exCount} ex.
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Edição dos Detalhes da Divisão Ativa */}
                {(() => {
                  const currentSplit = customSplits.find((s) => s.id === activeSplitId);
                  if (!currentSplit) return null;

                  return (
                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.08] space-y-3 mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Configurando Divisão {currentSplit.id}</span>
                        </h4>

                        {customSplits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplit(currentSplit.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                            title="Remover esta divisão"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover Dia {currentSplit.id}</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                            Título da Divisão:
                          </label>
                          <input
                            type="text"
                            value={currentSplit.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomSplits((prev) =>
                                prev.map((s) => (s.id === currentSplit.id ? { ...s, title: val } : s))
                              );
                            }}
                            placeholder="Ex: Treino A — Superior / Empurrar"
                            className="w-full p-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                            Músculos Alvo:
                          </label>
                          <input
                            type="text"
                            value={currentSplit.muscles}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomSplits((prev) =>
                                prev.map((s) => (s.id === currentSplit.id ? { ...s, muscles: val } : s))
                              );
                            }}
                            placeholder="Ex: Peitoral, Deltoides e Tríceps"
                            className="w-full p-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Exercícios já adicionados a esta divisão */}
                      <div className="pt-2 border-t border-white/[0.06] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">
                            Exercícios no Treino {currentSplit.id} ({currentSplit.exercises.length})
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Adicione abaixo no catálogo de exercícios
                          </span>
                        </div>

                        {currentSplit.exercises.length === 0 ? (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center text-zinc-500 text-xs italic">
                            Nenhum exercício neste dia ainda. Busque e adicione abaixo no catálogo!
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {currentSplit.exercises.map((ex, idx) => (
                              <div
                                key={ex.id}
                                className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between gap-2"
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-white truncate">
                                    {idx + 1}. {ex.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    {ex.target} • {ex.equipment} • {ex.restSeconds}s descanso
                                  </span>
                                  {ex.notes && (
                                    <span className="text-[9px] text-zinc-500 italic mt-0.5 truncate">
                                      Obs: {ex.notes}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(currentSplit.id, ex.id)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
                                  title="Remover exercício"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* CATÁLOGO DE EXERCÍCIOS PARA ADICIONAR AO DIA ATIVO */}
              <div className="p-4 rounded-3xl bg-zinc-900 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Catálogo de Exercícios — Adicionar ao Treino {activeSplitId}</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setIsAddCustomModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Criar Exercício</span>
                  </button>
                </div>

                {/* Busca e Filtros */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Buscar exercício para o Treino ${activeSplitId} (ex: Supino, Puxada, Leg Press...)`}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: "todos", label: "Todos" },
                      { id: "chest", label: "Peito" },
                      { id: "back", label: "Costas" },
                      { id: "upper legs", label: "Pernas" },
                      { id: "shoulders", label: "Ombros" },
                      { id: "upper arms", label: "Braços" },
                      { id: "waist", label: "Abdômen" },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setSelectedBodyPart(filter.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                          selectedBodyPart === filter.id
                            ? "bg-emerald-500 text-zinc-950 font-black"
                            : "bg-white/[0.04] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Resultados do Catálogo */}
                <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {searchResults.slice(0, 35).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.mediaFrames?.[0] && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic("light");
                              setPreviewExerciseModal({
                                id: item.id,
                                name: item.name,
                                muscle: item.target,
                                target: item.target,
                                equipment: item.equipment,
                                instructions: item.instructions,
                                tips: item.tips,
                                gifUrl: item.gifUrl,
                                mediaFrames: item.mediaFrames,
                                difficulty: item.difficulty,
                              });
                              setIsPreviewModalOpen(true);
                            }}
                            className="w-9 h-9 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0 relative group"
                            title="Ver demonstração"
                          >
                            <img src={item.mediaFrames[0]} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100">
                              <Play className="w-2.5 h-2.5 text-emerald-400 fill-current ml-0.5" />
                            </div>
                          </button>
                        )}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{item.name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400">
                              {item.equipment}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400 mt-0.5 truncate">{item.target}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            setPreviewExerciseModal({
                              id: item.id,
                              name: item.name,
                              muscle: item.target,
                              target: item.target,
                              equipment: item.equipment,
                              instructions: item.instructions,
                              tips: item.tips,
                              gifUrl: item.gifUrl,
                              mediaFrames: item.mediaFrames,
                              difficulty: item.difficulty,
                            });
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-emerald-400 text-xs flex items-center gap-1 border border-white/[0.06] transition-colors"
                          title="Ver GIF e execução"
                        >
                          <Play className="w-3 h-3 fill-current text-emerald-400" />
                          <span className="text-[10px] font-bold">GIF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddExerciseToSplit(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>+ Add Dia {activeSplitId}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BARRA FINAL DE SALVAMENTO & PRESCRIÇÃO */}
              <div className="p-4 rounded-3xl bg-zinc-900 border border-white/[0.08] flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSaveRoutineToLibrary(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all border border-white/[0.1]"
                >
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span>Salvar na Minha Biblioteca</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRoutineToLibrary(true)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Salvar & Prescrever para Aluno...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CADASTRO DE NOVO ALUNO */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/[0.12] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Cadastrar Aluno</h3>
                  <p className="text-[10px] text-zinc-400">Gera matrícula e ficha digital</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ex: Amanda Albuquerque"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="aluno@email.com"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Objetivo Principal</label>
                <select
                  value={newStudentGoal}
                  onChange={(e) => setNewStudentGoal(e.target.value as StudentProfile["goal"])}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white"
                >
                  <option value="Hipertrofia">Hipertrofia & Ganho de Massa</option>
                  <option value="Emagrecimento">Emagrecimento & Definição</option>
                  <option value="Força & Performance">Força & Performance 5×5</option>
                  <option value="Condicionamento Geral">Condicionamento & Saúde</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Cadastrar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Exercício Personalizado pelo Professor */}
      {isAddCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Criar Exercício Personalizado</h3>
              </div>
              <button
                onClick={() => setIsAddCustomModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customExName.trim()) {
                  alert("Por favor, digite o nome do exercício!");
                  return;
                }
                triggerHaptic("success");

                const createdItem = saveCustomExercise({
                  name: customExName.trim(),
                  bodyPart: customExMuscle.toLowerCase().includes("peito") ? "chest" :
                            customExMuscle.toLowerCase().includes("costa") ? "back" :
                            customExMuscle.toLowerCase().includes("perna") || customExMuscle.toLowerCase().includes("quadr") ? "upper legs" :
                            customExMuscle.toLowerCase().includes("ombro") ? "shoulders" :
                            customExMuscle.toLowerCase().includes("bíceps") || customExMuscle.toLowerCase().includes("tríceps") || customExMuscle.toLowerCase().includes("braço") ? "upper arms" :
                            customExMuscle.toLowerCase().includes("glúteo") ? "upper legs" :
                            customExMuscle.toLowerCase().includes("abd") ? "waist" : "upper legs",
                  target: customExMuscle,
                  equipment: customExEquipment,
                  instructions: [customExNotes.trim() || "Execução personalizada individualizada."],
                  difficulty: "Intermediário",
                });

                const newSplitEx: ExerciseInWorkout = {
                  id: `ex_${Date.now()}`,
                  exerciseId: createdItem.id,
                  name: createdItem.name,
                  muscle: customExMuscle,
                  equipment: customExEquipment,
                  target: `${customExSets} séries × ${customExReps}`,
                  restSeconds: 60,
                  notes: customExNotes.trim() || undefined,
                  isCustom: true,
                  sets: Array.from({ length: customExSets }).map((_, idx) => ({
                    setNumber: idx + 1,
                    reps: customExReps,
                    weightKg: customExWeight,
                    completed: false,
                  })),
                };

                setCustomSplits((prev) =>
                  prev.map((s) =>
                    s.id === activeSplitId
                      ? { ...s, exercises: [...s.exercises, newSplitEx] }
                      : s
                  )
                );

                showNotification(`Exercício "${createdItem.name}" adicionado ao Treino ${activeSplitId}!`);
                setIsAddCustomModalOpen(false);
                setCustomExName("");
                setCustomExNotes("");
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Exercício *</label>
                <input
                  type="text"
                  required
                  value={customExName}
                  onChange={(e) => setCustomExName(e.target.value)}
                  placeholder="Ex: Tríceps Francês na Polia com Barra W"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Grupo Muscular</label>
                  <select
                    value={customExMuscle}
                    onChange={(e) => setCustomExMuscle(e.target.value)}
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
                    value={customExEquipment}
                    onChange={(e) => setCustomExEquipment(e.target.value)}
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Séries</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={customExSets}
                    onChange={(e) => setCustomExSets(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Reps</label>
                  <input
                    type="text"
                    value={customExReps}
                    onChange={(e) => setCustomExReps(e.target.value)}
                    placeholder="10-12"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Carga (kg)</label>
                  <input
                    type="number"
                    min={0}
                    value={customExWeight}
                    onChange={(e) => setCustomExWeight(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Observações / Dica Técnica</label>
                <input
                  type="text"
                  value={customExNotes}
                  onChange={(e) => setCustomExNotes(e.target.value)}
                  placeholder="Ex: Segurar 2s no pico de contração"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20"
                >
                  Adicionar ao Treino {activeSplitId}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Animação / GIF de Exercício */}
      <ExerciseGifModal
        exercise={previewExerciseModal}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />

      {/* Modal de Prescrição de Ficha para Aluno */}
      <PrescribeWorkoutModal
        isOpen={isPrescribeModalOpen}
        onClose={() => setIsPrescribeModalOpen(false)}
        routine={prescribeTargetRoutine}
        defaultStudentId={selectedStudentId}
        onSuccess={(studentName, routineName) => {
          showNotification(`Ficha "${routineName}" prescrita para ${studentName} com sucesso!`);
          setStudents(getStoredStudents());
        }}
      />
    </div>
  );
}
