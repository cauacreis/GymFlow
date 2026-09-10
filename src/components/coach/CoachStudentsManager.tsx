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
  StudentProfile,
  CoachPlanOption,
  getStoredCoachPlans,
  saveCoachPlans,
  DEFAULT_COACH_PLANS,
} from "@/lib/workout-store";
import { getStoredCoaches, updateCoachPricing } from "@/lib/booking-store";
import { getCurrentUser, saveUserProfile } from "@/lib/auth-store";

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

  // Registrar presença
  const handleAddPresence = (studentId: string) => {
    triggerHaptic("medium");
    recordStudentAttendance(studentId, "presence");
    setStudents(getStoredStudents());
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              monthlyPresence: (prev.monthlyPresence || 0) + 1,
              totalClasses: (prev.totalClasses || 0) + 1,
            }
          : null
      );
    }
    showToast("Presença confirmada no salão! 🔥");
  };

  // Registrar falta
  const handleAddAbsence = (studentId: string) => {
    triggerHaptic("warning");
    recordStudentAttendance(studentId, "absence");
    setStudents(getStoredStudents());
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent((prev) =>
        prev ? { ...prev, monthlyAbsences: (prev.monthlyAbsences || 0) + 1 } : null
      );
    }
    showToast("Falta registrada para o aluno.");
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
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
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
                  </div>

                  {student.phone && (
                    <a
                      href={getWhatsAppLink(student.phone, student.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
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

                <div className="flex items-center gap-1.5">
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
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06] text-center space-y-2">
                    <p className="text-xs text-zinc-400">
                      Este aluno está em <strong>acompanhamento presencial livre</strong> (sem ficha
                      obrigatória).
                    </p>
                    {onPrescribeWorkoutForStudent && (
                      <button
                        onClick={() => {
                          setSelectedStudent(null);
                          onPrescribeWorkoutForStudent(selectedStudent.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs inline-flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Montar ou Atribuir Ficha</span>
                      </button>
                    )}
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
    </div>
  );
}
