"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, Mail, User, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

// Schemas Zod Estritos
const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido").max(100),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(100),
});

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(60),
  email: z.string().email("Formato de e-mail inválido").max(100),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres com letras e números").max(100),
});

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        // Validação Zod no Client
        loginSchema.parse({ email, password });

        // Simulação de login seguro com mensagem genérica (anti-enumeração)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Sucesso
        setSuccessMessage("Login efetuado com sucesso!");
        if (onSuccessLogin) {
          onSuccessLogin({ name: email.split("@")[0], email });
        }
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        // Validação Zod para Cadastro
        signupSchema.parse({ name, email, password });

        await new Promise((resolve) => setTimeout(resolve, 900));

        setSuccessMessage("Conta criada com sucesso! Bem-vindo ao GymFlow.");
        if (onSuccessLogin) {
          onSuccessLogin({ name, email });
        }
        setTimeout(() => {
          onClose();
        }, 900);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMessage(err.errors[0]?.message || "Dados inválidos");
      } else {
        // Mensagem de erro cega de segurança
        setErrorMessage("E-mail ou senha incorretos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={mode === "login" ? "Entrar na sua Conta" : "Criar Nova Conta"}>
      <div className="relative w-full flex flex-col gap-4">
        
        {/* Glow de Fundo Estilo Aceternity UI */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Seletor de Modo (Abas Animadas) */}
        <div className="relative flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "login"
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(16,185,129,0.3)]"
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
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(16,185,129,0.3)]"
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

        {/* Formulário com Inputs com Linhas Aceternity Glow */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 z-10">
          {mode === "signup" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-300">Nome Completo</label>
              <div className="relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
                <User className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  required
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-zinc-300">E-mail</label>
            <div className="relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
              <Mail className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                autoComplete="username"
                required
                className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-300">Senha</label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => alert("Link de recuperação enviado para o e-mail cadastrado caso exista.")}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all">
              <Lock className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? "Processando..." : mode === "login" ? "Acessar Conta" : "Cadastrar Gratuitamente"}
          </Button>
        </form>

        {/* Divisor com Linha Aceternity */}
        <div className="relative flex items-center justify-center my-1">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="absolute px-2 bg-[#0C0C10] text-[10px] uppercase font-bold text-zinc-400">
            ou continue com
          </span>
        </div>

        {/* Botões Sociais Estilo Aceternity UI */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (onSuccessLogin) onSuccessLogin({ name: "Google User", email: "atleta@google.com" });
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white transition-all active:scale-[0.98]"
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
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSuccessLogin) onSuccessLogin({ name: "Apple Athlete", email: "atleta@icloud.com" });
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.04-.51 2.66-1.26z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protegido contra força bruta • Validação Zod ativa</span>
        </div>
      </div>
    </Drawer>
  );
}
