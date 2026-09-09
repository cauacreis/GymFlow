"use client";

import React from "react";
import Image from "next/image";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { PresetMeal } from "@/lib/data";
import { triggerHaptic } from "@/lib/haptic";
import {
  Flame,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Microwave,
  Wind,
  Plus,
  Sparkles,
} from "lucide-react";

interface DishDetailModalProps {
  meal: PresetMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (meal: PresetMeal) => void;
}

export function DishDetailModal({
  meal,
  isOpen,
  onClose,
  onAddToCart,
}: DishDetailModalProps) {
  if (!meal) return null;

  const handleAdd = () => {
    triggerHaptic("success");
    onAddToCart(meal);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={meal.name}>
      <div className="flex flex-col gap-4">
        {/* Foto do Prato com Badge */}
        <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-lg">
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover"
            sizes="(max-width: 440px) 100vw, 440px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-black shadow-md">
              {meal.badge}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold">
              {meal.category}
            </span>
          </div>
        </div>

        {/* Descrição & Tagline */}
        <div className="flex flex-col">
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            {meal.tagline}
          </span>
          <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
            {meal.name}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed mt-1">
            {meal.description}
          </p>
        </div>

        {/* Grid de Macronutrientes Pesados */}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black text-emerald-400">{meal.calories}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-medium">Calorias</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
            <span className="text-sm font-black text-white">{meal.protein}g</span>
            <span className="text-[10px] text-zinc-400 uppercase font-medium">Proteína</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
            <span className="text-sm font-black text-zinc-300">{meal.carbs}g</span>
            <span className="text-[10px] text-zinc-400 uppercase font-medium">Carboidratos</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
            <span className="text-sm font-black text-zinc-300">{meal.fat}g</span>
            <span className="text-[10px] text-zinc-400 uppercase font-medium">Gorduras</span>
          </div>
        </div>

        {/* Equivalente Esportivo */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400 shrink-0" />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-white">Equivalente de Treino</span>
            <span className="text-zinc-300 text-[11px]">
              Fornece combustível ideal para ~50 min de treino pesado ou 8km de corrida.
            </span>
          </div>
        </div>

        {/* Instruções de Aquecimento */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-white">Modo de Preparo Rápido:</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-white">Micro-ondas</span>
                <span className="text-[10px] text-zinc-400">3 a 4 min na tampa</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-white">Airfryer</span>
                <span className="text-[10px] text-zinc-400">6 min a 160°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selos de Qualidade */}
        <div className="flex items-center justify-around py-2 border-y border-white/5 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sem Conservantes
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Embalagem BPA Free
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Pesado
          </span>
        </div>

        {/* Barra de Ação e Preço */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Valor Unitário</span>
            <span className="text-lg font-black text-white">{formatCurrency(meal.price)}</span>
          </div>

          <Button
            size="lg"
            variant="primary"
            icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
            onClick={handleAdd}
          >
            Adicionar à Sacola
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
