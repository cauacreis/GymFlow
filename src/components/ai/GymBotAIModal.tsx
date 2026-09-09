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
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

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
}

export function GymBotAIModal({ isOpen, onClose }: GymBotAIModalProps) {
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

    // Free AI Resolution: Check if GEMINI key exists, otherwise use the rich deterministic coach
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    let botReplyText = "";

    const lower = query.toLowerCase();
    if (lower.includes("progress") || lower.includes("carga") || lower.includes("peso")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.progressao;
    } else if (lower.includes("dor") || lower.includes("ombro") || lower.includes("substitu")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.dor;
    } else if (lower.includes("proteina") || lower.includes("proteína") || lower.includes("dieta") || lower.includes("comer")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.proteina;
    } else if (lower.includes("descanso") || lower.includes("tempo") || lower.includes("esperar")) {
      botReplyText = DETERMINISTIC_KNOWLEDGE.descanso;
    } else {
      if (geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Você é o GymBot, um personal trainer experiente e motivador de academia brasileira. Seja direto, prático, acolhedor e foque em segurança e hipertrofia. Responda à dúvida do aluno: ${query}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );
          const data = await res.json();
          botReplyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Excelente dúvida! Lembre-se de manter a constância e consulte sempre o instrutor de plantão no salão para ajustar sua postura.";
        } catch {
          botReplyText =
            "Dica de ouro: Mantenha sempre a técnica impecável e consulte os instrutores da nossa academia para ajustar seus ângulos anatômicos!";
        }
      } else {
        botReplyText =
          "Excelente pergunta! A chave para qualquer objetivo é a constância: mantenha a intensidade nos treinos, durma pelo menos 7 a 8 horas por noite para recuperação das fibras musculares e não pule o aquecimento das articulações!";
      }
    }

    // Delay natural para simular digitação
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      triggerHaptic("success");
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-white/[0.1] sm:rounded-3xl rounded-t-3xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header do Chat */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white">GymBot IA</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-zinc-400">Personal Trainer Digital 24h</p>
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

        {/* Lista de Mensagens */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                    isUser
                      ? "bg-emerald-500 text-zinc-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10"
                      : "bg-zinc-900 border border-white/[0.08] text-zinc-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      isUser ? "text-emerald-950/70" : "text-zinc-500"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/[0.06] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="w-4 h-4" />
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
      </div>
    </div>
  );
}
