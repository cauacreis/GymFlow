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
import { StudentReminderBanner } from "@/components/student/StudentReminderBanner";
import { AuthGateView } from "@/components/auth/AuthGateView";
import { SubscriptionOnboardingModal } from "@/components/subscription/SubscriptionOnboardingModal";
import {
  getCurrentUser,
  switchUserRole,
  subscribeToAuthChanges,
  initAuthSession,
  UserProfile,
  UserRole,
  isUserAuthenticated,
  hasActiveAccess,
  activatePaidPlanForUser,
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
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "signup" | "forgot" | "update-password" | "magic-link">("login");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isGymBotOpen, setIsGymBotOpen] = useState(false);
  const [paymentToast, setPaymentToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  // Inicialização e Sincronização Contínua com Supabase Auth
  useEffect(() => {
    const unsubSession = initAuthSession();
    const handlePasswordRecovery = () => {
      setAuthInitialMode("update-password");
      setIsAuthOpen(true);
    };

    window.addEventListener("gymflow:password-recovery", handlePasswordRecovery);

    // Checa se a URL contém indicação de redefinição de senha ou modo de autenticação
    if (typeof window !== "undefined") {
      if (window.location.hash.includes("type=recovery") || window.location.search.includes("recovery=true")) {
        setAuthInitialMode("update-password");
        setIsAuthOpen(true);
      } else {
        const params = new URLSearchParams(window.location.search);
        const authParam = params.get("auth");
        if (authParam === "signup" || authParam === "login" || authParam === "forgot" || authParam === "magic-link") {
          setAuthInitialMode(authParam);
          setIsAuthOpen(true);
        }
      }
    }

    return () => {
      unsubSession();
      window.removeEventListener("gymflow:password-recovery", handlePasswordRecovery);
    };
  }, []);

  // Processamento e Sanitização de Retorno do Mercado Pago (Checkout Pro & Assinaturas)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const status = params.get("status") || params.get("collection_status");
    const subscription = params.get("subscription");
    const plan = params.get("plan") || "pro";
    const paymentId = params.get("payment_id") || params.get("id");

    const isApproved =
      payment === "approved" ||
      payment === "success" ||
      payment === "simulated" ||
      status === "approved" ||
      subscription === "active" ||
      subscription === "simulated";

    if (isApproved) {
      const user = getCurrentUser();
      const planTier = plan === "vip" ? "vip" : plan === "basico" ? "basico" : "pro";
      const isRecurring = subscription === "active" || subscription === "simulated" || plan === "monthly_recurring";

      activatePaidPlanForUser(plan, isRecurring, planTier);
      setUserProfile(getCurrentUser());
      triggerHaptic("success");

      setPaymentToast({
        message: `Pagamento confirmado com sucesso via Mercado Pago! Seu plano ${planTier.toUpperCase()} está 100% ativo.`,
        type: "success",
      });

      // Sincroniza em segundo plano com a API de auditoria se houver ID de pagamento
      if (paymentId && user.id && user.id !== "user_me") {
        fetch(`/api/payment/check?id=${paymentId}&userId=${user.id}`).catch(() => {});
      }

      // Higieniza os parâmetros da URL sem recarregar a página
      window.history.replaceState({}, document.title, window.location.pathname);

      const timer = setTimeout(() => setPaymentToast(null), 6000);
      return () => clearTimeout(timer);
    } else if (payment === "pending") {
      setPaymentToast({
        message: "Pagamento recebido e em análise pelo Mercado Pago. Seu acesso será liberado assim que for compensado.",
        type: "info",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => setPaymentToast(null), 6000);
      return () => clearTimeout(timer);
    } else if (payment === "failure" || status === "rejected") {
      setPaymentToast({
        message: "O pagamento não foi aprovado pelo Mercado Pago. Tente novamente com outro cartão ou via PIX.",
        type: "warning",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => setPaymentToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sincronização reativa com Auth Store
  useEffect(() => {
    const handleAuthChange = (updated: UserProfile) => {
      setUserProfile(updated);
      setCurrentTab((prevTab) => {
        if (updated.activeRole === "coach" && (prevTab === "treino" || prevTab === "personal" || prevTab === "evolucao" || prevTab === "aulas")) {
          return "alunos";
        } else if (updated.activeRole === "student" && (prevTab === "alunos" || prevTab === "fichas" || prevTab === "analytics")) {
          return "treino";
        }
        return prevTab;
      });
    };

    handleAuthChange(getCurrentUser());

    const unsubAuth = subscribeToAuthChanges(handleAuthChange);
    return () => unsubAuth();
  }, []);


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

  // ---------------------------------------------------------------------------
  // 1. PORTÃO DE ENTRADA OBRIGATÓRIO (AUTH-WALL):
  // O usuário não tem opção de navegar sem login/cadastro.
  // ---------------------------------------------------------------------------
  if (!isUserAuthenticated()) {
    return (
      <AuthGateView
        onAuthenticated={(user) => {
          setUserProfile(user);
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 2. ONBOARDING DE ASSINATURA PÓS-CADASTRO:
  // Alunos sem plano ativo ou sem trial devem selecionar uma opção para continuar.
  // ---------------------------------------------------------------------------
  if (!hasActiveAccess(userProfile)) {
    return (
      <div className="w-full min-h-screen bg-[#070709] text-white flex flex-col justify-center items-center p-4">
        <SubscriptionOnboardingModal
          isOpen={true}
          user={userProfile}
          onSuccess={() => {
            setUserProfile(getCurrentUser());
          }}
        />
      </div>
    );
  }

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

      {/* Toast Notificação de Retorno de Pagamento Mercado Pago */}
      {paymentToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border animate-in slide-in-from-top-4 duration-300 ${
            paymentToast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : paymentToast.type === "info"
              ? "bg-sky-950/90 border-sky-500/40 text-sky-200"
              : "bg-amber-950/90 border-amber-500/40 text-amber-200"
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
          <p className="text-xs font-semibold leading-snug flex-1">{paymentToast.message}</p>
          <button
            onClick={() => setPaymentToast(null)}
            className="text-white/60 hover:text-white p-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Container Principal */}
      <main className="w-full flex-1 flex flex-col px-3.5 pt-2 pb-20 max-w-md md:max-w-4xl lg:max-w-7xl mx-auto transition-all duration-200">

        {/* ------------------------------------------------------------- */}
        {/* VISÃO DO PROFESSOR (COACH) */}
        {/* ------------------------------------------------------------- */}
        {isCoach ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <CoachDashboard
              currentTab={currentTab}
              onSelectTab={handleTabSelect}
              onSwitchToStudentView={handleToggleRole}
            />
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VISÃO DO ALUNO (STUDENT) */
          /* ------------------------------------------------------------- */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Lembretes Inteligentes de Treino Hoje & Pagamento */}
            <StudentReminderBanner
              studentId={userProfile.id}
              onNavigateToAgenda={() => setCurrentTab("agenda")}
            />

            {/* ABA 1 DO ALUNO: MEU TREINO (ACADEMIA & CASA COM GIFS) */}
            {currentTab === "treino" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <WorkoutSheet
                  studentId={userProfile.id}
                  onOpenTimer={(seconds) => {
                    setTimerSeconds(seconds || 60);
                    setIsTimerOpen(true);
                  }}
                  onOpenPlans={() => setIsPlansOpen(true)}
                />
              </div>
            )}

            {/* ABA 2 DO ALUNO: MINHA AGENDA (PRESENÇAS, FALTAS & REMANEJAMENTO) */}
            {currentTab === "agenda" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <StudentAgendaCalendar
                  studentId={userProfile.id}
                  onNavigateToWorkout={() => setCurrentTab("treino")}
                  onNavigateToPersonal={() => setCurrentTab("personal")}
                />
              </div>
            )}

            {/* ABA 3 DO ALUNO: PERSONAL TRAINER & AGENDAMENTO ESTILO BARBEARIA */}
            {currentTab === "personal" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <PersonalMarketplaceView
                  studentId={userProfile.id}
                  studentName={userProfile.name}
                  studentPhone={userProfile.phone || ""}
                  onOpenPlans={() => setIsPlansOpen(true)}
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
                <GymClassesView onOpenPlans={() => setIsPlansOpen(true)} />
              </div>
            )}

            {/* ABA 5 DO ALUNO: EVOLUÇÃO, PRS & GAMIFICAÇÃO */}
            {currentTab === "evolucao" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <GymBadgesStreak />
                <StudentAnalyticsDashboard onOpenPlans={() => setIsPlansOpen(true)} />
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
        className="fixed bottom-20 right-4 sm:right-[max(1rem,calc(50%-224px+1rem))] z-40 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5"
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
          setAuthInitialMode("login");
          setIsAuthOpen(true);
        }}
      />

      {/* MODAL DE AUTENTICAÇÃO COM SELEÇÃO DE PAPEL (ALUNO OU PROFESSOR) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthInitialMode("login");
        }}
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
        onClose={() => {
          setIsPlansOpen(false);
          setUserProfile(getCurrentUser());
        }}
      />

      <RestTimerModal
        isOpen={isTimerOpen}
        defaultSeconds={timerSeconds}
        onClose={() => setIsTimerOpen(false)}
      />

      <GymBotAIModal
        isOpen={isGymBotOpen}
        onClose={() => setIsGymBotOpen(false)}
        onOpenPlans={() => setIsPlansOpen(true)}
      />
    </div>
  );
}
