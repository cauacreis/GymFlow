"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Dumbbell,
  Sparkles,
  Phone,
  Check,
  X,
  ArrowLeft,
  RotateCcw,
  KeyRound,
  Shield,
} from "lucide-react";
import {
  registerNewUser,
  saveUserProfile,
  UserRole,
  UserProfile,
  getCurrentUser,
} from "@/lib/auth-store";
import { triggerHaptic } from "@/lib/haptic";
import { getSupabase } from "@/lib/supabase";
import { fetchProfileFromSupabase } from "@/lib/supabase-service";
import { updateCoachPublicProfile } from "@/lib/booking-store";
import { saveNewStudent } from "@/lib/workout-store";
import { canRegisterAccountOnDevice, registerDeviceAccount } from "@/lib/device-lockout";

// ============================================================================
// SCHEMAS DE VALIDAÇÃO ZOD
// ============================================================================

const loginSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido").max(100),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(100),
});

const forgotSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido").max(100),
});

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "A senha deve conter ao menos 1 letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter ao menos 1 letra minúscula")
      .regex(/[0-9]/, "A senha deve conter ao menos 1 número")
      .regex(/[^A-Za-z0-9]/, "A senha deve conter ao menos 1 símbolo especial (!@#$...)")
      .max(100),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
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
    bio: z.string().max(300).optional(),
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
      errorMap: () => ({ message: "Você precisa aceitar os Termos de Uso e LGPD para criar uma conta." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem. Digite senhas idênticas.",
    path: ["confirmPassword"],
  });

function translateSupabaseError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid grant")) {
    return "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "Já existe um usuário cadastrado com este e-mail. Faça login ou solicite recuperação de senha.";
  }
  if (lower.includes("email not confirmed")) {
    return "E-mail não confirmado. Por favor, verifique sua caixa de entrada para confirmar seu cadastro.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("over_email_send_rate_limit")) {
    return "Muitas tentativas em pouco tempo. Por segurança, aguarde alguns minutos antes de tentar novamente.";
  }
  if (lower.includes("password should be at least")) {
    return "A senha deve ter no mínimo 8 caracteres e atender aos requisitos de segurança.";
  }
  if (lower.includes("signup disabled")) {
    return "Novos cadastros estão temporariamente suspensos no servidor.";
  }
  if (lower.includes("expired") || lower.includes("invalid token") || lower.includes("token has expired")) {
    return "O link de recuperação ou acesso expirou ou é inválido. Solicite um novo link.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Falha de conexão com os servidores. Operando em modo local protegido.";
  }
  return msg || "Ocorreu um erro ao processar sua autenticação.";
}

const BottomGradient = () => (
  <>
    <span className="group-hover/input:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent pointer-events-none" />
    <span className="group-hover/input:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-teal-400 to-transparent pointer-events-none" />
  </>
);

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawMode = searchParams.get("mode");
  const isRecovery = searchParams.get("recovery") === "true";
  const redirectTarget = searchParams.get("redirect") || "/";

  type AuthMode = "login" | "signup" | "forgot" | "update-password" | "magic-link";

  const getInitialMode = (): AuthMode => {
    if (isRecovery) return "update-password";
    if (rawMode === "signup") return "signup";
    if (rawMode === "forgot") return "forgot";
    if (rawMode === "magic-link") return "magic-link";
    return "login";
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  // Formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cref, setCref] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState<UserProfile["goal"]>("Hipertrofia");

  // Flags
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // E-mail lembrado
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("gymflow_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      if (window.location.hash.includes("type=recovery")) {
        setMode("update-password");
      }
    }
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordsMatching = confirmPassword.length > 0 && password === confirmPassword;

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { label: "Muito Fraca", color: "text-rose-400", bg: "bg-rose-500" };
    if (score === 2) return { label: "Regular", color: "text-amber-400", bg: "bg-amber-500" };
    if (score === 3) return { label: "Boa", color: "text-sky-400", bg: "bg-sky-400" };
    if (score === 4) return { label: "Forte", color: "text-teal-400", bg: "bg-teal-400" };
    return { label: "Excelente", color: "text-emerald-400", bg: "bg-emerald-500" };
  };

  const strengthInfo = getStrengthLabel(strengthScore);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const client = getSupabase();
      if (client) {
        const redirectTo = typeof window !== "undefined"
          ? `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTarget)}`
          : undefined;
        const { error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });
        if (error) {
          throw new Error(translateSupabaseError(error.message));
        }
      } else {
        triggerHaptic("warning");
        setErrorMessage("Google OAuth requer chaves ativas do Supabase no ambiente.");
      }
    } catch (err: unknown) {
      triggerHaptic("warning");
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro ao autenticar com o Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const client = getSupabase();

      // LOGIN
      if (mode === "login") {
        loginSchema.parse({ email, password });

        if (typeof window !== "undefined") {
          if (rememberMe) {
            localStorage.setItem("gymflow_remembered_email", email.trim());
          } else {
            localStorage.removeItem("gymflow_remembered_email");
          }
        }

        let loggedUser: UserProfile;

        if (client) {
          const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            throw new Error(translateSupabaseError(error.message));
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
                bio: meta.bio || undefined,
                goal: meta.goal || "Hipertrofia",
              });
            }
          } else {
            loggedUser = getCurrentUser();
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
          const current = getCurrentUser();
          const existingName = current.email === email.trim() ? current.name : email.split("@")[0];
          const existingRole = current.email === email.trim() ? current.activeRole : "student";
          loggedUser = saveUserProfile({
            id: current.email === email.trim() ? current.id : `usr_${Date.now()}`,
            email: email.trim(),
            name: existingName,
            activeRole: existingRole,
          });
        }

        triggerHaptic("success");
        setSuccessMessage(`Bem-vindo(a) de volta, ${loggedUser.name}! Redirecionando...`);

        // Sincroniza o usuário nas coleções do app (marketplace ou alunos)
        if (loggedUser.activeRole === "coach") {
          updateCoachPublicProfile(loggedUser.id, {
            name: loggedUser.name,
            cref: loggedUser.cref,
            specialty: loggedUser.specialty,
            bio: loggedUser.bio,
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

        setTimeout(() => {
          router.push(redirectTarget);
        }, 600);
      }

      // MAGIC LINK
      else if (mode === "magic-link") {
        forgotSchema.parse({ email });

        if (client) {
          const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
          const { error } = await client.auth.signInWithOtp({
            email: email.trim(),
            options: {
              emailRedirectTo: redirectTo,
            },
          });

          if (error) {
            throw new Error(translateSupabaseError(error.message));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        triggerHaptic("success");
        setSuccessMessage(
          `Enviamos um Link Mágico para ${email.trim()}. Abra sua caixa de entrada e clique nele para entrar!`
        );
      }

      // SIGNUP
      else if (mode === "signup") {
        signupSchema.parse({
          name,
          email,
          phone,
          role: selectedRole,
          cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
          specialty: selectedRole === "coach" ? specialty.trim() || undefined : undefined,
          bio: selectedRole === "coach" ? bio.trim() || undefined : undefined,
          goal: selectedRole === "student" ? goal : undefined,
          password,
          confirmPassword,
          termsAccepted,
        });

        // 🛡️ Proteção Anti-Abuso: Impede mais de uma conta por dispositivo físico e e-mail duplicado
        const deviceCheck = await canRegisterAccountOnDevice(email.trim());
        if (!deviceCheck.allowed) {
          throw new Error(deviceCheck.reason || "Criação de conta bloqueada para este dispositivo.");
        }

        let createdUserId: string | undefined;
        let requiresConfirmation = false;

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
                bio: selectedRole === "coach" ? bio.trim() || undefined : undefined,
                goal: selectedRole === "student" ? goal : undefined,
              },
            },
          });

          if (error) {
            throw new Error(translateSupabaseError(error.message));
          }

          if (data?.user) {
            createdUserId = data.user.id;
            if (!data.session && data.user.identities?.length) {
              requiresConfirmation = true;
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        triggerHaptic("success");

        const newUser = registerNewUser({
          id: createdUserId,
          name: name.trim(),
          email: email.trim(),
          role: selectedRole,
          phone: phone.trim() || undefined,
          cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
          specialty: selectedRole === "coach" ? specialty.trim() || "Musculação & Hipertrofia" : undefined,
          bio: selectedRole === "coach" ? bio.trim() || undefined : undefined,
          goal: selectedRole === "student" ? goal : undefined,
        });

        // 🛡️ Vincula formalmente a nova conta a este dispositivo físico
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
            bio: newUser.bio,
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

        if (requiresConfirmation) {
          setSuccessMessage(
            "Conta criada com sucesso! Enviamos um e-mail de confirmação para o endereço informado. Verifique sua caixa de entrada."
          );
        } else {
          setSuccessMessage(
            selectedRole === "coach"
              ? "Perfil de Professor criado! Redirecionando para o GymFlow..."
              : "Perfil de Aluno criado! Redirecionando para seus treinos..."
          );
          setTimeout(() => {
            router.push(redirectTarget);
          }, 800);
        }
      }

      // FORGOT PASSWORD
      else if (mode === "forgot") {
        forgotSchema.parse({ email });

        if (client) {
          const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth?recovery=true` : undefined;
          const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo,
          });

          if (error) {
            throw new Error(translateSupabaseError(error.message));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        triggerHaptic("success");
        setSuccessMessage(`Enviamos um link seguro de recuperação para ${email.trim()}.`);
      }

      // UPDATE PASSWORD
      else if (mode === "update-password") {
        updatePasswordSchema.parse({ password, confirmPassword });

        if (client) {
          const { error } = await client.auth.updateUser({
            password,
          });

          if (error) {
            throw new Error(translateSupabaseError(error.message));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        if (typeof window !== "undefined") {
          const cleanUrl = redirectTarget && redirectTarget !== "/"
            ? `${window.location.pathname}?redirect=${encodeURIComponent(redirectTarget)}`
            : window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        triggerHaptic("success");
        setSuccessMessage("Sua senha foi redefinida com sucesso! Você já pode entrar.");
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setSuccessMessage(null);
        }, 1200);
      }
    } catch (err: unknown) {
      triggerHaptic("warning");
      if (err instanceof z.ZodError) {
        setErrorMessage(err.errors[0]?.message || "Dados inválidos");
      } else if (err instanceof Error) {
        setErrorMessage(err.message || "Erro na autenticação.");
      } else {
        setErrorMessage("Erro ao processar sua solicitação.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#070709] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Glows de Fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Botão de Retorno */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao GymFlow</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <Dumbbell className="w-4 h-4" />
          <span>GymFlow</span>
        </div>
      </div>

      {/* Card Principal */}
      <div className="w-full max-w-md bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col gap-4">
        {/* Cabeçalho */}
        <div className="text-center space-y-1 pb-1">
          <h1 className="text-lg font-black text-white tracking-tight">
            {mode === "login" && "Acessar GymFlow"}
            {mode === "signup" && "Criar Conta de Usuário"}
            {mode === "forgot" && "Recuperação de Senha"}
            {mode === "magic-link" && "Acesso com Link Mágico"}
            {mode === "update-password" && "Definir Nova Senha"}
          </h1>
          <p className="text-xs text-zinc-400">
            {mode === "login" && "Entre para gerenciar seus treinos, alunos e agendamentos."}
            {mode === "signup" && "Escolha se deseja começar como Aluno ou Professor."}
            {mode === "forgot" && "Digite seu e-mail para receber o link de recuperação."}
            {mode === "magic-link" && "Acesse instantaneamente sem precisar digitar sua senha."}
            {mode === "update-password" && "Crie uma nova senha forte para proteger sua conta."}
          </p>
        </div>

        {/* Seletor Entrar / Criar Conta */}
        {(mode === "login" || mode === "signup") && (
          <div className="relative flex p-1 rounded-2xl bg-zinc-900/90 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Seleção Aluno / Professor no Cadastro */}
        {mode === "signup" && (
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Como deseja atuar?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedRole("student");
                }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                  selectedRole === "student"
                    ? "bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/15 ring-1 ring-emerald-500/40"
                    : "bg-zinc-950 border-white/[0.06] text-zinc-400 hover:text-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                    selectedRole === "student" ? "bg-emerald-500 text-zinc-950" : "bg-white/[0.06] text-zinc-400"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white">Sou Aluno</span>
                <span className="text-[9px] text-zinc-400 mt-0.5">Treinar e agendar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedRole("coach");
                }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                  selectedRole === "coach"
                    ? "bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/15 ring-1 ring-amber-500/40"
                    : "bg-zinc-950 border-white/[0.06] text-zinc-400 hover:text-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                    selectedRole === "coach" ? "bg-amber-500 text-zinc-950" : "bg-white/[0.06] text-zinc-400"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white">Sou Professor</span>
                <span className="text-[9px] text-zinc-400 mt-0.5">Prescrever e atender</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">Nome Completo</label>
                <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                  <User className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedRole === "coach" ? "Ex: Prof. Camila Martins" : "Ex: Carlos Silva"}
                    required
                    maxLength={70}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <BottomGradient />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">WhatsApp / Telefone</label>
                <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                  <Phone className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 11991234567"
                    maxLength={20}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none font-mono"
                  />
                  <BottomGradient />
                </div>
              </div>

              {selectedRole === "coach" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Registro CREF</label>
                      <input
                        type="text"
                        value={cref}
                        onChange={(e) => setCref(e.target.value)}
                        placeholder="Ex: 08412-SP"
                        maxLength={25}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 outline-none uppercase font-mono"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Especialidade</label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex: Hipertrofia & Postura"
                        maxLength={50}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Bio / Apresentação</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Breve descrição profissional para os alunos..."
                      maxLength={250}
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 outline-none resize-none"
                    />
                  </div>
                </>
              )}

              {selectedRole === "student" && (
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">Objetivo Inicial</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as UserProfile["goal"])}
                    className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white outline-none"
                  >
                    <option value="Hipertrofia">Hipertrofia & Ganho de Massa Muscular</option>
                    <option value="Emagrecimento">Emagrecimento & Definição Corporal</option>
                    <option value="Força & Performance">Força & Performance 5×5</option>
                    <option value="Condicionamento Geral">Condicionamento Físico & Saúde Geral</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* E-mail */}
          {mode !== "update-password" && (
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300">E-mail</label>
              <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                <Mail className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  required
                  maxLength={100}
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                />
                <BottomGradient />
              </div>
            </div>
          )}

          {/* Senha */}
          {mode !== "forgot" && mode !== "magic-link" && (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-300">
                  {mode === "update-password" ? "Nova Senha" : "Senha"}
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setMode("forgot");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>

              <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                <Lock className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  maxLength={100}
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="mr-3 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <BottomGradient />
              </div>

              {/* Medidor de Força */}
              {(mode === "signup" || mode === "update-password") && password.length > 0 && (
                <div className="flex flex-col gap-2 mt-1.5 p-2.5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-full flex-1 transition-all duration-300 ${
                            strengthScore >= lvl ? strengthInfo.bg : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${strengthInfo.color}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-400 pt-1">
                    <span className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-400 font-semibold" : ""}`}>
                      {passwordChecks.length ? <Check className="w-3 h-3" /> : "•"} Mínimo 8 caracteres
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordChecks.hasUpper ? "text-emerald-400 font-semibold" : ""}`}>
                      {passwordChecks.hasUpper ? <Check className="w-3 h-3" /> : "•"} Maiúscula (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordChecks.hasLower ? "text-emerald-400 font-semibold" : ""}`}>
                      {passwordChecks.hasLower ? <Check className="w-3 h-3" /> : "•"} Minúscula (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordChecks.hasNumber ? "text-emerald-400 font-semibold" : ""}`}>
                      {passwordChecks.hasNumber ? <Check className="w-3 h-3" /> : "•"} Número (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 col-span-2 ${passwordChecks.hasSpecial ? "text-emerald-400 font-semibold" : ""}`}>
                      {passwordChecks.hasSpecial ? <Check className="w-3 h-3" /> : "•"} Símbolo especial (!@#$%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirmar Senha */}
          {(mode === "signup" || mode === "update-password") && (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-300">Confirmar Senha</label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[10px] font-bold flex items-center gap-1 ${
                      isPasswordsMatching ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPasswordsMatching ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {isPasswordsMatching ? "Senhas coincidem" : "Senhas diferentes"}
                  </span>
                )}
              </div>
              <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                <KeyRound className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required
                  maxLength={100}
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="mr-3 text-zinc-400 hover:text-zinc-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <BottomGradient />
              </div>
            </div>
          )}

          {/* Lembrar de mim */}
          {mode === "login" && (
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-zinc-900 border-white/20 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                />
                <span className="text-[11px] text-zinc-300">Lembrar de mim neste dispositivo</span>
              </label>
            </div>
          )}

          {/* Termos & LGPD */}
          {mode === "signup" && (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-start gap-2.5">
              <input
                type="checkbox"
                id="page-terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-zinc-950 border-white/20 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 shrink-0 cursor-pointer"
              />
              <label htmlFor="page-terms-checkbox" className="text-[10px] text-zinc-300 leading-relaxed cursor-pointer select-none">
                Li e concordo com os{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 underline font-semibold inline-flex items-center gap-0.5"
                >
                  Termos de Uso e Política de Privacidade (LGPD)
                </button>{" "}
                do GymFlow.
              </label>
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isLoading || (mode === "signup" && !termsAccepted)}
            className="group/btn relative w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden mt-1 flex items-center justify-center gap-2"
          >
            <span>
              {isLoading
                ? "Processando..."
                : mode === "login"
                ? "Entrar no GymFlow →"
                : mode === "signup"
                ? selectedRole === "coach"
                  ? "Cadastrar Perfil de Professor →"
                  : "Cadastrar Perfil de Aluno →"
                : mode === "forgot"
                ? "Enviar Link de Recuperação →"
                : mode === "magic-link"
                ? "Enviar Link de Acesso Instantâneo →"
                : "Salvar Nova Senha →"}
            </span>
            <BottomGradient />
          </button>

          {/* Google OAuth (Login ou Cadastro) */}
          {(mode === "login" || mode === "signup") && (
            <>
              <div className="relative flex items-center justify-center my-0.5">
                <div className="border-t border-white/[0.08] w-full" />
                <span className="bg-zinc-950 px-2.5 text-[10px] text-zinc-500 uppercase tracking-wider font-mono shrink-0">
                  ou
                </span>
                <div className="border-t border-white/[0.08] w-full" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Continuar com o Google</span>
              </button>
            </>
          )}

          {/* Atalho Magic Link */}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setMode("magic-link");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-[11px] text-zinc-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors py-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Entrar sem senha via Magic Link</span>
            </button>
          )}

          {/* Links Secundários de Volta */}
          {(mode === "forgot" || mode === "magic-link" || mode === "update-password") && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Voltar para Entrar com Senha</span>
            </button>
          )}
        </form>

        {/* Rodapé de Segurança */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Auth & TLS Criptografado</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors underline"
          >
            Privacidade & LGPD
          </button>
        </div>
      </div>

      {/* Modal de Termos & Privacidade */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Termos de Uso & Privacidade (LGPD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 overflow-y-auto text-xs text-zinc-300 leading-relaxed no-scrollbar">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Compromisso GymFlow de Privacidade Absoluta
                </p>
                <p className="text-[11px] text-emerald-200/90 mt-1">
                  Seus dados de saúde, treinos, biometria corporal e contatos são confidenciais e nunca são comercializados com terceiros.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1">1. Coleta e Finalidade</h4>
                <p className="text-[11px] text-zinc-400">
                  O GymFlow coleta dados cadastrais exclusivamente para a prescrição, execução de rotinas e agendamento com personais parceiros.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1">2. Direitos do Titular (LGPD)</h4>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-zinc-400">
                  <li><strong>Exportação:</strong> Baixe todos os dados em JSON (/api/export-data).</li>
                  <li><strong>Direito ao Esquecimento:</strong> Exclua sua conta e histórico (/api/delete-account).</li>
                </ul>
              </div>
            </div>
            <div className="p-3 border-t border-white/[0.08] bg-zinc-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                Aceitar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#070709] flex items-center justify-center text-zinc-400 text-xs">
          Carregando GymFlow Auth...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
