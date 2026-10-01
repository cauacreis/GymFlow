"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  X,
  Share2,
  ArrowRight,
  Flame,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  AchievementUnlockEventData,
  EVENT_SHOW_CELEBRATION,
  TIER_NAMES,
} from "@/lib/gamification-service";

const TIER_STYLES = {
  bronze: {
    bg: "from-amber-950/60 via-zinc-950 to-amber-950/30",
    border: "border-amber-700/60",
    glow: "shadow-[0_0_50px_rgba(180,83,9,0.35)]",
    textGradient: "from-amber-300 via-amber-400 to-amber-600",
    badgeBorder: "border-amber-600",
    accentBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  prata: {
    bg: "from-slate-900/80 via-zinc-950 to-slate-950/40",
    border: "border-slate-400/60",
    glow: "shadow-[0_0_50px_rgba(203,213,225,0.4)]",
    textGradient: "from-slate-100 via-slate-300 to-slate-400",
    badgeBorder: "border-slate-300",
    accentBg: "bg-slate-400/20 text-slate-200 border-slate-400/30",
  },
  ouro: {
    bg: "from-yellow-950/70 via-zinc-950 to-amber-950/40",
    border: "border-amber-400/70",
    glow: "shadow-[0_0_60px_rgba(251,191,36,0.45)]",
    textGradient: "from-yellow-200 via-amber-400 to-yellow-500",
    badgeBorder: "border-amber-400",
    accentBg: "bg-amber-500/25 text-amber-300 border-amber-400/40",
  },
  diamante: {
    bg: "from-cyan-950/70 via-zinc-950 to-teal-950/40",
    border: "border-cyan-400/70",
    glow: "shadow-[0_0_70px_rgba(34,211,238,0.5)]",
    textGradient: "from-cyan-200 via-teal-300 to-cyan-400",
    badgeBorder: "border-cyan-400",
    accentBg: "bg-cyan-500/25 text-cyan-300 border-cyan-400/40",
  },
};

export function AchievementCelebrationModal() {
  const [activeCelebration, setActiveCelebration] = useState<AchievementUnlockEventData | null>(null);

  useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEvt = e as CustomEvent<AchievementUnlockEventData>;
      if (customEvt.detail) {
        setActiveCelebration(customEvt.detail);
      }
    };

    window.addEventListener(EVENT_SHOW_CELEBRATION, handleCelebration);
    return () => {
      window.removeEventListener(EVENT_SHOW_CELEBRATION, handleCelebration);
    };
  }, []);

  if (!activeCelebration) return null;

  const tierStyle = TIER_STYLES[activeCelebration.tier] || TIER_STYLES.ouro;

  const handleClose = () => {
    triggerHaptic("light");
    setActiveCelebration(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
        {/* Efeito de Luz Radial e Brilho Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
          <div className="w-80 h-80 rounded-full bg-amber-500/20 blur-[100px] animate-pulse delay-150" />
        </div>

        {/* Card Principal da Celebração */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={`relative w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b ${tierStyle.bg} border ${tierStyle.border} ${tierStyle.glow} p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden z-10 shadow-2xl`}
        >
          {/* Botão de Fechar Rápido */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Pill de Header */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-md mb-5 ${tierStyle.accentBg}`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current animate-spin" />
            <span>Nova Conquista Desbloqueada!</span>
          </motion.div>

          {/* Imagem 3D da Conquista com Animação de Entrada e Flutuação */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 my-2 flex items-center justify-center">
            {/* Brilho de Fundo da Medalha */}
            <div className="absolute inset-0 rounded-full bg-white/10 blur-xl animate-ping opacity-40 pointer-events-none" />

            <motion.div
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{
                scale: [0.5, 1.1, 1],
                rotate: [-15, 5, 0],
                y: [-4, 4, -4],
              }}
              transition={{
                scale: { duration: 0.6, ease: "easeOut" },
                rotate: { duration: 0.7, ease: "easeOut" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative w-32 h-32 sm:w-40 sm:h-40"
            >
              <Image
                src={activeCelebration.badge.image}
                alt={activeCelebration.badge.name}
                fill
                sizes="(max-width: 640px) 140px, 160px"
                className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                priority
              />
            </motion.div>
          </div>

          {/* Título da Conquista */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 space-y-1"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-white/[0.08] text-zinc-300 border border-white/10">
                Nível {activeCelebration.unlockedLevel} • {TIER_NAMES[activeCelebration.tier]}
              </span>
            </div>

            <h3 className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${tierStyle.textGradient} bg-clip-text text-transparent`}>
              {activeCelebration.badge.name}
            </h3>

            <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed pt-1">
              {activeCelebration.reason}
            </p>
          </motion.div>

          {/* Badge de Recompensa de XP */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border border-amber-500/30 flex items-center gap-2 shadow-lg"
          >
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black text-amber-300">
              +{activeCelebration.xpReward} XP Recompensados
            </span>
          </motion.div>

          {/* Botão de Ação / Continuar */}
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleClose}
            className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar Focado</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
