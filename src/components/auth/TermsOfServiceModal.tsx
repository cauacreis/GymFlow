"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  X,
  Lock,
  Scale,
  HeartPulse,
  CreditCard,
  UserCheck,
  AlertTriangle,
  ArrowDown,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  hasAlreadyAccepted?: boolean;
}

export function TermsOfServiceModal({
  isOpen,
  onClose,
  onAccept,
  hasAlreadyAccepted = false,
}: TermsOfServiceModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(hasAlreadyAccepted);
  const [scrollProgress, setScrollProgress] = useState(hasAlreadyAccepted ? 100 : 0);

  // Sincroniza estado inicial se já foi aceito anteriormente
  useEffect(() => {
    if (hasAlreadyAccepted) {
      setHasReachedBottom(true);
      setScrollProgress(100);
    }
  }, [hasAlreadyAccepted]);

  // Trava a rolagem do body de fundo enquanto o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const totalScrollable = scrollHeight - clientHeight;

    if (totalScrollable <= 0) {
      setScrollProgress(100);
      setHasReachedBottom(true);
      return;
    }

    const currentPercent = Math.min(100, Math.max(0, Math.round((scrollTop / totalScrollable) * 100)));
    setScrollProgress(currentPercent);

    // Considera lido quando faltar 30px ou atingir >= 98%
    if (scrollHeight - scrollTop - clientHeight <= 30 || currentPercent >= 98) {
      if (!hasReachedBottom) {
        setHasReachedBottom(true);
        triggerHaptic("success");
      }
    }
  };

  const handleScrollToBottom = () => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleConfirmAcceptance = () => {
    if (!hasReachedBottom) return;
    triggerHaptic("success");
    onAccept();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-zinc-950 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* ================================================================= */}
        {/* CABEÇALHO DO MODAL */}
        {/* ================================================================= */}
        <div className="px-6 py-4 border-b border-white/10 bg-zinc-900/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Termos de Uso & Privacidade
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LGPD Brasil
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  GymFlow Tecnologia e Gestão Fitness • Versão 2.4 (2026)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              title="Fechar (sem aceitar)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de Progresso de Leitura */}
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
            <div className="flex-1 bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  hasReachedBottom
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-amber-500 to-emerald-500"
                }`}
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <div className="text-[11px] font-mono shrink-0">
              {hasReachedBottom ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> 100% Lido
                </span>
              ) : (
                <span className="text-zinc-400">
                  Progresso: <b className="text-white">{scrollProgress}%</b>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CONTEÚDO DETALHADO DOS TERMOS (ÁREA ROLÁVEL) */}
        {/* ================================================================= */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-xs text-zinc-300 leading-relaxed custom-scrollbar scroll-smooth"
        >
          {/* Aviso inicial de obrigatoriedade */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-200/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-white font-semibold">Aviso Importante:</strong> Para garantir a validade jurídica de seu consentimento nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), <strong>é obrigatório rolar e ler este instrumento até o final</strong>. O botão de aceite permanecerá bloqueado até que você conclua a visualização de todas as cláusulas.
            </p>
          </div>

          {/* CLÁUSULA 1 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">1</span>
              <h4>OBJETO, ESCOPO E DEFINIÇÕES DA PLATAFORMA</h4>
            </div>
            <p className="text-zinc-400">
              1.1. O presente Contrato de Licença de Uso e Termos de Serviço disciplina o acesso e utilização da plataforma <strong>GymFlow</strong>, sistema digital no modelo SaaS (Software as a Service) voltado ao gerenciamento de rotinas de treinamento, periodização física, registro de evolução antropométrica, agendamento de sessões práticas e intermediação de assinaturas entre <strong>Alunos</strong> (usuários praticantes) e <strong>Personal Trainers / Treinadores</strong> (profissionais credenciados).
            </p>
            <p className="text-zinc-400">
              1.2. Ao realizar o cadastro no GymFlow, o Usuário expressa sua manifestação livre, informada e inequívoca pela qual concorda integralmente com as disposições aqui estipuladas, submetendo-se a todas as condições e penalidades legais cabíveis.
            </p>
          </section>

          {/* CLÁUSULA 2 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">2</span>
              <h4>CADASTRO, VERACIDADE DAS INFORMAÇÕES E SEGURANÇA DA CONTA</h4>
            </div>
            <p className="text-zinc-400">
              2.1. O acesso à plataforma é restrito a pessoas físicas civilmente capazes maiores de 18 (dezoito) anos, ou a adolescentes entre 16 e 18 anos devidamente assistidos por seus responsáveis legais.
            </p>
            <p className="text-zinc-400">
              2.2. O Usuário compromete-se a prestar informações estritamente fidedignas, completas e atualizadas. A indicação de nome falso, e-mail descartável, dados de terceiros ou número de telefone/WhatsApp inexistente ensejará o bloqueio sumário da conta.
            </p>
            <p className="text-zinc-400">
              2.3. As credenciais de acesso (e-mail e senha) são de uso estritamente pessoal e intransferível. O Usuário é o único e exclusivo responsável por toda e qualquer atividade, agendamento ou alteração de dados efetuada mediante autenticação de sua conta.
            </p>
            <p className="text-zinc-400">
              2.4. Em caso de perda, furto ou suspeita de comprometimento de suas credenciais, o Usuário deverá utilizar imediatamente o fluxo de redefinição de senha ou notificar a equipe de segurança do GymFlow.
            </p>
          </section>

          {/* CLÁUSULA 3 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">3</span>
              <h4>PROTEÇÃO ANTI-ABUSO E REGRA DE UNICIDADE POR DISPOSITIVO</h4>
            </div>
            <p className="text-zinc-400">
              3.1. Visando resguardar a integridade técnica, a estabilidade dos servidores e a equidade comercial entre os usuários, o GymFlow implementa tecnologia de identificação digital e atributos de hardware (<em>Device Fingerprinting</em> com hash criptográfico SHA-256).
            </p>
            <p className="text-zinc-400">
              3.2. É terminantemente proibida a criação sucessiva de múltiplas contas por um mesmo indivíduo em um mesmo dispositivo físico ou rede com a finalidade de:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Reutilizar fraudulentamente o período de degustação gratuita (Trial de 7 dias);</li>
              <li>Burlar bloqueios disciplinares, limites de alunos ou suspensões contratuais;</li>
              <li>Praticar avaliações falsas ou manipulação de reputação no Marketplace de Profissionais.</li>
            </ul>
            <p className="text-zinc-400">
              3.3. Cada dispositivo físico tem direito a utilizar a gratuidade promocional de 7 dias apenas 1 (uma) única vez. Tentativas automatizadas de reset de cache para reinício indevido de trial resultarão no travamento do equipamento.
            </p>
          </section>

          {/* CLÁUSULA 4 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">4</span>
              <h4>PLANOS DE ASSINATURA, PERÍODO DE TESTE (7 DIAS) E TRANSAÇÕES</h4>
            </div>
            <p className="text-zinc-400">
              4.1. <strong>Período de Teste Gratuito (Trial):</strong> O GymFlow disponibiliza a novos alunos um período de avaliação gratuita de 7 (sete) dias corridos. Durante este intervalo, nenhuma cobrança é debitada no cartão cadastrado.
            </p>
            <p className="text-zinc-400">
              4.2. <strong>Renovação Automática:</strong> Caso o Usuário não efetue o cancelamento formal de sua assinatura dentro do painel da plataforma antes do término do 7º dia corrido, a assinatura mensal no valor vigente (R$ 39,90/mês) será cobrada de forma automática e recorrente.
            </p>
            <p className="text-zinc-400">
              4.3. <strong>Assinaturas e Pagamentos Avulsos via PIX:</strong> Planos adquiridos mediante pagamento instantâneo PIX ou boleto bancário não possuem renovação compulsória e serão finalizados automaticamente após 30 (trinta) ou 365 (trezentos e sessenta e cinco) dias, salvo renovação voluntária pelo Usuário.
            </p>
            <p className="text-zinc-400">
              4.4. <strong>Processamento Seguro de Pagamentos:</strong> Todas as cobranças, geração de chaves PIX e tokenização de cartões são operadas através de instituições de pagamento licenciadas pelo Banco Central do Brasil e certificadas no padrão PCI-DSS (Mercado Pago). O GymFlow não armazena, em momento algum, o número completo, data de validade ou código de segurança (CVV) do seu cartão de crédito.
            </p>
            <p className="text-zinc-400">
              4.5. <strong>Direito de Arrependimento e Cancelamento:</strong> Em estrito cumprimento ao Artigo 49 do Código de Defesa do Consumidor (Lei 8.078/1990), o Usuário poderá requerer o cancelamento com reembolso integral em até 7 (sete) dias contados da primeira cobrança. Cancelamentos solicitados após esse prazo extinguem cobranças futuras, mantendo o acesso liberado até o encerramento do ciclo mensal já quitado.
            </p>
          </section>

          {/* CLÁUSULA 5 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">5</span>
              <h4>TERMO DE ISENÇÃO DE RESPONSABILIDADE MÉDICA E APTIDÃO FÍSICA</h4>
            </div>
            <p className="text-zinc-400">
              5.1. <strong>Inexistência de Vínculo Médico:</strong> O GymFlow é uma ferramenta tecnológica de apoio organizacional e informativo. O sistema <strong>NÃO</strong> prescreve medicamentos, <strong>NÃO</strong> fornece diagnósticos clínicos e <strong>NÃO</strong> substitui a avaliação prévia de um médico cardiologista ou ortopedista.
            </p>
            <p className="text-zinc-400">
              5.2. O Usuário declara sob compromisso de honra que se encontra em pleno gozo de sua saúde física e apto a submeter-se a esforços de condicionamento muscular e aeróbico, respondendo com total sinceridade ao Questionário de Prontidão para Atividade Física (PAR-Q).
            </p>
            <p className="text-zinc-400">
              5.3. A realização de exercícios de sobrecarga, treinamento funcional ou alta intensidade sem a supervisão presencial e direta de um profissional de Educação Física habilitado dá-se por conta e risco do próprio praticante. O GymFlow e seus desenvolvedores não respondem por lesões articulares, estiramentos, danos corporais ou complicações decorrentes da execução errônea de movimentos sugeridos em fichas de treino.
            </p>
            <p className="text-zinc-400">
              5.4. Os Treinadores cadastrados na plataforma declaram possuir inscrição ativa perante o Conselho Regional de Educação Física (CREF) e assumem responsabilidade técnica integral pela prescrição emitida aos seus respectivos alunos vinculados.
            </p>
          </section>

          {/* CLÁUSULA 6 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">6</span>
              <h4>POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD - LEI Nº 13.709/2018)</h4>
            </div>
            <p className="text-zinc-400">
              6.1. <strong>Bases Legais e Coleta:</strong> Os dados pessoais fornecidos pelo Usuário (nome, telefone/WhatsApp, e-mail, biometria corporal opcional, cargas e histórico de treinos) são tratados com fundamento no Artigo 7º, inciso V (execução de contrato) e Artigo 11, inciso II, alínea "a" (consentimento para dados de saúde/aptidão física).
            </p>
            <p className="text-zinc-400">
              6.2. <strong>Finalidade Exclusiva:</strong> Os dados coletados destinam-se única e exclusivamente a:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Disponibilizar a interface de treinos e acompanhamento biomecânico;</li>
              <li>Enviar notificações e lembretes de sessões via WhatsApp e alertas do sistema;</li>
              <li>Gerenciar a cobrança das assinaturas e garantir segurança contra fraudes.</li>
            </ul>
            <p className="text-zinc-400">
              6.3. <strong>Vedação Absoluta à Comercialização:</strong> O GymFlow <strong>NUNCA</strong> vende, cede, compartilha ou aluga bancos de dados cadastrais ou registros biométricos de seus usuários a corretores de dados (<em>data brokers</em>), agências de publicidade ou terceiros não autorizados.
            </p>
            <p className="text-zinc-400">
              6.4. <strong>Segurança da Informação:</strong> Todas as transmissões de dados são protegidas por protocolos de encriptação TLS 1.3 de alta segurança, e as tabelas em repouso utilizam chaves simétricas AES-256 e regras estritas de Row Level Security (RLS) no Supabase.
            </p>
            <p className="text-zinc-400">
              6.5. <strong>Direitos do Titular (Art. 18 da LGPD):</strong> É garantido ao Usuário, a qualquer tempo e de forma gratuita:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Confirmar a existência de tratamento e acessar seus dados em formato legível;</li>
              <li>Solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Portabilidade dos dados para outra plataforma mediante exportação completa em JSON;</li>
              <li>A revogação do consentimento e a <strong>exclusão definitiva de sua conta</strong> e todos os registros associados, com anonimização imediata via painel de segurança.</li>
            </ul>
          </section>

          {/* CLÁUSULA 7 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">7</span>
              <h4>PROPRIEDADE INTELECTUAL E PRÁTICAS PROIBIDAS</h4>
            </div>
            <p className="text-zinc-400">
              7.1. Todos os direitos de propriedade intelectual relativos ao código-fonte, arquitetura, design visual, identidade de marca, layouts e banco de dados do GymFlow são de titularidade exclusiva de seus desenvolvedores e protegidos pela Lei de Direitos Autorais (Lei nº 9.610/1998) e Lei do Software (Lei nº 9.609/1998).
            </p>
            <p className="text-zinc-400">
              7.2. É estritamente vedado ao Usuário: realizar engenharia reversa, descompilar, copiar trechos, utilizar robôs ou scrapers para raspagem de dados, revender acessos ou praticar ataques de negação de serviço contra a infraestrutura do GymFlow.
            </p>
          </section>

          {/* CLÁUSULA 8 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">8</span>
              <h4>VIGÊNCIA, RESCISÃO E MODIFICAÇÕES</h4>
            </div>
            <p className="text-zinc-400">
              8.1. O presente instrumento vige por prazo indeterminado a contar do aceite eletrônico.
            </p>
            <p className="text-zinc-400">
              8.2. O GymFlow poderá atualizar estes termos periodicamente para refletir exigências regulatórias ou melhorias técnicas. Em caso de mudanças materiais substanciais, os usuários serão notificados por e-mail ou aviso na tela principal da plataforma.
            </p>
          </section>

          {/* CLÁUSULA 9 */}
          <section className="space-y-2 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[11px] flex items-center justify-center text-emerald-400">9</span>
              <h4>LEGISLAÇÃO APLICÁVEL E ELEIÇÃO DE FORO</h4>
            </div>
            <p className="text-zinc-400">
              9.1. Este contrato é regido e interpretado segundo as Leis da República Federativa do Brasil.
            </p>
            <p className="text-zinc-400">
              9.2. Fica eleito o Foro da Comarca de São Paulo/SP para dirimir qualquer litígio oriundo destes Termos, com expressa renúncia a qualquer outro, por mais privilegiado que seja, ressalvadas as prerrogativas de foro do domicílio do consumidor preconizadas pela Lei 8.078/1990.
            </p>
          </section>

          {/* Fim do documento / Confirmação de chegada ao fim */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">
              Fim do Documento Jurídico
            </p>
            <p className="text-[11px] text-zinc-400">
              Você alcançou o término integral dos Termos de Uso e Política de Privacidade. Seu consentimento já pode ser registrado.
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RODAPÉ DO MODAL (BOTÃO COM TRAVA DE SEGURANÇA) */}
        {/* ================================================================= */}
        <div className="px-6 py-4 border-t border-white/10 bg-zinc-900/90 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {!hasReachedBottom ? (
              <button
                type="button"
                onClick={handleScrollToBottom}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                <span>Rolar até o final para liberar o botão</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Documento lido por completo</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!hasReachedBottom}
              onClick={handleConfirmAcceptance}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                hasReachedBottom
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer"
                  : "bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                !hasReachedBottom
                  ? "Role o texto até o final para poder concordar"
                  : "Concordar com os termos"
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hasReachedBottom ? "Li e Concordo com os Termos" : "Role até o final para aceitar"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
