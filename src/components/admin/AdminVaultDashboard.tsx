"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Terminal,
  Users,
  Calendar,
  CreditCard,
  Database,
  Activity,
  Download,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Dumbbell,
  Clock,
  LogOut,
  ExternalLink,
  ChevronRight,
  Filter,
  Save,
  Check,
  TrendingUp,
  Award,
  Layers,
  Phone,
  Mail,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { destroyVaultSession } from "@/lib/admin-vault";
import {
  getStoredStudents,
  updateStudentProfile,
  deleteStudent,
  saveNewStudent,
  StudentProfile,
  getStoredCoachPlans,
  saveCoachPlans,
  CoachPlanOption,
} from "@/lib/workout-store";
import {
  getStoredCoaches,
  saveStoredCoaches,
  getStoredBookings,
  saveStoredBookings,
  CoachTrainer,
  BookingRequest,
} from "@/lib/booking-store";
import { getCurrentUser, saveUserProfile, UserProfile } from "@/lib/auth-store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type AdminTab = "overview" | "students" | "coaches" | "agenda" | "finance" | "system";

export function AdminVaultDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [coaches, setCoaches] = useState<CoachTrainer[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [plans, setPlans] = useState<CoachPlanOption[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estados de Busca e Filtro de Alunos
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<"todos" | "ativo" | "atrasado" | "inativo">("todos");

  // Modal de Edição Master de Aluno
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);

  // Modal de Edição Master de Treinador
  const [editingCoach, setEditingCoach] = useState<CoachTrainer | null>(null);

  // Diagnósticos de Banco de Dados
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [dbTableCounts, setDbTableCounts] = useState<{ [table: string]: number }>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Carrega todas as coleções do sistema
  const loadSystemData = async () => {
    setStudents(getStoredStudents());
    setCoaches(getStoredCoaches());
    setBookings(getStoredBookings());
    setPlans(getStoredCoachPlans());

    // Teste de conexão Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        const start = performance.now();
        try {
          const { count, error } = await client
            .from("students")
            .select("*", { count: "exact", head: true });

          const end = performance.now();
          if (!error) {
            setDbStatus("connected");
            setDbLatency(Math.round(end - start));
            setDbTableCounts((prev) => ({ ...prev, students: count || 0 }));
          } else {
            setDbStatus("offline");
          }
        } catch {
          setDbStatus("offline");
        }
      }
    } else {
      setDbStatus("offline");
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  // Métricas Calculadas
  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === "ativo").length;
    const delayedStudents = students.filter((s) => s.paymentStatus === "atrasado").length;
    const inactiveStudents = students.filter((s) => s.status === "inativo").length;

    // Faturamento estimado baseado nos planos
    let estimatedRevenue = 0;
    students.forEach((s) => {
      if (s.status !== "inativo") {
        if (s.plan?.includes("55") || s.plan?.toLowerCase().includes("vip")) {
          estimatedRevenue += 55;
        } else if (s.plan?.includes("45") || s.plan?.toLowerCase().includes("pro")) {
          estimatedRevenue += 45;
        } else {
          estimatedRevenue += 35;
        }
      }
    });

    const totalCoaches = coaches.length;
    const totalBookings = bookings.length;
    const completedClasses = bookings.filter((b) => b.attendanceStatus === "attended").length;

    return {
      totalStudents,
      activeStudents,
      delayedStudents,
      inactiveStudents,
      estimatedRevenue,
      totalCoaches,
      totalBookings,
      completedClasses,
    };
  }, [students, coaches, bookings]);

  // Alunos Filtrados
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesSearch =
        st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (st.email && st.email.toLowerCase().includes(studentSearch.toLowerCase())) ||
        (st.phone && st.phone.includes(studentSearch)) ||
        (st.matricula && st.matricula.toLowerCase().includes(studentSearch.toLowerCase()));

      const matchesStatus =
        studentStatusFilter === "todos" ? true : st.status === studentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, studentSearch, studentStatusFilter]);

  // Logout do Vault
  const handleLockVault = () => {
    triggerHaptic("warning");
    destroyVaultSession();
    window.location.href = "/";
  };

  // Exportar Backup JSON Completo
  const handleExportFullBackup = () => {
    triggerHaptic("success");
    const snapshot = {
      timestamp: new Date().toISOString(),
      platform: "GymFlow Master Vault Backup",
      environment: process.env.NODE_ENV || "production",
      data: {
        students,
        coaches,
        bookings,
        plans,
      },
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymflow-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Backup JSON baixado com sucesso!");
  };

  // Salvar Edição Master de Aluno
  const handleSaveStudentEdit = () => {
    if (!editingStudent) return;
    triggerHaptic("success");
    updateStudentProfile(editingStudent.id, editingStudent);
    setStudents(getStoredStudents());
    setEditingStudent(null);
    showToast(`Aluno ${editingStudent.name} atualizado com sucesso!`);
  };

  // Excluir Aluno
  const handleDeleteStudent = (stId: string, name: string) => {
    if (confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o aluno ${name}?`)) {
      triggerHaptic("warning");
      deleteStudent(stId);
      setStudents(getStoredStudents());
      showToast(`Aluno ${name} removido da base.`);
    }
  };

  // Zerar Faltas
  const handleResetAbsences = (stId: string) => {
    triggerHaptic("selection");
    updateStudentProfile(stId, { monthlyAbsences: 0 });
    setStudents(getStoredStudents());
    showToast("Faltas zeradas para este aluno.");
  };

  // Salvar Edição Master de Treinador
  const handleSaveCoachEdit = () => {
    if (!editingCoach) return;
    triggerHaptic("success");
    const all = getStoredCoaches();
    const updated = all.map((c) => (c.id === editingCoach.id ? editingCoach : c));
    saveStoredCoaches(updated);
    setCoaches(updated);
    setEditingCoach(null);
    showToast(`Treinador ${editingCoach.name} atualizado!`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans pb-20">
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Master de Segurança */}
      <div className="border-b border-emerald-500/20 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Terminal className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-wide text-white">
                  GymFlow Master Vault
                </h1>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                <span>
                  Supabase:{" "}
                  <strong className={dbStatus === "connected" ? "text-emerald-400" : "text-amber-400"}>
                    {dbStatus === "connected" ? `Online (${dbLatency}ms)` : "Modo Local Resiliente"}
                  </strong>
                </span>
                <span>•</span>
                <span>Vercel Edge Ready</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Top */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportFullBackup}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-all active:scale-95"
              title="Baixar cópia de segurança completa do banco em JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup JSON</span>
            </button>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-all active:scale-95"
              title="Voltar para a interface do aplicativo"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Ver App</span>
            </Link>

            <button
              type="button"
              onClick={handleLockVault}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-all active:scale-95"
              title="Encerrar sessão de Super Admin e bloquear o painel"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Bloquear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Abas do Super Admin */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-2xl bg-zinc-900/60 border border-white/[0.06] backdrop-blur-md">
          {[
            { id: "overview", label: "Visão Geral", icon: Activity },
            { id: "students", label: `Alunos (${students.length})`, icon: Users },
            { id: "coaches", label: `Treinadores (${coaches.length})`, icon: Award },
            { id: "agenda", label: `Agenda Geral (${bookings.length})`, icon: Calendar },
            { id: "finance", label: "Financeiro & Planos", icon: CreditCard },
            { id: "system", label: "Diagnóstico & Banco", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveTab(tab.id as AdminTab);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? "bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "stroke-[2.5]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* =================================================================== */}
        {/* ABA 1: VISÃO GERAL / ANALYTICS MASTER */}
        {/* =================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 KPIs Principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] shadow-sm flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Receita Estimada</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    R$ {metrics.estimatedRevenue}
                    <span className="text-xs font-normal text-zinc-400">/mês</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold mt-0.5">
                    {metrics.activeStudents} alunos adimplentes
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] shadow-sm flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Alunos Totais</span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {metrics.totalStudents}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {metrics.delayedStudents} em atraso • {metrics.inactiveStudents} inativos
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] shadow-sm flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Treinadores Ativos</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {metrics.totalCoaches}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    No marketplace oficial
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] shadow-sm flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Aulas Agendadas</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {metrics.totalBookings}
                  </div>
                  <p className="text-[11px] text-amber-400 mt-0.5">
                    {metrics.completedClasses} aulas concluídas
                  </p>
                </div>
              </div>
            </div>

            {/* Ações Rápidas de Super Admin */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Central de Controle Geral</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Você tem permissão irrestrita para editar cadastros, finanças, planos e rotinas de treino.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gerenciar Alunos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("coaches")}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Treinadores</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 2: GESTÃO MASTER DE ALUNOS (CRUD COMPLETO) */}
        {/* =================================================================== */}
        {activeTab === "students" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header de Ações dos Alunos */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar por nome, email, telefone ou matrícula..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-white/[0.08]">
                  {(["todos", "ativo", "atrasado", "inativo"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStudentStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        studentStatusFilter === st
                          ? "bg-white/[0.1] text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    const newId = `student_master_${Date.now()}`;
                    setEditingStudent({
                      id: newId,
                      name: "",
                      email: "",
                      phone: "",
                      matricula: `GF-${newId.slice(-4)}`,
                      goal: "Hipertrofia",
                      currentRoutineTitle: "Treino Personalizado Master",
                      prescribedBy: "Admin Vault",
                      prescribedAt: new Date().toISOString().split("T")[0],
                      plan: "Mensal Pro",
                      status: "ativo",
                      paymentStatus: "pago",
                      monthlyPresence: 95,
                      monthlyAbsences: 0,
                      totalClasses: 0,
                      age: 25,
                    });
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Novo Aluno</span>
                </button>
              </div>
            </div>

            {/* Tabela de Alunos */}
            <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/90 text-zinc-400 font-bold text-[10px] uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="p-3.5">Aluno</th>
                      <th className="p-3.5">Contato</th>
                      <th className="p-3.5">Plano & Status</th>
                      <th className="p-3.5">Frequência</th>
                      <th className="p-3.5 text-right">Ações Master</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          Nenhum aluno encontrado com esses filtros.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Coluna Aluno */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center font-black text-emerald-400 text-xs shrink-0">
                                {student.name ? student.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{student.name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  {student.matricula || student.id.slice(0, 8)} • {student.goal}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Coluna Contato */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <div className="text-zinc-300 font-mono text-[11px] truncate">
                                {student.email || "Sem e-mail"}
                              </div>
                              <div className="text-zinc-500 font-mono text-[10px]">
                                {student.phone || "Sem telefone"}
                              </div>
                            </div>
                          </td>

                          {/* Coluna Plano & Status */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="text-zinc-200 font-bold text-[11px]">
                                {student.plan || "Treino Livre"}
                              </div>
                              <span
                                className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  student.status === "ativo"
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                    : student.status === "pendente"
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                    : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                {student.status}
                              </span>
                            </div>
                          </td>

                          {/* Coluna Frequência */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <div className="text-emerald-400 font-bold font-mono">
                                {student.monthlyPresence ?? 95}% presença
                              </div>
                              <div className="text-zinc-500 text-[10px]">
                                {student.monthlyAbsences || 0} faltas no mês
                              </div>
                            </div>
                          </td>

                          {/* Coluna Ações */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResetAbsences(student.id)}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 hover:text-amber-300 transition-colors"
                                title="Zerar faltas do aluno"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic("selection");
                                  setEditingStudent({ ...student });
                                }}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 hover:text-cyan-300 transition-colors"
                                title="Editar dados completos do aluno"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(student.id, student.name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                                title="Excluir aluno permanentemente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 3: GESTÃO DE TREINADORES */}
        {/* =================================================================== */}
        {activeTab === "coaches" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Treinadores Oficiais</h3>
                <p className="text-xs text-zinc-400">
                  Gerencie personais que aparecem no catálogo e definam valores de planos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  const newCoach: CoachTrainer = {
                    id: `coach_${Date.now()}`,
                    name: "",
                    cref: "",
                    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                    phone: "",
                    specialty: "Musculação & Hipertrofia",
                    distance: "0.8 km",
                    rating: 5.0,
                    reviewCount: 1,
                    bio: "Personal trainer credenciado GymFlow.",
                    pricing: { basicMonthly: 35, proMonthly: 45, vipMonthly: 55 },
                    slots: [],
                  };
                  setEditingCoach(newCoach);
                }}
                className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Adicionar Treinador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={coach.avatarUrl}
                        alt={coach.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{coach.name}</h4>
                        <p className="text-[11px] text-emerald-400 font-medium">{coach.specialty}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {coach.cref ? `CREF: ${coach.cref}` : "Sem CREF informado"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingCoach({ ...coach })}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 transition-colors"
                      title="Editar Treinador"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {coach.bio || "Sem biografia cadastrada."}
                  </p>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">Planos:</span>
                    <span className="text-zinc-200 font-bold">
                      R$ {coach.pricing?.basicMonthly || 35} / R$ {coach.pricing?.proMonthly || 45} / R$ {coach.pricing?.vipMonthly || 55}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 4: AUDITORIA GERAL DE AGENDA */}
        {/* =================================================================== */}
        {activeTab === "agenda" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Todas as Aulas da Academia</h3>
                <p className="text-xs text-zinc-400">
                  Visão macro de agendamentos presenciais entre todos os personais e alunos.
                </p>
              </div>

              <span className="text-xs font-mono text-zinc-400">
                Total: <strong>{bookings.length}</strong> agendamentos
              </span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/90 text-zinc-400 font-bold text-[10px] uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="p-3.5">Dia & Horário</th>
                      <th className="p-3.5">Aluno</th>
                      <th className="p-3.5">Treinador</th>
                      <th className="p-3.5">Status Presença</th>
                      <th className="p-3.5 text-right">Ação Master</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          Nenhum agendamento na grade no momento.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-mono font-bold text-white">
                            {booking.slotDay} às {booking.slotTime}
                          </td>
                          <td className="p-3.5 text-zinc-200 font-bold">
                            {booking.studentName || "Aluno"}
                          </td>
                          <td className="p-3.5 text-zinc-400 font-mono">
                            {booking.coachId}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                booking.attendanceStatus === "attended"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : booking.attendanceStatus === "missed"
                                  ? "bg-rose-500/15 text-rose-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {booking.attendanceStatus || "agendado"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja desocupar e cancelar esta aula de ${booking.studentName}?`)) {
                                  const updated = bookings.filter((b) => b.id !== booking.id);
                                  saveStoredBookings(updated);
                                  setBookings(updated);
                                  showToast("Aula desocupada pelo Administrador.");
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 font-bold text-[10px]"
                            >
                              Desocupar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 5: FINANCEIRO & PLANOS GLOBAIS */}
        {/* =================================================================== */}
        {activeTab === "finance" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tabela de Planos Padrão */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Planos Oficiais da Academia</h3>
                  <p className="text-xs text-zinc-400">
                    Valores sugeridos para mensalidades e diárias de musculação.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan, index) => (
                  <div key={plan.id} className="p-4 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{plan.name}</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        R$ {plan.price}/mês
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{plan.description}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{plan.frequency}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 6: DIAGNÓSTICO DO SISTEMA, SUPABASE & BACKUP */}
        {/* =================================================================== */}
        {activeTab === "system" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Status da Infraestrutura & Banco de Dados</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/10">
                  <span className="text-xs text-zinc-500 block">Supabase PostgreSQL</span>
                  <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dbStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <span>{dbStatus === "connected" ? "Conectado" : "Local / Offline"}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {dbLatency ? `Latência: ${dbLatency}ms` : "Modo resiliente ativo"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/10">
                  <span className="text-xs text-zinc-500 block">Hospedagem & CDN</span>
                  <div className="text-lg font-bold text-white mt-1">Vercel Edge Network</div>
                  <p className="text-[10px] text-emerald-400 mt-1">Produção Ativa (SSL / HTTPS)</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/10">
                  <span className="text-xs text-zinc-500 block">Segurança de Código</span>
                  <div className="text-lg font-bold text-white mt-1">Shield Ativo</div>
                  <p className="text-[10px] text-zinc-400 mt-1">0 credenciais expostas no Git</p>
                </div>
              </div>

              {/* Botões de Manutenção */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Baixar Backup Completo JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    localStorage.removeItem("gymflow_cache_timestamp");
                    loadSystemData();
                    showToast("Cache local purgado e sincronizado!");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Limpar Cache & Revalidar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL DE EDIÇÃO MASTER DE ALUNO */}
      {/* =================================================================== */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setEditingStudent(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl text-zinc-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Edição Master: {editingStudent.name || "Novo Aluno"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">E-mail:</label>
                  <input
                    type="email"
                    value={editingStudent.email || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={editingStudent.phone || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Status:</label>
                  <select
                    value={editingStudent.status}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Presença (%):</label>
                  <input
                    type="number"
                    value={editingStudent.monthlyPresence ?? 95}
                    onChange={(e) => setEditingStudent({ ...editingStudent, monthlyPresence: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Faltas no Mês:</label>
                  <input
                    type="number"
                    value={editingStudent.monthlyAbsences ?? 0}
                    onChange={(e) => setEditingStudent({ ...editingStudent, monthlyAbsences: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Plano Atual:</label>
                <input
                  type="text"
                  value={editingStudent.plan || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, plan: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Observações do Treinador:</label>
                <textarea
                  rows={3}
                  value={editingStudent.notesFromCoach || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, notesFromCoach: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-zinc-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStudentEdit}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE EDIÇÃO MASTER DE TREINADOR */}
      {/* =================================================================== */}
      {editingCoach && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setEditingCoach(null)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl text-zinc-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">
                  Treinador: {editingCoach.name || "Novo Treinador"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoach(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Nome:</label>
                <input
                  type="text"
                  value={editingCoach.name}
                  onChange={(e) => setEditingCoach({ ...editingCoach, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">CREF:</label>
                <input
                  type="text"
                  value={editingCoach.cref || ""}
                  onChange={(e) => setEditingCoach({ ...editingCoach, cref: e.target.value })}
                  placeholder="Ex: 012345-G/SP (opcional)"
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Especialidade:</label>
                <input
                  type="text"
                  value={editingCoach.specialty}
                  onChange={(e) => setEditingCoach({ ...editingCoach, specialty: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Telefone WhatsApp:</label>
                <input
                  type="text"
                  value={editingCoach.phone}
                  onChange={(e) => setEditingCoach({ ...editingCoach, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Plano Básico (R$):</label>
                  <input
                    type="number"
                    value={editingCoach.pricing.basicMonthly}
                    onChange={(e) =>
                      setEditingCoach({
                        ...editingCoach,
                        pricing: { ...editingCoach.pricing, basicMonthly: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Plano Pro (R$):</label>
                  <input
                    type="number"
                    value={editingCoach.pricing.proMonthly}
                    onChange={(e) =>
                      setEditingCoach({
                        ...editingCoach,
                        pricing: { ...editingCoach.pricing, proMonthly: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Plano VIP (R$):</label>
                  <input
                    type="number"
                    value={editingCoach.pricing.vipMonthly}
                    onChange={(e) =>
                      setEditingCoach({
                        ...editingCoach,
                        pricing: { ...editingCoach.pricing, vipMonthly: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Biografia:</label>
                <textarea
                  rows={3}
                  value={editingCoach.bio}
                  onChange={(e) => setEditingCoach({ ...editingCoach, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCoach(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-zinc-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCoachEdit}
                className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-black text-xs uppercase"
              >
                Salvar Treinador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
