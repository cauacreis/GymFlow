"use client";

import React from "react";
import Link from "next/link";
import { Flame, Sparkles, QrCode, User, UserCheck, GraduationCap, Bell } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

interface HeaderProps {
  streakDays?: number;
  viewMode?: "student" | "coach";
  onToggleViewMode?: () => void;
  onOpenCheckin: () => void;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  user: { name: string; email: string } | null;
}

export function Header({
  streakDays = 16,
  viewMode = "student",
  onToggleViewMode,
  onOpenCheckin,
  onOpenPlans,
  onOpenAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  user,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-2 pb-2 bg-gradient-to-b from-[#070709] via-[#070709]/95 to-transparent backdrop-blur-md">
      <div className="flex items-center justify-between p-2 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        {/* Logo GymFlow */}
        <Link href="/" className="flex items-center gap-2 pl-2 group">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-105">
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white leading-none">
              Gym<span className="text-emerald-400">Flow</span>
            </span>
            <span className="text-[8px] font-bold text-zinc-400 tracking-wider uppercase leading-none mt-0.5">
              {viewMode === "coach" ? "Portal Instrutor" : "Smart Fitness"}
            </span>
          </div>
        </Link>

        {/* Status / Ações Rápidas */}
        <div className="flex items-center gap-1.5">
          {/* Botão de Alternância de Perfil (Aluno ⇄ Professor) */}
          {onToggleViewMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleViewMode();
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all active:scale-95 ${
                viewMode === "coach"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
              }`}
              title={viewMode === "coach" ? "Voltar para Visão do Aluno" : "Acessar Modo Professor / Prescrição"}
            >
              {viewMode === "coach" ? (
                <>
                  <UserCheck className="w-3 h-3 text-amber-400" />
                  <span>CREF Ativo</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3 h-3 text-emerald-400" />
                  <span>Área do Prof</span>
                </>
              )}
            </button>
          )}

          {/* Botão do Sino de Notificações com Badge */}
          {onOpenNotifications && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenNotifications();
              }}
              className="relative w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Central de Alertas & Notificações"
            >
              <Bell className="w-3.5 h-3.5 text-zinc-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Botão de Acesso Rápido à Catraca */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              onOpenCheckin();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            title="Catraca Digital QR"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Botão de Planos VIP */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              onOpenPlans();
            }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
            title="Ver Planos"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Planos</span>
          </button>

          {/* Botão de Login / Perfil */}
          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenAuth();
            }}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              user
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold text-xs"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title={user ? `Logado como ${user.name}` : "Entrar / Cadastrar"}
          >
            {user ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
