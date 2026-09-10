"use client";

import React, { useState } from "react";
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
  Target,
  Sparkles,
  Phone,
} from "lucide-react";
import { registerNewUser, saveUserProfile, UserRole, UserProfile } from "@/lib/auth-store";
import { triggerHaptic } from "@/lib/haptic";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

// Schemas Zod Estritos (Anti-Injeção e Validação de Formato)
const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido").max(100),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(100),
});

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(60),
  email: z.string().email("Formato de e-mail inválido").max(100),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100),
});

// Componente de Gradiente Inferior Oficial da Aceternity UI
const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
    </>
  );
};

// Container de Input Estilo Aceternity UI
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={`flex flex-col space-y-1.5 w-full ${className || ""}`}>{children}</div>;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (user: { name: string; email: string; role?: UserRole }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccessLogin }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cref, setCref] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [goal, setGoal] = useState<UserProfile["goal"]>("Hipertrofia");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Força de senha visual
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const client = getSupabase();

      if (mode === "login") {
        loginSchema.parse({ email, password });

        let profileName = email.split("@")[0];
        let userRole: UserRole = "coach";

        if (client) {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(error.message);
          }
          if (data?.user) {
            const { data: profile } = await client
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .maybeSingle();

            if (profile) {
              profileName = profile.name || profileName;
              userRole = (profile.active_role as UserRole) || userRole;
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        // Atualiza perfil logado no store
        const loggedUser = saveUserProfile({
          email,
          name: profileName,
          activeRole: userRole,
        });

        setSuccessMessage(`Login efetuado! Entrando como ${loggedUser.activeRole === "coach" ? "Professor" : "Aluno"}...`);
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
      } else {
        signupSchema.parse({ name, email, password });

        let createdUserId: string | undefined;

        if (client) {
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                phone,
                role: selectedRole,
                cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
                specialty: selectedRole === "coach" ? specialty || "Musculação & Hipertrofia" : undefined,
                goal: selectedRole === "student" ? goal : undefined,
              },
            },
          });

          if (error) {
            throw new Error(error.message);
          }
          createdUserId = data?.user?.id;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }

        // Registra novo usuário com o papel escolhido
        const newUser = registerNewUser({
          name,
          email,
          role: selectedRole,
          phone,
          cref: selectedRole === "coach" ? cref.trim() || undefined : undefined,
          specialty: selectedRole === "coach" ? specialty || "Musculação & Hipertrofia" : undefined,
          goal: selectedRole === "student" ? goal : undefined,
        });

        if (createdUserId) {
          saveUserProfile({ id: createdUserId });
        }

        setSuccessMessage(
          selectedRole === "coach"
            ? "Perfil de Professor criado! Você também poderá treinar no Modo Aluno quando quiser."
            : "Perfil de Aluno criado! Você também poderá prescrever treinos no Modo Professor."
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
        }, 900);
      }
    } catch (err: unknown) {
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "login" ? "Acessar GymFlow" : "Criar Conta de Usuário"}
    >
      <div className="relative w-full flex flex-col gap-4 text-left">
        {/* Glow de Fundo e Feixes Neon Estilo Aceternity */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-24 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header com Descrição */}
        <div className="text-center pb-1">
          <p className="text-xs text-zinc-400">
            {mode === "login"
              ? "Acesse seu perfil de Aluno ou Professor para treinar e prescrever."
              : "Cadastre-se e escolha se deseja iniciar como Aluno ou Professor."}
          </p>
        </div>

        {/* Seletor de Modo: Entrar vs Criar Conta */}
        <div className="relative flex p-1 rounded-2xl bg-zinc-950/80 border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setMode("login");
              setErrorMessage(null);
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

        {/* SELEÇÃO DO PAPEL NO CADASTRO (ALUNO OU PROFESSOR) */}
        {mode === "signup" && (
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
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
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                  selectedRole === "student" ? "bg-emerald-500 text-zinc-950" : "bg-white/[0.06] text-zinc-400"
                }`}>
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
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                  selectedRole === "coach" ? "bg-amber-500 text-zinc-950" : "bg-white/[0.06] text-zinc-400"
                }`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white">Sou Professor</span>
                <span className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                  Quero prescrever treinos e atender
                </span>
              </button>
            </div>

            <p className="text-[9px] text-zinc-400 leading-snug italic mt-1">
              ✨ Não se preocupe: nas configurações da conta você pode alternar livremente para treinar e também ser treinador com a mesma conta!
            </p>
          </div>
        )}

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 z-10">
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
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <BottomGradient />
                </div>
              </LabelInputContainer>

              <LabelInputContainer>
                <label className="text-[11px] font-semibold text-zinc-300">WhatsApp / Telefone</label>
                <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 transition-all">
                  <Phone className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 11991234567"
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <BottomGradient />
                </div>
              </LabelInputContainer>

              {/* Se for Professor: CREF e Especialidade */}
              {selectedRole === "coach" && (
                <div className="grid grid-cols-2 gap-2">
                  <LabelInputContainer>
                    <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Registro CREF</span>
                      <span className="text-[10px] text-zinc-500 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08]">
                      <input
                        type="text"
                        value={cref}
                        onChange={(e) => setCref(e.target.value)}
                        placeholder="Ex: 08412-SP (opcional)"
                        className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none font-mono"
                      />
                    </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <label className="text-[11px] font-semibold text-zinc-300">Especialidade</label>
                    <div className="relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08]">
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex: Hipertrofia"
                        className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                      />
                    </div>
                  </LabelInputContainer>
                </div>
              )}

              {/* Se for Aluno: Meta/Objetivo */}
              {selectedRole === "student" && (
                <LabelInputContainer>
                  <label className="text-[11px] font-semibold text-zinc-300">Objetivo de Treino</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as UserProfile["goal"])}
                    className="w-full p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-white outline-none focus:border-emerald-500/60"
                  >
                    <option value="Hipertrofia">Hipertrofia & Ganho de Massa</option>
                    <option value="Emagrecimento">Emagrecimento & Definição</option>
                    <option value="Força & Performance">Força & Performance 5×5</option>
                    <option value="Condicionamento Geral">Condicionamento Físico & Saúde</option>
                  </select>
                </LabelInputContainer>
              )}
            </>
          )}

          <LabelInputContainer>
            <label className="text-[11px] font-semibold text-zinc-300">E-mail</label>
            <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
              <Mail className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@gymflow.com"
                autoComplete="username"
                required
                className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
              />
              <BottomGradient />
            </div>
          </LabelInputContainer>

          <LabelInputContainer>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-300">Senha</label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => alert("Link de redefinição de senha enviado para o e-mail informado.")}
                  className="text-[10px] text-emerald-400 hover:underline"
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

            {/* Medidor de força de senha */}
            {mode === "signup" && password.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 transition-all ${strength >= 1 ? "bg-red-500" : "bg-transparent"}`} />
                  <div className={`h-full flex-1 transition-all ${strength >= 2 ? "bg-amber-500" : "bg-transparent"}`} />
                  <div className={`h-full flex-1 transition-all ${strength >= 3 ? "bg-emerald-400" : "bg-transparent"}`} />
                  <div className={`h-full flex-1 transition-all ${strength >= 4 ? "bg-emerald-500" : "bg-transparent"}`} />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {strength <= 1 ? "Fraca" : strength <= 2 ? "Média" : "Forte"}
                </span>
              </div>
            )}
          </LabelInputContainer>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isLoading}
            className="group/btn relative w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden mt-1"
          >
            <span>
              {isLoading
                ? "Processando..."
                : mode === "login"
                ? "Entrar no GymFlow &rarr;"
                : selectedRole === "coach"
                ? "Cadastrar Perfil de Professor &rarr;"
                : "Cadastrar Perfil de Aluno &rarr;"}
            </span>
            <BottomGradient />
          </button>
        </form>

        {/* Rodapé de Segurança */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>GymFlow • Perfis de Alunos & Personal Trainers</span>
        </div>
      </div>
    </Drawer>
  );
}
