"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  RotateCcw,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Users,
  Dumbbell,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface FAQItem {
  id: string;
  category: "cancelamento" | "pagamento" | "planos" | "geral" | "seguranca";
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "diferenca_papeis",
    category: "planos",
    question: "Qual é a diferença entre os planos de Aluno e de Professor / Personal?",
    answer:
      "Os planos de Aluno são desenhados para a evolução do seu treino individual: liberam fichas completas, animações de biomecânica 3D, histórico de cargas e recordes, gráficos de evolução e GymBot IA. Já os planos de Professor são ferramentas profissionais completas: liberam limites ampliados de alunos simultâneos (10, 35 ou ilimitados), prescrição de fichas digitais com 3D para seus clientes, destaque no Marketplace da cidade para atrair novos alunos e gestão financeira de mensalidades.",
    highlight: "Planos específicos para quem treina ou para quem atende e prescreve treinos",
    icon: Users,
  },
  {
    id: "cancelamento",
    category: "cancelamento",
    question: "Como funciona o cancelamento da assinatura?",
    answer:
      "Você tem liberdade total para cancelar quando quiser diretamente pelo aplicativo, em apenas 1 clique, sem multas, sem taxas ocultas e sem fidelidade. Ao cancelar, você continuará com acesso irrestrito a todos os recursos até o último dia do período já pago. Nenhuma cobrança futura será realizada no seu cartão ou PIX.",
    highlight: "Sem fidelidade • Cancele quando quiser mantendo o acesso até o fim do ciclo",
    icon: RotateCcw,
  },
  {
    id: "trial",
    category: "planos",
    question: "Como funciona o período de teste grátis de 7 dias?",
    answer:
      "Tanto para Alunos quanto para Professores, você experimenta todos os recursos do Plano Pro por 7 dias corridos sem pagar nada hoje. Alunos podem testar biomecânica 3D, gráficos de cargas e GymBot IA; professores podem cadastrar alunos, prescrever treinos e testar as ferramentas profissionais. Se cancelar durante os 7 dias, nenhum valor será cobrado.",
    highlight: "7 dias com acesso Pro completo • R$ 0,00 cobrado hoje",
    icon: Sparkles,
  },
  {
    id: "duplo_perfil",
    category: "geral",
    question: "Posso ser Aluno e também Personal Trainer no GymFlow?",
    answer:
      "Sim! O GymFlow possui suporte nativo a duplo papel. Você pode alternar entre a visão de Aluno (para registrar seus próprios treinos) e a de Professor (para atender seus alunos) diretamente pelo topo da tela.",
    highlight: "Alterne livremente entre treinar e prescrever fichas",
    icon: Dumbbell,
  },
  {
    id: "pagamentos",
    category: "pagamento",
    question: "Quais são as formas de pagamento disponíveis?",
    answer:
      "Oferecemos duas modalidades práticas: Cartão de Crédito com cobrança mensal automática (que não compromete o limite total do cartão, apenas o valor da mensalidade) e PIX à vista para 30 dias de acesso com liberação imediata e sem renovação automática.",
    highlight: "Cartão mensal sem travar o limite ou PIX à vista sem renovação automática",
    icon: CreditCard,
  },
  {
    id: "dados_salvos",
    category: "cancelamento",
    question: "Se eu cancelar ou meu plano expirar, perco minhas fichas e treinos?",
    answer:
      "Não! Todos os seus dados de treinos, séries, cargas máximas, alunos cadastrados e fichas continuam salvos com segurança na sua conta. Quando você decidir retornar, tudo estará exatamente de onde você parou.",
    highlight: "Histórico e fichas 100% preservados para quando você voltar",
    icon: Calendar,
  },
  {
    id: "trocar_plano",
    category: "planos",
    question: "Posso mudar de plano (upgrade ou downgrade) a qualquer momento?",
    answer:
      "Sim! Você pode trocar de plano quando desejar. Ao fazer upgrade, os recursos adicionais são liberados no mesmo instante na sua conta para você aproveitar os novos benefícios.",
    highlight: "Flexibilidade total para ajustar seu plano ao seu momento de treino",
    icon: Layers,
  },
  {
    id: "seguranca",
    category: "seguranca",
    question: "O pagamento é seguro?",
    answer:
      "Totalmente seguro. Todas as transações são intermediadas e processadas de forma direta pelo Mercado Pago, com proteção antifraude e conformidade rigorosa com os padrões de segurança do Banco Central.",
    highlight: "Ambiente protegido e processamento oficial Mercado Pago",
    icon: ShieldCheck,
  },
];

interface SubscriptionFAQProps {
  className?: string;
  defaultOpenId?: string;
}

export function SubscriptionFAQ({ className = "", defaultOpenId }: SubscriptionFAQProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    if (defaultOpenId) return { [defaultOpenId]: true };
    return {};
  });

  const toggleItem = (id: string) => {
    triggerHaptic("selection");
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Cabeçalho da Seção FAQ */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Perguntas Frequentes
            </h4>
            <p className="text-[10px] text-zinc-400">Tudo sobre cancelamento, cobrança e planos</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            const allOpen = Object.values(openItems).filter(Boolean).length === FAQ_ITEMS.length;
            if (allOpen) {
              setOpenItems({});
            } else {
              const full: Record<string, boolean> = {};
              FAQ_ITEMS.forEach((item) => (full[item.id] = true));
              setOpenItems(full);
            }
          }}
          className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {Object.values(openItems).filter(Boolean).length === FAQ_ITEMS.length
            ? "Recolher todas"
            : "Expandir todas"}
        </button>
      </div>

      {/* Lista de Itens do Accordion */}
      <div className="space-y-2">
        {FAQ_ITEMS.map((item) => {
          const isOpen = Boolean(openItems[item.id]);
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-zinc-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                  : "bg-zinc-900/40 border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 leading-snug">
                    {item.question}
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-0 text-xs text-zinc-400 space-y-2 animate-in fade-in duration-150">
                  <p className="leading-relaxed border-t border-white/[0.05] pt-2.5 text-zinc-300">
                    {item.answer}
                  </p>

                  {item.highlight && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{item.highlight}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
