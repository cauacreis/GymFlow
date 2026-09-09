"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Play, Pause, RotateCcw, Plus, Bell, Sparkles } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSeconds?: number;
}

export function RestTimerModal({ isOpen, onClose, defaultSeconds = 60 }: RestTimerModalProps) {
  const [totalTime, setTotalTime] = useState(defaultSeconds);
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Efeito do Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            triggerHaptic("heavy");
            return 0;
          }
          if (prev <= 4) {
            triggerHaptic("light");
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Reset ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(totalTime);
      setIsRunning(true);
      setIsFinished(false);
    } else {
      setIsRunning(false);
    }
  }, [isOpen, totalTime]);

  const toggleRun = () => {
    triggerHaptic("medium");
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    triggerHaptic("light");
    setTimeLeft(totalTime);
    setIsRunning(false);
    setIsFinished(false);
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

        {/* Presets Rápidos de Tempo (30s, 45s, 60s, 90s, 120s) */}
        <div className="flex items-center justify-center gap-1.5 w-full">
          {[30, 45, 60, 90, 120].map((secs) => (
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
