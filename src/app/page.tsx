"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar, GymTabType } from "@/components/layout/BottomTabBar";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";
import { WorkoutSheet } from "@/components/workout/WorkoutSheet";
import { RestTimerModal } from "@/components/workout/RestTimerModal";
import { GymClassesView } from "@/components/classes/GymClassesView";
import { GymBadgesStreak } from "@/components/gamification/GymBadgesStreak";
import { GymPlansModal } from "@/components/plans/GymPlansModal";
import { GymBotAIModal } from "@/components/ai/GymBotAIModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { CoachDashboard } from "@/components/coach/CoachDashboard";
import { PersonalMarketplaceView } from "@/components/personal/PersonalMarketplaceView";
import { NotificationBellModal } from "@/components/notifications/NotificationBellModal";
import { CoachAnalyticsDashboard } from "@/components/analytics/CoachAnalyticsDashboard";
import { StudentAnalyticsDashboard } from "@/components/analytics/StudentAnalyticsDashboard";
import { StudentAgendaCalendar } from "@/components/student/StudentAgendaCalendar";
import {
  getCurrentUser,
  switchUserRole,
  subscribeToAuthChanges,
  UserProfile,
  UserRole,
} from "@/lib/auth-store";
import {
  getStoredNotifications,
  subscribeToNotifications,
  AppNotification,
} from "@/lib/booking-store";
import { triggerHaptic } from "@/lib/haptic";
import {
  Sparkles,
  Dumbbell,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  Bot,
  UserCheck,
  ArrowRightLeft,
  Settings,
} from "lucide-react";

export default function GymFlowApp() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getCurrentUser());
  const viewMode: UserRole = userProfile.activeRole;

  // Aba ativa da navegação inferior
  const [currentTab, setCurrentTab] = useState<GymTabType>(
    userProfile.activeRole === "coach" ? "alunos" : "treino"
  );

  // Notificações
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modais
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isGymBotOpen, setIsGymBotOpen] = useState(false);

  // Sincronização reativa com Auth Store
  useEffect(() => {
    const handleAuthChange = (updated: UserProfile) => {
      setUserProfile(updated);
      if (updated.activeRole === "coach" && (currentTab === "treino" || currentTab === "personal")) {
        setCurrentTab("alunos");
      } else if (updated.activeRole === "student" && (currentTab === "alunos" || currentTab === "agenda")) {
        setCurrentTab("treino");
      }
    };

    const unsubAuth = subscribeToAuthChanges(handleAuthChange);
    return () => unsubAuth();
  }, [currentTab]);

  // Sincronização de Notificações
  useEffect(() => {
    const refreshNotifications = () => {
      const all = getStoredNotifications();
      setNotifications(all.filter((n) => n.targetRole === (viewMode === "coach" ? "coach" : "student")));
    };
    refreshNotifications();
    const unsub = subscribeToNotifications(refreshNotifications);
    return () => unsub();
  }, [viewMode]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Alternar papel Aluno ⇄ Professor com 1 toque
  const handleToggleRole = () => {
    const nextRole: UserRole = viewMode === "student" ? "coach" : "student";
    triggerHaptic("medium");
    const updated = switchUserRole(nextRole);
    setUserProfile(updated);
    setCurrentTab(nextRole === "coach" ? "alunos" : "treino");
  };

  const handleTabSelect = (tab: GymTabType) => {
    if (tab === "perfil") {
      triggerHaptic("selection");
      setIsProfileOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  const isCoach = viewMode === "coach";

  return (
    <div className="w-full min-h-screen bg-[#070709] text-white flex flex-col justify-between relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Banner PWA para celular */}
      <PWAInstaller />

      {/* Header com Papel Ativo, Alternância de Modo & Notificações */}
      <Header
        user={userProfile}
        viewMode={viewMode}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleViewMode={handleToggleRole}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Container Principal */}
      <main className="w-full flex-1 flex flex-col px-4 pt-1 pb-20 max-w-md mx-auto">
        {/* Banner de Boas-Vindas do Perfil com Botão de Troca Rápida */}
        <div className="mb-3.5 p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                isCoach ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isCoach ? <GraduationCap className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">{userProfile.name}</span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    isCoach
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isCoach ? "Prof" : "Aluno"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                {isCoach
                  ? `CREF ${userProfile.cref || "08412-SP"} • ${userProfile.specialty || "Musculação"}`
                  : `Meta: ${userProfile.goal || "Hipertrofia"}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleRole}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 border transition-all active:scale-95 ${
              isCoach
                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
            title="Alternar entre treinar ou ser treinador"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Ir p/ {isCoach ? "Aluno" : "Professor"}</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VISÃO DO PROFESSOR (COACH) */}
        {/* ------------------------------------------------------------- */}
        {isCoach ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* ABA 1 DO PROFESSOR: ALUNOS & PRESCRIÇÕES */}
            {currentTab === "alunos" && (
              <CoachDashboard defaultTab="students" onSwitchToStudentView={handleToggleRole} />
            )}

            {/* ABA 2 DO PROFESSOR: MINHA AGENDA & SOLICITAÇÕES */}
            {currentTab === "agenda" && (
              <CoachDashboard defaultTab="agenda" onSwitchToStudentView={handleToggleRole} />
            )}

            {/* ABA 3 DO PROFESSOR: AULAS & TURMAS */}
            {currentTab === "aulas" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                      Turmas & Coletivas
                    </span>
                    <h2 className="text-base font-black text-white mt-0.5">Grade de Aulas</h2>
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/[0.06]">
                    Visão do Professor
                  </span>
                </div>
                <GymClassesView />
              </div>
            )}

            {/* ABA 4 DO PROFESSOR: ANALYTICS & MÉTRICAS DE NEGÓCIO E ALUNOS */}
            {currentTab === "evolucao" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <CoachAnalyticsDashboard />
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VISÃO DO ALUNO (STUDENT) */
          /* ------------------------------------------------------------- */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* ABA 1 DO ALUNO: MEU TREINO (ACADEMIA & CASA COM GIFS) */}
            {currentTab === "treino" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <WorkoutSheet
                  studentId="student_carlos"
                  onOpenTimer={(seconds) => {
                    setTimerSeconds(seconds || 60);
                    setIsTimerOpen(true);
                  }}
                />
              </div>
            )}

            {/* ABA 2 DO ALUNO: MINHA AGENDA (PRESENÇAS, FALTAS & REMANEJAMENTO) */}
            {currentTab === "agenda" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <StudentAgendaCalendar
                  studentId="student_carlos"
                  onNavigateToWorkout={() => setCurrentTab("treino")}
                />
              </div>
            )}

            {/* ABA 3 DO ALUNO: PERSONAL TRAINER & AGENDAMENTO ESTILO BARBEARIA */}
            {currentTab === "personal" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <PersonalMarketplaceView
                  studentName={userProfile.name}
                  studentPhone={userProfile.phone || "5511991234567"}
                />
              </div>
            )}

            {/* ABA 4 DO ALUNO: AULAS COLETIVAS */}
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

            {/* ABA 5 DO ALUNO: EVOLUÇÃO, PRS & GAMIFICAÇÃO */}
            {currentTab === "evolucao" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <GymBadgesStreak />
                <StudentAnalyticsDashboard />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Botão Flutuante do GymBot IA */}
      <button
        onClick={() => {
          triggerHaptic("medium");
          setIsGymBotOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5"
        title="Assistente GymBot IA"
      >
        <Bot className="w-5 h-5" />
        <span className="text-xs hidden xs:inline">GymBot IA</span>
      </button>

      {/* Barra de Navegação Inferior (adaptada por papel Aluno ou Professor) */}
      <BottomTabBar
        role={viewMode}
        currentTab={currentTab}
        onSelectTab={handleTabSelect}
      />

      {/* MODAL DE PERFIL & CONFIGURAÇÕES DA CONTA (TREINAR & SER TREINADO) */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAuth={() => {
          setIsProfileOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* MODAL DE AUTENTICAÇÃO COM SELEÇÃO DE PAPEL (ALUNO OU PROFESSOR) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={(userData) => {
          const current = getCurrentUser();
          setUserProfile(current);
          if (userData.role) {
            setCurrentTab(userData.role === "coach" ? "alunos" : "treino");
          }
        }}
      />

      {/* Central de Notificações */}
      <NotificationBellModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        targetRole={viewMode === "coach" ? "coach" : "student"}
      />

      {/* Modais Utilitários */}
      <GymPlansModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
      />

      <RestTimerModal
        isOpen={isTimerOpen}
        defaultSeconds={timerSeconds}
        onClose={() => setIsTimerOpen(false)}
      />

      <GymBotAIModal
        isOpen={isGymBotOpen}
        onClose={() => setIsGymBotOpen(false)}
      />
    </div>
  );
}
