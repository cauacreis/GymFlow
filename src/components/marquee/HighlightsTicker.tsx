"use client";

import React from "react";
import { Zap, ShieldCheck, Dumbbell, Leaf, Sparkles, Flame } from "lucide-react";

interface HighlightsTickerProps {
  onQuickFilter?: (tag: string) => void;
}

const HIGHLIGHTS = [
  { text: "Entrega em 30min na Academia", icon: Zap, color: "text-amber-400" },
  { text: "Macros 100% Pesados em Balança", icon: ShieldCheck, color: "text-emerald-400" },
  { text: "50g+ Proteína por Refeição", icon: Dumbbell, color: "text-emerald-300" },
  { text: "Embalagens BPA Free & Seguras", icon: Leaf, color: "text-teal-400" },
  { text: "Cozinha Funcional Sem Conservantes", icon: Sparkles, color: "text-emerald-400" },
  { text: "Déficit Calórico ou Bulking Limpo", icon: Flame, color: "text-amber-400" },
];

export function HighlightsTicker({ onQuickFilter }: HighlightsTickerProps) {
  return (
    <div className="w-full py-2 overflow-hidden relative select-none border-y border-white/[0.05] bg-black/40">
      {/* Máscara de desfoque lateral para efeito de fade infinito */}
      <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-[#070709] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-[#070709] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee gap-3">
        {[...HIGHLIGHTS, ...HIGHLIGHTS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => onQuickFilter && onQuickFilter(item.text)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer group shrink-0"
            >
              <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0 group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-zinc-300 group-hover:text-white whitespace-nowrap">
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
