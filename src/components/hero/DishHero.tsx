"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PRESET_MEALS, PresetMeal } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";

interface DishHeroProps {
  onSelectMeal: (meal: PresetMeal) => void;
  onCustomizeMeal: (meal: PresetMeal) => void;
}

export function DishHero({ onSelectMeal, onCustomizeMeal }: DishHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentMeal = PRESET_MEALS[currentIndex];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PRESET_MEALS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % PRESET_MEALS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + PRESET_MEALS.length) % PRESET_MEALS.length);
  };

  return (
    <section 
      className="relative w-full px-4 pt-1 pb-4 flex flex-col"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Container Principal com Double-Bezel e Gradiente Escuro */}
      <div className="relative p-1.5 rounded-[2.25rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="relative w-full p-4 rounded-[calc(2.25rem-0.375rem)] bg-[#0A0A0E] overflow-hidden flex flex-col">
          
          {/* Luz de destaque no topo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Topo do Banner: Eyebrow + Badge de Categoria */}
          <div className="flex items-center justify-between mb-3 z-10">
            <Badge variant="emerald" size="sm" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{currentMeal.badge}</span>
            </Badge>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {currentMeal.category}
            </span>
          </div>

          {/* Imagem do Prato com Animação Fluida */}
          <div className="relative w-full h-48 rounded-2xl overflow-hidden my-1 bg-black/40 border border-white/5 group cursor-pointer" onClick={handleNext}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMeal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                className="relative w-full h-full"
              >
                <Image
                  src={currentMeal.image}
                  alt={currentMeal.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 440px) 100vw, 440px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-transparent to-black/20" />
              </motion.div>
            </AnimatePresence>

            {/* Setas discretas para navegação rápida */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-xs opacity-75 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-xs opacity-75 hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Informações do Prato */}
          <div className="mt-3 flex flex-col z-10">
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
              {currentMeal.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
              {currentMeal.description}
            </p>

            {/* Grid de Macronutrientes em Tempo Real */}
            <div className="grid grid-cols-4 gap-1.5 mt-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-xs font-extrabold text-emerald-400">{currentMeal.calories}</span>
                <span className="text-[9px] text-zinc-400 uppercase font-medium">Kcal</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
                <span className="text-xs font-extrabold text-white">{currentMeal.protein}g</span>
                <span className="text-[9px] text-zinc-400 uppercase font-medium">Proteína</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
                <span className="text-xs font-extrabold text-zinc-300">{currentMeal.carbs}g</span>
                <span className="text-[9px] text-zinc-400 uppercase font-medium">Carbos</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
                <span className="text-xs font-extrabold text-zinc-300">{currentMeal.fat}g</span>
                <span className="text-[9px] text-zinc-400 uppercase font-medium">Gorduras</span>
              </div>
            </div>

            {/* Barra de Ação: Preço + Botões */}
            <div className="flex items-center justify-between mt-4 pt-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Valor Unitário</span>
                <span className="text-base font-black text-white">
                  {formatCurrency(currentMeal.price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCustomizeMeal(currentMeal)}
                  className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
                >
                  Ajustar
                </button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5 text-black" />}
                  onClick={() => onSelectMeal(currentMeal)}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Paginação em Pontos Minimalistas */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {PRESET_MEALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-6 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Ver prato ${idx + 1}`}
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
