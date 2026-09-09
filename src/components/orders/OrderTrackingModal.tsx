"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock, ChefHat, Bike, ShieldCheck, MapPin, Sparkles } from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: string;
}

export function OrderTrackingModal({
  isOpen,
  onClose,
  orderNumber = "GF-91402",
}: OrderTrackingModalProps) {
  const [currentStep, setCurrentStep] = useState(2); // 1: Recebido, 2: Cozinha, 3: Rota, 4: Entregue
  const [minutesLeft, setMinutesLeft] = useState(18);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setMinutesLeft((prev) => (prev > 2 ? prev - 1 : 2));
    }, 12000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const steps = [
    { id: 1, title: "Pedido Confirmado", desc: "Macros registrados no sistema", icon: CheckCircle2 },
    { id: 2, title: "Cozinha Funcional", desc: "Pesagem precisa na grama", icon: ChefHat },
    { id: 3, title: "A Caminho da Academia", desc: "Em trânsito com motoboy parceiro", icon: Bike },
    { id: 4, title: "Pronto na Recepção", desc: "Disponível na catraca para retirada", icon: MapPin },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Acompanhar Pedido #${orderNumber}`}>
      <div className="flex flex-col gap-4">
        {/* Card do Status Atual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
              Previsão de Entrega
            </span>
            <span className="text-2xl font-black text-white mt-0.5">
              ~{minutesLeft} min
            </span>
            <span className="text-[11px] text-zinc-300 mt-1">
              Destino: <b>SmartFit Paulista (Recepção)</b>
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
            <Bike className="w-7 h-7 animate-pulse" />
          </div>
        </div>

        {/* PIN de Segurança para Retirada na Catraca */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Código de Retirada na Academia:</span>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-sm font-black tracking-widest border border-emerald-500/30">
            7421
          </span>
        </div>

        {/* Linha do Tempo das Etapas */}
        <div className="flex flex-col gap-4 pl-2 pr-1 py-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="relative flex items-start gap-3">
                {/* Ícone com Indicador */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-black shadow-sm"
                      : isCurrent
                      ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      : "bg-white/5 text-zinc-500 border border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Linha Conectora Vertical */}
                {step.id !== 4 && (
                  <div
                    className={`absolute left-4 top-8 w-0.5 h-8 -ml-[1px] ${
                      isCompleted ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}

                {/* Textos */}
                <div className="flex flex-col flex-1">
                  <span
                    className={`text-xs font-bold ${
                      isCurrent ? "text-emerald-400" : isCompleted ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-zinc-400">{step.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Fechar */}
        <Button size="md" variant="secondary" onClick={onClose} className="w-full mt-2">
          Fechar Acompanhamento
        </Button>
      </div>
    </Drawer>
  );
}
