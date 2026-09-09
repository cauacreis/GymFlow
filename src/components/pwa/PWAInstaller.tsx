"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Registro seguro do Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[GymFlow PWA] Service Worker registrado com sucesso."))
        .catch((err) => console.log("[GymFlow PWA] Falha ao registrar Service Worker:", err));
    }

    // 2. Detecção de iOS
    const isIosDevice =
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 3. Captura do evento de instalação (Chrome / Android / Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert("Para instalar no iPhone: Toque no botão 'Compartilhar' do Safari e selecione 'Adicionar à Tela de Início'.");
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 max-w-[408px] mx-auto p-3 rounded-2xl bg-[#121218]/95 backdrop-blur-xl border border-emerald-500/30 shadow-[0_12px_32px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
        <Smartphone className="w-5 h-5" />
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs font-bold text-white">
          <span>Instalar App GymFlow</span>
          <Sparkles className="w-3 h-3 text-emerald-400" />
        </div>
        <span className="text-[10px] text-zinc-400">
          Adicione à tela de início para abrir como app nativo
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          Instalar
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
