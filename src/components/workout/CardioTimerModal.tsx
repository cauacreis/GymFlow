"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Flame,
  Timer,
  Check,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  TrendingUp,
  Zap,
  Activity,
  Footprints,
  Bike,
  Waves,
  RotateCw,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { CardioItem, CARDIO_TYPES_METADATA, CardioType } from "@/lib/exercisedb";

interface CardioTimerModalProps {
  cardio: CardioItem | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (cardioId: string, actualSeconds: number, actualCalories: number) => void;
}

export function CardioTimerModal({
  cardio,
  isOpen,
  onClose,
  onComplete,
}: CardioTimerModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isCountdown, setIsCountdown] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(20 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const hasPlayedHalfway = useRef(false);
  const lastCountdownBeep = useRef<number | null>(null);

  // Inicializa com dados do cárdio fornecido
  useEffect(() => {
    if (isOpen && cardio) {
      const initialSecs = Math.max(60, (cardio.durationMinutes || 20) * 60);
      setTotalSeconds(initialSecs);
      setRemainingSeconds(initialSecs);
      setElapsedSeconds(cardio.actualSeconds || 0);
      setIsRunning(false);
      setIsFinished(false);
      hasPlayedHalfway.current = false;
      lastCountdownBeep.current = null;
    }
  }, [isOpen, cardio?.id]);

  // Audio sintetizado via Web Audio API (sem dependências de rede)
  const playBeep = (freq: number, duration: number, type: OscillatorType = "sine", gainVal: number = 0.25) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, (duration + 0.1) * 1000);
    } catch {}
  };

  const playVictoryFanfare = () => {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => playBeep(freq, 0.25, "triangle", 0.3), idx * 140);
    });
  };

  // Loop de contagem
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setElapsedSeconds((prevElapsed) => {
          const nextElapsed = prevElapsed + 1;

          // Alerta na metade do tempo
          if (isCountdown && totalSeconds >= 120 && !hasPlayedHalfway.current) {
            if (nextElapsed >= Math.floor(totalSeconds / 2)) {
              hasPlayedHalfway.current = true;
              playBeep(587.33, 0.15, "sine", 0.2);
              setTimeout(() => playBeep(880, 0.25, "sine", 0.25), 160);
              triggerHaptic("selection");
            }
          }

          return nextElapsed;
        });

        if (isCountdown) {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              setIsFinished(true);
              triggerHaptic("success");
              playVictoryFanfare();
              return 0;
            }

            // Bip nos últimos 3 segundos
            if (prev <= 4 && prev > 1 && lastCountdownBeep.current !== prev) {
              lastCountdownBeep.current = prev;
              playBeep(440, 0.1, "sine", 0.2);
              triggerHaptic("light");
            }

            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isFinished, isCountdown, totalSeconds, soundEnabled]);

  if (!isOpen || !cardio) return null;

  const metadata = CARDIO_TYPES_METADATA[cardio.type] || CARDIO_TYPES_METADATA.outro;
  const targetCalories = cardio.targetCalories || Math.round(cardio.durationMinutes * metadata.defaultKcalPerMinute);

  // Calorias estimadas em tempo real
  const currentBurnedCalories = Math.round(
    targetCalories > 0 && totalSeconds > 0
      ? (elapsedSeconds / totalSeconds) * targetCalories
      : (elapsedSeconds / 60) * metadata.defaultKcalPerMinute
  );

  // Formatação de display MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100))
    : 0;

  const handleTogglePlay = () => {
    triggerHaptic("medium");
    if (isFinished) {
      // Reiniciar se já havia terminado
      setRemainingSeconds(totalSeconds);
      setElapsedSeconds(0);
      setIsFinished(false);
      hasPlayedHalfway.current = false;
      lastCountdownBeep.current = null;
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    triggerHaptic("heavy");
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(totalSeconds);
    setElapsedSeconds(0);
    hasPlayedHalfway.current = false;
    lastCountdownBeep.current = null;
  };

  const handleAddMinutes = (deltaMin: number) => {
    triggerHaptic("selection");
    const deltaSecs = deltaMin * 60;
    setTotalSeconds((t) => Math.max(60, t + deltaSecs));
    setRemainingSeconds((r) => Math.max(0, r + deltaSecs));
  };

  const handleCompleteWorkout = () => {
    triggerHaptic("success");
    playVictoryFanfare();
    if (onComplete) {
      onComplete(cardio.id, elapsedSeconds, Math.max(1, currentBurnedCalories));
    }
    onClose();
  };

  const getIcon = (type: CardioType) => {
    switch (type) {
      case "bicicleta":
        return <Bike className="w-5 h-5 text-sky-400" />;
      case "escada":
        return <Flame className="w-5 h-5 text-rose-400" />;
      case "esteira_corrida":
      case "hiit":
        return <Zap className="w-5 h-5 text-amber-400" />;
      case "esteira_inclinada":
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      case "eliptico":
        return <Activity className="w-5 h-5 text-indigo-400" />;
      case "corda":
        return <RotateCw className="w-5 h-5 text-red-400" />;
      case "remo":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case "caminhada":
        return <Footprints className="w-5 h-5 text-emerald-400" />;
      default:
        return <Timer className="w-5 h-5 text-zinc-400" />;
    }
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
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Timer */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              {getIcon(cardio.type)}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {metadata.label}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate max-w-[200px]">
                {cardio.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSoundEnabled(!soundEnabled);
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] active:scale-95 transition-all"
              title={soundEnabled ? "Desativar avisos sonoros" : "Ativar avisos sonoros"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo Central do Timer */}
        <div className="p-5 sm:p-6 flex flex-col items-center justify-center space-y-6">
          {/* Display Digital */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Anel de Progresso / Barra Circular */}
            <div className="relative w-56 h-56 rounded-full border-4 border-white/[0.06] flex flex-col items-center justify-center bg-zinc-900/40 shadow-inner">
              {/* Progresso visual circular */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="112"
                  cy="112"
                  r="104"
                  className="stroke-amber-500 transition-all duration-500 ease-linear"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 104}
                  strokeDashoffset={
                    2 * Math.PI * 104 * (1 - Math.min(1, elapsedSeconds / (totalSeconds || 1)))
                  }
                  strokeLinecap="round"
                />
              </svg>

              <div className="z-10 flex flex-col items-center text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  {isCountdown ? "Tempo Restante" : "Tempo Decorrido"}
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                  {formatTime(isCountdown ? remainingSeconds : elapsedSeconds)}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mt-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{currentBurnedCalories} kcal queimadas</span>
                </div>
              </div>
            </div>

            {/* Banner de Conclusão */}
            {isFinished && (
              <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 animate-bounce">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tempo Concluído! Bom trabalho!</span>
              </div>
            )}
          </div>

          {/* Ajuste Rápido de Minutos (+1 / -1) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddMinutes(-1)}
              disabled={totalSeconds <= 60}
              className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-zinc-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              <Minus className="w-3 h-3" /> 1 min
            </button>

            <span className="text-[11px] text-zinc-500 font-mono">
              Meta: {Math.round(totalSeconds / 60)} min ({targetCalories} kcal)
            </span>

            <button
              type="button"
              onClick={() => handleAddMinutes(1)}
              className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> 1 min
            </button>
          </div>

          {/* Orientações e Métricas do Cárdio */}
          <div className="w-full grid grid-cols-2 gap-2 text-left">
            {cardio.intensity && (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Intensidade</span>
                <span className="text-xs font-black capitalize text-zinc-200">{cardio.intensity}</span>
              </div>
            )}

            {cardio.speedKmh ? (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Velocidade</span>
                <span className="text-xs font-black text-zinc-200">{cardio.speedKmh} km/h</span>
              </div>
            ) : cardio.inclinePercent ? (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Inclinação</span>
                <span className="text-xs font-black text-zinc-200">{cardio.inclinePercent}%</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Progresso</span>
                <span className="text-xs font-black text-amber-400 font-mono">{progressPercent}%</span>
              </div>
            )}
          </div>

          {cardio.notes && (
            <div className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
              <span className="text-[9px] uppercase font-bold text-amber-400 block mb-0.5">
                Orientação
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">{cardio.notes}</p>
            </div>
          )}

          {/* Controles Principais do Timer */}
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleReset}
              className="p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] active:scale-95 transition-all"
              title="Reiniciar Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                isRunning
                  ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-zinc-950" />
                  <span>Pausar Cárdio</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>{elapsedSeconds > 0 ? "Retomar Cárdio" : "Iniciar Cárdio"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCompleteWorkout}
              className="p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-all"
              title="Marcar como Concluído"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Footer com botão de conclusão explícita */}
        <div className="p-4 border-t border-white/[0.08] bg-zinc-900/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setIsCountdown(!isCountdown);
            }}
            className="text-zinc-400 hover:text-white font-medium underline underline-offset-2"
          >
            {isCountdown ? "Modo Cronômetro (Crescente)" : "Modo Regressivo"}
          </button>

          <button
            type="button"
            onClick={handleCompleteWorkout}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Salvar Cárdio Realizado</span>
          </button>
        </div>
      </div>
    </div>
  );
}
