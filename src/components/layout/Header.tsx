"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Flame, Sparkles } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  activeCalories?: number;
}

export function Header({
  cartCount,
  onOpenCart,
  onOpenAuth,
  activeCalories = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-2 pb-3 bg-gradient-to-b from-[#070709] via-[#070709]/90 to-transparent backdrop-blur-md">
      <div className="flex items-center justify-between p-2 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        
        {/* Logo GymFlow */}
        <Link href="/" className="flex items-center gap-2 pl-2 group">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-105">
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-none">
              Gym<span className="text-emerald-400">Flow</span>
            </span>
            <span className="text-[9px] font-medium text-zinc-400 tracking-wider uppercase leading-none mt-0.5">
              Nutrition Lab
            </span>
          </div>
        </Link>

        {/* Status / Ações */}
        <div className="flex items-center gap-1.5">
          {activeCalories > 0 ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Flame className="w-3 h-3 animate-pulse fill-emerald-400" />
              <span>{activeCalories} kcal</span>
            </div>
          ) : (
            <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>30m delivery</span>
            </div>
          )}

          {/* Botão de Autenticação / Perfil */}
          <button
            onClick={onOpenAuth}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            title="Conta & Login"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Botão da Sacola com Badge */}
          <button
            onClick={onOpenCart}
            className="relative w-9 h-9 rounded-full bg-emerald-500 text-black font-semibold flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
            title="Ver Sacola"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
