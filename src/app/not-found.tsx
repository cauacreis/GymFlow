"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Dumbbell,
  Users,
  RotateCw,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Trophy,
  Award,
  X,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { recordSecretAchievement } from "@/lib/gamification-service";

const GYM_FAIL_QUOTES = [
  "Até os maiores campeões erram o caminho da academia às vezes. O importante é não pular o treino de perna!",
  "Essa repetição falhou na subida, mas seu foco continua intacto. Recupere o fôlego e volte ao início.",
  "404 calorias queimadas procurando uma rota que não existe no mapa. Bom cárdio!",
  "A dor da página não encontrada é passageira, o progresso físico é permanente.",
  "Parece que alguém largou os halteres fora do suporte e quebrou o link.",
  "Falhar até a falha faz parte da hipertrofia. Recarregue a página e execute a próxima série!",
];

export default function NotFound() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [alreadyUnlocked, setAlreadyUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isUnlocked = localStorage.getItem("gymflow_badge_secret_404_unlocked") === "true";

    if (!isUnlocked) {
      // Desbloqueia a conquista secreta mística da página 404 pela primeira vez!
      localStorage.setItem("gymflow_badge_secret_404_unlocked", "true");
      const todayStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      localStorage.setItem("gymflow_badge_secret_404_date", todayStr);
      recordSecretAchievement("secret-glitch-404", "ao encontrar a página secreta 404 da Matrix");
      triggerHaptic("success");
      setShowSecretModal(true);
      setAlreadyUnlocked(true);
    } else {
      setAlreadyUnlocked(true);
    }
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % GYM_FAIL_QUOTES.length);
  };

  return (
    <main className="min-h-screen w-full bg-[#030304] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Background Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">
        {/* Badges de Status & Conquista Secreta */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-emerald-500/5 backdrop-blur-md"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Erro 404 • Série Interrompida</span>
          </motion.div>

          {alreadyUnlocked && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                triggerHaptic("success");
                setShowSecretModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all shadow-lg shadow-purple-500/10 active:scale-95"
            >
              <Trophy className="w-3.5 h-3.5 text-purple-300 animate-bounce" />
              <span>Medalha Secreta 404 Desbloqueada!</span>
            </motion.button>
          )}
        </div>

        {/* 3D Shattered Dumbbell Hero Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
          className="relative w-52 h-52 sm:w-60 sm:h-60 my-2 select-none"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-transparent to-purple-500/20 blur-2xl pointer-events-none" />
          <motion.div
            animate={{
              y: [-6, 6, -6],
              rotate: [-1.5, 1.5, -1.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
            }}
            className="w-full h-full relative"
          >
            <Image
              src="/images/404_dumbbell_shatter.png"
              alt="404 - Haltere quebrado em gravidade zero"
              fill
              sizes="(max-width: 640px) 208px, 240px"
              priority
              className="object-contain drop-shadow-[0_20px_40px_rgba(16,185,129,0.25)]"
            />
          </motion.div>
        </motion.div>

        {/* Título & Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-3 font-mono">
            404 • ESSA REPETIÇÃO FALHOU!
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
            Parece que essa página foi descontinuada do plano de treino ou os pesos foram guardados no lugar errado do salão.
          </p>
        </motion.div>

        {/* Frase Cômica Interativa de Academia */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-5 w-full max-w-md p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-md shadow-xl flex items-center justify-between gap-3 text-left group"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300 italic leading-snug line-clamp-2">
              &ldquo;{GYM_FAIL_QUOTES[quoteIndex]}&rdquo;
            </p>
          </div>
          <button
            onClick={handleNextQuote}
            title="Outra frase motivacional"
            aria-label="Trocar frase"
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-zinc-400 hover:text-white transition-all shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Botões de Navegação Rápida */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-7 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md"
        >
          <Link
            href="/"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>

          <Link
            href="/?tab=workout"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.1] active:scale-98 text-white font-semibold text-sm transition-all"
          >
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span>Minha Ficha</span>
          </Link>
        </motion.div>

        {/* Links Secundários */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 flex items-center justify-center gap-5 text-xs text-zinc-400"
        >
          <Link
            href="/?tab=coaches"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Encontrar Personal</span>
          </Link>
          <span className="text-zinc-700">•</span>
          <button
            onClick={() => window.history.back()}
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Página Anterior</span>
          </button>
        </motion.div>
      </div>

      {/* Modal Comemorativo: Conquista Secreta 404 Desbloqueada */}
      <AnimatePresence>
        {showSecretModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setShowSecretModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-gradient-to-b from-zinc-900 via-zinc-900 to-purple-950/40 border border-purple-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
            >
              {/* Fechar */}
              <button
                onClick={() => setShowSecretModal(false)}
                aria-label="Fechar conquista secreta"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Tag de Raridade Mítica */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Mítico • Quase Impossível
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Easter Egg
                </span>
              </div>

              {/* Título de Desbloqueio */}
              <h2 className="text-xs uppercase font-extrabold text-amber-400 tracking-widest mt-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span>CONQUISTA SECRETA DESBLOQUEADA!</span>
              </h2>

              {/* Medalha 3D Real da Dimensão 404 */}
              <div className="relative w-44 h-44 my-2">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-60 bg-purple-600 animate-pulse" />
                <motion.div
                  animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full relative"
                >
                  <Image
                    src="/badges/badge_secret_404.png"
                    alt="Medalha Secreta Dimensão 404"
                    fill
                    sizes="176px"
                    priority
                    className="object-contain drop-shadow-[0_15px_30px_rgba(168,85,247,0.5)]"
                  />
                </motion.div>
              </div>

              {/* Nome & Descrição */}
              <h3 className="text-2xl font-black text-white tracking-tight font-mono">
                Dimensão 404
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-xs leading-relaxed">
                Você acessou uma fenda na realidade do GymFlow! Pouquíssimas pessoas no mundo conseguem encontrar esta rota de erro.
              </p>

              {/* Bônus de XP */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <Award className="w-4 h-4 text-purple-300" />
                  <span className="text-xs font-semibold text-purple-200">Recompensa Secreta:</span>
                </div>
                <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  +500 XP
                </span>
              </div>

              {/* Botão de Ação */}
              <Link
                href="/?tab=profile"
                onClick={() => setShowSecretModal(false)}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ver Conquista no Meu Perfil</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé Sutil */}
      <div className="absolute bottom-4 text-center text-[11px] text-zinc-600 font-mono">
        GymFlow • Treino & Performance
      </div>
    </main>
  );
}
