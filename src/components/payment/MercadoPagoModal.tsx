"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { QrCode, CreditCard, Copy, Check, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { createSandboxPayment, PaymentResult } from "@/lib/mercadopago";

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: () => void;
}

export function MercadoPagoModal({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess,
}: MercadoPagoModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Dados fictícios do Pix Sandbox
  const pixCode = `00020126580014br.gov.bcb.pix0136gymflow-sandbox-pay-${Date.now()}520400005303986540${amount.toFixed(
    2
  )}5802BR5915GymFlow Alimentos6009Sao Paulo62070503***6304E1F2`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsProcessing(false);
    setPaymentSuccess(true);

    // Explosão de Confetes de Celebração de Atleta
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10B981", "#22C55E", "#34D399", "#FFFFFF"],
    });

    setTimeout(() => {
      onPaymentSuccess();
    }, 2000);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Pagamento com Mercado Pago">
      {paymentSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h4 className="text-lg font-black text-white">Pagamento Confirmado!</h4>
          <p className="text-xs text-zinc-300 mt-1 max-w-[260px]">
            Seu pedido foi encaminhado para a cozinha esportiva e chegará em ~28 min.
          </p>
          <span className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
            Status: Aprovado no Sandbox
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Banner de Ambiente Sandbox */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <b>Modo Sandbox:</b> Pagamento de demonstração 100% gratuito e seguro.
            </span>
          </div>

          {/* Abas de Método de Pagamento */}
          <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setPaymentMethod("pix")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === "pix"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Pix Instantâneo</span>
            </button>
            <button
              onClick={() => setPaymentMethod("credit_card")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === "credit_card"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cartão de Crédito</span>
            </button>
          </div>

          {/* Conteúdo do Pix */}
          {paymentMethod === "pix" ? (
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-zinc-300 font-medium">
                Escaneie o QR Code ou copie o código Pix abaixo:
              </span>

              {/* Simulação Visual do QR Code */}
              <div className="w-44 h-44 rounded-2xl bg-white p-3 flex flex-col items-center justify-center shadow-lg">
                <div className="w-full h-full border-4 border-black rounded-lg p-2 flex flex-col items-center justify-between">
                  <div className="flex justify-between w-full">
                    <div className="w-8 h-8 bg-black rounded" />
                    <div className="w-8 h-8 bg-black rounded" />
                  </div>
                  <div className="w-10 h-10 bg-emerald-600 rounded-md flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="w-8 h-8 bg-black rounded" />
                    <div className="w-8 h-8 bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>

              {/* Copia e Cola */}
              <div className="w-full flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-zinc-400 truncate flex-1 font-mono">
                  {pixCode}
                </span>
                <button
                  onClick={handleCopyPix}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>

              <div className="text-[10px] text-zinc-400 text-center">
                Expira em 15 minutos • Confirmação instantânea automática
              </div>
            </div>
          ) : (
            /* Formulário Seguro de Cartão (Tokenização) */
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-300">Número do Cartão</label>
                <input
                  type="text"
                  placeholder="4242 •••• •••• 4242"
                  disabled
                  value="4242 4242 4242 4242 (Cartão de Teste MP)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-zinc-300">Validade</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    disabled
                    value="12/28"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-zinc-300">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    disabled
                    value="123"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <span className="text-[10px] text-zinc-400">
                🔒 Dados criptografados ponta-a-ponta direto no Mercado Pago SDK.
              </span>
            </div>
          )}

          {/* Total & Botão de Simulação de Pagamento */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Valor Total</span>
              <span className="text-base font-black text-white">{formatCurrency(amount)}</span>
            </div>

            <Button
              size="md"
              variant="primary"
              disabled={isProcessing}
              onClick={handleSimulatePayment}
              icon={<ArrowRight className="w-4 h-4 text-black" />}
            >
              {isProcessing ? "Verificando..." : "Simular Pagamento"}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
