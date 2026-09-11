"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { isVaultSessionActive } from "@/lib/admin-vault";
import { AdminVaultDashboard } from "@/components/admin/AdminVaultDashboard";
import { MasterAdminAuthModal } from "@/components/admin/MasterAdminAuthModal";
import { triggerHaptic } from "@/lib/haptic";

export default function AdminVaultPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Detecção de 5 toques no texto "404" para abrir a porta mestra em celulares/telas de erro
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  useEffect(() => {
    const checkAuth = () => {
      const active = isVaultSessionActive();
      setIsAuthenticated(active);
      if (!active) {
        document.title = "404: Esta página não foi encontrada | GymFlow";
      } else {
        document.title = "GymFlow Vault | Painel de Controle Master";
      }
    };

    checkAuth();

    // Atalho global de teclado: Ctrl+Shift+A ou Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        triggerHaptic("medium");
        setIsAuthModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDecoyTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 1200) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      triggerHaptic("heavy");
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    document.title = "GymFlow Vault | Painel de Controle Master";
  };

  // Enquanto avalia o estado no client
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-800 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Se autenticado com a sessão secreta do Vault, renderiza o Super Admin Dashboard
  if (isAuthenticated) {
    return <AdminVaultDashboard />;
  }

  // DECOY 404: Se não autenticado, simula uma página 404 idêntica ao Next.js
  // Para qualquer terceiro, esta rota parece inexistente.
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center px-4 font-sans select-none">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 border-b border-zinc-800/80 pb-8 mb-6">
        <h1
          onClick={handleDecoyTap}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 cursor-default active:text-zinc-300 transition-colors"
          title=""
        >
          404
        </h1>
        <div className="hidden sm:block h-10 w-[1px] bg-zinc-800" />
        <p className="text-sm sm:text-base text-zinc-400 text-center sm:text-left">
          Esta página não pôde ser encontrada.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 text-xs text-zinc-500">
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Voltar para o início</span>
        </Link>
      </div>

      {/* Modal de Autenticação Mestra Secreta (ativado por 5 toques no 404 ou Ctrl+Shift+A) */}
      <MasterAdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
