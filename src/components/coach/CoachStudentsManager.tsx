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
} from "@/lib/workout-store";

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

  // Modal Novo Aluno (Online ou Offline)
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentGoal, setNewStudentGoal] = useState<StudentProfile["goal"]>("Hipertrofia");
  const [newStudentPlan, setNewStudentPlan] = useState("Mensal VIP Presencial");
  const [newStudentAge, setNewStudentAge] = useState("28");
  const [newStudentEmergency, setNewStudentEmergency] = useState("");
  const [newStudentIsOffline, setNewStudentIsOffline] = useState(true);

  // Notificação toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setStudents(getStoredStudents());
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

          <button
            onClick={() => {
              triggerHaptic("medium");
              setIsNewStudentModalOpen(true);
            }}
            className="px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Aluno</span>
          </button>
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Plano Contratado
                  </label>
                  <select
                    value={newStudentPlan}
                    onChange={(e) => setNewStudentPlan(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white"
                  >
                    <option value="Mensal VIP Presencial">Mensal VIP Presencial</option>
                    <option value="Semanal 3x">Semanal 3x</option>
                    <option value="Diária Avulsa">Diária Avulsa</option>
                    <option value="Trimestral Premium">Trimestral Premium</option>
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
    </div>
  );
}
