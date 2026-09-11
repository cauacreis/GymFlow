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

        {/* Formulário */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <>
              {/* Seleção de Papel (Aluno ou Personal) */}
              <div className="grid grid-cols-2 gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedRole("student");
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    selectedRole === "student"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20 shadow-sm"
                      : "bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Sou Aluno(a)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedRole("coach");
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    selectedRole === "coach"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/20 shadow-sm"
                      : "bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Sou Personal</span>
                </button>
              </div>

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
