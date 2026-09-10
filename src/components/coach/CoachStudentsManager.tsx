"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Dumbbell,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Clock,
  MessageCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Tag,
  RefreshCw,
  Check,
  AlertTriangle,
  Play,
  Flame,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredStudents,
  saveNewStudent,
  updateStudentProfile,
  deleteStudent,
  recordStudentAttendance,
  detachWorkoutFromStudent,
  subscribeToWorkoutChanges,
  getStudentWorkout,
  assignWorkoutToStudent,
  StudentProfile,
  CoachPlanOption,
  getStoredCoachPlans,
  saveCoachPlans,
  DEFAULT_COACH_PLANS,
  StudentWorkoutPackage,
} from "@/lib/workout-store";
import { getStoredBookings, getStoredCoaches, updateCoachPricing } from "@/lib/booking-store";
import { getCurrentUser, saveUserProfile } from "@/lib/auth-store";
import { ExerciseInWorkout, WorkoutSplitTemplate } from "@/lib/exercisedb";

interface CoachStudentsManagerProps {
  onPrescribeWorkoutForStudent?: (studentId: string) => void;
}

export function CoachStudentsManager({
  onPrescribeWorkoutForStudent,
}: CoachStudentsManagerProps) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "ativo" | "inativo" | "pendente">("todos");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // Planos oferecidos pelo professor
  const [coachPlans, setCoachPlans] = useState<CoachPlanOption[]>([]);
  const [editingPlans, setEditingPlans] = useState<CoachPlanOption[]>([]);
  const [isManagePlansModalOpen, setIsManagePlansModalOpen] = useState(false);

  // Alterar plano de aluno individual
  const [isEditStudentPlanModalOpen, setIsEditStudentPlanModalOpen] = useState(false);
  const [selectedStudentNewPlan, setSelectedStudentNewPlan] = useState("");

  // Modal de Edição de Treino do Aluno
  const [isEditWorkoutModalOpen, setIsEditWorkoutModalOpen] = useState(false);
  const [editingWorkoutStudent, setEditingWorkoutStudent] = useState<StudentProfile | null>(null);
  const [editingWorkoutData, setEditingWorkoutData] = useState<StudentWorkoutPackage | null>(null);
  const [editingActiveSplitIndex, setEditingActiveSplitIndex] = useState(0);

  // Seletor rápido de atraso (minutos)
  const [delaySelectorStudentId, setDelaySelectorStudentId] = useState<string | null>(null);

  // Adicionar exercício rápido ao split
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseSets, setNewExerciseSets] = useState("4");
  const [newExerciseReps, setNewExerciseReps] = useState("10-12");
  const [newExerciseMuscle, setNewExerciseMuscle] = useState("Peito");

  // Formulário para novo plano personalizado
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanFrequency, setNewPlanFrequency] = useState("3x por semana presencial");
  const [newPlanDescription, setNewPlanDescription] = useState("");

  // Modal Novo Aluno (Online ou Offline)
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentGoal, setNewStudentGoal] = useState<StudentProfile["goal"]>("Hipertrofia");
  const [newStudentPlan, setNewStudentPlan] = useState("Mensal Pro (R$ 45/mês)");
  const [newStudentAge, setNewStudentAge] = useState("28");
  const [newStudentEmergency, setNewStudentEmergency] = useState("");
  const [newStudentIsOffline, setNewStudentIsOffline] = useState(true);

  // Notificação toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setStudents(getStoredStudents());
      const loadedPlans = getStoredCoachPlans();
      setCoachPlans(loadedPlans);
      if (loadedPlans.length > 0) {
        setNewStudentPlan((prev) => {
          if (!prev || prev === "Mensal Pro (R$ 45/mês)") {
            const defaultPro = loadedPlans.find((p) => p.id === "plan_pro") || loadedPlans[0];
            return `${defaultPro.name} (R$ ${defaultPro.price}/mês)`;
          }
          return prev;
        });
      }
    };
    load();
    const unsub = subscribeToWorkoutChanges(load);
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtragem
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      s.goal.toLowerCase().includes(searchQuery.toLowerCase());

    const status = s.status || "ativo";
    const matchesFilter = filterStatus === "todos" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Salvar novo aluno
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const created = saveNewStudent({
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || undefined,
      phone: newStudentPhone.trim() || undefined,
      goal: newStudentGoal,
      plan: newStudentPlan,
      age: parseInt(newStudentAge) || 25,
      emergencyContact: newStudentEmergency.trim() || undefined,
      isOfflineStudent: newStudentIsOffline,
    });

    setStudents(getStoredStudents());
    setIsNewStudentModalOpen(false);
    setNewStudentName("");
    setNewStudentPhone("");
    setNewStudentEmail("");
    setNewStudentEmergency("");
    showToast(`Aluno "${created.name}" cadastrado com sucesso!`);
  };

  // Abrir modal de gestão de planos
  const handleOpenManagePlans = () => {
    triggerHaptic("light");
    setEditingPlans(JSON.parse(JSON.stringify(coachPlans)));
    setIsManagePlansModalOpen(true);
  };

  // Atualizar campo de um plano em edição
  const handleUpdateEditingPlanField = (
    id: string,
    field: keyof CoachPlanOption,
    value: any
  ) => {
    setEditingPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Adicionar plano personalizado
  const handleAddCustomPlanToEditing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    const priceNum = parseFloat(newPlanPrice) || 40;
    const newPlan: CoachPlanOption = {
      id: `plan_${Date.now()}`,
      name: newPlanName.trim(),
      price: priceNum,
      period: "personalizado",
      frequency: newPlanFrequency.trim() || "Presencial",
      description: newPlanDescription.trim() || "Plano personalizado com o professor",
      isCustom: true,
    };
    setEditingPlans((prev) => [...prev, newPlan]);
    setNewPlanName("");
    setNewPlanPrice("");
    setNewPlanFrequency("3x por semana presencial");
    setNewPlanDescription("");
    triggerHaptic("success");
    showToast(`Plano "${newPlan.name}" adicionado à tabela!`);
  };

  // Remover plano personalizado
  const handleDeletePlanFromEditing = (id: string) => {
    triggerHaptic("warning");
    setEditingPlans((prev) => prev.filter((p) => p.id !== id));
    showToast("Plano removido da lista.");
  };

  // Restaurar padrões
  const handleResetToDefaults = () => {
    triggerHaptic("warning");
    setEditingPlans(JSON.parse(JSON.stringify(DEFAULT_COACH_PLANS)));
    showToast("Planos restaurados para o padrão oficial (R$ 35, 45 e 55).");
  };

  // Salvar tabela de planos
  const handleSaveAllPlans = () => {
    triggerHaptic("success");
    saveCoachPlans(editingPlans);
    setCoachPlans(editingPlans);

    // Sincronizar preços no booking-store e auth-store
    const basic = editingPlans.find((p) => p.id === "plan_basico")?.price ?? 35;
    const pro = editingPlans.find((p) => p.id === "plan_pro")?.price ?? 45;
    const vip = editingPlans.find((p) => p.id === "plan_vip")?.price ?? 55;

    const coaches = getStoredCoaches();
    if (coaches.length > 0) {
      updateCoachPricing(coaches[0].id, {
        basicMonthly: basic,
        proMonthly: pro,
        vipMonthly: vip,
        dailySession: basic,
        weeklyPlan: pro,
        monthlyPlan: vip,
      });
    }

    const currentUser = getCurrentUser();
    saveUserProfile({
      pricing: {
        basicMonthly: basic,
        proMonthly: pro,
        vipMonthly: vip,
        dailySession: basic,
        weeklyPlan: pro,
        monthlyPlan: vip,
      },
    });

    setIsManagePlansModalOpen(false);
    showToast("Tabela de planos atualizada e sincronizada com sucesso! ✨");
  };

  // Atualizar plano de aluno específico
  const handleConfirmUpdateStudentPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudentNewPlan.trim()) return;
    triggerHaptic("success");
    updateStudentProfile(selectedStudent.id, { plan: selectedStudentNewPlan.trim() });
    setSelectedStudent((prev) => (prev ? { ...prev, plan: selectedStudentNewPlan.trim() } : null));
    setStudents(getStoredStudents());
    setIsEditStudentPlanModalOpen(false);
    showToast(`Plano do aluno atualizado para "${selectedStudentNewPlan}"!`);
  };

  // Registrar frequência (Presença, Falta ou Atraso) com sincronização imediata
  const handleRecordAttendance = (
    studentId: string,
    type: "presence" | "absence" | "delay",
    delayMinutes: number = 15
  ) => {
    triggerHaptic(type === "presence" ? "success" : type === "delay" ? "medium" : "warning");
    recordStudentAttendance(studentId, type, delayMinutes);
    const updated = getStoredStudents();
    setStudents(updated);
    if (selectedStudent && selectedStudent.id === studentId) {
      const match = updated.find((s) => s.id === studentId);
      if (match) setSelectedStudent(match);
    }
    setDelaySelectorStudentId(null);

    const student = updated.find((s) => s.id === studentId);
    const studentName = student?.name || "Aluno";
    if (type === "presence") {
      showToast(`✓ Presença de ${studentName} confirmada! Aluno notificado 🔥`);
    } else if (type === "absence") {
      showToast(`✕ Falta de ${studentName} registrada no sistema.`);
    } else {
      showToast(`⚠️ Atraso (${delayMinutes}m) registrado para ${studentName}! Aluno notificado.`);
    }
  };

  const handleAddPresence = (studentId: string) => handleRecordAttendance(studentId, "presence");
  const handleAddAbsence = (studentId: string) => handleRecordAttendance(studentId, "absence");
  const handleAddDelay = (studentId: string, minutes: number = 15) => handleRecordAttendance(studentId, "delay", minutes);

  // Adicionar aluno à grade de hoje (Quinta-feira)
  const handleAddStudentToToday = (studentId: string, time: string = "18:00") => {
    triggerHaptic("light");
    updateStudentProfile(studentId, {
      scheduledTimeToday: time,
      todayAttendanceStatus: "agendado",
    });
    setStudents(getStoredStudents());
    showToast("Aluno agendado para a grade de hoje!");
  };

  // Abrir editor de treino do aluno
  const handleOpenEditWorkout = (student: StudentProfile) => {
    triggerHaptic("light");
    setEditingWorkoutStudent(student);
    const pkg = getStudentWorkout(student.id);
    setEditingWorkoutData(JSON.parse(JSON.stringify(pkg)));
    setEditingActiveSplitIndex(0);
    setIsEditWorkoutModalOpen(true);
  };

  // Salvar edições do treino e sincronizar com o aluno
  const handleSaveWorkoutEdit = () => {
    if (!editingWorkoutStudent || !editingWorkoutData) return;
    triggerHaptic("success");
    assignWorkoutToStudent(editingWorkoutStudent.id, {
      routineTitle: editingWorkoutData.routineTitle,
      coachNotes: editingWorkoutData.coachNotes,
      splits: editingWorkoutData.splits,
      prescribedBy: editingWorkoutData.prescribedBy,
    });
    const updated = getStoredStudents();
    setStudents(updated);
    if (selectedStudent && selectedStudent.id === editingWorkoutStudent.id) {
      const match = updated.find((s) => s.id === editingWorkoutStudent.id);
      if (match) setSelectedStudent(match);
    }
    setIsEditWorkoutModalOpen(false);
    showToast(`Treino de ${editingWorkoutStudent.name} atualizado e sincronizado no celular do aluno! ✨`);
  };

  // Adicionar exercício ao split em edição
  const handleAddExerciseToSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim() || !editingWorkoutData) return;
    const setsCount = parseInt(newExerciseSets) || 3;
    const newEx: ExerciseInWorkout = {
      id: `ex_${Date.now()}`,
      exerciseId: `custom_${Date.now()}`,
      name: newExerciseName.trim(),
      muscle: newExerciseMuscle,
      equipment: "Livre / Halter",
      target: newExerciseMuscle,
      restSeconds: 60,
      sets: Array.from({ length: setsCount }, (_, i) => ({
        setNumber: i + 1,
        reps: newExerciseReps.trim() || "10-12",
        weightKg: 20,
      })),
    };
    const updatedSplits = [...editingWorkoutData.splits];
    if (updatedSplits[editingActiveSplitIndex]) {
      updatedSplits[editingActiveSplitIndex].exercises.push(newEx);
      setEditingWorkoutData({ ...editingWorkoutData, splits: updatedSplits });
    }
    setNewExerciseName("");
    triggerHaptic("light");
    showToast(`Exercício "${newEx.name}" adicionado ao treino!`);
  };

  // Remover exercício do split em edição
  const handleRemoveExerciseFromSplit = (splitIdx: number, exerciseId: string) => {
    if (!editingWorkoutData) return;
    triggerHaptic("warning");
    const updatedSplits = [...editingWorkoutData.splits];
    if (updatedSplits[splitIdx]) {
      updatedSplits[splitIdx].exercises = updatedSplits[splitIdx].exercises.filter(
        (ex) => ex.id !== exerciseId
      );
      setEditingWorkoutData({ ...editingWorkoutData, splits: updatedSplits });
    }
  };

  // Desvincular ficha
  const handleDetachWorkout = (studentId: string) => {
    triggerHaptic("light");
    detachWorkoutFromStudent(studentId);
    setStudents(getStoredStudents());
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              hasWorkoutSheet: false,
              currentRoutineTitle: "Acompanhamento Presencial Livre",
            }
          : null
      );
    }
    showToast("Ficha desvinculada. Aluno em acompanhamento presencial livre!");
  };

  // Excluir aluno
  const handleDeleteStudent = (studentId: string) => {
    if (!confirm("Tem certeza que deseja remover este aluno da sua lista?")) return;
    triggerHaptic("warning");
    deleteStudent(studentId);
    setSelectedStudent(null);
    setStudents(getStoredStudents());
    showToast("Aluno removido da lista.");
  };

  // WhatsApp
  const getWhatsAppLink = (phone?: string, studentName?: string) => {
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá, ${studentName || "aluno"}! Aqui é o seu treinador do GymFlow. Como está o seu planejamento de treinos essa semana?`
    );
    return `https://wa.me/55${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header do Módulo de Alunos */}
      <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/[0.08] shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Gestão de Alunos & CRM
            </span>
            <h2 className="text-base sm:text-lg font-black text-white mt-1">
              Carteira de Alunos do Treinador
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cadastre alunos presenciais mesmo sem conta no app e acompanhe presenças, faltas e fichas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
            <button
              onClick={handleOpenManagePlans}
              className="px-3 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Configurar os planos que você oferece aos alunos"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Planos Oferecidos ({coachPlans.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("medium");
                setIsNewStudentModalOpen(true);
              }}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* 3 Micro KPIs da Carteira */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06]">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 block">Total de Alunos</span>
            <span className="text-sm sm:text-base font-black text-white font-mono mt-0.5 block">
              {students.length}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 block">Alunos Ativos</span>
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5 block">
              {students.filter((s) => (s.status || "ativo") === "ativo").length}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 block">Presenciais Offline</span>
            <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5 block">
              {students.filter((s) => s.isOfflineStudent).length}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: ALUNOS AGENDADOS PARA HOJE */}
      {(() => {
        const todayDateStr = new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "short",
        });
        const formattedToday = todayDateStr.charAt(0).toUpperCase() + todayDateStr.slice(1);
        const bookings = getStoredBookings();

        // Alunos agendados para hoje (ou com status de presença/falta/atraso registrado hoje)
        const todayStudents = students.filter((s) => {
          if (s.scheduledTimeToday) return true;
          if (s.todayAttendanceStatus && s.todayAttendanceStatus !== "agendado") return true;
          if (s.lastPresence && s.lastPresence.toLowerCase().includes("hoje")) return true;
          return bookings.some(
            (b) => b.studentId === s.id && (b.slotDay === "Hoje" || b.slotDay?.toLowerCase().includes("hoje"))
          );
        });

        const getStudentTimeToday = (s: StudentProfile) => {
          if (s.scheduledTimeToday) return s.scheduledTimeToday;
          const matchBooking = bookings.find(
            (b) => b.studentId === s.id && (b.slotDay === "Hoje" || b.slotDay?.toLowerCase().includes("hoje"))
          );
          if (matchBooking) return matchBooking.slotTime;
          if (s.id === "student_carlos") return "18:00";
          if (s.id === "student_lucas") return "07:00";
          if (s.id === "student_beatriz") return "19:30";
          return "Hoje";
        };

        return (
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-3.5">
            <div className="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Cabeçalho da Seção de Hoje */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Grade de Hoje • {formattedToday}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                  <span>⚡ Alunos do Dia</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                    {todayStudents.length} {todayStudents.length === 1 ? "aluno" : "alunos"}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Marque presença, falta ou atraso com 1 toque e edite os treinos com sincronização instantânea no aluno.
                </p>
              </div>

              {/* Seletor rápido para agendar aluno offline ou livre para hoje */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddStudentToToday(e.target.value, "18:00");
                      e.target.value = "";
                    }
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                >
                  <option value="" disabled>
                    + Agendar Aluno para Hoje...
                  </option>
                  {students
                    .filter((st) => !todayStudents.some((ts) => ts.id === st.id))
                    .map((st) => (
                      <option key={st.id} value={st.id} className="bg-zinc-950 text-white">
                        {st.name} ({st.plan || "Presencial"})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Cards dos Alunos de Hoje */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {todayStudents.length === 0 ? (
                <div className="col-span-full p-6 rounded-2xl bg-zinc-950/60 border border-white/[0.06] text-center text-xs text-zinc-400">
                  Nenhum aluno agendado para hoje ainda. Selecione um aluno acima para agendar!
                </div>
              ) : (
                todayStudents.map((student) => {
                  const timeToday = getStudentTimeToday(student);
                  const isPresent = student.todayAttendanceStatus === "presente";
                  const isAbsent = student.todayAttendanceStatus === "falta";
                  const isDelayed = student.todayAttendanceStatus === "atraso";

                  return (
                    <div
                      key={student.id}
                      className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between gap-3 shadow-md ${
                        isPresent
                          ? "bg-emerald-950/20 border-emerald-500/35 hover:border-emerald-500/50"
                          : isAbsent
                          ? "bg-rose-950/20 border-rose-500/35 hover:border-rose-500/50"
                          : isDelayed
                          ? "bg-amber-950/25 border-amber-500/40 hover:border-amber-500/60"
                          : "bg-zinc-950/80 border-white/[0.08] hover:border-amber-500/30"
                      }`}
                    >
                      {/* Topo: Avatar + Info + Horário + Status */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          onClick={() => {
                            triggerHaptic("selection");
                            setSelectedStudent(student);
                          }}
                        >
                          <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-black text-amber-400">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            {student.isOfflineStudent && (
                              <span
                                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-zinc-950"
                                title="Presencial Offline"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-white truncate hover:text-amber-300 transition-colors">
                                {student.name}
                              </h4>
                              {student.isOfflineStudent && (
                                <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                  Presencial
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                              {student.plan || "Mensal VIP"} • {student.goal}
                            </p>
                          </div>
                        </div>

                        {/* Horário & Badge de Status Atual de Hoje */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/[0.06] text-white border border-white/10 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{timeToday}</span>
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              isPresent
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : isAbsent
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : isDelayed
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-white/[0.05] text-zinc-400 border-white/10"
                            }`}
                          >
                            {isPresent
                              ? "✓ Presente"
                              : isAbsent
                              ? "✕ Falta"
                              : isDelayed
                              ? `⚠️ Atraso (${student.delayMinutes || 15}m)`
                              : "⏳ Agendado"}
                          </span>
                        </div>
                      </div>

                      {/* Meio: Ficha de Treino Ativa */}
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {student.hasWorkoutSheet ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 truncate">
                              <Dumbbell className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{student.currentRoutineTitle}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-500 italic flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400/70 shrink-0" /> Presencial Livre (Ficha Opcional)
                            </span>
                          )}
                        </div>

                        {student.phone && (
                          <a
                            href={getWhatsAppLink(student.phone, student.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] flex items-center gap-1 shrink-0 ml-2"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Base: AÇÕES DIRETAS (Presença, Falta, Atraso e Editar Treino) */}
                      <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap">
                        {/* 3 Botões de Frequência */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordAttendance(student.id, "presence");
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 ${
                              isPresent
                                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30"
                                : "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300"
                            }`}
                            title="Confirmar presença do aluno no treino de hoje"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Presença</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordAttendance(student.id, "absence");
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 ${
                              isAbsent
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                                : "bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300"
                            }`}
                            title="Registrar falta do aluno no treino de hoje"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Falta</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDelaySelectorStudentId(
                                delaySelectorStudentId === student.id ? null : student.id
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 ${
                              isDelayed
                                ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30"
                                : "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300"
                            }`}
                            title="Registrar atraso do aluno com notificação"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Atraso</span>
                          </button>
                        </div>

                        {/* Botão de Edição de Treino */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditWorkout(student);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-amber-300 flex items-center gap-1 transition-all active:scale-95"
                          title="Editar a rotina de treinos deste aluno e sincronizar no app dele"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Editar Treino</span>
                        </button>
                      </div>

                      {/* Mini Seletor de Minutos de Atraso */}
                      {delaySelectorStudentId === student.id && (
                        <div
                          className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-2 animate-in fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-amber-300">
                            Selecionar minutos de atraso:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[10, 15, 20, 30].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handleRecordAttendance(student.id, "delay", mins)}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-zinc-950 text-[10px] font-mono font-black transition-all active:scale-95"
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, telefone ou objetivo..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Filtro por Status */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-900 border border-white/[0.08] shrink-0 self-start sm:self-auto">
          {(["todos", "ativo", "inativo", "pendente"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                triggerHaptic("selection");
                setFilterStatus(st);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all ${
                filterStatus === st
                  ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Alunos em Cards */}
      <div className="flex flex-col gap-2.5">
        {filteredStudents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/[0.06] text-center text-zinc-400 text-xs">
            Nenhum aluno encontrado para os critérios pesquisados.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const presences = student.monthlyPresence ?? 14;
            const absences = student.monthlyAbsences ?? 1;
            const total = presences + absences;
            const rate = total > 0 ? Math.round((presences / total) * 100) : 100;

            return (
              <div
                key={student.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedStudent(student);
                }}
                className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/[0.06] hover:border-amber-500/30 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Avatar & Nome */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-zinc-400">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      {student.isOfflineStudent && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-zinc-950"
                          title="Aluno Presencial Offline"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-amber-400 transition-colors">
                          {student.name}
                        </h4>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            student.status === "inativo"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {student.status || "Ativo"}
                        </span>
                        {student.isOfflineStudent && (
                          <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                            Presencial
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {student.plan || "Mensal VIP"} • Meta: {student.goal}
                      </p>
                    </div>
                  </div>

                  {/* Indicador de Frequência & Botão Detalhes */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden xs:block">
                      <span className="text-xs font-black font-mono text-white block">
                        {rate}%
                      </span>
                      <span className="text-[9px] text-zinc-400 block">
                        {presences}P • {absences}F
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] group-hover:bg-amber-500/20 group-hover:text-amber-300 flex items-center justify-center text-zinc-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Linha Inferior: Status da Ficha & Ações Rápidas */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {student.hasWorkoutSheet ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" /> Ficha Ativa: {student.currentRoutineTitle}
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400/70" /> Presencial Livre (Ficha
                        Opcional)
                      </span>
                    )}

                    {student.todayAttendanceStatus && (
                      <span
                        className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                          student.todayAttendanceStatus === "presente"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : student.todayAttendanceStatus === "falta"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        Hoje: {student.todayAttendanceStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordAttendance(student.id, "presence");
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Marcar presença no treino de hoje"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Presença</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordAttendance(student.id, "absence");
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Marcar falta no treino de hoje"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Falta</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordAttendance(student.id, "delay", 15);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Marcar atraso no treino de hoje"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Atraso</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditWorkout(student);
                      }}
                      className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-amber-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Editar ficha e treino deste aluno"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400" />
                      <span>Editar Treino</span>
                    </button>

                    {student.phone && (
                      <a
                        href={getWhatsAppLink(student.phone, student.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline ml-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DRAWER / MODAL DE DETALHES DO ALUNO */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Aluno */}
            <div className="p-5 border-b border-white/[0.08] bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-amber-500/40 shrink-0">
                  {selectedStudent.avatarUrl ? (
                    <img
                      src={selectedStudent.avatarUrl}
                      alt={selectedStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-amber-400 text-base">
                      {selectedStudent.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{selectedStudent.name}</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedStudent.isOfflineStudent ? "Offline / Presencial" : "Usuário do Site"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Matrícula: {selectedStudent.matricula} • {selectedStudent.age || 28} anos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
              {/* Botões Rápidos de Registro de Frequência no Salão */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    Frequência do Mês
                  </span>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    {selectedStudent.monthlyPresence ?? 0} Presenças •{" "}
                    {selectedStudent.monthlyAbsences ?? 0} Faltas
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleAddPresence(selectedStudent.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-1 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Presença</span>
                  </button>

                  <button
                    onClick={() => handleAddAbsence(selectedStudent.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-black flex items-center gap-1 transition-all active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>+ Falta</span>
                  </button>

                  <button
                    onClick={() => handleAddDelay(selectedStudent.id, 15)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Atraso</span>
                  </button>
                </div>
              </div>

              {/* Plano Contratado do Aluno */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Plano Contratado
                    </span>
                    <span className="text-xs font-black text-amber-300 mt-0.5 block">
                      {selectedStudent.plan || "Acompanhamento Livre"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedStudentNewPlan(
                      selectedStudent.plan ||
                        (coachPlans.length > 0
                          ? `${coachPlans[0].name} (R$ ${coachPlans[0].price}/mês)`
                          : "Mensal Pro (R$ 45/mês)")
                    );
                    setIsEditStudentPlanModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Alterar Plano</span>
                </button>
              </div>

              {/* Status da Ficha Técnica (Opcional!) */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" /> Ficha de Treino Prescrita
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {selectedStudent.hasWorkoutSheet ? "Vinculada" : "Opcional"}
                  </span>
                </div>

                {selectedStudent.hasWorkoutSheet ? (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white">
                          {selectedStudent.currentRoutineTitle}
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          Prescrito em {selectedStudent.prescribedAt}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDetachWorkout(selectedStudent.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
                      >
                        Desvincular
                      </button>
                    </div>

                    {selectedStudent.notesFromCoach && (
                      <p className="text-[11px] text-zinc-300 italic bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        "{selectedStudent.notesFromCoach}"
                      </p>
                    )}

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = selectedStudent;
                          setSelectedStudent(null);
                          handleOpenEditWorkout(current);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Ficha & Exercícios</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] text-center space-y-2.5">
                    <p className="text-xs text-zinc-400">
                      Este aluno está em <strong>acompanhamento presencial livre</strong> (sem ficha
                      obrigatória).
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const current = selectedStudent;
                          setSelectedStudent(null);
                          handleOpenEditWorkout(current);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs inline-flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Montar Ficha Agora</span>
                      </button>

                      {onPrescribeWorkoutForStudent && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(null);
                            onPrescribeWorkoutForStudent(selectedStudent.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-zinc-200 font-bold text-xs inline-flex items-center gap-1 border border-white/10 active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Via ExerciseDB</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Informações de Contato e Emergência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">
                    Telefone / WhatsApp
                  </span>
                  <span className="text-xs font-mono text-white mt-1 block">
                    {selectedStudent.phone || "Não informado"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">
                    Contato de Emergência
                  </span>
                  <span className="text-xs font-mono text-white mt-1 block">
                    {selectedStudent.emergencyContact || "Não informado"}
                  </span>
                </div>
              </div>

              {/* Botão de Exclusão do Aluno */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(selectedStudent.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Aluno da Lista</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVO ALUNO (ONLINE OU OFFLINE) */}
      {isNewStudentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsNewStudentModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Cadastrar Aluno</h3>
                  <p className="text-[10px] text-zinc-400">
                    Pode ser aluno presencial que não usa o site
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Idade</label>
                  <input
                    type="number"
                    value={newStudentAge}
                    onChange={(e) => setNewStudentAge(e.target.value)}
                    placeholder="28"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="aluno@email.com"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Objetivo</label>
                  <select
                    value={newStudentGoal}
                    onChange={(e) =>
                      setNewStudentGoal(e.target.value as StudentProfile["goal"])
                    }
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                  >
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Força & Performance">Força & Performance</option>
                    <option value="Condicionamento Geral">Condicionamento Geral</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Plano Contratado
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenManagePlans}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      title="Editar tabela de planos que você oferece"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Editar Planos</span>
                    </button>
                  </div>
                  <select
                    value={newStudentPlan}
                    onChange={(e) => setNewStudentPlan(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {coachPlans.map((plan) => (
                      <option key={plan.id} value={`${plan.name} (R$ ${plan.price}/mês)`}>
                        {plan.name} — R$ {plan.price}/mês {plan.frequency ? `• ${plan.frequency}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Contato de Emergência
                </label>
                <input
                  type="text"
                  value={newStudentEmergency}
                  onChange={(e) => setNewStudentEmergency(e.target.value)}
                  placeholder="Nome e telefone de familiar..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Cadastrar no CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERENCIAR PLANOS OFERECIDOS PELO PROFESSOR */}
      {isManagePlansModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsManagePlansModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-zinc-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Tabela de Planos do Treinador
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Personalize valores e planos que você pode oferecer no cadastro de alunos e no salão
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsManagePlansModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo Rolável */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 no-scrollbar flex-1">
              {/* Lista de Planos Atuais */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Planos Ativos ({editingPlans.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                    title="Restaurar valores oficiais (R$ 35, 45 e 55)"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] hover:border-amber-500/30 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={plan.name}
                            onChange={(e) =>
                              handleUpdateEditingPlanField(plan.id, "name", e.target.value)
                            }
                            placeholder="Nome do Plano"
                            className="bg-transparent font-bold text-white text-xs border-b border-transparent hover:border-white/20 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full max-w-[200px]"
                          />
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              plan.isCustom
                                ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {plan.isCustom ? "Personalizado" : "Plano Oficial"}
                          </span>
                        </div>

                        {plan.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlanFromEditing(plan.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Remover plano personalizado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                            Valor Mensal (R$)
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-xs text-zinc-400 font-bold">
                              R$
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={plan.price}
                              onChange={(e) =>
                                handleUpdateEditingPlanField(
                                  plan.id,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500/50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                            Frequência Presencial
                          </label>
                          <input
                            type="text"
                            value={plan.frequency || ""}
                            onChange={(e) =>
                              handleUpdateEditingPlanField(plan.id, "frequency", e.target.value)
                            }
                            placeholder="Ex: 2x por semana presencial"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                          Descrição / Benefícios
                        </label>
                        <input
                          type="text"
                          value={plan.description || ""}
                          onChange={(e) =>
                            handleUpdateEditingPlanField(plan.id, "description", e.target.value)
                          }
                          placeholder="Ex: Acompanhamento postural e ficha no app..."
                          className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário: Adicionar Novo Plano Personalizado */}
              <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/25 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white">
                    Adicionar Novo Plano Personalizado
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                      Nome do Plano *
                    </label>
                    <input
                      type="text"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="Ex: Trimestral Personal VIP"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                      Valor (R$) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-zinc-400 font-bold">R$</span>
                      <input
                        type="number"
                        min="0"
                        value={newPlanPrice}
                        onChange={(e) => setNewPlanPrice(e.target.value)}
                        placeholder="Ex: 90"
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                      Frequência
                    </label>
                    <input
                      type="text"
                      value={newPlanFrequency}
                      onChange={(e) => setNewPlanFrequency(e.target.value)}
                      placeholder="Ex: 4x por semana presencial"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                      Descrição Opcional
                    </label>
                    <input
                      type="text"
                      value={newPlanDescription}
                      onChange={(e) => setNewPlanDescription(e.target.value)}
                      placeholder="Ex: Acompanhamento de alta intensidade"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomPlanToEditing}
                  disabled={!newPlanName.trim()}
                  className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Plano à Grade</span>
                </button>
              </div>
            </div>

            {/* Rodapé Fixo */}
            <div className="p-4 border-t border-white/[0.08] bg-zinc-900/80 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsManagePlansModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300 hover:text-white transition-colors"
              >
                Descartar
              </button>

              <button
                type="button"
                onClick={handleSaveAllPlans}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Salvar Tabela de Planos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR PLANO DO ALUNO */}
      {isEditStudentPlanModalOpen && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsEditStudentPlanModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/[0.08] bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white">Alterar Plano</h3>
                  <p className="text-[10px] text-zinc-400">{selectedStudent.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditStudentPlanModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmUpdateStudentPlan} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  Selecione o Novo Plano
                </label>
                <select
                  value={selectedStudentNewPlan}
                  onChange={(e) => setSelectedStudentNewPlan(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                >
                  {coachPlans.map((plan) => (
                    <option key={plan.id} value={`${plan.name} (R$ ${plan.price}/mês)`}>
                      {plan.name} — R$ {plan.price}/mês {plan.frequency ? `• ${plan.frequency}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditStudentPlanModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Atualizar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FICHA DE TREINO DO ALUNO COM SINCRONIZAÇÃO */}
      {isEditWorkoutModalOpen && editingWorkoutStudent && editingWorkoutData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsEditWorkoutModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">Editar Ficha de Treino</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Sincronização Ativa
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Aluno: <span className="text-white font-bold">{editingWorkoutStudent.name}</span> • {editingWorkoutStudent.matricula}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditWorkoutModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
              {/* Nome do Protocolo / Rotina */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  Nome do Protocolo / Ficha
                </label>
                <input
                  type="text"
                  value={editingWorkoutData.routineTitle}
                  onChange={(e) =>
                    setEditingWorkoutData({ ...editingWorkoutData, routineTitle: e.target.value })
                  }
                  placeholder="Ex: Hipertrofia Clássica ABC"
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-bold text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Recado do Treinador */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  Orientações do Treinador (Visível no celular do aluno)
                </label>
                <textarea
                  rows={2}
                  value={editingWorkoutData.coachNotes || ""}
                  onChange={(e) =>
                    setEditingWorkoutData({ ...editingWorkoutData, coachNotes: e.target.value })
                  }
                  placeholder="Ex: Foco especial na fase excêntrica e cadência controlada em todos os compostos."
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Divisões de Treino (Splits A, B, C...) */}
              <div className="space-y-3 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Divisões de Treino (Splits)
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    {editingWorkoutData.splits.length} divisões cadastradas
                  </span>
                </div>

                {/* Abas dos Splits */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {editingWorkoutData.splits.map((split, sIdx) => (
                    <button
                      key={split.id || sIdx}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setEditingActiveSplitIndex(sIdx);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        editingActiveSplitIndex === sIdx
                          ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>Treino {split.id}</span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded-full ${
                          editingActiveSplitIndex === sIdx
                            ? "bg-zinc-950 text-amber-300"
                            : "bg-white/10 text-zinc-400"
                        }`}
                      >
                        {split.exercises.length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Conteúdo do Split Ativo */}
                {(() => {
                  const activeSplit = editingWorkoutData.splits[editingActiveSplitIndex];
                  if (!activeSplit) return null;

                  return (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] space-y-3">
                      {/* Editor de Nome do Split e Minutos */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-0.5">
                            Foco do Split
                          </label>
                          <input
                            type="text"
                            value={activeSplit.title}
                            onChange={(e) => {
                              const updated = [...editingWorkoutData.splits];
                              updated[editingActiveSplitIndex].title = e.target.value;
                              setEditingWorkoutData({ ...editingWorkoutData, splits: updated });
                            }}
                            className="w-full p-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs font-bold text-white focus:outline-none focus:border-amber-500/50"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-0.5">
                            Tempo Est.
                          </label>
                          <input
                            type="number"
                            value={activeSplit.estimatedMinutes}
                            onChange={(e) => {
                              const updated = [...editingWorkoutData.splits];
                              updated[editingActiveSplitIndex].estimatedMinutes =
                                parseInt(e.target.value) || 45;
                              setEditingWorkoutData({ ...editingWorkoutData, splits: updated });
                            }}
                            className="w-full p-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      {/* Lista de Exercícios no Split */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">
                          Exercícios deste Split ({activeSplit.exercises.length})
                        </span>

                        {activeSplit.exercises.length === 0 ? (
                          <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950/50 rounded-xl border border-white/[0.04]">
                            Nenhum exercício neste split ainda. Adicione abaixo!
                          </div>
                        ) : (
                          activeSplit.exercises.map((ex, exIdx) => (
                            <div
                              key={ex.id || exIdx}
                              className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-lg bg-white/[0.06] text-amber-400 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                                  {exIdx + 1}
                                </span>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-white truncate">{ex.name}</h5>
                                  <span className="text-[9px] text-zinc-400 block truncate">
                                    {ex.muscle} • {ex.sets.length} séries × {ex.sets[0]?.reps || "10-12"} reps • {ex.restSeconds}s descanso
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveExerciseFromSplit(editingActiveSplitIndex, ex.id)
                                }
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                                title="Remover exercício"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Adicionar Exercício Rápido ao Split */}
                      <form
                        onSubmit={handleAddExerciseToSplit}
                        className="p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1] space-y-2.5"
                      >
                        <span className="text-[9px] font-bold uppercase text-amber-400 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Adicionar Exercício ao Treino {activeSplit.id}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newExerciseName}
                            onChange={(e) => setNewExerciseName(e.target.value)}
                            placeholder="Nome (ex: Supino Inclinado c/ Halteres)"
                            className="p-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                          />

                          <select
                            value={newExerciseMuscle}
                            onChange={(e) => setNewExerciseMuscle(e.target.value)}
                            className="p-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                          >
                            <option value="Peito">Peitoral</option>
                            <option value="Costas">Costas / Dorsal</option>
                            <option value="Pernas">Pernas / Quadríceps</option>
                            <option value="Glúteos">Glúteos</option>
                            <option value="Ombros">Ombros / Deltoides</option>
                            <option value="Braços">Braços (Bíceps / Tríceps)</option>
                            <option value="Abdômen">Abdômen / Core</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={newExerciseSets}
                              onChange={(e) => setNewExerciseSets(e.target.value)}
                              placeholder="Séries"
                              className="w-16 p-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono focus:outline-none focus:border-amber-500/50"
                            />
                            <span className="text-[10px] text-zinc-500">séries ×</span>
                            <input
                              type="text"
                              value={newExerciseReps}
                              onChange={(e) => setNewExerciseReps(e.target.value)}
                              placeholder="10-12"
                              className="w-20 p-2 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs text-white text-center font-mono focus:outline-none focus:border-amber-500/50"
                            />
                            <span className="text-[10px] text-zinc-500">reps</span>
                          </div>

                          <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all"
                          >
                            + Inserir
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })()}
              </div>

              {/* Atalho para Prescrição Completa no ExerciseDB */}
              {onPrescribeWorkoutForStudent && (
                <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">Catálogo ExerciseDB Completo</p>
                      <p className="text-[10px] text-zinc-400">
                        Prescrever com busca anatômica e demonstrações visuais
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const stId = editingWorkoutStudent.id;
                      setIsEditWorkoutModalOpen(false);
                      onPrescribeWorkoutForStudent(stId);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0 transition-all active:scale-95"
                  >
                    Abrir ExerciseDB
                  </button>
                </div>
              )}
            </div>

            {/* Footer de Ações */}
            <div className="p-4 border-t border-white/[0.08] bg-zinc-900/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditWorkoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 active:scale-95 transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveWorkoutEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar & Sincronizar com Aluno</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
