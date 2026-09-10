"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Dumbbell,
  Sparkles,
  Info,
  CheckCircle2,
  Flame,
  Activity,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface ExerciseModalData {
  id: string;
  name: string;
  muscle?: string;
  target?: string;
  equipment?: string;
  difficulty?: string;
  gifUrl?: string;
  mediaFrames?: string[];
  instructions?: string[];
  tips?: string[];
  notes?: string;
}

interface ExerciseGifModalProps {
  exercise: ExerciseModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExerciseGifModal({ exercise, isOpen, onClose }: ExerciseGifModalProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(800); // 800ms default
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  // Frames a exibir
  const frames = exercise?.mediaFrames && exercise.mediaFrames.length > 0
    ? exercise.mediaFrames
    : exercise?.gifUrl
    ? [exercise.gifUrl]
    : [];

  // Reset de estado quando abre modal ou muda o exercício
  useEffect(() => {
    if (isOpen) {
      setCurrentFrameIndex(0);
      setIsPlaying(true);
      setImageLoadError(false);
    }
  }, [isOpen, exercise?.id]);

  // Intervalo de animação em loop para os frames
  useEffect(() => {
    if (!isOpen || !isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, playbackSpeedMs);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, frames.length, playbackSpeedMs]);

  if (!isOpen || !exercise) return null;

  const currentFrameUrl = frames[currentFrameIndex] || exercise.gifUrl;

  const handleTogglePlay = () => {
    triggerHaptic("selection");
    setIsPlaying(!isPlaying);
  };

  const handlePrevFrame = () => {
    triggerHaptic("light");
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleNextFrame = () => {
    triggerHaptic("light");
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const handleChangeSpeed = (speedMs: number) => {
    triggerHaptic("selection");
    setPlaybackSpeedMs(speedMs);
  };

  const isEccentricPhase = currentFrameIndex === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Guia de Execução & Animação
              </span>
              <h2 className="text-sm sm:text-base font-black text-white line-clamp-1">
                {exercise.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Player de Animação / GIF */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] shadow-inner group">
            {/* Visualizador de Mídia */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full flex items-center justify-center bg-black/60 overflow-hidden">
              {currentFrameUrl && !imageLoadError ? (
                <img
                  key={currentFrameUrl}
                  src={currentFrameUrl}
                  alt={exercise.name}
                  onError={() => setImageLoadError(true)}
                  className="w-full h-full object-contain transition-all duration-300 select-none"
                  loading="eager"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 p-6 text-center">
                  <Activity className="w-8 h-8 text-emerald-500/40 animate-pulse" />
                  <p className="text-xs">Demonstração visual do exercício</p>
                </div>
              )}

              {/* Tag de Fase Biomecânica */}
              {frames.length > 1 && (
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wide backdrop-blur-md border shadow-lg transition-all ${
                      isEccentricPhase
                        ? "bg-sky-500/25 border-sky-400/40 text-sky-200"
                        : "bg-emerald-500/25 border-emerald-400/40 text-emerald-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full animate-ping ${
                        isEccentricPhase ? "bg-sky-400" : "bg-emerald-400"
                      }`}
                    />
                    {isEccentricPhase ? "Fase 1: Posição Inicial / Excêntrica" : "Fase 2: Pico de Contração"}
                  </span>
                </div>
              )}

              {/* Tag de Dificuldade / Equipamento */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                {exercise.difficulty && (
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-950/80 border border-white/10 text-zinc-300 text-[10px] font-medium backdrop-blur-md">
                    {exercise.difficulty}
                  </span>
                )}
              </div>
            </div>

            {/* Barra de Controles da Animação */}
            {frames.length > 1 && (
              <div className="p-2.5 bg-zinc-950/90 border-t border-white/[0.06] flex items-center justify-between gap-2">
                {/* Controles de Frame & Play/Pause */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevFrame}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition-all active:scale-90"
                    title="Quadro Anterior"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Animar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextFrame}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition-all active:scale-90"
                    title="Próximo Quadro"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Seletor de Velocidade da Cadência */}
                <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-1 rounded-xl border border-white/[0.06]">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase mr-1">Cadência:</span>
                  {[
                    { label: "1.2s", ms: 1200 },
                    { label: "0.8s", ms: 800 },
                    { label: "0.5s", ms: 500 },
                  ].map((s) => (
                    <button
                      key={s.ms}
                      onClick={() => handleChangeSpeed(s.ms)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        playbackSpeedMs === s.ms
                          ? "bg-emerald-500 text-zinc-950"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Badges de Músculos e Equipamentos */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Foco Muscular</span>
                <span className="text-xs font-bold text-white truncate block">
                  {exercise.target || exercise.muscle || "Geral"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Dumbbell className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Equipamento</span>
                <span className="text-xs font-bold text-white truncate block">
                  {exercise.equipment || "Livre / Peso do Corpo"}
                </span>
              </div>
            </div>
          </div>

          {/* Instruções Passo a Passo */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-2.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Como Executar com Técnica Perfeita
              </h3>
              <div className="space-y-2">
                {exercise.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                      {idx + 1}
                    </span>
                    <p className="flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dicas do Personal Trainer */}
          {exercise.tips && exercise.tips.length > 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Dicas de Ouro do Personal Trainer
              </h3>
              <ul className="space-y-1.5 text-xs text-emerald-100/90 leading-relaxed">
                {exercise.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : exercise.notes ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200/90 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-emerald-300">Dica Técnica:</strong> {exercise.notes}
              </p>
            </div>
          ) : null}
        </div>

        {/* Rodapé com Ação */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-zinc-900/60 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-zinc-400 font-mono">
            GymFlow • Animação e Guia de Execução
          </span>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold border border-white/[0.08] active:scale-95 transition-all"
          >
            Entendi, Voltar ao Treino
          </button>
        </div>
      </div>
    </div>
  );
}
