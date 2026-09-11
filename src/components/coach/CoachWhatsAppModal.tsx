"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageCircle,
  Dumbbell,
  Clock,
  CreditCard,
  AlertTriangle,
  Flame,
  Edit3,
  Copy,
  Check,
  Send,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface CoachWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentPhone: string;
  studentPlan?: string;
  studentGoal?: string;
  scheduledTime?: string;
  scheduledDay?: string;
  paymentDueDate?: string;
  monthlyPresence?: number;
}

export function CoachWhatsAppModal({
  isOpen,
  onClose,
  studentName,
  studentPhone,
  studentPlan,
  studentGoal,
  scheduledTime,
  scheduledDay,
  paymentDueDate = "Dia 10",
  monthlyPresence = 95,
}: CoachWhatsAppModalProps) {
  const firstName = studentName ? studentName.split(" ")[0] : "Aluno";
  const cleanPhone = studentPhone ? studentPhone.replace(/\D/g, "") : "";
  const finalPhone = cleanPhone.length <= 11 && !cleanPhone.startsWith("55") ? `55${cleanPhone}` : cleanPhone;

  const TEMPLATES = [
    {
      id: "treino",
      icon: Dumbbell,
      title: "Lembrete de Treino",
      badge: "Hoje",
      color: "emerald",
      getText: () =>
        `Olá, ${firstName}! Tudo pronto para o treino de hoje? Preparei sua rotina com foco nos seus objetivos${
          studentGoal ? ` (${studentGoal})` : ""
        }. Te espero no salão! 🏋️‍♂️`,
    },
    {
      id: "atraso",
      icon: Clock,
      title: "Aviso de Atraso",
      badge: "Pontualidade",
      color: "amber",
      getText: () =>
        `Olá, ${firstName}! Notei que você ainda não chegou para o treino${
          scheduledTime ? ` das ${scheduledTime}` : ""
        }. Está a caminho ou aconteceu algum imprevisto? Me avisa por aqui para alinharmos! ⏰`,
    },
    {
      id: "pagamento",
      icon: CreditCard,
      title: "Mensalidade & Pagamento",
      badge: "Financeiro",
      color: "purple",
      getText: () =>
        `Olá, ${firstName}! Tudo bem? Passando para lembrar sobre a mensalidade do seu plano (${
          studentPlan || "Treino Personal"
        }), com vencimento no ${paymentDueDate}. Qualquer dúvida ou para envio do comprovante, só me mandar por aqui! 💳`,
    },
    {
      id: "falta",
      icon: AlertTriangle,
      title: "Falta & Reposição",
      badge: "Frequência",
      color: "rose",
      getText: () =>
        `Olá, ${firstName}! Sentimos sua falta no treino${
          scheduledDay ? ` de ${scheduledDay}` : " de hoje"
        }. Aconteceu algum imprevisto? Vamos alinhar um horário para você não perder o ritmo e repor essa aula! 📅`,
    },
    {
      id: "elogio",
      icon: Flame,
      title: "Elogio & Constância",
      badge: "Motivação",
      color: "amber",
      getText: () =>
        `Fala, ${firstName}! Passando para parabenizar pela sua constância e foco nos treinos este mês! Você está com ${monthlyPresence}% de presença e seus resultados estão visíveis. Vamos com tudo! 🔥💪`,
    },
    {
      id: "personalizada",
      icon: Edit3,
      title: "Mensagem Livre",
      badge: "Customizada",
      color: "zinc",
      getText: () => `Olá, ${firstName}! `,
    },
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("treino");
  const [messageText, setMessageText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
      setMessageText(initialTemplate.getText());
      setCopied(false);
    }
  }, [isOpen, studentName, studentPlan, studentGoal, scheduledTime, scheduledDay, paymentDueDate]);

  if (!isOpen) return null;

  const handleSelectTemplate = (id: string) => {
    triggerHaptic("selection");
    setSelectedTemplateId(id);
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setMessageText(tmpl.getText());
    }
  };

  const handleCopy = () => {
    triggerHaptic("light");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = (withText: boolean = true) => {
    triggerHaptic("success");
    if (!finalPhone) {
      alert("Este aluno não possui número de WhatsApp cadastrado.");
      return;
    }
    const url = withText && messageText.trim()
      ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(messageText.trim())}`
      : `https://wa.me/${finalPhone}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08] bg-zinc-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <MessageCircle className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  Mensagem no WhatsApp
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Pronta p/ Envio
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Para: <strong className="text-white">{studentName}</strong> • {studentPhone || "Sem telefone"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
          {/* Seletor de Modelos Rápidos */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              1. Escolha o objetivo da mensagem:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTemplate(t.id)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all active:scale-95 ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                        : "bg-zinc-900/60 hover:bg-zinc-900 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? "bg-emerald-500 text-zinc-950 font-black"
                            : "bg-white/[0.06] text-zinc-300"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[8px] font-mono font-bold uppercase text-zinc-500">
                        {t.badge}
                      </span>
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">
                      {t.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo Editável de Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Edit3 className="w-3 h-3 text-emerald-400" />
                <span>2. Mensagem que será enviada (você pode editar):</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Copiar texto para área de transferência"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite sua mensagem personalizada..."
                className="w-full p-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 leading-relaxed font-sans shadow-inner resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[9px] font-mono text-zinc-500">
                {messageText.length} caracteres
              </span>
            </div>
          </div>

          {/* Dica / Informação de Envio */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ao abrir, o WhatsApp já inicia com essa mensagem pronta.</span>
            </span>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="p-4 border-t border-white/[0.08] bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Opção para abrir direto no WhatsApp em branco */}
          <button
            type="button"
            onClick={() => handleOpenWhatsApp(false)}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-2 flex items-center gap-1 self-start sm:self-auto"
            title="Abre a conversa no WhatsApp sem nenhum texto pré-definido"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Abrir conversa em branco no WhatsApp</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition-all active:scale-95"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleOpenWhatsApp(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
