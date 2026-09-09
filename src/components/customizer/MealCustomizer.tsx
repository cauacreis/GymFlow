"use client";

import React, { useState } from "react";
import Image from "next/image";
import { INGREDIENTS, Ingredient } from "@/lib/data";
import { MacroEngine, MacroTotals } from "@/components/macros/MacroEngine";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Check, Plus, PackageCheck, Sparkles, Flame } from "lucide-react";

export interface CustomMealItem {
  id: string;
  name: string;
  base: Ingredient;
  protein: Ingredient;
  greens?: Ingredient;
  topping?: Ingredient;
  multiplier: number;
  totalPrice: number;
  macros: MacroTotals;
}

interface MealCustomizerProps {
  onAddToCart: (customMeal: CustomMealItem) => void;
}

export function MealCustomizer({ onAddToCart }: MealCustomizerProps) {
  // Ingredientes padrão selecionados
  const defaultBase = INGREDIENTS.find((i) => i.id === "b-1")!;
  const defaultProtein = INGREDIENTS.find((i) => i.id === "p-1")!;
  const defaultGreens = INGREDIENTS.find((i) => i.id === "g-1");
  const defaultTopping = INGREDIENTS.find((i) => i.id === "t-1");

  const [selectedBase, setSelectedBase] = useState<Ingredient>(defaultBase);
  const [selectedProtein, setSelectedProtein] = useState<Ingredient>(defaultProtein);
  const [selectedGreens, setSelectedGreens] = useState<Ingredient | undefined>(defaultGreens);
  const [selectedTopping, setSelectedTopping] = useState<Ingredient | undefined>(defaultTopping);
  const [isFamilyPack, setIsFamilyPack] = useState(false);
  const [activeStep, setActiveStep] = useState<"base" | "protein" | "greens" | "topping">("base");

  // Multiplicador: 1 para individual, 5 para kit semanal (com 10% desconto)
  const multiplier = isFamilyPack ? 5 : 1;
  const discountFactor = isFamilyPack ? 0.9 : 1.0;

  // Cálculo de Macros
  const currentMacros: MacroTotals = {
    calories:
      selectedBase.calories +
      selectedProtein.calories +
      (selectedGreens?.calories || 0) +
      (selectedTopping?.calories || 0),
    protein:
      selectedBase.protein +
      selectedProtein.protein +
      (selectedGreens?.protein || 0) +
      (selectedTopping?.protein || 0),
    carbs:
      selectedBase.carbs +
      selectedProtein.carbs +
      (selectedGreens?.carbs || 0) +
      (selectedTopping?.carbs || 0),
    fat:
      selectedBase.fat +
      selectedProtein.fat +
      (selectedGreens?.fat || 0) +
      (selectedTopping?.fat || 0),
  };

  // Cálculo de Preço
  const singlePrice =
    selectedBase.price +
    selectedProtein.price +
    (selectedGreens?.price || 0) +
    (selectedTopping?.price || 0);

  const finalTotalPrice = singlePrice * multiplier * discountFactor;

  const handleAddMeal = () => {
    const customMeal: CustomMealItem = {
      id: `custom-${Date.now()}`,
      name: isFamilyPack
        ? `Kit 5 Marmitas: ${selectedProtein.name} & ${selectedBase.name}`
        : `Bowl Personalizado: ${selectedProtein.name}`,
      base: selectedBase,
      protein: selectedProtein,
      greens: selectedGreens,
      topping: selectedTopping,
      multiplier,
      totalPrice: finalTotalPrice,
      macros: currentMacros,
    };
    onAddToCart(customMeal);
  };

  const stepIngredients = INGREDIENTS.filter((i) => i.category === activeStep);

  return (
    <section className="w-full px-4 py-2 flex flex-col gap-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>Monte Seu Bowl Fit</span>
          </h2>
          <p className="text-xs text-zinc-400">Escolha os ingredientes pesados na grama exata</p>
        </div>

        {/* Switch Individual vs Kit 5 Marmitas */}
        <div className="flex items-center p-0.5 rounded-full bg-white/[0.04] border border-white/10 text-xs">
          <button
            onClick={() => setIsFamilyPack(false)}
            className={`px-3 py-1 rounded-full transition-all text-xs font-semibold ${
              !isFamilyPack ? "bg-emerald-500 text-black shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            1x Bowl
          </button>
          <button
            onClick={() => setIsFamilyPack(true)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all text-xs font-semibold ${
              isFamilyPack
                ? "bg-emerald-500 text-black shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Kit 5x</span>
            <span className="text-[9px] bg-black/20 text-emerald-300 px-1 rounded-full">-10%</span>
          </button>
        </div>
      </div>

      {/* Motor de Macros em Tempo Real */}
      <MacroEngine macros={currentMacros} multiplier={1} />

      {/* Barra de Etapas em Pílulas */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        {[
          { id: "base" as const, label: "1. Base", selected: selectedBase.name.split(" ")[0] },
          { id: "protein" as const, label: "2. Proteína", selected: selectedProtein.name.split(" ")[0] },
          { id: "greens" as const, label: "3. Legumes", selected: selectedGreens ? selectedGreens.name.split(" ")[0] : "Nenhum" },
          { id: "topping" as const, label: "4. Topping", selected: selectedTopping ? selectedTopping.name.split(" ")[0] : "Nenhum" },
        ].map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all ${
              activeStep === step.id
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider">{step.label}</span>
            <span className="text-[9px] text-zinc-300 truncate max-w-[65px] mt-0.5">{step.selected}</span>
          </button>
        ))}
      </div>

      {/* Lista de Opções da Etapa Atual */}
      <div className="grid grid-cols-2 gap-2.5">
        {stepIngredients.map((item) => {
          let isSelected = false;
          if (activeStep === "base") isSelected = selectedBase.id === item.id;
          if (activeStep === "protein") isSelected = selectedProtein.id === item.id;
          if (activeStep === "greens") isSelected = selectedGreens?.id === item.id;
          if (activeStep === "topping") isSelected = selectedTopping?.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (activeStep === "base") setSelectedBase(item);
                if (activeStep === "protein") setSelectedProtein(item);
                if (activeStep === "greens") {
                  setSelectedGreens(selectedGreens?.id === item.id ? undefined : item);
                }
                if (activeStep === "topping") {
                  setSelectedTopping(selectedTopping?.id === item.id ? undefined : item);
                }
              }}
              className={`relative p-2.5 rounded-2xl border transition-all cursor-pointer select-none group flex flex-col justify-between ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              {/* Check de Seleção */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center z-10 shadow">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Imagem do Ingrediente */}
              <div className="relative w-full h-20 rounded-xl overflow-hidden mb-2 bg-black/40 border border-white/5">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="160px"
                />
              </div>

              {/* Dados do Ingrediente */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate max-w-[100px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400">
                  <span>{item.portion}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">{item.protein}g prot</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                  <span className="text-xs font-bold text-white">{formatCurrency(item.price)}</span>
                  <span className="text-[9px] text-zinc-400">{item.calories} kcal</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra Inferior com Valor e CTA */}
      <div className="p-3 rounded-2xl bg-[#0A0A0E] border border-white/10 shadow-lg flex items-center justify-between mt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
            {isFamilyPack ? "Total (5 Marmitas -10%)" : "Total do Bowl"}
          </span>
          <span className="text-lg font-black text-white">{formatCurrency(finalTotalPrice)}</span>
        </div>

        <Button
          size="md"
          variant="primary"
          icon={<PackageCheck className="w-4 h-4 text-black" />}
          onClick={handleAddMeal}
        >
          Adicionar Bowl
        </Button>
      </div>
    </section>
  );
}
