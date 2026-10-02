"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar, GymTabType } from "@/components/layout/BottomTabBar";
import { WorkoutSheet } from "@/components/workout/WorkoutSheet";
import { RestTimerModal } from "@/components/workout/RestTimerModal";
import { GymClassesView } from "@/components/classes/GymClassesView";
import { GymBadgesStreak } from "@/components/gamification/GymBadgesStreak";
import { AchievementCelebrationModal } from "@/components/gamification/AchievementCelebrationModal";
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
import { AccountCustomizationModal } from "@/components/auth/AccountCustomizationModal";
import { SubscriptionOnboardingModal } from "@/components/subscription/SubscriptionOnboardingModal";
import {
  getCurrentUser,
  saveUserProfile,
  switchUserRole,
  subscribeToAuthChanges,
  initAuthSession,
  UserProfile,
  UserRole,
  isUserAuthenticated,
  isProfileComplete,
  hasActiveAccess,
  activatePaidPlanForUser,
  areProfilesEqual,
} from "@/lib/auth-store";
import { getRemainingTrialDays } from "@/lib/subscription-features";

import {
  getStoredNotifications,
  subscribeToNotifications,
  AppNotification,
} from "@/lib/booking-store";
import { triggerHaptic } from "@/lib/haptic";
import { calculateSmartWorkoutStreak } from "@/lib/streak-service";
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

  // Aba ativa da navegação inferior com persistência contínua
  const [currentTab, setCurrentTab] = useState<GymTabType>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTab = localStorage.getItem("gymflow_active_tab_v2") as GymTabType | null;
        if (savedTab) {
          const isCoach = userProfile.activeRole === "coach";
          const coachTabs: GymTabType[] = ["alunos", "fichas", "analytics"];
          const studentTabs: GymTabType[] = ["treino", "agenda", "personal", "aulas", "evolucao"];
          if (isCoach && coachTabs.includes(savedTab)) return savedTab;
          if (!isCoach && studentTabs.includes(savedTab)) return savedTab;
        }
      } catch {}
    }
    return userProfile.activeRole === "coach" ? "alunos" : "treino";
  });

  const changeTab = (tab: GymTabType) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("gymflow_active_tab_v2", tab);
      } catch {}
    }
  };

  // Notificações
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modais
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "signup" | "forgot" | "update-password" | "magic-link">("login");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isGymBotOpen, setIsGymBotOpen] = useState(false);
  const [paymentToast, setPaymentToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);
  const [streakDays, setStreakDays] = useState<number>(() =>
    calculateSmartWorkoutStreak({ userId: userProfile?.id }).currentStreak
  );

  useEffect(() => {
    const syncStreak = () => {
      setStreakDays(calculateSmartWorkoutStreak({ userId: userProfile?.id }).currentStreak);
    };
    syncStreak();
    window.addEventListener("gymflow:streak-updated", syncStreak);
    window.addEventListener("gymflow:badges-updated", syncStreak);
    window.addEventListener("storage", syncStreak);
    return () => {
      window.removeEventListener("gymflow:streak-updated", syncStreak);
      window.removeEventListener("gymflow:badges-updated", syncStreak);
      window.removeEventListener("storage", syncStreak);
    };
  }, [userProfile?.id]);

  // Inicialização e Sincronização Contínua com Supabase Auth
  useEffect(() => {
    const unsubSession = initAuthSession();

    const handlePasswordRecovery = () => {
      setAuthInitialMode("update-password");
      setIsAuthOpen(true);
    };

    window.addEventListener("gymflow:password-recovery", handlePasswordRecovery);

    // Checa se a URL contém erro de autenticação OAuth, redefinição de senha ou modo de autenticação
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const authError =
        searchParams.get("auth_error") ||
        searchParams.get("error_description") ||
        searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (authError) {
        const lower = authError.toLowerCase();
        let message = `Erro na autenticação social: ${decodeURIComponent(authError.replace(/\+/g, " "))}`;
        if (
          lower.includes("not enabled") ||
          lower.includes("unsupported") ||
          lower.includes("provider is not enabled")
        ) {
          message = "O login social selecionado precisa ser ativado no painel do Supabase com Client ID e Secret (Authentication > Providers).";
        } else if (lower.includes("redirect_uri") || lower.includes("redirect_to") || lower.includes("not allowed")) {
          message = "URL de redirecionamento não autorizada no painel do Supabase. Adicione a URL em Authentication > URL Configuration > Redirect URLs.";
        } else if (lower.includes("access_denied") || lower.includes("cancelled")) {
          message = "Autenticação social cancelada pelo usuário.";
        }
        setPaymentToast({
          message,
          type: "warning",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (window.location.hash.includes("type=recovery") || window.location.search.includes("recovery=true")) {
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
      setUserProfile((prev) => (areProfilesEqual(prev, updated) ? prev : updated));
      setCurrentTab((prevTab) => {
        let nextTab = prevTab;
        if (updated.activeRole === "coach" && (prevTab === "treino" || prevTab === "personal" || prevTab === "evolucao" || prevTab === "aulas")) {
          nextTab = "alunos";
        } else if (updated.activeRole === "student" && (prevTab === "alunos" || prevTab === "fichas" || prevTab === "analytics")) {
          nextTab = "treino";
        }
        if (nextTab !== prevTab && typeof window !== "undefined") {
          try {
            localStorage.setItem("gymflow_active_tab_v2", nextTab);
          } catch {}
        }
        return nextTab;
      });
    };

    handleAuthChange(getCurrentUser());

    const unsubAuth = subscribeToAuthChanges(handleAuthChange);
    return () => unsubAuth();
  }, []);


  // Sincronização de Notificações
  useEffect(() => {
    const refreshNotifications = () => {
      const userNotifs = getStoredNotifications(userProfile.id, viewMode === "coach" ? "coach" : "student");
      setNotifications(userNotifs);
    };
    refreshNotifications();
    const unsub = subscribeToNotifications(refreshNotifications);
    return () => unsub();
  }, [viewMode, userProfile.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Alternar papel Aluno ⇄ Professor (apenas se a conta tiver perfil de professor ativado)
  const canToggleRole = Boolean(userProfile.enabledRoles?.includes("coach"));

  const handleToggleRole = () => {
    if (!canToggleRole && viewMode === "student") {
      setIsProfileOpen(true);
      return;
    }
    const nextRole: UserRole = viewMode === "student" ? "coach" : "student";
    triggerHaptic("medium");
    const updated = switchUserRole(nextRole);
    setUserProfile(updated);
    changeTab(nextRole === "coach" ? "alunos" : "treino");
  };

  const handleTabSelect = (tab: GymTabType) => {
    if (tab === "perfil") {
      triggerHaptic("selection");
      setIsProfileOpen(true);
      return;
    }
    changeTab(tab);
  };

  const isCoach = viewMode === "coach";

  // ---------------------------------------------------------------------------
  // 1. PORTÃO DE ENTRADA OBRIGATÓRIO (AUTH-WALL):
  // O usuário não tem opção de navegar sem login/cadastro.
  // ---------------------------------------------------------------------------
  if (!isUserAuthenticated(userProfile)) {
    return (
      <AuthGateView
        onAuthenticated={(user) => {
          setUserProfile(user);
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 2. PERSONALIZAÇÃO DE CONTA OBRIGATÓRIA PÓS-AUTH / OAUTH:
  // Se for novo usuário ou se o perfil tiver pendência essencial (nome, WhatsApp, objetivo/CREF, LGPD),
  // exibe o modal dedicado de personalização antes do dashboard ou paywall.
  // ---------------------------------------------------------------------------
  if (!isProfileComplete(userProfile)) {
    return (
      <AccountCustomizationModal
        isOpen={true}
        user={userProfile}
        onComplete={(completedUser) => {
          const fresh = saveUserProfile(completedUser);
          setUserProfile(fresh);
          if (fresh.activeRole === "coach") {
            changeTab("alunos");
          } else {
            changeTab("treino");
          }
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 3. ONBOARDING DE ASSINATURA PÓS-CADASTRO:
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

      {/* Header com Papel Ativo, Alternância de Modo & Notificações */}
      <Header
        user={userProfile}
        viewMode={viewMode}
        streakDays={streakDays}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleViewMode={canToggleRole ? handleToggleRole : undefined}
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
              onNavigateToAgenda={() => changeTab("agenda")}
            />

            {/* Banner Informativo de Período de Testes de 7 Dias */}
            {userProfile.subscriptionStatus === "trial" && (
              <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/70 to-emerald-950/20 border border-emerald-500/25 flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white">Período de Testes Pro</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                        {getRemainingTrialDays(userProfile)} {getRemainingTrialDays(userProfile) === 1 ? "dia restante" : "dias restantes"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      Você está aproveitando o Plano Pro completo. Cancele ou assine quando quiser.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setIsPlansOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shrink-0 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  Ver Planos
                </button>
              </div>
            )}

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
                  onNavigateToWorkout={() => changeTab("treino")}
                  onNavigateToPersonal={() => changeTab("personal")}
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
                  onOpenProfile={() => setIsProfileOpen(true)}
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
        onClose={() => {
          setIsProfileOpen(false);
          setUserProfile(getCurrentUser());
        }}
        onOpenAuth={() => {
          setIsProfileOpen(false);
          setAuthInitialMode("login");
          setIsAuthOpen(true);
        }}
        onOpenCustomization={() => {
          setIsProfileOpen(false);
          setIsCustomizationOpen(true);
        }}
        onOpenPlans={() => {
          setIsProfileOpen(false);
          setIsPlansOpen(true);
        }}
      />

      {/* MODAL DE PERSONALIZAÇÃO DE PERFIL SOB DEMANDA */}
      {isCustomizationOpen && (
        <AccountCustomizationModal
          isOpen={isCustomizationOpen}
          user={userProfile}
          onClose={() => setIsCustomizationOpen(false)}
          onComplete={(completedUser) => {
            setUserProfile(completedUser);
            setIsCustomizationOpen(false);
          }}
        />
      )}

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
            changeTab(userData.role === "coach" ? "alunos" : "treino");
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
      {/* Modal de Celebração de Conquistas Gamificadas */}
      <AchievementCelebrationModal />
    </div>
  );
}
