"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  ShieldCheck,
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
  Shield,
  Zap,
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
// VALIDAÇÃO ZOD
// ============================================================================
const loginSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido").max(100),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(100),
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
      errorMap: () => ({ message: "Você precisa aceitar os Termos de Uso e LGPD." }),
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
  const [tab, setTab] = useState<"login" | "signup">("login");
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

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const client = getSupabase();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // 1. MODO LOGIN
      if (tab === "login") {
        loginSchema.parse({ email, password });

        let loggedUser: UserProfile;

        if (client) {
          const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            throw new Error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
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

      // 2. MODO CADASTRO (SIGNUP)
      else {
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

        // 🛡️ Proteção Anti-Abuso: Bloqueio de múltiplas contas por dispositivo
        const deviceCheck = await canRegisterAccountOnDevice(email.trim());
        if (!deviceCheck.allowed) {
          throw new Error(deviceCheck.reason || "Criação de conta bloqueada para este dispositivo.");
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
    <div className="min-h-screen w-full bg-[#060608] text-white flex items-center justify-center p-4 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Decorativo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 flex flex-col space-y-5">
        {/* Cabeçalho */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>GymFlow Access</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
            {tab === "login" ? "Entrar na sua conta" : "Crie sua conta"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            {tab === "login"
              ? "Acesse suas rotinas, agendamentos e treinos de elite."
              : "Cadastre-se para iniciar seu período de teste ou plano."}
          </p>
        </div>

        {/* Alternador Login / Cadastro */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setTab("login");
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "login"
                ? "bg-emerald-500 text-zinc-950 font-black shadow-md"
                : "text-zinc-400 hover:text-white"
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
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "signup"
                ? "bg-emerald-500 text-zinc-950 font-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <>
              {/* Escolha Aluno ou Personal */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === "student"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-zinc-900 border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Sou Aluno(a)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("coach")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === "coach"
                      ? "bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/30"
                      : "bg-zinc-900 border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Sou Personal</span>
                </button>
              </div>

              {/* Nome Completo */}
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="WhatsApp (ex: 11999990000)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Se for Coach: CREF */}
              {selectedRole === "coach" && (
                <div className="relative">
                  <Shield className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Registro CREF (opcional)"
                    value={cref}
                    onChange={(e) => setCref(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}
            </>
          )}

          {/* E-mail */}
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="Seu e-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirmação de Senha no Cadastro */}
          {tab === "signup" && (
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* Termos de Uso no Cadastro */}
          {tab === "signup" && (
            <label className="flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded bg-zinc-900 border-white/20 text-emerald-500 focus:ring-emerald-500/30"
              />
              <span className="leading-snug">
                Concordo com os Termos de Uso, Política de Privacidade e proteção LGPD do GymFlow.
              </span>
            </label>
          )}

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Processando...</span>
            ) : tab === "login" ? (
              <>
                <span>Acessar o GymFlow</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            ) : (
              <>
                <span>Cadastrar e Continuar</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Proteção Anti-Abuso & Rodapé */}
        <div className="pt-2 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 border-t border-white/[0.06]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sistema anti-abuso ativo: 1 conta por dispositivo físico.</span>
        </div>
      </div>
    </div>
  );
}
