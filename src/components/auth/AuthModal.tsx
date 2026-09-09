"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { ShieldCheck, Lock, Mail, User, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

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
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[0-9]/, "A senha deve conter ao menos um número")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
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
  onSuccessLogin?: (user: { name: string; email: string }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccessLogin }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Força de senha visual
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
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
      if (mode === "login") {
        loginSchema.parse({ email, password });
        await new Promise((resolve) => setTimeout(resolve, 800));

        setSuccessMessage("Login efetuado com sucesso! Acessando GymFlow...");
        if (onSuccessLogin) {
          onSuccessLogin({ name: email.split("@")[0], email });
        }
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        signupSchema.parse({ name, email, password });
        await new Promise((resolve) => setTimeout(resolve, 900));

        setSuccessMessage("Matrícula criada com sucesso! Bem-vindo ao time.");
        if (onSuccessLogin) {
          onSuccessLogin({ name, email });
        }
        setTimeout(() => {
          onClose();
        }, 900);
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setErrorMessage(err.errors[0]?.message || "Dados inválidos");
      } else {
        setErrorMessage("E-mail ou senha incorretos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={mode === "login" ? "Entrar na Academia" : "Criar Conta de Membro"}>
      <div className="relative w-full flex flex-col gap-4 text-left">
        {/* Glow de Fundo e Feixes Neon Estilo Aceternity */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-24 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header com Descrição */}
        <div className="text-center pb-1">
          <p className="text-xs text-zinc-400">
            {mode === "login"
              ? "Acesse seus treinos, check-in da catraca e evolução física."
              : "Cadastre-se para gerenciar seus treinos e aulas coletivas."}
          </p>
        </div>

        {/* Seletor de Modo (Abas Animadas) */}
        <div className="relative flex p-1 rounded-2xl bg-zinc-950/80 border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => {
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

        {/* Formulário Aceternity UI Blocks */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 z-10">
          {mode === "signup" && (
            <LabelInputContainer>
              <label className="text-[11px] font-semibold text-zinc-300">Nome Completo</label>
              <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
                <User className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  autoComplete="name"
                  required
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                />
                <BottomGradient />
              </div>
            </LabelInputContainer>
          )}

          <LabelInputContainer>
            <label className="text-[11px] font-semibold text-zinc-300">E-mail</label>
            <div className="group/input relative flex items-center rounded-xl bg-zinc-900/70 border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
              <Mail className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atleta@gymflow.com"
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
                  onClick={() => alert("Link de redefinição de senha enviado para o e-mail cadastrado.")}
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

            {/* Medidor de força de senha no cadastro */}
            {mode === "signup" && password.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength >= 1 ? "bg-red-500" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength >= 2 ? "bg-amber-500" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength >= 3 ? "bg-emerald-400" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength >= 4 ? "bg-emerald-500" : "bg-transparent"
                    }`}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {strength <= 1 ? "Fraca" : strength <= 2 ? "Média" : "Forte"}
                </span>
              </div>
            )}
          </LabelInputContainer>

          {/* Botão de Envio com Efeito Aceternity Shimmer */}
          <button
            type="submit"
            disabled={isLoading}
            className="group/btn relative w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden mt-1"
          >
            <span>{isLoading ? "Processando..." : mode === "login" ? "Entrar na Academia &rarr;" : "Criar Minha Matrícula &rarr;"}</span>
            <BottomGradient />
          </button>
        </form>

        {/* Divisor Aceternity */}
        <div className="relative flex items-center justify-center my-1">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="absolute px-2 bg-[#0C0C10] text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            ou acesse com
          </span>
        </div>

        {/* Botões Sociais com Efeito Aceternity UI */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              if (onSuccessLogin) onSuccessLogin({ name: "Atleta Google", email: "atleta@gmail.com" });
              onClose();
            }}
            className="group/btn relative flex items-center justify-center py-2.5 px-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-xs font-medium text-white transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
              />
            </svg>
            <BottomGradient />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSuccessLogin) onSuccessLogin({ name: "Atleta Apple", email: "atleta@icloud.com" });
              onClose();
            }}
            className="group/btn relative flex items-center justify-center py-2.5 px-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-xs font-medium text-white transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.04-.51 2.66-1.26z" />
            </svg>
            <BottomGradient />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSuccessLogin) onSuccessLogin({ name: "Atleta GitHub", email: "atleta@github.com" });
              onClose();
            }}
            className="group/btn relative flex items-center justify-center py-2.5 px-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-xs font-medium text-white transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <BottomGradient />
          </button>
        </div>

        {/* Rodapé de Segurança */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Criptografia de ponta a ponta • LGPD compliant</span>
        </div>
      </div>
    </Drawer>
  );
}
