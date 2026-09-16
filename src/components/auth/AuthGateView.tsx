"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  GraduationCap,
  Dumbbell,
  Phone,
  Check,
  AlertCircle,
  ShieldCheck,
  FileText,
  RotateCcw,
  Info,
} from "lucide-react";
import { TermsOfServiceModal } from "./TermsOfServiceModal";
import {
  registerNewUser,
  saveUserProfile,
  UserRole,
  UserProfile,
  getCurrentUser,
  extractFullName,
} from "@/lib/auth-store";
import { triggerHaptic } from "@/lib/haptic";
import { getSupabase, getAuthRedirectUrl } from "@/lib/supabase";
import { fetchProfileFromSupabase } from "@/lib/supabase-service";
import { updateCoachPublicProfile } from "@/lib/booking-store";
import { saveNewStudent } from "@/lib/workout-store";
import { canRegisterAccountOnDevice, registerDeviceAccount } from "@/lib/device-lockout";

// ============================================================================
// VALIDAÇÃO ZOD
// ============================================================================
const loginSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido").max(100),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(100),
});

const forgotSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido").max(100),
});

const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(70, "Nome não pode exceder 70 caracteres"),
    email: z.string().trim().email("Formato de e-mail inválido").max(100),
    phone: z.string().max(20).optional(),
    role: z.enum(["student", "coach"]),
    cref: z.string().max(30).optional(),
    specialty: z.string().max(100).optional(),
    goal: z.enum(["Hipertrofia", "Emagrecimento", "Força & Performance", "Condicionamento Geral"]).optional(),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "A senha deve conter ao menos 1 letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter ao menos 1 letra minúscula")
      .regex(/[0-9]/, "A senha deve conter ao menos 1 número")
      .regex(/[^A-Za-z0-9]/, "A senha deve conter ao menos 1 caractere especial (!@#$...)")
      .max(100),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "Você precisa aceitar os Termos de Uso e LGPD para continuar." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem. Digite senhas idênticas.",
    path: ["confirmPassword"],
  });

function formatOAuthErrorMessage(provider: string, rawError: string): string {
  const lower = rawError.toLowerCase();
  const providerName =
    provider === "google" ? "Google" : provider === "facebook" ? "Facebook / Meta" : "Apple";

  if (
    lower.includes("not enabled") ||
    lower.includes("unsupported provider") ||
    lower.includes("unsupported_provider") ||
    lower.includes("provider is not enabled")
  ) {
    return `O provedor ${providerName} precisa ser ativado no painel do Supabase com Client ID e Secret (Authentication > Providers > ${providerName}).`;
  }
  if (lower.includes("redirect_uri") || lower.includes("redirect_to") || lower.includes("not allowed")) {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `URL de redirecionamento não autorizada no Supabase. Adicione '${origin}/auth/callback' em Authentication > URL Configuration > Redirect URLs.`;
  }
  if (lower.includes("invalid_client") || lower.includes("client secret") || lower.includes("bad credentials")) {
    return `As credenciais de ${providerName} no Supabase estão incorretas (verifique Client ID e Secret no Supabase Dashboard).`;
  }
  if (lower.includes("cancelled") || lower.includes("access_denied") || lower.includes("user denied")) {
    return `Login com ${providerName} foi cancelado.`;
  }
  if (lower.includes("popup_closed")) {
    return `Janela de autenticação com ${providerName} foi fechada antes de concluir o login.`;
  }
  return `Erro ao iniciar autenticação com ${providerName}: ${rawError}`;
}

function formatOAuthCallbackError(rawError: string): string {
  const lower = rawError.toLowerCase();
  if (
    lower.includes("not enabled") ||
    lower.includes("unsupported_provider") ||
    lower.includes("unsupported provider") ||
    lower.includes("provider is not enabled")
  ) {
    return "O provedor social selecionado precisa ser ativado no painel do Supabase com Client ID e Secret (Authentication > Providers).";
  }
  if (lower.includes("redirect_uri") || lower.includes("redirect_to") || lower.includes("not allowed")) {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `URL de redirecionamento não autorizada no Supabase. Adicione '${origin}/auth/callback' em Authentication > URL Configuration > Redirect URLs.`;
  }
  if (lower.includes("access_denied") || lower.includes("user cancelled") || lower.includes("user_denied") || lower.includes("cancelled")) {
    return "Autenticação social cancelada pelo usuário.";
  }
  if (lower.includes("invalid_grant") || lower.includes("code verifier") || lower.includes("pkce")) {
    return "Código de autorização social expirado ou já utilizado. Por favor, tente novamente.";
  }
  return `Erro na autenticação social: ${decodeURIComponent(rawError.replace(/\+/g, " "))}`;
}

interface AuthGateViewProps {
  onAuthenticated: (user: UserProfile) => void;
}

export function AuthGateView({ onAuthenticated }: AuthGateViewProps) {
  const [tab, setTab] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [cref, setCref] = useState("");
  const [specialty, setSpecialty] = useState("Musculação & Hipertrofia");
  const [goal, setGoal] = useState<UserProfile["goal"]>("Hipertrofia");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasReadTermsToBottom, setHasReadTermsToBottom] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const client = getSupabase();

  // 🛡️ Captura e processamento de Retorno OAuth (código PKCE, sessão ativa pós-callback ou erros do Supabase)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    // 1. Detecta erro retornado pelo provedor OAuth ou Supabase
    const authError =
      searchParams.get("auth_error") ||
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      hashParams.get("error_description") ||
      hashParams.get("error");

    if (authError) {
      const friendlyError = formatOAuthCallbackError(authError);
      setErrorMessage(friendlyError);
      triggerHaptic("warning");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const handleSuccessfulSession = async (user: any) => {
      let role: UserRole = "student";
      const savedRole = localStorage.getItem("gymflow_oauth_role") as UserRole | null;
      if (savedRole === "coach" || savedRole === "student") {
        role = savedRole;
        localStorage.removeItem("gymflow_oauth_role");
      }
      if (typeof document !== "undefined") {
        document.cookie = "gymflow_oauth_role=; path=/; max-age=0; SameSite=Lax";
      }

      const meta = user.user_metadata || {};
      const fullName = extractFullName(meta, user.email);
      const avatarUrl = meta.avatar_url || meta.picture || undefined;
      const cloudProfile = await fetchProfileFromSupabase(user.id);

      let loggedUser: UserProfile;
      if (cloudProfile) {
        loggedUser = saveUserProfile({
          ...cloudProfile,
          name: cloudProfile.name || fullName,
          avatarUrl: cloudProfile.avatarUrl || avatarUrl,
          activeRole: savedRole ? role : cloudProfile.activeRole || "student",
          termsAccepted: cloudProfile.termsAccepted ?? Boolean(meta.terms_accepted),
          termsAcceptedAt: cloudProfile.termsAcceptedAt || meta.terms_accepted_at,
          profileCompleted: cloudProfile.profileCompleted ?? Boolean(meta.profile_completed),
          experienceLevel: cloudProfile.experienceLevel || meta.experience_level,
        });
      } else {
        loggedUser = saveUserProfile({
          id: user.id,
          email: user.email || "",
          name: fullName,
          avatarUrl,
          activeRole: role,
          enabledRoles: ["student", "coach"],
          subscriptionStatus: role === "coach" ? "active" : "pending_choice",
          subscriptionPlan: "trial_7d",
          planTier: "pro",
          termsAccepted: Boolean(meta.terms_accepted),
          termsAcceptedAt: meta.terms_accepted_at,
          profileCompleted: Boolean(meta.profile_completed),
        });
      }

      // Garante vínculo anti-abuso e inicialização do aluno/professor
      if (user.email && user.id) {
        registerDeviceAccount({
          email: user.email,
          userId: user.id,
          trialUsed: false,
          plan: loggedUser.subscriptionPlan || "pending_choice",
        }).catch(() => {});

        if (loggedUser.activeRole === "coach") {
          updateCoachPublicProfile(loggedUser.id, {
            name: loggedUser.name,
            cref: loggedUser.cref,
            specialty: loggedUser.specialty,
            phone: loggedUser.phone,
          });
        } else {
          saveNewStudent({
            id: loggedUser.id,
            name: loggedUser.name,
            email: loggedUser.email,
            goal: loggedUser.goal || "Hipertrofia",
            phone: loggedUser.phone,
            isOfflineStudent: false,
          });
        }
      }

      triggerHaptic("success");
      setSuccessMessage(`Bem-vindo(a), ${loggedUser.name}!`);
      window.history.replaceState({}, document.title, window.location.pathname);
      onAuthenticated(loggedUser);
    };

    // 2. Detecta código de autorização PKCE retornado pelo OAuth
    const code = searchParams.get("code");
    if (code && client) {
      setIsLoading(true);
      setSuccessMessage("Concluindo autenticação segura...");

      client.auth
        .exchangeCodeForSession(code)
        .then(async ({ data, error }) => {
          if (error) {
            console.warn("⚠️ [OAuth Client Exchange] Erro:", error.message);
            setErrorMessage(formatOAuthCallbackError(error.message));
            setIsLoading(false);
            setSuccessMessage(null);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }

          if (data?.session?.user) {
            await handleSuccessfulSession(data.session.user);
          }
        })
        .catch((err) => {
          console.error("❌ [OAuth Client Exchange] Exceção:", err);
          setErrorMessage("Erro inesperado ao concluir autenticação social. Tente novamente.");
          setIsLoading(false);
          setSuccessMessage(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      return;
    }

    // 3. Verifica se já existe sessão ativa (ex: cookie seguro setado pelo /auth/callback do servidor)
    if (client) {
      client.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setIsLoading(true);
          await handleSuccessfulSession(session.user);
        }
      }).catch(() => {});
    }
  }, [client, onAuthenticated]);

  // Autenticação Social via OAuth (Google, Facebook/Meta e Apple)
  const handleOAuthSignIn = async (provider: "google" | "facebook" | "apple") => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (tab === "signup") {
        // 🛡️ Proteção Anti-Abuso: Checagem prévia no dispositivo antes de iniciar OAuth
        const deviceCheck = await canRegisterAccountOnDevice("");
        if (!deviceCheck.allowed && deviceCheck.reason?.includes("aparelho")) {
          throw new Error(deviceCheck.reason);
        }
        // Salva papel selecionado no localStorage e em cookie para persistência no fluxo de callback
        if (typeof window !== "undefined") {
          localStorage.setItem("gymflow_oauth_role", selectedRole);
        }
        if (typeof document !== "undefined") {
          document.cookie = `gymflow_oauth_role=${selectedRole}; path=/; max-age=600; SameSite=Lax`;
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("gymflow_oauth_role");
        }
        if (typeof document !== "undefined") {
          document.cookie = "gymflow_oauth_role=; path=/; max-age=0; SameSite=Lax";
        }
      }

      if (client) {
        // Mantém a URL de redirecionamento limpa para corresponder com exatidão às Redirect URLs do Supabase
        const redirectTo = getAuthRedirectUrl("/auth/callback");
        const { data, error } = await client.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams:
              provider === "google"
                ? {
                    access_type: "offline",
                    prompt: "select_account",
                  }
                : undefined,
          },
        });

        if (error) {
          throw error;
        }

        // Em ambientes que não executam redirecionamento automático
        if (data?.url && typeof window !== "undefined") {
          window.location.href = data.url;
        }
      } else {
        triggerHaptic("warning");
        setErrorMessage("Configuração do Supabase ausente no ambiente (.env.local).");
      }
    } catch (err: any) {
      triggerHaptic("warning");
      const msg = err?.message || String(err);
      setErrorMessage(formatOAuthErrorMessage(provider, msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // ----------------------------------------------------------------------
      // MODO 1: LOGIN
      // ----------------------------------------------------------------------
      if (tab === "login") {
        loginSchema.parse({ email, password });

        let loggedUser: UserProfile;

        if (client) {
          const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            const lower = error.message.toLowerCase();
            if (lower.includes("invalid login credentials") || lower.includes("invalid grant")) {
              throw new Error("E-mail ou senha incorretos. Verifique suas credenciais.");
            }
            throw new Error(error.message);
          }

          if (data?.user) {
            const cloudProfile = await fetchProfileFromSupabase(data.user.id);
            if (cloudProfile) {
              loggedUser = saveUserProfile(cloudProfile);
            } else {
              const meta = data.user.user_metadata || {};
              loggedUser = saveUserProfile({
                id: data.user.id,
                email: email.trim(),
                name: extractFullName(meta, email.trim()),
                activeRole: (meta.role as UserRole) || "student",
                phone: meta.phone || "",
                cref: meta.cref || undefined,
                specialty: meta.specialty || undefined,
                goal: meta.goal || "Hipertrofia",
              });
            }
          } else {
            loggedUser = getCurrentUser();
          }
        } else {
          // Fallback em ambiente de desenvolvimento local
          await new Promise((r) => setTimeout(r, 400));
          loggedUser = saveUserProfile({
            id: `usr_${Date.now()}`,
            email: email.trim(),
            name: email.split("@")[0] || "Usuário",
            activeRole: "student",
          });
        }

        triggerHaptic("success");
        onAuthenticated(loggedUser);
      }

      // ----------------------------------------------------------------------
      // MODO 2: CADASTRO (SIGNUP)
      // ----------------------------------------------------------------------
      else if (tab === "signup") {
        if (!hasReadTermsToBottom) {
          setShowTermsModal(true);
          throw new Error("Para criar sua conta, é obrigatório ler os Termos de Uso e LGPD até o final.");
        }

        signupSchema.parse({
          name,
          email,
          phone,
          role: selectedRole,
          cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
          specialty: selectedRole === "coach" ? specialty.trim() || undefined : undefined,
          goal: selectedRole === "student" ? goal : undefined,
          password,
          confirmPassword,
          termsAccepted,
        });

        // 🛡️ Proteção Anti-Abuso Silenciosa: Impede mais de uma conta por dispositivo físico
        const deviceCheck = await canRegisterAccountOnDevice(email.trim());
        if (!deviceCheck.allowed) {
          throw new Error(deviceCheck.reason || "Não foi possível concluir o cadastro para este dispositivo.");
        }

        let createdUserId: string | undefined;

        if (client) {
          const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: name.trim(),
                phone: phone.trim() || undefined,
                role: selectedRole,
                cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
                specialty: selectedRole === "coach" ? specialty.trim() || "Musculação & Hipertrofia" : undefined,
                goal: selectedRole === "student" ? goal : undefined,
              },
            },
          });

          if (error) {
            const lower = error.message.toLowerCase();
            if (lower.includes("user already registered") || lower.includes("already registered")) {
              throw new Error("Já existe um usuário cadastrado com este e-mail. Faça login ou recupere sua senha.");
            }
            throw new Error(error.message);
          }

          if (data?.user) {
            createdUserId = data.user.id;
          }
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }

        const newUser = registerNewUser({
          id: createdUserId,
          name: name.trim(),
          email: email.trim(),
          role: selectedRole,
          phone: phone.trim() || undefined,
          cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
          specialty: selectedRole === "coach" ? specialty.trim() || "Musculação & Hipertrofia" : undefined,
          goal: selectedRole === "student" ? goal : undefined,
          termsAccepted: true,
        });

        // 🛡️ Registra vínculo do dispositivo no sistema anti-abuso
        await registerDeviceAccount({
          email: newUser.email,
          userId: newUser.id,
          trialUsed: false,
          plan: "pending_choice",
        });

        if (selectedRole === "coach") {
          updateCoachPublicProfile(newUser.id, {
            name: newUser.name,
            cref: newUser.cref,
            specialty: newUser.specialty,
            phone: newUser.phone,
          });
        } else {
          saveNewStudent({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            goal: newUser.goal || "Hipertrofia",
            phone: newUser.phone,
            isOfflineStudent: false,
          });
        }

        triggerHaptic("success");
        onAuthenticated(newUser);
      }

      // ----------------------------------------------------------------------
      // MODO 3: ESQUECI A SENHA (RECUPERAÇÃO)
      // ----------------------------------------------------------------------
      else if (tab === "forgot") {
        forgotSchema.parse({ email });

        if (client) {
          const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth?recovery=true` : undefined;
          const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo,
          });
          if (error) throw new Error(error.message);
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }

        triggerHaptic("success");
        setSuccessMessage(`Enviamos o link de recuperação para ${email.trim()}. Verifique sua caixa de entrada.`);
      }
    } catch (err: any) {
      triggerHaptic("warning");
      if (err instanceof z.ZodError) {
        setErrorMessage(err.errors[0]?.message || "Dados inválidos.");
      } else {
        setErrorMessage(err.message || "Falha na autenticação.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070709] text-white flex items-center justify-center p-4 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Luz Ambiente Sutil de Fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/[0.06] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[380px] h-[380px] bg-teal-500/[0.03] rounded-full blur-[110px] pointer-events-none" />

      {/* Card Central Clean Estilo Moderno */}
      <div className="w-full max-w-[420px] bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl relative z-10 space-y-6">
        {/* Cabeçalho Minimalista com Ícone de Marca */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-black/40">
              <Dumbbell className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">
              {tab === "login"
                ? "Bem-vindo de volta!"
                : tab === "signup"
                ? "Criar sua conta"
                : "Recuperar sua senha"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-[300px] mx-auto leading-relaxed">
              {tab === "login"
                ? "Entre com seus dados para acessar seus treinos e rotinas."
                : tab === "signup"
                ? "Preencha seus dados para começar seus treinos no GymFlow."
                : "Digite seu e-mail para receber as instruções de recuperação."}
            </p>
          </div>
        </div>

        {/* Notificações de Erro e Sucesso */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in leading-relaxed">
            <Check className="w-4 h-4 shrink-0 text-emerald-400 stroke-[3]" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário com Rótulos Limpos Sobre Cada Campo */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {tab === "signup" && (
            <>
              {/* Seletor de Papel (Aluno ou Personal) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">Como você atuará?</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedRole("student");
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      selectedRole === "student"
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Sou Aluno(a)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedRole("coach");
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      selectedRole === "coach"
                        ? "bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Sou Personal</span>
                  </button>
                </div>
              </div>

              {/* Nome Completo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">Nome completo</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* WhatsApp / Telefone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Registro CREF para Professor */}
              {selectedRole === "coach" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">Registro CREF</label>
                  <input
                    type="text"
                    placeholder="Ex: 08412-SP"
                    value={cref}
                    onChange={(e) => setCref(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 uppercase transition-all"
                  />
                </div>
              )}
            </>
          )}

          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Senha */}
          {tab !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Sua senha</label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setTab("forgot");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  title={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirmação de Senha no Cadastro */}
          {tab === "signup" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">Confirmar senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita sua senha"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Termos de Uso e LGPD com Rolagem Obrigatória */}
          {tab === "signup" && (
            <div className="pt-1">
              <div
                onClick={() => {
                  if (!hasReadTermsToBottom) {
                    triggerHaptic("light");
                    setShowTermsModal(true);
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  hasReadTermsToBottom
                    ? "bg-zinc-900/40 border-emerald-500/25 hover:border-emerald-500/40"
                    : "bg-zinc-900/40 border-amber-500/30 hover:border-amber-500/50 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="pt-0.5">
                    {hasReadTermsToBottom ? (
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          e.stopPropagation();
                          setTermsAccepted(e.target.checked);
                        }}
                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer accent-emerald-500"
                      />
                    ) : (
                      <div
                        className="w-4 h-4 rounded bg-zinc-900 border border-amber-500/50 flex items-center justify-center text-amber-400"
                        title="Bloqueado: leia os termos até o final"
                      >
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-xs leading-snug">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-200 font-medium">Termos de Uso & Proteção LGPD</span>
                      {hasReadTermsToBottom ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Lido
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Ler obrigatório
                        </span>
                      )}
                    </div>

                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {hasReadTermsToBottom ? (
                        <span>
                          Você visualizou todas as cláusulas.{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTermsModal(true);
                            }}
                            className="text-emerald-400 underline hover:text-emerald-300 font-medium"
                          >
                            Rever termos
                          </button>
                        </span>
                      ) : (
                        <span className="text-amber-200/80">
                          Clique aqui para abrir os termos. O aceite só é liberado após rolar até o final.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Ação Principal em Destaque */}
          <button
            type="submit"
            disabled={isLoading || (tab === "signup" && (!termsAccepted || !hasReadTermsToBottom))}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-zinc-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Processando...</span>
              </div>
            ) : tab === "login" ? (
              "Entrar"
            ) : tab === "signup" ? (
              "Cadastrar e Continuar"
            ) : (
              "Enviar link de recuperação"
            )}
          </button>
        </form>

        {/* Divisor Horizontal Central com "ou" e Linha de 3 Provedores Sociais */}
        {tab !== "forgot" && (
          <div className="space-y-4 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-zinc-800/90 w-full" />
              <span className="bg-zinc-950 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-medium shrink-0">
                ou
              </span>
              <div className="border-t border-zinc-800/90 w-full" />
            </div>

            {/* Linha Limpa de 3 Botões Sociais: [ Google ] [ Facebook / Meta ] [ Apple ] */}
            <div className="grid grid-cols-3 gap-3">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
                title="Continuar com Google"
                className="h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </button>

              {/* Facebook / Meta */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn("facebook")}
                disabled={isLoading}
                title="Continuar com Facebook / Meta"
                className="h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 group"
              >
                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn("apple")}
                disabled={isLoading}
                title="Continuar com Apple"
                className="h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 group"
              >
                <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 170 170" aria-hidden="true">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-5.6-8.59-9.98-18.06-13.13-28.41-3.16-10.35-4.73-20.2-4.73-29.56 0-13.17 3.38-24.32 10.15-33.45 6.77-9.13 15.18-13.79 25.24-13.99 4.95 0 10.45 1.25 16.5 3.76 6.05 2.51 10.02 3.82 11.91 3.92 1.5.11 5.75-1.28 12.74-4.17 6.99-2.88 12.97-4.17 17.95-3.87 13.74.87 24.32 5.76 31.75 14.67-12.08 7.39-18.02 17.4-17.82 30.02.2 9.89 3.93 18.27 11.19 25.13 7.26 6.86 16.03 10.88 26.31 12.06-2.17 6.3-4.78 12.5-7.83 18.6zM119.22 33.15c0-7.39 2.65-14.19 7.95-20.4 5.3-6.21 11.83-10.08 19.59-11.61.22 1.3.33 2.61.33 3.92 0 7.39-2.61 14.19-7.83 20.4-5.22 6.21-11.85 10.08-19.89 11.61-.05-1.3-.15-2.6-.15-3.92z" />
                </svg>
              </button>
            </div>

            {tab === "signup" && (
              <p className="text-[11px] text-zinc-400 text-center leading-relaxed pt-1">
                Ao continuar com as redes sociais, você concorda com nossos{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-emerald-400 underline hover:text-emerald-300 font-medium"
                >
                  Termos de Uso e LGPD
                </button>
                .
              </p>
            )}
          </div>
        )}

        {/* Rodapé Sleek de Alternância */}
        <div className="pt-2 text-center border-t border-zinc-800/60">
          {tab === "login" ? (
            <p className="text-xs text-zinc-400">
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setTab("signup");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Cadastre-se
              </button>
            </p>
          ) : tab === "signup" ? (
            <p className="text-xs text-zinc-400">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setTab("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Entrar
              </button>
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Lembrou sua senha?{" "}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setTab("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Voltar ao login
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Modal de Termos de Uso e LGPD com leitura obrigatória */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setHasReadTermsToBottom(true);
          setTermsAccepted(true);
          setErrorMessage(null);
        }}
        hasAlreadyAccepted={hasReadTermsToBottom}
      />
    </div>
  );
}
