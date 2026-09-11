"use client";

import React, { useState } from "react";
import {
  X,
  Scale,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Ruler,
  FileText,
  Plus,
  Minus,
  Activity,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { addBodyMetric } from "@/lib/body-metrics-store";

interface NewBodyMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialWeight?: number;
  initialBodyFat?: number;
}

export function NewBodyMetricModal({
  isOpen,
  onClose,
  onSuccess,
  initialWeight = 78.4,
  initialBodyFat = 13.8,
}: NewBodyMetricModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState(initialWeight);
  const [bodyFat, setBodyFat] = useState(initialBodyFat);
  const [customMuscleMass, setCustomMuscleMass] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Circunferências opcionais
  const [showCircumferences, setShowCircumferences] = useState(false);
  const [waistCm, setWaistCm] = useState<string>("");
  const [armCm, setArmCm] = useState<string>("");
  const [chestCm, setChestCm] = useState<string>("");
  const [thighCm, setThighCm] = useState<string>("");

  if (!isOpen) return null;

  // Cálculos dinâmicos em tempo real
  const autoMuscleMass = Number((weight * (1 - bodyFat / 100)).toFixed(1));
  const autoFatMass = Number((weight * (bodyFat / 100)).toFixed(1));
  const effectiveMuscleMass = customMuscleMass ? Number(customMuscleMass) : autoMuscleMass;

  const handleAdjustWeight = (delta: number) => {
    triggerHaptic("light");
    setWeight((prev) => Number(Math.max(30, Math.min(250, prev + delta)).toFixed(1)));
  };

  const handleAdjustBodyFat = (delta: number) => {
    triggerHaptic("light");
    setBodyFat((prev) => Number(Math.max(3, Math.min(60, prev + delta)).toFixed(1)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || weight <= 0 || !bodyFat || bodyFat <= 0) return;

    triggerHaptic("success");

    addBodyMetric({
      date,
      weight: Number(weight),
      bodyFat: Number(bodyFat),
      muscleMass: Number(effectiveMuscleMass),
      fatMass: Number(autoFatMass),
      waistCm: waistCm ? Number(waistCm) : undefined,
      armCm: armCm ? Number(armCm) : undefined,
      chestCm: chestCm ? Number(chestCm) : undefined,
      thighCm: thighCm ? Number(thighCm) : undefined,
      notes: notes.trim() || undefined,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white leading-none">
                Nova Medição Corporal
              </h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Registre seu peso, gordura e acompanhe a evolução
              </p>
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

        {/* Corpo do Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-left">
          {/* Data da Medição */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Data da Medição
            </label>
            <input
              type="date"
              required
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Peso Corporal (kg) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-sky-400" /> Peso Corporal (kg)
              </label>
              <span className="text-lg font-black text-sky-400 font-mono">{weight.toFixed(1)} kg</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustWeight(-0.5)}
                className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                step="0.1"
                min="30"
                max="250"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="flex-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-center text-sm font-black text-white font-mono focus:outline-none focus:border-sky-500/50"
              />

              <button
                type="button"
                onClick={() => handleAdjustWeight(0.5)}
                className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gordura Corporal (% BF) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Gordura Corporal (% BF)
              </label>
              <span className="text-lg font-black text-teal-400 font-mono">{bodyFat.toFixed(1)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustBodyFat(-0.5)}
                className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                step="0.1"
                min="3"
                max="60"
                required
                value={bodyFat}
                onChange={(e) => setBodyFat(Number(e.target.value))}
                className="flex-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-center text-sm font-black text-white font-mono focus:outline-none focus:border-teal-500/50"
              />

              <button
                type="button"
                onClick={() => handleAdjustBodyFat(0.5)}
                className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resumo Instantâneo de Composição Corporal */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" /> Massa Magra
              </span>
              <div className="mt-1">
                <span className="text-base font-black text-emerald-400 font-mono">
                  {effectiveMuscleMass.toFixed(1)} kg
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  ({(100 - bodyFat).toFixed(1)}% do peso)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Massa Gorda
              </span>
              <div className="mt-1">
                <span className="text-base font-black text-amber-400 font-mono">
                  {autoFatMass.toFixed(1)} kg
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  ({bodyFat.toFixed(1)}% do peso)
                </span>
              </div>
            </div>
          </div>

          {/* Seção Expansível: Medidas de Circunferência */}
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCircumferences(!showCircumferences)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-sky-400" /> Circunferências Corporais (Opcional)
              </span>
              {showCircumferences ? (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {showCircumferences && (
              <div className="p-4 pt-1 border-t border-white/[0.06] grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Cintura / Abdômen (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    placeholder="Ex: 80.0"
                    className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Braço Contraído (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={armCm}
                    onChange={(e) => setArmCm(e.target.value)}
                    placeholder="Ex: 37.5"
                    className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Tórax / Peitoral (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={chestCm}
                    onChange={(e) => setChestCm(e.target.value)}
                    placeholder="Ex: 102.0"
                    className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Coxa (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thighCm}
                    onChange={(e) => setThighCm(e.target.value)}
                    placeholder="Ex: 58.0"
                    className="w-full mt-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Anotações / Contexto */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-zinc-400" /> Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Medição em jejum pela manhã, após 8h de sono..."
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Medição</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
