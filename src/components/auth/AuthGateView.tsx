"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  GraduationCap,
  Dumbbell,
  Sparkles,
  Phone,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  KeyRound,
  FileText,
} from "lucide-react";
import { TermsOfServiceModal } from "./TermsOfServiceModal";
import {
  registerNewUser,
  saveUserProfile,
  UserRole,
  UserProfile,
  getCurrentUser,
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

  // Autenticação Social via OAuth (Google e Apple)
  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (tab === "signup") {
        // 🛡️ Proteção Anti-Abuso Silenciosa: Checagem prévia no dispositivo antes de iniciar OAuth
        const deviceCheck = await canRegisterAccountOnDevice("");
        if (!deviceCheck.allowed && deviceCheck.reason?.includes("aparelho")) {
          throw new Error(deviceCheck.reason);
        }
        // Salva papel selecionado para ser atribuído na conclusão do OAuth
        if (typeof window !== "undefined") {
          localStorage.setItem("gymflow_oauth_role", selectedRole);
        }
      }

      if (client) {
        const callbackPath = tab === "signup" ? `/auth/callback?role=${selectedRole}` : "/auth/callback";
        const redirectTo = getAuthRedirectUrl(callbackPath);
        const { error } = await client.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: provider === "google" ? {
              access_type: "offline",
              prompt: "select_account",
            } : undefined,
          },
        });

        if (error) {
          throw new Error(
            error.message.includes("not enabled")
              ? `O login com ${provider === "google" ? "Google" : "Apple"} precisa ser ativado no painel do Supabase.`
              : error.message
          );
        }
      } else {
        triggerHaptic("warning");
        setErrorMessage("Autenticação social requer chaves ativas do Supabase configuradas.");
      }
    } catch (err: any) {
      triggerHaptic("warning");
      setErrorMessage(err.message || `Erro ao autenticar com ${provider === "google" ? "Google" : "Apple"}.`);
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
            throw new Error(
              error.message === "Invalid login credentials"
                ? "E-mail ou senha incorretos."
                : error.message
            );
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
                name: meta.name || email.split("@")[0] || "Usuário",
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
          // Fallback em ambiente local
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
        });

        // 🛡️ Registra vínculo do dispositivo no sistema anti-abuso de forma transparente
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
      {/* Luz Ambiente Sutil de Alta Fidelidade */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/[0.07] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[380px] h-[380px] bg-teal-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Cartão Central Double-Bezel Estilo Linear/Apple */}
      <div className="w-full max-w-[420px] bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl relative z-10 space-y-6">
        {/* Cabeçalho com Emblema da Marca */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-md group-hover:opacity-35 transition-opacity" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800/90 to-zinc-950 border border-white/10 flex items-center justify-center shadow-inner">
              <Dumbbell className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {tab === "login"
                ? "Entrar na sua conta"
                : tab === "signup"
                ? "Criar sua conta"
                : "Recuperar senha"}
            </h1>
            <p className="text-xs text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
              {tab === "login"
                ? "Acesse suas rotinas, agendamentos e treinos personalizados."
                : tab === "signup"
                ? "Cadastre-se para iniciar seus treinos de alta performance."
                : "Digite seu e-mail para receber as instruções de recuperação."}
            </p>
          </div>
        </div>

        {/* Segmented Control / Alternador Elegante */}
        {tab !== "forgot" ? (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900/90 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setTab("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                tab === "login"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setTab("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                tab === "signup"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Criar Conta
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setTab("login");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Voltar para o login</span>
          </button>
        )}

        {/* Notificações de Erro e Sucesso */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400 stroke-[3]" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* Provedores Sociais OAuth (Google & Apple) */}
        {tab !== "forgot" && (
          <div className="space-y-3 pt-0.5">
            {tab === "signup" && (
              /* Seleção de Papel (Aluno ou Personal) */
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedRole("student");
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedRole === "student"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20 shadow-sm"
                      : "bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
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
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedRole === "coach"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/20 shadow-sm"
                      : "bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Sou Personal</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  handleOAuthSignIn("google");
                }}
                disabled={isLoading}
                className="h-11 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/[0.08] hover:border-white/[0.18] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-sm hover:shadow disabled:opacity-50 group"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  handleOAuthSignIn("apple");
                }}
                disabled={isLoading}
                className="h-11 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/[0.08] hover:border-white/[0.18] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-sm hover:shadow disabled:opacity-50 group"
              >
                <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 170 170" aria-hidden="true">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-5.6-8.59-9.98-18.06-13.13-28.41-3.16-10.35-4.73-20.2-4.73-29.56 0-13.17 3.38-24.32 10.15-33.45 6.77-9.13 15.18-13.79 25.24-13.99 4.95 0 10.45 1.25 16.5 3.76 6.05 2.51 10.02 3.82 11.91 3.92 1.5.11 5.75-1.28 12.74-4.17 6.99-2.88 12.97-4.17 17.95-3.87 13.74.87 24.32 5.76 31.75 14.67-12.08 7.39-18.02 17.4-17.82 30.02.2 9.89 3.93 18.27 11.19 25.13 7.26 6.86 16.03 10.88 26.31 12.06-2.17 6.3-4.78 12.5-7.83 18.6zM119.22 33.15c0-7.39 2.65-14.19 7.95-20.4 5.3-6.21 11.83-10.08 19.59-11.61.22 1.3.33 2.61.33 3.92 0 7.39-2.61 14.19-7.83 20.4-5.22 6.21-11.85 10.08-19.89 11.61-.05-1.3-.15-2.6-.15-3.92z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            {tab === "signup" && (
              <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                Ao continuar com Google ou Apple, você concorda com nossos{" "}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setShowTermsModal(true);
                  }}
                  className="text-emerald-400 underline hover:text-emerald-300 font-medium"
                >
                  Termos de Uso e LGPD
                </button>
                .
              </p>
            )}

            {/* Divisor Sleek Linear */}
            <div className="relative flex items-center justify-center pt-1 pb-0.5">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-zinc-950/90 px-3 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold shrink-0">
                ou continue com e-mail
              </span>
              <div className="border-t border-white/[0.08] w-full" />
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <>

              {/* Nome */}
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* WhatsApp */}
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="WhatsApp com DDD (ex: 11999990000)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* CREF para Professor */}
              {selectedRole === "coach" && (
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Registro CREF (ex: 08412-SP)"
                    value={cref}
                    onChange={(e) => setCref(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              )}
            </>
          )}

          {/* E-mail */}
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              placeholder="Seu e-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Senha */}
          {tab !== "forgot" && (
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Confirmação de Senha no Cadastro */}
          {tab === "signup" && (
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          )}

          {/* Atalho Esqueceu a Senha */}
          {tab === "login" && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setTab("forgot");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                Esqueceu a senha?
              </button>
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
                        className="w-4 h-4 rounded bg-zinc-900 border-white/20 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
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

                  <div className="flex-1 text-[11px] leading-snug">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-200 font-medium">
                        Termos de Uso & Proteção de Dados
                      </span>
                      {hasReadTermsToBottom ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Lido e Aceito
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-bold animate-pulse flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Ler obrigatório
                        </span>
                      )}
                    </div>

                    <p className="text-zinc-400 text-[10px] mt-0.5">
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
                          Clique aqui para abrir os termos. O aceite só é liberado após rolar e ler o documento até o final.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Ação com Estilo Ilha / Trailing Icon */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-between shadow-[0_0_24px_rgba(16,185,129,0.22)] hover:shadow-[0_0_32px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all disabled:opacity-50 group"
          >
            <span className="flex-1 text-center font-black">
              {isLoading
                ? "Processando..."
                : tab === "login"
                ? "Acessar o GymFlow"
                : tab === "signup"
                ? "Cadastrar e Continuar"
                : "Enviar Link de Recuperação"}
            </span>

            <div className="w-6 h-6 rounded-full bg-zinc-950/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
          </button>
        </form>

        {/* Rodapé Padrão de Sistemas Globais (Clean & Transparente) */}
        <div className="pt-2 text-center space-y-2 border-t border-white/[0.06]">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Ambiente protegido com criptografia de ponta a ponta e proteção LGPD.
          </p>
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
