"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  X,
  Bell,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredBookings,
  isSlotToday,
  getStoredCoaches,
  BookingRequest,
  CoachTrainer,
} from "@/lib/booking-store";
import {
  getStoredStudents,
  StudentProfile,
  getStoredCoachPlans,
} from "@/lib/workout-store";
import {
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
} from "@/lib/reminders-service";

interface StudentReminderBannerProps {
  studentId?: string;
  onNavigateToAgenda?: () => void;
}

export function StudentReminderBanner({
  studentId = "student_carlos",
  onNavigateToAgenda,
}: StudentReminderBannerProps) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [todayBooking, setTodayBooking] = useState<BookingRequest | null>(null);
  const [coach, setCoach] = useState<CoachTrainer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const loadData = () => {
      const students = getStoredStudents();
      const currentStudent =
        students.find((s) => s.id === studentId) ||
        students.find((s) => s.id === "student_carlos") ||
        students[0];

      setStudent(currentStudent || null);

      const coaches = getStoredCoaches();
      setCoach(coaches[0] || null);

      const bookings = getStoredBookings();
      const activeBookingToday = bookings.find(
        (b) =>
          b.studentId === currentStudent?.id &&
          isSlotToday(b.slotDay) &&
          b.status === "accepted" &&
          b.attendanceStatus !== "attended"
      );
      setTodayBooking(activeBookingToday || null);

      if (typeof window !== "undefined" && isBrowserNotificationSupported()) {
        setBrowserPermission(getBrowserNotificationPermission());
      }
    };

    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("gymflow:workout-updated", handleUpdate);
    window.addEventListener("gymflow:booking-updated", handleUpdate);
    return () => {
      window.removeEventListener("gymflow:workout-updated", handleUpdate);
      window.removeEventListener("gymflow:booking-updated", handleUpdate);
    };
  }, [studentId]);

  if (dismissed) return null;

  // Verifica se há aula hoje
  const hasClassToday = Boolean(
    todayBooking || (student?.todayAttendanceStatus === "agendado" && student?.scheduledTimeToday)
  );
  const classTime = todayBooking?.slotTime || student?.scheduledTimeToday || "16:00";

  // Verifica status financeiro
  const isOverdue = student?.paymentStatus === "atrasado";
  const isPending = student?.paymentStatus === "pendente";

  const todayDate = new Date().getDate();
  let isDueToday = false;
  if (student?.paymentDueDate) {
    const match = student.paymentDueDate.match(/(\d{1,2})/);
    if (match && match[1] && parseInt(match[1], 10) === todayDate) {
      isDueToday = true;
    }
  }

  const coachPhone = coach?.phone ? coach.phone.replace(/\D/g, "") : "11999990000";
  const pixKey = coachPhone;

  const handleCopyPix = () => {
    triggerHaptic("success");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleOpenWhatsAppProof = () => {
    triggerHaptic("selection");
    const firstName = student?.name ? student.name.split(" ")[0] : "Aluno";
    const text = `Olá, professor! Aqui está o comprovante da minha mensalidade do GymFlow (${
      student?.plan || "Plano Mensal"
    }) de ${firstName}. 💳`;
    const url = `https://wa.me/55${coachPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEnablePush = async () => {
    triggerHaptic("selection");
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
  };

  // Se não tem aula hoje, não tem pendência de pagamento e já tem permissão de push, não precisa exibir o banner
  if (!hasClassToday && !isOverdue && !isPending && !isDueToday && browserPermission === "granted") {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-2.5 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* 1. CARD DE TREINO AGENDADO PARA HOJE */}
      {hasClassToday && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-3.5 shadow-lg shadow-emerald-500/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950">
                  Treino Hoje
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {classTime}
                </span>
              </div>
              <p className="text-xs text-white font-bold truncate mt-0.5">
                Aula com {coach?.name || "Prof. Rodrigo"}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                Prepare a garrafa d'água e consulte sua ficha de treino.
              </p>
            </div>
          </div>

          {onNavigateToAgenda && (
            <button
              onClick={() => {
                triggerHaptic("light");
                onNavigateToAgenda();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>Ver Agenda</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 2. CARD DE PAGAMENTO (VENCE HOJE OU ATRASADO) */}
      {(isOverdue || isPending || isDueToday) && (
        <div
          className={`relative overflow-hidden rounded-2xl border p-3.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isOverdue
              ? "bg-gradient-to-r from-rose-950/60 via-zinc-900 to-zinc-900 border-rose-500/30 shadow-rose-500/5"
              : "bg-gradient-to-r from-purple-950/60 via-zinc-900 to-zinc-900 border-purple-500/30 shadow-purple-500/5"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isOverdue
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : "bg-purple-500/20 border-purple-500/40 text-purple-400"
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isOverdue
                      ? "bg-rose-500 text-white"
                      : "bg-purple-500 text-white"
                  }`}
                >
                  {isOverdue ? "Mensalidade em Aberto" : "Mensalidade Vence Hoje"}
                </span>
                <span className="text-xs text-zinc-300 font-bold">
                  {student?.plan || "Plano Mensal"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Chave PIX do Personal: <span className="font-mono text-white font-bold">{pixKey}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleCopyPix}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-bold flex items-center gap-1.5 border border-white/[0.1] active:scale-95 transition-all"
            >
              {copiedPix ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copiar PIX</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsAppProof}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
              <span>Enviar Comprovante</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ATALHO DE NOTIFICAÇÕES NO CELULAR SE AINDA NÃO ATIVADO */}
      {browserPermission === "default" && (
        <div className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">Deseja receber avisos de treinos e pagamentos na tela do celular?</span>
          </div>
          <button
            onClick={handleEnablePush}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 shrink-0 transition-colors"
          >
            Ativar Alertas
          </button>
        </div>
      )}
    </div>
  );
}
