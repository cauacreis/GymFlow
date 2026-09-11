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

  // Buffer de teclas digitadas para Cheat Code silencioso (digitar "vault")
  const keystrokeBufferRef = useRef<string>("");
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // 1. Checagem de parâmetro direto de desbloqueio na URL (?unlock=1 ou ?vault=1)
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (
        searchParams.get("unlock") === "1" ||
        searchParams.get("unlock") === "true" ||
        searchParams.get("vault") === "1" ||
        searchParams.get("vault") === "true"
      ) {
        setIsAuthModalOpen(true);
      }
    }

    // 2. Atalhos de Teclado Ultra-Secretos & Cheat Code
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalho rápido: Ctrl+Alt+Shift+V ou Ctrl+Shift+A
      if (
        ((e.ctrlKey || e.metaKey) && e.altKey && e.shiftKey && (e.key === "V" || e.key === "v")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a"))
      ) {
        e.preventDefault();
        triggerHaptic("medium");
        setIsAuthModalOpen(true);
        return;
      }

      // Cheat Code: Digitar a sequência 'vault' em qualquer lugar da tela
      keystrokeBufferRef.current += e.key.toLowerCase();
      if (keystrokeBufferRef.current.length > 12) {
        keystrokeBufferRef.current = keystrokeBufferRef.current.slice(-12);
      }

      if (keystrokeBufferRef.current.endsWith("vault") || keystrokeBufferRef.current.endsWith("cofre")) {
        triggerHaptic("heavy");
        setIsAuthModalOpen(true);
        keystrokeBufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. Pressionar e Segurar (Long-Press Stealth de 2.5s no Celular)
  const handleStartLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic("heavy");
      setIsAuthModalOpen(true);
    }, 2500); // 2.5 segundos segurando
  };

  const handleCancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
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
        {/* Número 404 com suporte a Long-Press secreto de 2.5s */}
        <h1
          onMouseDown={handleStartLongPress}
          onMouseUp={handleCancelLongPress}
          onTouchStart={handleStartLongPress}
          onTouchEnd={handleCancelLongPress}
          onTouchCancel={handleCancelLongPress}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 cursor-default select-none"
        >
          404
        </h1>
        <div className="hidden sm:block h-10 w-[1px] bg-zinc-800" />
        <p className="text-sm sm:text-base text-zinc-400 text-center sm:text-left select-none">
          Esta página não pôde ser encontrada
          {/* Micro hotspot no ponto final com Long-Press */}
          <span
            onMouseDown={handleStartLongPress}
            onMouseUp={handleCancelLongPress}
            onTouchStart={handleStartLongPress}
            onTouchEnd={handleCancelLongPress}
            className="cursor-default"
          >
            .
          </span>
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

      {/* Modal de Autenticação Mestra Secreta */}
      <MasterAdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
