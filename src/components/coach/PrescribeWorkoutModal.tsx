"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  UserCheck,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { StudentProfile, assignWorkoutToStudent, getStoredStudents } from "@/lib/workout-store";
import { PreFormedWorkoutRoutine } from "@/lib/exercisedb";

interface PrescribeWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: PreFormedWorkoutRoutine | null;
  onSuccess?: (studentName: string, routineName: string) => void;
  defaultStudentId?: string;
}

export function PrescribeWorkoutModal({
  isOpen,
  onClose,
  routine,
  onSuccess,
  defaultStudentId,
}: PrescribeWorkoutModalProps) {
  if (!isOpen || !routine) return null;

  const students = getStoredStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    defaultStudentId || students[0]?.id || ""
  );
  const [coachNotes, setCoachNotes] = useState<string>(
    `Prescrição "${routine.name}" adaptada para o seu objetivo. Mantenha a cadência e execute com boa técnica!`
  );

  const targetStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const totalExercises = routine.splits.reduce((acc, s) => acc + s.exercises.length, 0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    triggerHaptic("success");

    assignWorkoutToStudent(targetStudent.id, {
      routineTitle: routine.name,
      coachNotes: coachNotes.trim() || `Prescrição ${routine.name} focada em ${targetStudent.goal}.`,
      splits: routine.splits,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    });

    if (onSuccess) {
      onSuccess(targetStudent.name, routine.name);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Prescrever Ficha para Aluno</h3>
              <p className="text-[10px] text-zinc-400">Atribuir protocolo diretamente ao app do aluno</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumo da Ficha Selecionada */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {routine.category}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">{routine.frequency}</span>
          </div>
          <h4 className="text-sm font-black text-white">{routine.name}</h4>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{routine.description}</p>

          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06] text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-white">{routine.splits.length}</strong> Divisões (
              {routine.splits.map((s) => s.id).join(", ")})
            </span>
            <span>•</span>
            <span>
              <strong className="text-white">{totalExercises}</strong> Exercícios no total
            </span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          {/* Seletor de Aluno */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Selecione o Aluno para Receber a Ficha:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                triggerHaptic("light");
                setSelectedStudentId(e.target.value);
              }}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id} className="bg-zinc-950 text-white">
                  {st.name} — {st.matricula} ({st.goal})
                </option>
              ))}
            </select>

            {targetStudent && (
              <div className="mt-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] flex justify-between items-center text-zinc-400">
                <span>Ficha atual do aluno:</span>
                <span className="font-bold text-zinc-200">{targetStudent.currentRoutineTitle}</span>
              </div>
            )}
          </div>

          {/* Observações / Recado Especial do Personal */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Orientações Personalizadas do Instrutor:
            </label>
            <textarea
              rows={3}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Ex: Amanda, foque na fase excêntrica do agachamento. Respeite os 60s de descanso..."
              className="w-full p-3 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
            />
          </div>

          {/* Divisões e Exercícios Resumo */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Estrutura das Divisões da Ficha:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {routine.splits.map((split) => (
                <div
                  key={split.id}
                  className="p-2 rounded-xl bg-zinc-950/60 border border-white/[0.05] text-[10px]"
                >
                  <div className="flex justify-between font-bold text-white">
                    <span>Divisão {split.id}</span>
                    <span className="text-emerald-400">{split.exercises.length} ex.</span>
                  </div>
                  <p className="text-zinc-400 truncate mt-0.5">{split.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-bold text-xs active:scale-98 transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Confirmar & Prescrever Ficha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
