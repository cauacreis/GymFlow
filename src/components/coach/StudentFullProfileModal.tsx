"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  Edit3,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Dumbbell,
  Target,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Save,
  Check,
  Tag,
  Flame,
  ShieldCheck,
  DollarSign,
  CreditCard,
  UserX,
  UserCheck,
  Ban,
  RotateCcw,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  StudentProfile,
  updateStudentProfile,
  updateStudentPaymentStatus,
  inactivateStudentAndReleaseAgenda,
  getStoredCoachPlans,
  CoachPlanOption,
} from "@/lib/workout-store";
import {
  BookingRequest,
  updateAttendanceStatus,
  updateBookingNotes,
} from "@/lib/booking-store";

interface StudentFullProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile | null;
  currentBooking?: BookingRequest | null;
  onEditWorkout?: (student: StudentProfile) => void;
  onStudentUpdated?: (updated: StudentProfile) => void;
}

export function StudentFullProfileModal({
  isOpen,
  onClose,
  student,
  currentBooking,
  onEditWorkout,
  onStudentUpdated,
}: StudentFullProfileModalProps) {
  const [localStudent, setLocalStudent] = useState<StudentProfile | null>(student);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Campos de edição
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAge, setEditAge] = useState("25");
  const [editEmergency, setEditEmergency] = useState("");
  const [editGoal, setEditGoal] = useState<StudentProfile["goal"]>("Hipertrofia");
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState<"ativo" | "inativo" | "pendente">("ativo");
  const [editPaymentStatus, setEditPaymentStatus] = useState<"pago" | "atrasado" | "pendente" | "cancelado">("pago");
  const [editPaymentDueDate, setEditPaymentDueDate] = useState("Dia 10");
  const [editNotes, setEditNotes] = useState("");

  // Observações da aula atual
  const [bookingNotes, setBookingNotes] = useState(currentBooking?.notes || "");
  const [coachPlans, setCoachPlans] = useState<CoachPlanOption[]>([]);

  useEffect(() => {
    setLocalStudent(student);
    if (student) {
      setEditName(student.name || "");
      setEditEmail(student.email || "");
      setEditPhone(student.phone || "");
      setEditAge(String(student.age || 26));
      setEditEmergency(student.emergencyContact || "");
      setEditGoal(student.goal || "Hipertrofia");
      setEditPlan(student.plan || "Mensal VIP (R$ 55/mês)");
      setEditStatus(student.status || "ativo");
      setEditPaymentStatus(student.paymentStatus || "pago");
      setEditPaymentDueDate(student.paymentDueDate || "Dia 10");
      setEditNotes(student.notes || student.notesFromCoach || "");
    }
  }, [student]);

  useEffect(() => {
    if (currentBooking) {
      setBookingNotes(currentBooking.notes || "");
    }
  }, [currentBooking]);

  useEffect(() => {
    setCoachPlans(getStoredCoachPlans());
  }, [isOpen]);

  if (!isOpen || !localStudent) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Alterar pagamento com 1 clique
  const handleQuickSetPayment = (status: "pago" | "atrasado" | "pendente" | "cancelado") => {
    triggerHaptic(status === "pago" ? "success" : "warning");
    updateStudentPaymentStatus(localStudent.id, status);
    const updated: StudentProfile = {
      ...localStudent,
      paymentStatus: status,
      ...(status === "pago" ? { lastPaymentDate: new Date().toLocaleDateString("pt-BR") } : {}),
    };
    setLocalStudent(updated);
    if (onStudentUpdated) onStudentUpdated(updated);
    showToast(
      status === "pago"
        ? "Mensalidade marcada como PAGA ✅"
        : status === "atrasado"
        ? "Mensalidade marcada como ATRASADA ⚠️"
        : `Status financeiro alterado para ${status}`
    );
  };

  // Inativar aluno e desocupar agenda
  const handleInactivateAndReleaseAgenda = () => {
    const confirmed = window.confirm(
      `Deseja inativar ${localStudent.name}?\n\nOs horários deste aluno serão LIBERADOS na agenda para novos alunos, mas todo o histórico continuará salvo no sistema.`
    );
    if (!confirmed) return;

    triggerHaptic("warning");
    inactivateStudentAndReleaseAgenda(localStudent.id, true);
    const updated: StudentProfile = {
      ...localStudent,
      status: "inativo",
      paymentStatus: "cancelado",
      todayAttendanceStatus: undefined,
      scheduledTimeToday: undefined,
    };
    setLocalStudent(updated);
    if (onStudentUpdated) onStudentUpdated(updated);
    showToast(`${localStudent.name} inativado e horários liberados na Agenda!`);
  };

  // Reativar aluno
  const handleReactivateStudent = () => {
    triggerHaptic("success");
    updateStudentProfile(localStudent.id, { status: "ativo", paymentStatus: "pago" });
    const updated: StudentProfile = {
      ...localStudent,
      status: "ativo",
      paymentStatus: "pago",
    };
    setLocalStudent(updated);
    if (onStudentUpdated) onStudentUpdated(updated);
    showToast(`${localStudent.name} reativado com sucesso!`);
  };

  // Link para cobrança educada no WhatsApp
  const getCobrarWhatsAppLink = () => {
    if (!localStudent.phone) return "#";
    const cleanPhone = localStudent.phone.replace(/\D/g, "");
    const msg = `Olá, ${localStudent.name}! Tudo bem? Passando para lembrar sobre a mensalidade do seu plano (${localStudent.plan || "Treino Personal"}), com vencimento no ${localStudent.paymentDueDate || "dia 10"}. Qualquer dúvida ou para envio do comprovante, só me mandar por aqui! 🏋️‍♂️`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Salvar edições do aluno
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updates: Partial<StudentProfile> = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      age: parseInt(editAge) || 25,
      emergencyContact: editEmergency.trim(),
      goal: editGoal,
      plan: editPlan,
      status: editStatus,
      paymentStatus: editPaymentStatus,
      paymentDueDate: editPaymentDueDate,
      notes: editNotes.trim(),
    };

    updateStudentProfile(localStudent.id, updates);

    const updated: StudentProfile = {
      ...localStudent,
      ...updates,
    };

    setLocalStudent(updated);
    if (onStudentUpdated) {
      onStudentUpdated(updated);
    }

    setIsEditMode(false);
    showToast("Informações do aluno salvas com sucesso!");
  };

  // Salvar nota da aula atual
  const handleSaveBookingNotes = () => {
    if (!currentBooking) return;
    updateBookingNotes(currentBooking.id, bookingNotes.trim());
    showToast("Anotações da aula salvas!");
  };

  // Atualizar presença da aula atual
  const handleUpdateBookingAttendance = (
    status: "attended" | "missed" | "justified" | "pending"
  ) => {
    if (!currentBooking) return;
    updateAttendanceStatus(currentBooking.id, status);
    triggerHaptic(status === "attended" ? "success" : "light");
    showToast(
      `Presença atualizada para ${
        status === "attended"
          ? "Presente"
          : status === "missed"
          ? "Falta"
          : status === "justified"
          ? "Justificado"
          : "Pendente"
      }`
    );
  };

  // Métricas
  const totalClasses = localStudent.totalClasses ?? 142;
  const presenceCount = localStudent.monthlyPresence ?? 16;
  const absencesCount = localStudent.monthlyAbsences ?? 1;
  const totalMonth = presenceCount + absencesCount;
  const presenceRate = totalMonth > 0 ? Math.round((presenceCount / totalMonth) * 100) : 95;
  const frequencyLabel = presenceRate >= 90 ? "Excelente" : presenceRate >= 75 ? "Muito Boa" : "Regular";
  const frequencyColor = presenceRate >= 90 ? "text-emerald-400" : presenceRate >= 75 ? "text-amber-400" : "text-zinc-400";

  // Meses para o gráfico de frequência (Jan a Dez)
  const MONTHS_DATA = [
    { month: "Jan", val: 14, max: 16 },
    { month: "Fev", val: 15, max: 16 },
    { month: "Mar", val: 13, max: 16 },
    { month: "Abr", val: 15, max: 16 },
    { month: "Mai", val: 14, max: 16 },
    { month: "Jun", val: 12, max: 16 },
    { month: "Jul", val: 15, max: 16 },
    { month: "Ago", val: 13, max: 16 },
    { month: "Set", val: presenceCount || 15, max: 16, current: true },
    { month: "Out", val: 14, max: 16 },
    { month: "Nov", val: 13, max: 16 },
    { month: "Dez", val: 14, max: 16 },
  ];

  // Agenda semanal
  const weeklySchedule = localStudent.weeklySchedule && localStudent.weeklySchedule.length > 0
    ? localStudent.weeklySchedule
    : ["Segunda · 08:00", "Quarta · 08:00", "Sexta · 08:00"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------------------------------------------------------------- */}
        {/* 1. TOP BAR DE NAVEGAÇÃO (ESTILO PILATESFLOW) */}
        {/* ---------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-zinc-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all flex items-center gap-1 active:scale-95 shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Voltar</span>
            </button>

            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
                Perfil do Aluno
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                {localStudent.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {localStudent.phone && (
              <a
                href={`https://wa.me/${localStudent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá, ${localStudent.name}! Aqui é o seu treinador. Passando para alinhar seus treinos...`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="Conversar no WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsEditMode(!isEditMode);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                isEditMode
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30"
                  : "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border-white/10"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-300" />
              <span>{isEditMode ? "Ver Perfil" : "Editar Aluno"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CORPO DO MODAL (SCROLL) */}
        {/* ---------------------------------------------------------------- */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 no-scrollbar flex-1">
          {/* MODO EDIÇÃO DO ALUNO */}
          {isEditMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Editar Informações do Aluno</h4>
                  <p className="text-xs text-zinc-400">
                    Altere nome, contato, plano, objetivo ou notas gerais deste aluno.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="11987654321"
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="aluno@email.com"
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Idade
                  </label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Objetivo Principal
                  </label>
                  <select
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value as StudentProfile["goal"])}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Força & Performance">Força & Performance</option>
                    <option value="Condicionamento Geral">Condicionamento Geral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Plano Contratado
                  </label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    {coachPlans.length > 0 ? (
                      coachPlans.map((p) => (
                        <option key={p.id} value={`${p.name} (R$ ${p.price}/mês)`}>
                          {p.name} — R$ {p.price}/mês
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Mensal VIP (R$ 55/mês)">Mensal VIP (R$ 55/mês)</option>
                        <option value="Mensal Pro (R$ 45/mês)">Mensal Pro (R$ 45/mês)</option>
                        <option value="Mensal Básico (R$ 35/mês)">Mensal Básico (R$ 35/mês)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Status da Matrícula
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Situação da Mensalidade
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    <option value="pago">✓ Pago (Em dia)</option>
                    <option value="atrasado">⚠️ Atrasado (Pendente cobrança)</option>
                    <option value="pendente">🕒 Pendente (Aguardando vencimento)</option>
                    <option value="cancelado">✕ Cancelado / Inadimplente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Dia de Vencimento
                  </label>
                  <input
                    type="text"
                    value={editPaymentDueDate}
                    onChange={(e) => setEditPaymentDueDate(e.target.value)}
                    placeholder="Ex: Dia 10, Dia 05..."
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Contato de Emergência
                  </label>
                  <input
                    type="text"
                    value={editEmergency}
                    onChange={(e) => setEditEmergency(e.target.value)}
                    placeholder="Nome e telefone de familiar..."
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">
                  Observações Gerais do Aluno
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Anotações sobre lesões, pontualidade, preferências ou metas..."
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* ------------------------------------------------------------ */}
              {/* 2. CARD HERO DO ALUNO (ESTILO PILATESFLOW) */}
              {/* ------------------------------------------------------------ */}
              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/90 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  {/* Avatar com status dot */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-purple-500/30 shrink-0">
                    {localStudent.avatarUrl ? (
                      <img
                        src={localStudent.avatarUrl}
                        alt={localStudent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-purple-400 text-2xl">
                        {localStudent.name.charAt(0)}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${
                        localStudent.status === "ativo" ? "bg-emerald-500" : "bg-zinc-500"
                      }`}
                      title={localStudent.status === "ativo" ? "Ativo" : "Inativo"}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {localStudent.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          localStudent.status === "ativo"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        • {localStudent.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          localStudent.paymentStatus === "pago"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : localStudent.paymentStatus === "atrasado"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-black"
                            : localStudent.paymentStatus === "pendente"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        💳 {localStudent.paymentStatus === "pago"
                          ? "Pago"
                          : localStudent.paymentStatus === "atrasado"
                          ? "Atrasado"
                          : localStudent.paymentStatus === "pendente"
                          ? "Pendente"
                          : "Cancelado"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                      {localStudent.goal || "Condicionamento físico e postura"}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-400">
                      {localStudent.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{localStudent.email}</span>
                        </div>
                      )}
                      {localStudent.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{localStudent.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {localStudent.registeredSince
                            ? `Desde ${localStudent.registeredSince}`
                            : `Matrícula ${localStudent.matricula}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges do Lado Direito */}
                <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/30 shadow-sm">
                    {localStudent.plan || "Mensal Premium"}
                  </span>
                  <div className="text-right">
                    <span className={`text-sm font-black ${frequencyColor} block`}>
                      {frequencyLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      frequência este mês
                    </span>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* 3. 4 KEY METRIC CARDS (ESTILO PILATESFLOW) */}
              {/* ------------------------------------------------------------ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* KPI 1: Total de Aulas */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/[0.08] flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono leading-none">
                      {totalClasses}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 font-medium">Total de Aulas</div>
                  </div>
                </div>

                {/* KPI 2: Presença Mensal */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/[0.08] flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono leading-none">
                      {presenceRate}%
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 font-medium">Presença Mensal</div>
                  </div>
                </div>

                {/* KPI 3: Faltas no Mês */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/[0.08] flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-2">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono leading-none">
                      {absencesCount}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 font-medium">Faltas no Mês</div>
                  </div>
                </div>

                {/* KPI 4: Última Presença */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/[0.08] flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">
                      {localStudent.lastPresence || "Hoje às 06:00"}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 font-medium">Última Presença</div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* 3.5 CONTROLE FINANCEIRO & MENSALIDADE */}
              {/* ------------------------------------------------------------ */}
              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/90 border border-white/[0.08] space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        localStudent.paymentStatus === "pago"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : localStudent.paymentStatus === "atrasado"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                          : localStudent.paymentStatus === "pendente"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        Gestão Financeira
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>Mensalidade & Pagamento</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            localStudent.paymentStatus === "pago"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : localStudent.paymentStatus === "atrasado"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-black"
                              : localStudent.paymentStatus === "pendente"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {localStudent.paymentStatus === "pago"
                            ? "✓ Pago"
                            : localStudent.paymentStatus === "atrasado"
                            ? "⚠️ Atrasado"
                            : localStudent.paymentStatus === "pendente"
                            ? "🕒 Pendente"
                            : "✕ Cancelado / Inadimplente"}
                        </span>
                      </h4>
                    </div>
                  </div>

                  {/* Informações de Vencimento e Valor */}
                  <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                    <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 block">Vencimento</span>
                      <span className="font-bold text-white">
                        {localStudent.paymentDueDate || "Dia 10"}
                      </span>
                    </div>
                    {localStudent.lastPaymentDate && (
                      <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-400 block">Último Pago</span>
                        <span className="font-bold text-emerald-400">
                          {localStudent.lastPaymentDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação de 1 Toque para o Professor */}
                <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">
                    Definir Situação do Pagamento com 1 Toque:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Marcar Pago */}
                    <button
                      type="button"
                      onClick={() => handleQuickSetPayment("pago")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        localStudent.paymentStatus === "pago"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black"
                          : "bg-white/[0.04] text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar Pago</span>
                    </button>

                    {/* Marcar Atrasado */}
                    <button
                      type="button"
                      onClick={() => handleQuickSetPayment("atrasado")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        localStudent.paymentStatus === "atrasado"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black"
                          : "bg-white/[0.04] text-rose-400 hover:bg-rose-600/20 border border-rose-500/30"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Marcar Atrasado</span>
                    </button>

                    {/* Marcar Pendente */}
                    <button
                      type="button"
                      onClick={() => handleQuickSetPayment("pendente")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        localStudent.paymentStatus === "pendente"
                          ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 font-black"
                          : "bg-white/[0.04] text-amber-400 hover:bg-amber-600/20 border border-amber-500/30"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pendente</span>
                    </button>

                    {/* Cobrança WhatsApp (se tiver telefone) */}
                    {localStudent.phone ? (
                      <a
                        href={getCobrarWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all active:scale-95"
                        title="Abrir WhatsApp com lembrete amigável pré-formatado"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Cobrar WhatsApp</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-white/[0.02] text-zinc-500 border border-white/[0.04] cursor-not-allowed"
                      >
                        <span>Sem WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* 4. SEÇÃO SE HOUVER AULA SELECIONADA NA AGENDA */}
              {/* ------------------------------------------------------------ */}
              {currentBooking && (
                <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/90 border border-purple-500/30 space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                        Aula Agendada
                      </span>
                      <h4 className="text-sm font-black text-white mt-0.5">
                        {currentBooking.slotDay} às {currentBooking.slotTime} (55 min)
                      </h4>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/[0.06] text-zinc-300 border border-white/10">
                      Status:{" "}
                      {currentBooking.attendanceStatus === "attended"
                        ? "Presente"
                        : currentBooking.attendanceStatus === "missed"
                        ? "Falta"
                        : currentBooking.attendanceStatus === "justified"
                        ? "Justificado"
                        : "Pendente"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">
                      Marcar Presença do Aluno:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingAttendance("attended")}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentBooking.attendanceStatus === "attended"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                            : "bg-white/[0.04] text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Presente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateBookingAttendance("missed")}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentBooking.attendanceStatus === "missed"
                            ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                            : "bg-white/[0.04] text-red-400 hover:bg-red-500/20 border border-red-500/30"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Falta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateBookingAttendance("justified")}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentBooking.attendanceStatus === "justified"
                            ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                            : "bg-white/[0.04] text-amber-400 hover:bg-amber-600/20 border border-amber-500/30"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Justificar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateBookingAttendance("pending")}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentBooking.attendanceStatus === "pending" ||
                          currentBooking.attendanceStatus === "scheduled"
                            ? "bg-slate-600 text-white"
                            : "bg-white/[0.04] text-zinc-300 hover:bg-slate-700/40 border border-slate-600/30"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendente</span>
                      </button>
                    </div>
                  </div>

                  {/* Observações da aula */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">
                        Observações da Aula de Hoje:
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveBookingNotes}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Salvar nota
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Ex: Treinou bem costas, sentiu leve cansaço no final..."
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveBookingNotes}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shrink-0"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* 5. DUAS COLUNAS PRINCIPAIS: FREQUÊNCIA MENSAL + AGENDA SEMANAL */}
              {/* ------------------------------------------------------------ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* COLUNA ESQUERDA: GRÁFICO DE FREQUÊNCIA MENSAL (12 MESES) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/80 border border-white/[0.08] flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-white">Frequência Mensal</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Presenças e consistência nos últimos 12 meses
                    </p>
                  </div>

                  {/* Gráfico de Barras Customizado */}
                  <div className="pt-4 pb-1">
                    <div className="flex items-end justify-between gap-1.5 h-36 border-b border-white/[0.08] px-1 pb-2">
                      {MONTHS_DATA.map((item, idx) => {
                        const heightPct = Math.round((item.val / item.max) * 100);
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end h-full group relative"
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-1.5 py-0.5 rounded bg-zinc-950 border border-white/10 text-[9px] font-bold text-purple-300 whitespace-nowrap z-10">
                              {item.val} aulas
                            </div>

                            {/* Barra */}
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[20px] rounded-t-lg transition-all ${
                                item.current
                                  ? "bg-gradient-to-t from-purple-600 to-purple-400 shadow-md shadow-purple-500/30"
                                  : "bg-purple-600/70 hover:bg-purple-500/90"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Rótulos dos Meses */}
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-2 font-mono px-1">
                      {MONTHS_DATA.map((item, idx) => (
                        <span
                          key={idx}
                          className={item.current ? "text-purple-300 font-bold" : ""}
                        >
                          {item.month}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: AGENDA SEMANAL & OBSERVAÇÕES */}
                <div className="space-y-4">
                  {/* Agenda Semanal */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/80 border border-white/[0.08] space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">Agenda Semanal</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Aulas e horários recorrentes do aluno
                      </p>
                    </div>

                    <div className="space-y-2">
                      {weeklySchedule.map((slot, index) => {
                        const parts = slot.split("·");
                        const day = parts[0]?.trim() || slot;
                        const time = parts[1]?.trim() || "";
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                              <span className="text-xs font-bold text-white">{day}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-zinc-300">
                              {time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bloco de Observações */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/80 border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Observações do Treinador
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] text-xs text-zinc-300 leading-relaxed italic">
                      "{localStudent.notes ||
                        localStudent.notesFromCoach ||
                        "Aluna exemplar, nunca falta sem avisar e mantém consistência com os horários."}"
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* 6. FICHA DE TREINO PREVENTIVA / ATIVA */}
              {/* ------------------------------------------------------------ */}
              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/80 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      Ficha Prescrita
                    </span>
                    <h4 className="text-sm font-black text-white">
                      {localStudent.currentRoutineTitle || "Treino Personalizado"}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      Prescrito em {localStudent.prescribedAt || "Sem data"} por{" "}
                      {localStudent.prescribedBy || "Prof. Rodrigo"}
                    </p>
                  </div>
                </div>

                {onEditWorkout && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditWorkout(localStudent);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ver / Editar Ficha do Aluno</span>
                  </button>
                )}
              </div>

              {/* ------------------------------------------------------------ */}
              {/* 7. SITUAÇÃO DA MATRÍCULA & LIBERAÇÃO DE HORÁRIOS DA AGENDA */}
              {/* ------------------------------------------------------------ */}
              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/80 border border-white/[0.08] space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        localStudent.status === "ativo"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {localStudent.status === "ativo" ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">
                        Grade & Agenda do Personal
                      </span>
                      <h4 className="text-sm font-black text-white">
                        Situação da Matrícula & Horários
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border self-start sm:self-auto ${
                      localStudent.status === "ativo"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {localStudent.status === "ativo" ? "• Matrícula Ativa" : "✕ Matrícula Inativa"}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {localStudent.status === "ativo"
                    ? "Se este aluno não vai mais treinar ou cancelou o plano, você pode inativar a matrícula. Ao inativar, os horários deste aluno na agenda semanal serão desocupados imediatamente, liberando as vagas na grade para novos agendamentos, mantendo todo o histórico de presenças e treinos preservado no CRM."
                    : "Este aluno está com a matrícula INATIVA e seus horários foram liberados na grade de horários da agenda. Para voltar a treinar com este aluno, basta reativá-lo abaixo."}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {localStudent.status === "ativo" ? (
                    <button
                      type="button"
                      onClick={handleInactivateAndReleaseAgenda}
                      className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                      <UserX className="w-4 h-4 text-rose-400" />
                      <span>Inativar Aluno & Liberar Horários na Agenda</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReactivateStudent}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/30"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Reativar Matrícula do Aluno</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
