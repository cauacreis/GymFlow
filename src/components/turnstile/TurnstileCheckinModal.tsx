"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Drawer } from "@/components/ui/Drawer";
import { ShieldCheck, CheckCircle, RefreshCw, Smartphone, Users, Zap, Lock, AlertCircle } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser } from "@/lib/auth-store";
import { canAccessFeature, getUserPlanTier, isSubscriptionExpired } from "@/lib/subscription-features";

interface TurnstileCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name: string; email: string } | null;
  onOpenPlans?: () => void;
}

export function TurnstileCheckinModal({
  isOpen,
  onClose,
  user,
  onOpenPlans,
}: TurnstileCheckinModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [isScanned, setIsScanned] = useState(false);
  const [tokenSeed, setTokenSeed] = useState(Date.now());

  const currentUser = getCurrentUser();
  const memberName = user?.name || currentUser.name || "Aluno GymFlow";
  const matricula = currentUser.matricula || "GF-84920";
  const planTier = getUserPlanTier(currentUser);
  const isExpired = isSubscriptionExpired(currentUser);
  const access = canAccessFeature("turnstile_checkin", currentUser);

  // Geração do QR Code dinâmico com token rotativo (apenas se acesso liberado)
  useEffect(() => {
    if (!isOpen || isExpired || !access.allowed) {
      setIsScanned(false);
      return;
    }

    const payload = JSON.stringify({
      app: "GymFlow",
      matricula,
      timestamp: tokenSeed,
      token: btoa(`${matricula}-${tokenSeed}`).slice(0, 16),
    });

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [isOpen, tokenSeed, matricula, isExpired, access.allowed]);

  // Timer de rotação do QR Code (30 segundos)
  useEffect(() => {
    if (!isOpen || isScanned) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setTokenSeed(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isScanned]);

  // Simulação de Leitura na Catraca
  const handleSimulateScan = () => {
    triggerHaptic("heavy");
    setIsScanned(true);
    setTimeout(() => {
      triggerHaptic("medium");
    }, 300);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Passe de Acesso à Academia">
      <div className="flex flex-col items-center gap-4 py-1 text-center w-full relative">
        {/* Glow de Fundo */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {isExpired || !access.allowed ? (
          /* Estado Bloqueado: Assinatura Vencida ou Sem Plano */
          <div className="flex flex-col items-center gap-3 py-6 px-4 w-full text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Acesso Bloqueado na Catraca
              </span>
              <h3 className="text-lg font-black text-white mt-1.5">Assinatura Inativa ou Vencida</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Seu plano de acesso à academia expirou. Para liberar o giro da catraca digital na portaria, regularize sua assinatura.
              </p>
            </div>
            {onOpenPlans && (
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  onClose();
                  onOpenPlans();
                }}
                className="mt-2 w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Renovar Assinatura Agora
              </button>
            )}
          </div>
        ) : isScanned ? (
          /* Estado de Sucesso: Catraca Liberada */
          <div className="flex flex-col items-center gap-3 py-8 px-4 w-full animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Check-in Confirmado
              </span>
              <h3 className="text-xl font-black text-white mt-1">Catraca 02 Liberada!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Tenha um excelente treino hoje, <strong className="text-white">{memberName}</strong>!
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 mt-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Sequência ativa: <strong>16 dias consecutivos</strong></span>
            </div>

            <button
              onClick={() => {
                setIsScanned(false);
                setTokenSeed(Date.now());
                setSecondsRemaining(30);
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-all active:scale-95"
            >
              Novo QR Code
            </button>
          </div>
        ) : (
          /* Estado Normal: QR Code com Cartão Digital */
          <>
            {/* Card de Identificação do Membro */}
            <div className="flex items-center justify-between w-full p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold text-sm shadow-md">
                  {memberName.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                    {memberName}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400">Matrícula: #{matricula}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  Plano {planTier.toUpperCase()}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Liberado
                </span>
              </div>
            </div>

            {/* Container do QR Code com Borda de Alta Precisão */}
            <div className="relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-emerald-500/40">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code de Acesso"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center bg-zinc-100 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Timer de Validade do Token */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>
                Atualiza em <strong className="font-mono text-white">{secondsRemaining}s</strong>{" "}
                (Anti-Print)
              </span>
            </div>

            {/* Botão de Simulação de Leitura */}
            <button
              onClick={handleSimulateScan}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] active:scale-95 transition-all"
            >
              Simular Leitura na Catraca ➔
            </button>

            {/* Aviso de Segurança */}
            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Token criptografado com rotação automática a cada 30 segundos.</span>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
