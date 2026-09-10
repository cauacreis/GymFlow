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
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  LOCAL_EXERCISE_DB,
  PREFORMED_ROUTINES,
  searchExercises,
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

import { CoachAgendaManager } from "./CoachAgendaManager";
import { CoachStudentsManager } from "./CoachStudentsManager";
import { ExerciseGifModal, ExerciseModalData } from "../workout/ExerciseGifModal";
import { CoachAnalyticsDashboard } from "../analytics/CoachAnalyticsDashboard";

interface CoachDashboardProps {
  onSwitchToStudentView?: () => void;
  defaultTab?: "students" | "agenda" | "workouts" | "analytics";
}

export function CoachDashboard({ onSwitchToStudentView, defaultTab = "students" }: CoachDashboardProps) {
  const [mainTab, setMainTab] = useState<"students" | "agenda" | "workouts" | "analytics">(defaultTab);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("student_carlos");
  const [modeTab, setModeTab] = useState<"preformed" | "custom">("preformed");

  // Modal Novo Aluno
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentGoal, setNewStudentGoal] = useState<StudentProfile["goal"]>("Hipertrofia");

  // Treinos Pré-formados
  const [selectedPreformedId, setSelectedPreformedId] = useState<string>("routine_hypertrophy_abc");
  const [customCoachNotes, setCustomCoachNotes] = useState("");

  // Montador Customizado ExerciseDB
  const [activeSplitId, setActiveSplitId] = useState<"A" | "B" | "C">("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("todos");
  const [searchResults, setSearchResults] = useState<ExerciseDBItem[]>(LOCAL_EXERCISE_DB);

  // Preview de Animação / GIF de Exercício
  const [previewExerciseModal, setPreviewExerciseModal] = useState<ExerciseModalData | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Splits customizados sendo construídos
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
      muscles: "Quadríceps, Glúteos e Posterior",
      estimatedMinutes: 55,
      exercises: [],
    },
  ]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [coachUser, setCoachUser] = useState<UserProfile>(getCurrentUser());

  // Carrega alunos e perfil do treinador
  useEffect(() => {
    setStudents(getStoredStudents());
    setCoachUser(getCurrentUser());
    const unsubscribe = subscribeToAuthChanges((u) => setCoachUser(u));
    return () => unsubscribe();
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

  // Atribuir Treino Pré-formado
  const handleAssignPreformed = () => {
    if (!currentStudent) return;
    const routine = PREFORMED_ROUTINES.find((r) => r.id === selectedPreformedId);
    if (!routine) return;

    assignWorkoutToStudent(currentStudent.id, {
      routineTitle: routine.name,
      coachNotes: customCoachNotes.trim() || `Prescrição ${routine.name} focada em ${currentStudent.goal}.`,
      splits: routine.splits,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    });

    setStudents(getStoredStudents());
    showNotification(`Ficha "${routine.name}" atribuída com sucesso a ${currentStudent.name}!`);
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
      routineTitle: `Ficha Personalizada Prof. Rodrigo (${customSplits.length} Divisões)`,
      coachNotes: customCoachNotes.trim() || `Treino individualizado montado no ExerciseDB para ${currentStudent.name}.`,
      splits: customSplits,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
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
    <div className="flex flex-col gap-4 text-left w-full max-w-md mx-auto pb-10">
      {/* Toast de Notificação */}
      {notificationMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-3.5 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="leading-snug">{notificationMsg}</span>
        </div>
      )}

      {/* Banner do Professor / Personal */}
      <div className="rounded-3xl p-4 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white">{coachUser.name || "Prof. Rodrigo Costa"}</h2>
                {coachUser.cref && (
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {coachUser.cref.startsWith("CREF") ? coachUser.cref : `CREF ${coachUser.cref}`}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">{coachUser.specialty || "Personal Trainer & Fisiologia do Exercício"}</p>
            </div>
          </div>

          {onSwitchToStudentView && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onSwitchToStudentView();
              }}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08] flex items-center gap-1 transition-all active:scale-95"
            >
              <span>Ver como Aluno</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Seletor Principal: Alunos vs Agenda vs Fichas vs Analytics */}
        <div className="pt-3 border-t border-white/[0.06] grid grid-cols-4 p-1 rounded-2xl bg-zinc-950 border border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setMainTab("students");
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mainTab === "students"
                ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Alunos</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setMainTab("agenda");
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mainTab === "agenda"
                ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Agenda</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setMainTab("workouts");
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mainTab === "workouts"
                ? "bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fichas</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setMainTab("analytics");
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mainTab === "analytics"
                ? "bg-gradient-to-r from-amber-500 to-emerald-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Analytics</span>
          </button>
        </div>
      </div>

      {/* ABA PRINCIPAL 0: CARTEIRA DE ALUNOS & CRM (ONLINE E OFFLINE) */}
      {mainTab === "students" && (
        <CoachStudentsManager
          onPrescribeWorkoutForStudent={(id) => {
            setSelectedStudentId(id);
            setMainTab("workouts");
          }}
        />
      )}

      {/* ABA PRINCIPAL 1: AGENDA & GESTÃO DE HORÁRIOS / ALUNOS PRESENCIAIS */}
      {mainTab === "agenda" && <CoachAgendaManager coachId="coach_rodrigo" />}

      {/* ABA PRINCIPAL 2: ANALYTICS & DASHBOARD DE MÉTRICAS */}
      {mainTab === "analytics" && <CoachAnalyticsDashboard />}

      {/* ABA PRINCIPAL 3: MONTAGEM E PRESCRIÇÃO DE FICHAS COM EXERCISEDB */}
      {mainTab === "workouts" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          {/* Seletor de Alunos */}
          <div className="rounded-3xl p-4 bg-zinc-900 border border-white/[0.08] flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-1">
                  Aluno Selecionado para Prescrição:
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

            {/* Card do Aluno Ativo */}
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

      {/* Alternador de Modo de Prescrição: Pré-Formados vs Customizado ExerciseDB */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-white/[0.08]">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setModeTab("preformed");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            modeTab === "preformed"
              ? "bg-emerald-500 text-zinc-950 shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Treinos Prontos</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setModeTab("custom");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            modeTab === "custom"
              ? "bg-emerald-500 text-zinc-950 shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Criar com ExerciseDB</span>
        </button>
      </div>

      {/* ABA 1: TREINOS PRÉ-FORMADOS */}
      {modeTab === "preformed" && (
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-zinc-400 px-1">
            Escolha um protocolo profissional pré-montado para prescrever com 1 toque:
          </span>

          <div className="flex flex-col gap-3">
            {PREFORMED_ROUTINES.map((routine) => {
              const isSelected = selectedPreformedId === routine.id;
              return (
                <div
                  key={routine.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedPreformedId(routine.id);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                      : "bg-zinc-900/40 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {routine.category}
                        </span>
                        <span className="text-[10px] text-zinc-400">{routine.difficulty}</span>
                      </div>
                      <h3 className="text-sm font-black text-white mt-1.5">{routine.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{routine.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{routine.splits.length} Divisões ({routine.splits.map((s) => s.id).join(", ")})</span>
                    <span className="text-emerald-400 font-bold">{routine.frequency}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observações do Professor para este aluno */}
          <div className="mt-2 p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Observações Especiais do Instrutor para {currentStudent?.name || "o Aluno"}:
            </label>
            <textarea
              rows={2}
              value={customCoachNotes}
              onChange={(e) => setCustomCoachNotes(e.target.value)}
              placeholder="Ex: Aquecer manguito rotador antes do supino. 2 segundos de parada no agachamento..."
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />

            <button
              onClick={handleAssignPreformed}
              className="w-full mt-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Prescrever este Treino para {currentStudent?.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* ABA 2: CRIAR COM EXERCISEDB */}
      {modeTab === "custom" && (
        <div className="flex flex-col gap-3">
          {/* Seletor de Divisão (A / B / C) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Editando Divisão:</span>
            <div className="flex items-center gap-1.5">
              {(["A", "B", "C"] as const).map((splitId) => (
                <button
                  key={splitId}
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveSplitId(splitId);
                  }}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                    activeSplitId === splitId
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                      : "bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  {splitId}
                </button>
              ))}
            </div>
          </div>

          {/* Exercícios já adicionados ao split ativo */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exercícios no Treino {activeSplitId}</span>
              </h4>
              <span className="text-[10px] text-zinc-400">
                {customSplits.find((s) => s.id === activeSplitId)?.exercises.length || 0} exercícios
              </span>
            </div>

            {customSplits.find((s) => s.id === activeSplitId)?.exercises.length === 0 ? (
              <p className="text-[11px] text-zinc-500 py-3 text-center italic">
                Nenhum exercício adicionado. Busque abaixo no ExerciseDB e adicione!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {customSplits
                  .find((s) => s.id === activeSplitId)
                  ?.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {idx + 1}. {ex.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {ex.target} • {ex.equipment}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveExercise(activeSplitId, ex.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Barra de Busca e Filtros ExerciseDB */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar no ExerciseDB (ex: Supino, Puxada, Agachamento...)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Filtros de Músculo */}
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
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedBodyPart(filter.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                    selectedBodyPart === filter.id
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados do Catálogo ExerciseDB */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between gap-2"
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
                    onClick={() => handleAddExerciseToSplit(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Treino {activeSplitId}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Final de Salvar Ficha Customizada */}
          <button
            onClick={handleSaveCustomWorkout}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Finalizar & Prescrever Ficha para {currentStudent?.name}</span>
          </button>
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

      {/* Modal de Animação / GIF de Exercício */}
      <ExerciseGifModal
        exercise={previewExerciseModal}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
}
