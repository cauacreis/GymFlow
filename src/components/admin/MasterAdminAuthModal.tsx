"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Terminal,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  verifyMasterKey,
  establishVaultSession,
  getVaultLockoutState,
  recordFailedVaultAttempt,
  VaultLockoutState,
} from "@/lib/admin-vault";

interface MasterAdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MasterAdminAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: MasterAdminAuthModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lockout, setLockout] = useState<VaultLockoutState>({
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: 4,
  });

  // Atualiza estado de bloqueio periodicamente enquanto o modal estiver aberto
  useEffect(() => {
    if (!isOpen) {
      setInputKey("");
      setErrorMsg(null);
      setIsSuccess(false);
      return;
    }

    const state = getVaultLockoutState();
    setLockout(state);

    const timer = setInterval(() => {
      const current = getVaultLockoutState();
      setLockout(current);
      if (!current.isLocked && lockout.isLocked) {
        setErrorMsg(null);
      }
    }, 1000);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearInterval(timer);
  }, [isOpen, lockout.isLocked]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockout.isLocked) {
      triggerHaptic("warning");
      setErrorMsg(`Terminal temporariamente bloqueado. Aguarde ${lockout.remainingSeconds}s.`);
      return;
    }

    if (!inputKey.trim()) {
      triggerHaptic("warning");
      setErrorMsg("Insira a chave mestra de segurança.");
      return;
    }

    const isValid = verifyMasterKey(inputKey);

    if (isValid) {
      triggerHaptic("success");
      setIsSuccess(true);
      setErrorMsg(null);
      establishVaultSession();

      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin-vault");
        }
      }, 700);
    } else {
      triggerHaptic("warning");
      const nextLockout = recordFailedVaultAttempt();
      setLockout(nextLockout);

      if (nextLockout.isLocked) {
        setErrorMsg(`Chave incorreta! Bloqueio ativado por ${nextLockout.remainingSeconds}s.`);
      } else {
        setErrorMsg(`Chave mestra inválida! Restam ${nextLockout.attemptsLeft} tentativa(s).`);
      }
      setInputKey("");
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-zinc-100 flex flex-col gap-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Efeito sutil de scanlines / radar */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Terminal className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide text-white">
                  GymFlow Vault
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  NÍVEL 0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Terminal de Administração Restrito
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso ou Status */}
        <div className="relative z-10 p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex items-center gap-2.5 text-xs text-zinc-400">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-relaxed">
            Área confidencial para auditoria, edição master de dados e monitoramento de banco.
          </span>
        </div>

        {/* Formulário de Chave */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 flex items-center justify-between">
              <span>Chave Mestra de Segurança</span>
              {lockout.isLocked ? (
                <span className="text-rose-400 font-mono font-bold">
                  Bloqueado ({lockout.remainingSeconds}s)
                </span>
              ) : (
                <span className="text-zinc-500 font-mono">
                  {lockout.attemptsLeft} tentativas
                </span>
              )}
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showKey ? "text" : "password"}
                disabled={lockout.isLocked || isSuccess}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Digite a Chave Mestra..."
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all disabled:opacity-50"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensagem de Erro / Sucesso */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Chave Mestra autenticada! Acessando Vault...</span>
            </div>
          )}

          {/* Botões */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition-all active:scale-95"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={lockout.isLocked || isSuccess}
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSuccess ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Desbloqueado</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar no Vault</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Rodapé discreto */}
        <p className="text-[10px] text-center text-zinc-500 font-mono relative z-10">
          GymFlow Master Security Shield • Atividade monitorada
        </p>
      </div>
    </div>
  );
}
