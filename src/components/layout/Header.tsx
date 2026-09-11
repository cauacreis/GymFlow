"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Flame, Sparkles, User, GraduationCap, Dumbbell, Bell, ArrowRightLeft } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { MasterAdminAuthModal } from "@/components/admin/MasterAdminAuthModal";

interface HeaderProps {
  streakDays?: number;
  viewMode?: "student" | "coach";
  onToggleViewMode?: () => void;
  onOpenProfile: () => void;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  user: { name: string; email: string; activeRole?: "student" | "coach"; avatarUrl?: string } | null;
}

export function Header({
  viewMode = "student",
  onToggleViewMode,
  onOpenProfile,
  onOpenPlans,
  onOpenAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  user,
}: HeaderProps) {

  const isCoach = viewMode === "coach";

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const flameTapCountRef = useRef(0);
  const lastFlameTapRef = useRef(0);

  // Atalho de teclado: Ctrl+Shift+A ou Cmd+Shift+A para acionar o terminal master
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        triggerHaptic("medium");
        setIsVaultModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFlameTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastFlameTapRef.current > 1200) {
      flameTapCountRef.current = 1;
    } else {
      flameTapCountRef.current += 1;
    }
    lastFlameTapRef.current = now;

    // 5 toques rápidos na chama ativam o terminal secreto do Administrador
    if (flameTapCountRef.current >= 5) {
      e.preventDefault();
      e.stopPropagation();
      flameTapCountRef.current = 0;
      triggerHaptic("heavy");
      setIsVaultModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full px-3.5 pt-2 pb-1.5 bg-gradient-to-b from-[#070709]/90 via-[#070709]/75 to-transparent backdrop-blur-md">
      <div className="flex items-center justify-between px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {/* Logo GymFlow Minimalista com Porta Secreta (5 toques na chama) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFlameTap}
            className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-90"
            title="GymFlow"
          >
            <Flame className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          </button>
          <Link href="/" className="text-sm font-black tracking-tight text-white group">
            Gym<span className="text-emerald-400">Flow</span>
          </Link>
        </div>

        {/* Status / Ações Rápidas em Pílula Unificada */}
        <div className="flex items-center gap-1.5">
          {/* Alternador Rápido de Modo (Aluno ⇄ Professor) */}
          {onToggleViewMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleViewMode();
              }}
              className={`h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
                isCoach
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
              title={isCoach ? "Modo Professor ativo • Toque para alternar para Aluno" : "Modo Aluno ativo • Toque para alternar para Professor"}
            >
              {isCoach ? (
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="tracking-tight">{isCoach ? "Prof" : "Aluno"}</span>
              <ArrowRightLeft className="w-2.5 h-2.5 opacity-40 ml-0.5" />
            </button>
          )}

          {/* Sino de Notificações com Badge Sutil */}
          {onOpenNotifications && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenNotifications();
              }}
              className="relative w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Notificações"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[8px] flex items-center justify-center shadow-sm">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Botão de Planos VIP */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              onOpenPlans();
            }}
            className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Ver Planos"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Botão de Login / Cadastro para Visitantes */}
          {!user?.email && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenAuth();
              }}
              className="h-7 px-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black text-[11px] shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1 active:scale-95 transition-all"
              title="Fazer Login ou Criar Conta"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}

          {/* Avatar de Perfil */}
          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenProfile();
            }}
            className={`w-7 h-7 rounded-full border overflow-hidden flex items-center justify-center transition-all ${
              isCoach
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold text-xs"
                : user
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold text-xs"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-400 hover:text-white"
            }`}
            title="Perfil e Configurações"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : user ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </button>

        </div>
      </div>

      {/* Modal de Autenticação Secreta do Administrador Master (GymFlow Vault) */}
      <MasterAdminAuthModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />
    </header>
  );
}
