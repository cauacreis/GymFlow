"use client";

import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Play, Pause, RotateCcw, Plus, Bell, Sparkles, Volume2, VolumeX } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getWorkoutPreferences } from "@/lib/privacy-service";
import { requestScreenWakeLock, releaseScreenWakeLock } from "@/lib/wake-lock";
import { awardBadgeProgress } from "@/lib/gamification-service";

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSeconds?: number;
}

export function RestTimerModal({ isOpen, onClose, defaultSeconds }: RestTimerModalProps) {
  const getInitialSeconds = () => {
    if (defaultSeconds && defaultSeconds > 0) return defaultSeconds;
    const prefs = getWorkoutPreferences();
    return prefs.defaultRestTimerSeconds || 60;
  };

  const [totalTime, setTotalTime] = useState<number>(getInitialSeconds);
  const [timeLeft, setTimeLeft] = useState<number>(getInitialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const lastBeepRef = useRef<number | null>(null);

  // Sintetizador Web Audio API para alertas sonoros sem necessidade de arquivos externos
  const playBeep = (freq: number, duration: number, type: OscillatorType = "sine", gainVal: number = 0.2) => {
    const prefs = getWorkoutPreferences();
    if (!prefs.soundEnabled || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
    } catch {}
  };

  const playFinishedChime = () => {
    // Sequência de acordes melódicos para conclusão de descanso
    playBeep(523.25, 0.15, "triangle", 0.25); // C5
    setTimeout(() => playBeep(659.25, 0.15, "triangle", 0.25), 120); // E5
    setTimeout(() => playBeep(783.99, 0.35, "triangle", 0.3), 240); // G5
  };

  // Efeito do Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      // Solicita Screen Wake Lock para manter a tela do celular ligada
      requestScreenWakeLock();

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            triggerHaptic("heavy");
            playFinishedChime();
            releaseScreenWakeLock();

            // Premia a conquista Cronometrista de Aço (rest-master)
            awardBadgeProgress("rest-master", 1, {
              reason: "ao concluir seu tempo de descanso com disciplina",
            });

            return 0;
          }

          // Alertas nos últimos 3 segundos
          if (prev <= 4 && prev > 1 && lastBeepRef.current !== prev) {
            lastBeepRef.current = prev;
            triggerHaptic("light");
            playBeep(440, 0.08, "sine", 0.15); // A4
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      releaseScreenWakeLock();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Reset ao abrir modal
  useEffect(() => {
    if (isOpen) {
      const initial = getInitialSeconds();
      setTotalTime(initial);
      setTimeLeft(initial);
      setIsRunning(true);
      setIsFinished(false);
      lastBeepRef.current = null;
      requestScreenWakeLock();
    } else {
      setIsRunning(false);
      releaseScreenWakeLock();
    }
  }, [isOpen, defaultSeconds]);

  const toggleRun = () => {
    triggerHaptic("medium");
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    triggerHaptic("light");
    setTimeLeft(totalTime);
    setIsRunning(false);
    setIsFinished(false);
    lastBeepRef.current = null;
    releaseScreenWakeLock();
  };

  const addSeconds = (secs: number) => {
    triggerHaptic("light");
    setTimeLeft((prev) => prev + secs);
    setTotalTime((prev) => prev + secs);
  };

  const setPreset = (secs: number) => {
    triggerHaptic("medium");
    setTotalTime(secs);
    setTimeLeft(secs);
    setIsRunning(true);
    setIsFinished(false);
    lastBeepRef.current = null;
  };

  // Formatação MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Percentual para o anel SVG
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Timer de Descanso">
      <div className="flex flex-col items-center gap-5 py-2 text-center w-full">
        {/* Glow de Fundo */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Anel de Progresso Circular */}
        <div className="relative flex items-center justify-center w-52 h-52 my-1">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Trilho de Fundo */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="text-zinc-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Anel de Progresso Dinâmico */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className={`transition-all duration-300 ${
                isFinished
                  ? "text-red-500 animate-pulse"
                  : timeLeft <= 5
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
              strokeWidth="8"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Display Digital Central */}
          <div className="absolute flex flex-col items-center">
            <span
              className={`font-mono text-4xl font-black tracking-tight ${
                isFinished ? "text-red-400 animate-bounce" : "text-white"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-1">
              {isFinished ? "Hora da Série!" : isRunning ? "Recuperando..." : "Pausado"}
            </span>
          </div>
        </div>

        {/* Presets Rápidos de Tempo (30s, 45s, 60s, 90s, 120s, 180s) */}
        <div className="flex items-center justify-center gap-1.5 w-full flex-wrap">
          {[30, 45, 60, 90, 120, 180].map((secs) => (
            <button
              key={secs}
              onClick={() => setPreset(secs)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                totalTime === secs
                  ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>

        {/* Controles Principais (Play/Pause, Reset, +15s) */}
        <div className="flex items-center justify-center gap-3 w-full pt-1">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleRun}
            className="flex-1 max-w-[160px] h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.35)] active:scale-95 transition-all"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-black" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black ml-0.5" />
                <span>Iniciar</span>
              </>
            )}
          </button>

          <button
            onClick={() => addSeconds(15)}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.08] text-emerald-400 hover:text-emerald-300 flex items-center justify-center active:scale-95 transition-all text-xs font-mono font-bold"
            title="+15 segundos"
          >
            +15s
          </button>
        </div>

        {/* Dica Motivacional */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 bg-white/[0.02] py-2 px-4 rounded-xl border border-white/[0.04]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Controle respiratório acelera a remoção de ácido lático.</span>
        </div>
      </div>
    </Drawer>
  );
}
