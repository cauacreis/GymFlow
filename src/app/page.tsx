"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar, GymTabType } from "@/components/layout/BottomTabBar";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";
import { WorkoutSheet } from "@/components/workout/WorkoutSheet";
import { RestTimerModal } from "@/components/workout/RestTimerModal";
import { GymCapacityWidget } from "@/components/capacity/GymCapacityWidget";
import { TurnstileCheckinModal } from "@/components/turnstile/TurnstileCheckinModal";
import { GymClassesView } from "@/components/classes/GymClassesView";
import { EvolutionDashboard } from "@/components/evolution/EvolutionDashboard";
import { GymBadgesStreak } from "@/components/gamification/GymBadgesStreak";
import { GymPlansModal } from "@/components/plans/GymPlansModal";
import { GymBotAIModal } from "@/components/ai/GymBotAIModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { triggerHaptic } from "@/lib/haptic";
import { QrCode, Sparkles, Dumbbell, CalendarDays, TrendingUp, Bot, ShieldCheck, Zap } from "lucide-react";

export default function GymFlowApp() {
  const [currentTab, setCurrentTab] = useState<GymTabType>("treino");
  const [user, setUser] = useState<{ name: string; email: string } | null>({
    name: "Carlos Silva",
    email: "carlos.silva@gymflow.app",
  });

  // Modais
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isGymBotOpen, setIsGymBotOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#070709] text-white flex flex-col justify-between relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Banner PWA para instalação no celular */}
      <PWAInstaller />

      {/* Header Fixo do GymFlow */}
      <Header
        streakDays={16}
        user={user}
        onOpenCheckin={() => setIsCheckinOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Container Principal de Conteúdo por Aba */}
      <main className="w-full flex-1 flex flex-col px-4 pt-1 pb-20 max-w-md mx-auto">
        {/* ABA 1: TREINO */}
        {currentTab === "treino" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Ocupação da Academia em Tempo Real */}
            <GymCapacityWidget />

            {/* Ficha de Treino Interativa A/B/C */}
            <WorkoutSheet onOpenTimer={() => setIsTimerOpen(true)} />
          </div>
        )}

        {/* ABA 2: CATRACA / CHECK-IN DIGITAL */}
        {currentTab === "catraca" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="rounded-3xl p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/[0.08] shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
                <QrCode className="w-6 h-6" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Acesso Digital à Unidade
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">Catraca GymFlow Pass</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
                Aproxime o QR Code dinâmico do leitor óptico da catraca para liberar sua entrada.
              </p>

              <div className="w-full mt-4">
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    setIsCheckinOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4 stroke-[2.5]" />
                  <span>Gerar QR Pass em Tela Cheia</span>
                </button>
              </div>

              <div className="w-full mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Matrícula: GF-84920</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Plano Ativo
                </span>
              </div>
            </div>

            {/* Card informativo de regras de acesso */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">QR Code Criptografado & Anti-Fraude</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  O token visual é renovado automaticamente a cada 30 segundos para garantir a segurança dos alunos e evitar clonagem de credenciais.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: AULAS COLETIVAS */}
        {currentTab === "aulas" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Grade de Hoje
                </span>
                <h2 className="text-base font-black text-white mt-0.5">Aulas Coletivas</h2>
              </div>
              <span className="text-[10px] text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/[0.06]">
                Reservas Abertas
              </span>
            </div>

            <GymClassesView />
          </div>
        )}

        {/* ABA 4: EVOLUÇÃO & GAMIFICAÇÃO */}
        {currentTab === "evolucao" && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Sequência de Treinos, PRs e Medalhas */}
            <GymBadgesStreak />

            {/* Métricas Corporais e Bioimpedância InBody */}
            <EvolutionDashboard />
          </div>
        )}

        {/* ABA 5: GYMBOT IA */}
        {currentTab === "gymbot" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 border border-emerald-500/20 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-xl">
                <Bot className="w-9 h-9 animate-pulse" />
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Gratuito & 24 Horas
                </span>
              </div>
              <h2 className="text-lg font-black text-white">GymBot IA Coach</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
                Tire dúvidas de biomecânica, solicite substituições de exercícios para dores musculares, calcule suas proteínas e peça orientações de carga.
              </p>

              <button
                onClick={() => {
                  triggerHaptic("medium");
                  setIsGymBotOpen(true);
                }}
                className="w-full mt-4 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Abrir Chat com o Coach</span>
              </button>
            </div>

            {/* Tópicos Mais Frequentes */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-300">Dúvidas Frequentes no Salão</span>
              <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  • Como aquecer corretamente os manguitos rotadores
                </div>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  • Quando usar cinto lombar no agachamento e terra
                </div>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  • Quantidade de água recomendada no intra-treino
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barra de Navegação Inferior Fixa */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Modais Globais */}
      <TurnstileCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        user={user}
      />

      <GymPlansModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
      />

      <RestTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      <GymBotAIModal
        isOpen={isGymBotOpen}
        onClose={() => setIsGymBotOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={(userData) => setUser(userData)}
      />
    </div>
  );
}
