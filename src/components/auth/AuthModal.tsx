"use client";

import React, { useState, useEffect, useId } from "react";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
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
  ArrowRight,
  RotateCcw,
  FileText,
  KeyRound,
  Shield,
  HelpCircle,
  ExternalLink,
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
// SCHEMAS ZOD ESTREITOS (ANTI-INJEÇÃO & SEGURANÇA)
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

// ============================================================================
// MICROCOMPONENTES VISUAIS (DESIGN SYSTEM ACETERNITY / OLED)
// ============================================================================

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/input:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent pointer-events-none" />
      <span className="group-hover/input:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-teal-400 to-transparent pointer-events-none" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={`flex flex-col space-y-1.5 w-full ${className || ""}`}>{children}</div>;
};

// Dicionário de tradução de erros do Supabase Auth
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

// ============================================================================
// COMPONENTE PRINCIPAL: AuthModal
// ============================================================================

export type AuthMode = "login" | "signup" | "forgot" | "update-password" | "magic-link";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (user: { name: string; email: string; role?: UserRole }) => void;
  initialMode?: AuthMode;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccessLogin,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  // Campos de Cadastro / Login
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cref, setCref] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState<UserProfile["goal"]>("Hipertrofia");

  // Preferências e Segurança
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de UI e feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Carrega e-mail salvo se "Lembrar de mim" foi usado anteriormente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("gymflow_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  // Sincroniza modo inicial caso a prop mude
  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  // Escuta evento de recuperação de senha disparado pelo Supabase na URL
  useEffect(() => {
    const handlePasswordRecovery = () => {
      setMode("update-password");
      setErrorMessage(null);
      setSuccessMessage("Link de recuperação validado com sucesso! Defina sua nova senha abaixo.");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("gymflow:password-recovery", handlePasswordRecovery);
      // Checa parâmetros de hash da URL
      if (window.location.hash.includes("type=recovery") || window.location.search.includes("recovery=true")) {
        setMode("update-password");
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("gymflow:password-recovery", handlePasswordRecovery);
      }
    };
  }, []);

  // Critérios de Força de Senha
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

  // Autenticação Social via Google OAuth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const client = getSupabase();
      if (client) {
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
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
        setErrorMessage("Google OAuth requer chaves ativas do Supabase configuradas.");
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

  // ============================================================================
  // HANDLER PRINCIPAL DE SUBMISSÃO
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const client = getSupabase();

      // ----------------------------------------------------------------------
      // MODO 1: LOGIN (ENTRAR COM SENHA)
      // ----------------------------------------------------------------------
      if (mode === "login") {
        loginSchema.parse({ email, password });

        // Gerencia preferência de Lembrar de Mim
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
          // Simulação graciosa em ambiente sem backend conectado
          await new Promise((resolve) => setTimeout(resolve, 500));
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
        setSuccessMessage(`Bem-vindo(a) de volta, ${loggedUser.name}! Entrando no GymFlow...`);

        // Sincroniza o usuário nas coleções do app (marketplace de coaches ou cadastro de alunos)
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

        if (onSuccessLogin) {
          onSuccessLogin({
            name: loggedUser.name,
            email: loggedUser.email,
            role: loggedUser.activeRole,
          });
        }

        setTimeout(() => {
          onClose();
        }, 800);
      }

      // ----------------------------------------------------------------------
      // MODO 1.5: LOGIN COM LINK MÁGICO (SEM SENHA)
      // ----------------------------------------------------------------------
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
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        triggerHaptic("success");
        setSuccessMessage(
          `Enviamos um Link Mágico de acesso instantâneo para ${email.trim()}. Verifique sua caixa de entrada e clique no link para entrar sem digitar senha.`
        );
      }

      // ----------------------------------------------------------------------
      // MODO 2: CADASTRO (CRIAR CONTA COMPLETA)
      // ----------------------------------------------------------------------
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

        // 🛡️ Proteção Anti-Abuso: Impede mais de uma conta por dispositivo e e-mail duplicado
        const deviceCheck = await canRegisterAccountOnDevice(email.trim());
        if (!deviceCheck.allowed) {
          throw new Error(deviceCheck.reason || "Criação de conta bloqueada para este dispositivo.");
        }

        let createdUserId: string | undefined;
        let requiresEmailConfirmation = false;

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
            // Se Supabase requerer confirmação de e-mail e não retornar sessão imediata
            if (!data.session && data.user.identities?.length) {
              requiresEmailConfirmation = true;
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        triggerHaptic("success");

        // Salva na store local com dados enriquecidos
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

        // 🛡️ Vincula formalmente a conta criada a este dispositivo físico
        await registerDeviceAccount({
          email: newUser.email,
          userId: newUser.id,
          trialUsed: false,
          plan: "pending_choice",
        });

        // Sincroniza com as coleções correspondentes do app
        if (selectedRole === "coach") {
          updateCoachPublicProfile(newUser.id, {
            name: newUser.name,
            cref: newUser.cref,
            specialty: newUser.specialty,
            bio: newUser.bio,
            phone: newUser.phone,
          });
        } else if (selectedRole === "student") {
          saveNewStudent({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            goal: newUser.goal || "Hipertrofia",
            phone: newUser.phone,
            isOfflineStudent: false,
          });
        }

        if (requiresEmailConfirmation) {
          setSuccessMessage(
            "Conta criada com sucesso! Enviamos um e-mail de confirmação para o endereço informado. Verifique sua caixa de entrada."
          );
        } else {
          setSuccessMessage(
            selectedRole === "coach"
              ? "Perfil de Professor criado! Você também poderá treinar no Modo Aluno quando quiser."
              : "Perfil de Aluno criado! Seu cronograma e treinos já estão ativos."
          );

          if (onSuccessLogin) {
            onSuccessLogin({
              name: newUser.name,
              email: newUser.email,
              role: newUser.activeRole,
            });
          }

          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }

      // ----------------------------------------------------------------------
      // MODO 3: ESQUECEU A SENHA (REDEFINIÇÃO VIA LINK SEGURO)
      // ----------------------------------------------------------------------
      else if (mode === "forgot") {
        forgotSchema.parse({ email });

        if (client) {
          const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/?recovery=true` : undefined;
          const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo,
          });

          if (error) {
            throw new Error(translateSupabaseError(error.message));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        triggerHaptic("success");
        setSuccessMessage(
          `Enviamos um link seguro de redefinição para ${email.trim()}. Verifique sua caixa de entrada e spam.`
        );
      }

      // ----------------------------------------------------------------------
      // MODO 4: ATUALIZAR NOVA SENHA (PÓS-LINK DE RECUPERAÇÃO)
      // ----------------------------------------------------------------------
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
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Limpa parâmetros de recuperação da URL para não prender a UI no modo de redefinição
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        triggerHaptic("success");
        setSuccessMessage("Sua senha foi redefinida com segurança! Você já pode entrar.");
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (err: unknown) {
      triggerHaptic("warning");
      if (err instanceof z.ZodError) {
        setErrorMessage(err.errors[0]?.message || "Dados inválidos");
      } else if (err instanceof Error) {
        setErrorMessage(err.message || "Erro na autenticação.");
      } else {
        setErrorMessage("E-mail ou senha incorretos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={
          mode === "login"
            ? "Acessar GymFlow"
            : mode === "signup"
            ? "Criar Conta de Usuário"
            : mode === "forgot"
            ? "Recuperação de Senha"
            : mode === "magic-link"
            ? "Acesso com Link Mágico"
            : "Definir Nova Senha"
        }
      >
        <div className="relative w-full flex flex-col gap-4 text-left">
          {/* Ambient Glows estilo Aceternity */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-28 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Subtítulo Descritivo */}
          <div className="text-center pb-1">
            <p className="text-xs text-zinc-400">
              {mode === "login" && "Entre no seu perfil para gerenciar treinos, alunos e agendamentos."}
              {mode === "signup" && "Cadastre-se e escolha se deseja iniciar como Aluno ou Professor."}
              {mode === "forgot" && "Informe seu e-mail cadastrado para receber o link de recuperação."}
              {mode === "magic-link" && "Informe seu e-mail para receber um link de acesso direto sem senha."}
              {mode === "update-password" && "Crie uma nova senha forte para proteger sua conta no GymFlow."}
            </p>
          </div>

          {/* Seletor de Modo (Entrar vs Criar Conta) */}
          {(mode === "login" || mode === "signup") && (
            <div className="relative flex p-1 rounded-2xl bg-zinc-950/90 border border-white/[0.08] shadow-inner">
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
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
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
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* SELEÇÃO DO PAPEL NO CADASTRO (ALUNO OU PROFESSOR) */}
          {mode === "signup" && (
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-sm">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Como você deseja atuar inicialmente?
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
                    className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                      selectedRole === "student" ? "bg-emerald-500 text-zinc-950" : "bg-white/[0.06] text-zinc-400"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-white">Sou Aluno</span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                    Quero treinar e contratar personais
                  </span>
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
                    className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                      selectedRole === "coach" ? "bg-amber-500 text-zinc-950" : "bg-white/[0.06] text-zinc-400"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-white">Sou Professor</span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                    Quero prescrever treinos e atender
                  </span>
                </button>
              </div>

              <p className="text-[9px] text-zinc-400 leading-snug italic mt-0.5">
                ✨ Flexibilidade total: você pode alternar livremente entre Modo Aluno e Professor nas configurações da conta.
              </p>
            </div>
          )}

          {/* Mensagens de Feedback */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in duration-150">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 z-10">
            {/* ------------------------------------------------------------- */}
            {/* CAMPOS ESPECÍFICOS DE CADASTRO */}
            {/* ------------------------------------------------------------- */}
            {mode === "signup" && (
              <>
                <LabelInputContainer>
                  <label className="text-[11px] font-semibold text-zinc-300">Nome Completo</label>
                  <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
                    <User className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={selectedRole === "coach" ? "Ex: Prof. Camila Martins" : "Ex: Carlos Silva"}
                      autoComplete="name"
                      required
                      maxLength={70}
                      className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                    />
                    <BottomGradient />
                  </div>
                </LabelInputContainer>

                <LabelInputContainer>
                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                    <span>WhatsApp / Telefone</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Para contato de treinos</span>
                  </label>
                  <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                    <Phone className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 11991234567"
                      autoComplete="tel"
                      maxLength={20}
                      className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none font-mono"
                    />
                    <BottomGradient />
                  </div>
                </LabelInputContainer>

                {/* Campos do Professor: CREF, Especialidade e Bio */}
                {selectedRole === "coach" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <LabelInputContainer>
                        <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                          <span>Registro CREF</span>
                          <span className="text-[10px] text-zinc-500 font-normal">(Opcional)</span>
                        </label>
                        <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08]">
                          <input
                            type="text"
                            value={cref}
                            onChange={(e) => setCref(e.target.value)}
                            placeholder="Ex: 08412-SP"
                            maxLength={25}
                            className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none font-mono uppercase"
                          />
                          <BottomGradient />
                        </div>
                      </LabelInputContainer>

                      <LabelInputContainer>
                        <label className="text-[11px] font-semibold text-zinc-300">Especialidade</label>
                        <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08]">
                          <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="Ex: Hipertrofia & Biomecânica"
                            maxLength={50}
                            className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                          />
                          <BottomGradient />
                        </div>
                      </LabelInputContainer>
                    </div>

                    <LabelInputContainer>
                      <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                        <span>Apresentação Profissional</span>
                        <span className="text-[10px] text-zinc-500 font-normal">(Opcional)</span>
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Ex: Especialista em periodização de treinos, hipertrofia natural e correção postural..."
                        maxLength={250}
                        rows={2}
                        className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500/60 resize-none"
                      />
                    </LabelInputContainer>
                  </>
                )}

                {/* Campo do Aluno: Meta/Objetivo */}
                {selectedRole === "student" && (
                  <LabelInputContainer>
                    <label className="text-[11px] font-semibold text-zinc-300">Objetivo de Treino Inicial</label>
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as UserProfile["goal"])}
                      className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white outline-none focus:border-emerald-500/60"
                    >
                      <option value="Hipertrofia">Hipertrofia & Ganho de Massa Muscular</option>
                      <option value="Emagrecimento">Emagrecimento & Definição Corporal</option>
                      <option value="Força & Performance">Força & Performance 5×5</option>
                      <option value="Condicionamento Geral">Condicionamento Físico & Saúde Geral</option>
                    </select>
                  </LabelInputContainer>
                )}
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* E-MAIL (COMUM A TODOS OS MODOS EXCETO UPDATE-PASSWORD) */}
            {/* ------------------------------------------------------------- */}
            {mode !== "update-password" && (
              <LabelInputContainer>
                <label className="text-[11px] font-semibold text-zinc-300">E-mail</label>
                <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
                  <Mail className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    autoComplete="email"
                    required
                    maxLength={100}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <BottomGradient />
                </div>
              </LabelInputContainer>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SENHA (MODOS: LOGIN, SIGNUP, UPDATE-PASSWORD) */}
            {/* ------------------------------------------------------------- */}
            {mode !== "forgot" && mode !== "magic-link" && (
              <LabelInputContainer>
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
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>

                <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
                  <Lock className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    maxLength={100}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="mr-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <BottomGradient />
                </div>

                {/* Medidor de Força e Checklist (Cadastro ou Redefinição) */}
                {(mode === "signup" || mode === "update-password") && password.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1.5 p-2.5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
                    {/* Barra de Progresso */}
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

                    {/* Requisitos interativos */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-400 pt-1">
                      <span className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-400 font-semibold" : ""}`}>
                        {passwordChecks.length ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        Mínimo 8 caracteres
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordChecks.hasUpper ? "text-emerald-400 font-semibold" : ""}`}>
                        {passwordChecks.hasUpper ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        1 Letra maiúscula (A-Z)
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordChecks.hasLower ? "text-emerald-400 font-semibold" : ""}`}>
                        {passwordChecks.hasLower ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        1 Letra minúscula (a-z)
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordChecks.hasNumber ? "text-emerald-400 font-semibold" : ""}`}>
                        {passwordChecks.hasNumber ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        1 Número (0-9)
                      </span>
                      <span className={`flex items-center gap-1.5 col-span-2 ${passwordChecks.hasSpecial ? "text-emerald-400 font-semibold" : ""}`}>
                        {passwordChecks.hasSpecial ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        1 Símbolo especial (!@#$%)
                      </span>
                    </div>
                  </div>
                )}
              </LabelInputContainer>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONFIRMAR SENHA (MODOS: SIGNUP, UPDATE-PASSWORD) */}
            {/* ------------------------------------------------------------- */}
            {(mode === "signup" || mode === "update-password") && (
              <LabelInputContainer>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-300">Confirmar Senha</label>
                  {confirmPassword.length > 0 && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        isPasswordsMatching ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPasswordsMatching ? (
                        <>
                          <Check className="w-3 h-3" /> Senhas coincidem
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" /> Senhas diferentes
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
                  <KeyRound className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    autoComplete="new-password"
                    required
                    maxLength={100}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="mr-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <BottomGradient />
                </div>
              </LabelInputContainer>
            )}

            {/* ------------------------------------------------------------- */}
            {/* LEMBRAR DE MIM (LOGIN) */}
            {/* ------------------------------------------------------------- */}
            {mode === "login" && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-zinc-900 border-white/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950 accent-emerald-500"
                  />
                  <span className="text-[11px] text-zinc-300">Lembrar de mim neste dispositivo</span>
                </label>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONCORDÂNCIA COM TERMOS DE USO & LGPD (SIGNUP) */}
            {/* ------------------------------------------------------------- */}
            {mode === "signup" && (
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-zinc-950 border-white/20 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 shrink-0 cursor-pointer"
                />
                <label htmlFor="terms-checkbox" className="text-[10px] text-zinc-300 leading-relaxed cursor-pointer select-none">
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
                  do GymFlow, autorizando o armazenamento seguro de meus treinos e contatos.
                </label>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* BOTÃO PRINCIPAL DE ENVIO */}
            {/* ------------------------------------------------------------- */}
            <button
              type="submit"
              disabled={isLoading || (mode === "signup" && !termsAccepted)}
              className="group/btn relative w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden mt-1 flex items-center justify-center gap-2"
            >
              <span>
                {isLoading
                  ? "Processando..."
                  : mode === "login"
                  ? "Entrar no GymFlow &rarr;"
                  : mode === "signup"
                  ? selectedRole === "coach"
                    ? "Cadastrar Perfil de Professor &rarr;"
                    : "Cadastrar Perfil de Aluno &rarr;"
                  : mode === "forgot"
                  ? "Enviar Link de Recuperação &rarr;"
                  : mode === "magic-link"
                  ? "Enviar Link de Acesso Instantâneo &rarr;"
                  : "Salvar Nova Senha &rarr;"}
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

            {/* Alternância para Magic Link no Login */}
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

            {/* ------------------------------------------------------------- */}
            {/* LINKS DE RETORNO / ALTERNÂNCIA SECUNDÁRIA */}
            {/* ------------------------------------------------------------- */}
            {mode === "forgot" && (
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
                <span>Voltar para o Login</span>
              </button>
            )}

            {mode === "magic-link" && (
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

            {mode === "update-password" && (
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
                <span>Ir para a Tela de Login</span>
              </button>
            )}
          </form>

          {/* Rodapé de Segurança e LGPD */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px] text-zinc-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protegido por Supabase Auth & Criptografia TLS</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors underline"
            >
              Privacidade & Termos
            </button>
          </div>
        </div>
      </Drawer>

      {/* ==================================================================== */}
      {/* MODAL / DRAWER DE TERMOS DE USO & POLÍTICA DE PRIVACIDADE LGPD       */}
      {/* ==================================================================== */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Termos */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Termos de Uso & Privacidade (LGPD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs text-zinc-300 leading-relaxed no-scrollbar">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Compromisso GymFlow de Privacidade Absoluta
                </p>
                <p className="text-[11px] text-emerald-200/90 mt-1">
                  Seus dados de saúde, treinos, biometria corporal e contatos são confidenciais e nunca são comercializados com terceiros.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1">1. Coleta e Finalidade dos Dados</h4>
                <p className="text-[11px] text-zinc-400">
                  O GymFlow coleta dados cadastrais (nome, e-mail, telefone/WhatsApp) e biometria opcional (peso corporal, altura, objetivo de treino) exclusivamente para a prescrição, execução de rotinas e agendamento de sessões com personal trainers parceiros.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1">2. Direitos do Titular (LGPD - Lei 13.709/2018)</h4>
                <p className="text-[11px] text-zinc-400">
                  Você possui o direito inalienável de:
                </p>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-zinc-400">
                  <li><strong>Acesso e Portabilidade:</strong> Exportar todos os seus dados em formato JSON através de nosso endpoint dedicado (<code>/api/export-data</code>).</li>
                  <li><strong>Direito ao Esquecimento:</strong> Excluir sua conta e todo histórico associado imediatamente via configurações ou endpoint seguro (<code>/api/delete-account</code>).</li>
                  <li><strong>Revogação de Consentimento:</strong> Desconectar seu perfil a qualquer momento sem custos adicionais.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1">3. Segurança e Criptografia</h4>
                <p className="text-[11px] text-zinc-400">
                  Todas as comunicações são trafegadas sob protocolo TLS 1.3 com cabeçalhos HSTS (Strict-Transport-Security), Content Security Policy (CSP) restritivo e armazenamento criptografado no Supabase.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1">4. Regras para Personal Trainers</h4>
                <p className="text-[11px] text-zinc-400">
                  Profissionais que atuam prescrevendo treinos devem possuir registro profissional válido (CREF) e atuar em conformidade com as diretrizes do Conselho Federal de Educação Física (CONFEF).
                </p>
              </div>
            </div>

            {/* Rodapé de Fechamento */}
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
                Entendi e Aceito os Termos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
