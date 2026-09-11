"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Send,
  User,
  X,
  Dumbbell,
  Flame,
  Zap,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { canAccessFeature } from "@/lib/subscription-features";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  "Como fazer progressão de carga com segurança?",
  "Dor no ombro no supino: quais substitutos?",
  "Quantas gramas de proteína devo ingerir por dia?",
  "Qual o melhor tempo de descanso entre séries?",
];

const DETERMINISTIC_KNOWLEDGE: Record<string, string> = {
  progressao: `A progressão de carga é a chave para a hipertrofia e ganho de força! Aqui está a regra de ouro:

1. **Regra das 2 Repetições:** Quando conseguir realizar todas as séries do exercício no topo da faixa (ex: 3x12) com boa execução por 2 treinos seguidos, aumente a carga em 2kg a 5kg.
2. **Priorize a Execução (ROM):** Amplitude completa e fase excêntrica controlada (2-3 segundos) antes de socar peso.
3. **Outras formas de progressão:** Se não der para subir o peso, tente adicionar 1 repetição a mais ou diminuir 15 segundos do descanso.`,

  dor: `Atenção: se a dor for aguda ou persistente, consulte um médico ou fisioterapeuta da academia!

Para desconforto no ombro durante o Supino Reto com Barra:
- **Substitutos imediatos:**
  1. *Supino com Halteres com pegada neutra* (palmas voltadas uma para a outra): reduz impacto no manguito rotador.
  2. *Supino no Banco Inclinado (30°)*: distribui melhor a carga no feixe clavicular.
  3. *Floor Press (Supino no Chão)*: limita o arco de extensão excessiva do ombro.
- **Dica de postura:** Retraia e deprima as escápulas ("guarde as omoplatas no bolso de trás da calça") antes de tirar a barra do suporte.`,

  proteina: `Para praticantes de musculação focados em hipertrofia ou manutenção de massa magra em cutting:

- **Faixa Recomendada:** **1,6g a 2,2g de proteína por kg corporal** por dia.
  - Exemplo para 80 kg: ~130g a 175g de proteína diária.
- **Distribuição ideal:** Divida em 3 a 5 refeições ao longo do dia contendo pelo menos 25g a 35g de proteína de alto valor biológico (ovos, frango, carne magra, peixe, whey protein ou tofu/soja).
- Não se esqueça de beber pelo menos **35ml a 45ml de água por kg** para ajudar na síntese e filtragem renal.`,

  descanso: `O tempo de descanso dita o estímulo do seu treino:

- **Treinos de Força Pura / Cargas Altas (1 a 5 reps):** 2 a 3 minutos de descanso. Permite ressintetizar o ATP-CP neuromuscular.
- **Hipertrofia Clássica (6 a 12 reps compostos como Agachamento/Supino):** 90 a 120 segundos.
- **Exercícios Isoladores (Elevação Lateral, Tríceps Corda):** 45 a 60 segundos são suficientes para manter alta densidade.
- Nunca tenha pressa em exercícios de alta demanda neural para evitar lesões por fadiga!`,
};

interface GymBotAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans?: () => void;
}

export function GymBotAIModal({ isOpen, onClose, onOpenPlans }: GymBotAIModalProps) {
  const access = canAccessFeature("gymbot_ai");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Fala, atleta! Sou o GymBot IA, seu personal trainer e consultor fitness 24/7. Tem dúvidas sobre exercícios, cargas, substituições ou nutrição? Manda pra cá!",
      timestamp: "Agora",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText.trim();
    if (!query) return;

    triggerHaptic("medium");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    let botReplyText = "";
    const lower = query.toLowerCase();

    if (lower.includes("progress") || lower.includes("carga") || lower.includes("peso")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.progressao;
    } else if (lower.includes("dor") || lower.includes("ombro") || lower.includes("substitu")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.dor;
    } else if (lower.includes("proteina") || lower.includes("macro") || lower.includes("dieta")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.proteina;
    } else if (lower.includes("descanso") || lower.includes("tempo") || lower.includes("serie")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.descanso;
    } else {
      botReplyText = `Excelente dúvida! Para o objetivo de **${query.slice(0, 30)}...**, a chave é manter regularidade nos treinos, garantir progressão gradual de volume semanal e consumir proteínas adequadas com descanso de qualidade. Seu treinador também pode ajustar sua rotina diretamente na aba de Fichas!`;
    }

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      triggerHaptic("light");
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[680px]">
        {/* Header do Chat */}
        <div className="p-4 border-b border-white/[0.08] bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">GymBot IA 24/7</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Consultoria de Treino & Nutrição</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================= */}
        {/* SE O USUÁRIO NÃO TIVER ACESSO (PLANO BÁSICO OU EXPIRADO) */}
        {/* ============================================================= */}
        {!access.allowed ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                Recurso Exclusivo Plano Pro & VIP
              </span>
              <h4 className="text-lg font-black text-white mt-2">
                GymBot IA é Exclusivo para Assinantes Pro
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Tire dúvidas instantâneas sobre cargas, substituições de exercícios para dores musculares, cálculo de macros e estratégias de treino 24 horas por dia.
              </p>
            </div>

            <div className="w-full max-w-xs p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] text-left space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Respostas biomecânicas personalizadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cálculo de ingestão de proteínas e água</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Substitutos para exercícios que causam dor</span>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("heavy");
                onClose();
                if (onOpenPlans) onOpenPlans();
              }}
              className="w-full max-w-xs py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Fazer Upgrade para Plano Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ============================================================= */
          /* MODO LIBERADO: ÁREA DE CHAT */
          /* ============================================================= */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                        isUser
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "bg-zinc-800 text-emerald-400 border border-white/[0.08]"
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-emerald-500 text-zinc-950 font-medium"
                          : "bg-zinc-900 border border-white/[0.08] text-zinc-200"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span
                        className={`text-[9px] mt-1 block text-right opacity-60 ${
                          isUser ? "text-zinc-950" : "text-zinc-400"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-zinc-800 text-emerald-400 border border-white/[0.08] flex items-center justify-center text-xs shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] text-zinc-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Sugestões Rápidas de Prompt */}
            <div className="px-3 pb-2 pt-1 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-white/[0.04]">
              {PRESET_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[10px] whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.06] text-zinc-300 transition-colors shrink-0 active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-white/[0.08] bg-zinc-900/60 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Pergunte ao GymBot..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
