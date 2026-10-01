"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Dumbbell,
  ShieldCheck,
  User,
  Share2,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { recordClassCompleted } from "@/lib/gamification-service";
import { saveCardioSession } from "@/lib/cardio-store";
import type { GymClass } from "./GymClassesView";

interface ClassVideoModalProps {
  isOpen: boolean;
  gymClass: GymClass | null;
  onClose: () => void;
  onCompleteClass?: (classId: string) => void;
}

export function ClassVideoModal({
  isOpen,
  gymClass,
  onClose,
  onCompleteClass,
}: ClassVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "exercises" | "details">("video");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Timer do treino ao vivo em vídeo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && isPlaying && !isCompleted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isPlaying, isCompleted]);

  // Reset do estado ao abrir modal
  useEffect(() => {
    if (isOpen && gymClass) {
      setIsPlaying(true);
      setElapsedSeconds(0);
      setActiveChapterIndex(0);
      setShowCelebration(false);
      
      // Verifica se já foi concluído anteriormente
      if (typeof window !== "undefined") {
        try {
          const completedList = JSON.parse(localStorage.getItem("gymflow_completed_classes") || "[]");
          setIsCompleted(completedList.includes(gymClass.id));
        } catch {
          setIsCompleted(false);
        }
      }
    }
  }, [isOpen, gymClass]);

  if (!isOpen || !gymClass) return null;

  // Cálculo de calorias em tempo real durante a reprodução
  const totalDurationSec = (gymClass.durationMinutes || 45) * 60;
  const currentProgress = Math.min(1, elapsedSeconds / totalDurationSec);
  const realTimeCalories = Math.round(currentProgress * (gymClass.caloriesBurnEstimate || 500));

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleFinishWorkout = () => {
    triggerHaptic("success");
    setIsCompleted(true);
    setShowCelebration(true);

    if (typeof window !== "undefined") {
      try {
        const completedList = JSON.parse(localStorage.getItem("gymflow_completed_classes") || "[]");
        if (!completedList.includes(gymClass.id)) {
          completedList.push(gymClass.id);
          localStorage.setItem("gymflow_completed_classes", JSON.stringify(completedList));
        }
      } catch {}
    }

    const categoryModalityMap: Record<string, string> = {
      "Spinning": "bicicleta",
      "HIIT & Funcional": "hiit",
      "Cardio & Lutas": "hiit",
      "Dança & Ritmos": "aula_coletiva",
      "Alongamento & Mobilidade": "caminhada",
    };
    const modType = categoryModalityMap[gymClass.category] || "aula_coletiva";
    const finalCal = gymClass.caloriesBurnEstimate || 450;
    const durMin = gymClass.durationMinutes || 45;

    saveCardioSession({
      title: gymClass.title,
      modality: modType,
      modalityLabel: gymClass.category,
      durationMinutes: durMin,
      actualCalories: finalCal,
      intensity: "alta",
      source: "on_demand_class",
      completedAt: new Date().toISOString(),
    });

    recordClassCompleted(gymClass.title, finalCal);

    if (onCompleteClass) {
      onCompleteClass(gymClass.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              {gymClass.category}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {gymClass.title}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                {gymClass.instructor}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player de Vídeo Responsivo */}
        <div className="relative w-full aspect-video bg-black shrink-0 overflow-hidden group">
          {gymClass.videoUrl ? (
            <iframe
              src={`${gymClass.videoUrl}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
              title={gymClass.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 relative">
              <img
                src={gymClass.coverImage || "/classes/class_spinning.jpg"}
                alt={gymClass.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
                <p className="text-xs font-bold text-white mt-3">Iniciar Treino Guiado</p>
              </div>
            </div>
          )}

          {/* Barra de Calorias e Tempo em Tempo Real */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono font-black text-white">
                {formatTime(elapsedSeconds)} / {gymClass.durationMinutes}:00
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 text-amber-300 shadow-lg">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold font-mono">
                ~{realTimeCalories} / {gymClass.caloriesBurnEstimate} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação Inferior do Modal */}
        <div className="flex items-center justify-around border-b border-white/[0.08] bg-zinc-900/40 px-4">
          <button
            onClick={() => setActiveTab("video")}
            className={`py-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "video"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Fases da Aula</span>
          </button>
          <button
            onClick={() => setActiveTab("exercises")}
            className={`py-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "exercises"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Exercícios & Equipamentos</span>
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`py-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "details"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sobre o Professor</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left">
          {/* ABA 1: FASES DA AULA & CRONOGRAMA */}
          {activeTab === "video" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Capítulos & Blocos de Treino
                </span>
                <span className="text-[11px] text-zinc-500">
                  {gymClass.chapters?.length || 4} blocos programados
                </span>
              </div>

              <div className="space-y-2">
                {(gymClass.chapters || [
                  { title: "Aquecimento Dinâmico & Ativação", time: "00:00 - 05:00", intensity: "Leve" },
                  { title: "Bloco Principal - Fase de Ritmo e Carga", time: "05:00 - 25:00", intensity: "Alta" },
                  { title: "Sprint Final & Queima Máxima", time: "25:00 - 38:00", intensity: "Extrema" },
                  { title: "Desaquecimento & Alongamento Miofascial", time: "38:00 - 45:00", intensity: "Relax" },
                ]).map((chap, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      triggerHaptic("light");
                      setActiveChapterIndex(idx);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      activeChapterIndex === idx
                        ? "bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                          activeChapterIndex === idx
                            ? "bg-emerald-500 text-black font-black"
                            : "bg-white/[0.06] text-zinc-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{chap.title}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">{chap.time}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        chap.intensity === "Extrema" || chap.intensity === "Alta"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/[0.06] text-zinc-400"
                      }`}
                    >
                      {chap.intensity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2: EXERCÍCIOS & EQUIPAMENTOS */}
          {activeTab === "exercises" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 mb-2">Equipamentos Necessários</h4>
                <div className="flex flex-wrap gap-2">
                  {(gymClass.equipment || ["Nenhum (Peso do corpo)", "Garrafa de Água", "Colchonete"]).map(
                    (eq, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {eq}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-300 mb-2">Músculos e Foco Principal</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(gymClass.targetMuscles || ["Cardio", "Pernas", "Core"]).map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-300 mb-2">Descrição e Objetivos</h4>
                <p className="text-xs text-zinc-400 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.06]">
                  {gymClass.description}
                </p>
              </div>
            </div>
          )}

          {/* ABA 3: SOBRE O PROFESSOR */}
          {activeTab === "details" && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={gymClass.instructorAvatar || "/icon-192.png"}
                  alt={gymClass.instructor}
                  className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30"
                />
                <div>
                  <h4 className="text-sm font-black text-white">{gymClass.instructor}</h4>
                  <p className="text-xs text-emerald-400 font-semibold">
                    {gymClass.category} Specialist • GymFlow Verified
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Treinador com ampla experiência em aulas coletivas de alta performance. Todas as
                séries são estruturadas com cadência controlada para garantir máxima queima calórica
                e segurança biomecânica.
              </p>
            </div>
          )}
        </div>

        {/* Modal de Comemoração de Conclusão */}
        {showCelebration && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300 z-30">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Aula Concluída com Sucesso!</h3>
            <p className="text-xs text-zinc-300 max-w-sm mb-4">
              Parabéns! Você concluiu a aula <strong>{gymClass.title}</strong> e queimou
              aproximadamente ~{gymClass.caloriesBurnEstimate} kcal.
            </p>
            <div className="flex items-center gap-3 mb-6 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/10">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black text-amber-300">+150 XP de Gamificação</span>
            </div>
            <button
              onClick={() => {
                setShowCelebration(false);
                onClose();
              }}
              className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              Continuar Treinando
            </button>
          </div>
        )}

        {/* Footer do Modal com Ações */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-white/[0.08] bg-zinc-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>{gymClass.durationMinutes} min de treino</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFinishWorkout}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_16px_rgba(16,185,129,0.3)]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? "Aula Concluída ✓" : "Concluir Aula (+150 XP)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
