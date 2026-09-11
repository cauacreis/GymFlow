"use client";

import React, { useState } from "react";
import {
  X,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { studentLeaveCoach } from "@/lib/booking-store";
import { studentUnlinkCoach } from "@/lib/workout-store";

interface LeaveCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName: string;
  coachId?: string;
  coachPhone?: string;
  coachAvatar?: string;
  coachSpecialty?: string;
  currentPlan?: string;
  studentId: string;
  studentName: string;
  onSuccessLeave?: () => void;
}

export function LeaveCoachModal({
  isOpen,
  onClose,
  coachName,
  coachId,
  coachPhone,
  coachAvatar,
  coachSpecialty,
  currentPlan = "Mensal VIP (R$ 55/mês)",
  studentId,
  studentName,
  onSuccessLeave,
}: LeaveCoachModalProps) {
  const [selectedReason, setSelectedReason] = useState("Mudança de rotina ou horários");
  const [customFeedback, setCustomFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const REASON_OPTIONS = [
    "Mudança de rotina ou horários",
    "Dificuldade financeira temporária",
    "Prefiro treinar por conta própria no momento",
    "Mudança de academia ou de cidade",
    "Quero experimentar outro estilo de treino",
    "Outro motivo",
  ];

  const handleConfirmLeave = () => {
    setIsSubmitting(true);
    triggerHaptic("warning");

    const fullReason = customFeedback.trim()
      ? `${selectedReason}: ${customFeedback.trim()}`
      : selectedReason;

    // 1. Desocupa os agendamentos e envia notificações para coach e aluno
    studentLeaveCoach({
      studentId,
      studentName,
      coachId,
      coachName,
      reason: fullReason,
    });

    // 2. Atualiza o perfil do aluno para Treino Livre
    studentUnlinkCoach(studentId);

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      if (onSuccessLeave) onSuccessLeave();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Sair do Personal Trainer</h3>
              <p className="text-[10px] text-zinc-400">
                Você tem total liberdade para decidir se deseja continuar ou não
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh] no-scrollbar">
          {/* Card do Personal Atual */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {coachAvatar ? (
                <img src={coachAvatar} alt={coachName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-sm text-purple-400">{coachName.charAt(0)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">
                Personal Atual
              </span>
              <h4 className="text-sm font-black text-white truncate">{coachName}</h4>
              <p className="text-[11px] text-zinc-400 truncate">
                {coachSpecialty || "Hipertrofia & Musculação"} • {currentPlan}
              </p>
            </div>
          </div>

          {/* Destaques Informativos (O que acontece ao sair) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Ao confirmar seu desligamento:
            </span>

            <ul className="space-y-1.5 text-zinc-300 text-[11px] pt-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>
                  <strong>Horários liberados:</strong> Suas aulas agendadas com este treinador serão desocupadas na grade.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>
                  <strong>Histórico preservado:</strong> Todo o seu histórico de treinos, cargas e assiduidade continuará salvo no seu app.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>
                  <strong>Treino Livre:</strong> Você poderá continuar treinando por conta própria ou contratar outro personal a qualquer momento.
                </span>
              </li>
            </ul>
          </div>

          {/* Motivo do Desligamento (Opcional) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400 block">
              Motivo do encerramento (Opcional):
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500/50"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Observação / Mensagem Adicional */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400 block">
              Mensagem ou feedback para o professor (Opcional):
            </label>
            <textarea
              rows={2}
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="Ex: Muito obrigado pelas aulas! Estou com imprevisto no trabalho..."
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 border-t border-white/[0.08] bg-zinc-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition-all active:scale-95"
          >
            Continuar com o Personal
          </button>

          <button
            type="button"
            onClick={handleConfirmLeave}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Encerrando..." : "Confirmar e Sair"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
