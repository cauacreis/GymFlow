"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageCircle,
  Send,
  Sparkles,
  Smartphone,
  ExternalLink,
  RotateCcw,
  Check,
  Search,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Users,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  computeDailyReminders,
  sendReminderViaWhatsApp,
  sendReminderToApp,
  markReminderAsSent,
  unmarkReminderAsSent,
  subscribeToReminders,
  SmartReminderItem,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  getBrowserNotificationPermission,
} from "@/lib/reminders-service";

interface CoachRemindersCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: "all" | "aula" | "pagamento" | "retencao";
}

export function CoachRemindersCenterModal({
  isOpen,
  onClose,
  initialFilter = "all",
}: CoachRemindersCenterModalProps) {
  const [reminders, setReminders] = useState<SmartReminderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | "aula" | "pagamento" | "retencao">(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  const refresh = () => {
    setReminders(computeDailyReminders());
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
      if (typeof window !== "undefined") {
        setBrowserPermission(getBrowserNotificationPermission());
      }
    }
    const unsub = subscribeToReminders(refresh);
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    triggerHaptic("success");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRequestPermission = async () => {
    triggerHaptic("selection");
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
    if (perm === "granted") {
      sendBrowserNotification("GymFlow Notificações Ativadas! 🔔", {
        body: "Você receberá lembretes inteligentes de treinos e pagamentos direto neste dispositivo.",
      });
      showToast("Notificações no celular ativadas com sucesso!");
    } else {
      showToast("Permissão de notificação negada no navegador.");
    }
  };

  const handleSendWhatsApp = (item: SmartReminderItem) => {
    triggerHaptic("selection");
    const result = sendReminderViaWhatsApp(item);
    if (result.success) {
      showToast(`Lembrete aberto no WhatsApp para ${item.studentName.split(" ")[0]}!`);
      refresh();
    } else {
      alert(result.reason || "Erro ao abrir WhatsApp.");
    }
  };

  const handleSendToApp = (item: SmartReminderItem) => {
    triggerHaptic("medium");
    sendReminderToApp(item);
    showToast(`Alerta interno enviado para o app de ${item.studentName.split(" ")[0]}!`);
    refresh();
  };

  const handleToggleSent = (item: SmartReminderItem) => {
    triggerHaptic("light");
    if (item.isSent) {
      unmarkReminderAsSent(item.id);
      showToast("Status de envio redefinido.");
    } else {
      markReminderAsSent(item.id);
      showToast(`Marcado como enviado hoje!`);
    }
    refresh();
  };

  // Filtragem dos lembretes
  const filteredReminders = reminders.filter((item) => {
    const matchesCategory =
      activeCategory === "all" ? true : item.category === activeCategory;
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.planName && item.planName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const totalPending = reminders.filter((r) => !r.isSent).length;
  const aulaPending = reminders.filter((r) => r.category === "aula" && !r.isSent).length;
  const payPending = reminders.filter((r) => r.category === "pagamento" && !r.isSent).length;
  const retPending = reminders.filter((r) => r.category === "retencao" && !r.isSent).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col h-[88vh] max-h-[850px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Flutuante */}
        {toastMsg && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-zinc-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <Bell className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Central de Lembretes</h2>
                {totalPending > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[11px] font-bold">
                    {totalPending} pendente{totalPending > 1 ? "s" : ""} hoje
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Em dia!
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Dispare avisos de treino e cobrança sem atrito em 1 clique
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Push no Celular se não concedido */}
        {browserPermission !== "granted" && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-emerald-950/60 border-b border-emerald-500/20 flex items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] leading-tight">
                Receba alertas nativos na tela do celular mesmo com o app fechado:
              </span>
            </div>
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1 rounded-xl bg-emerald-500 text-zinc-950 font-black text-[11px] shrink-0 active:scale-95 transition-all shadow-sm"
            >
              Ativar Avisos
            </button>
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <div className="p-3 sm:px-5 border-b border-white/[0.06] bg-zinc-950 space-y-2.5 shrink-0">
          {/* Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveCategory("all");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "all"
                  ? "bg-white text-zinc-950 shadow-sm font-black"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white"
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-current">
                {reminders.length}
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveCategory("aula");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "aula"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm font-black"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aulas de Hoje</span>
              {aulaPending > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono font-bold">
                  {aulaPending}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveCategory("pagamento");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "pagamento"
                  ? "bg-purple-500 text-white shadow-sm font-black"
                  : "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pagamentos & PIX</span>
              {payPending > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono font-bold">
                  {payPending}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveCategory("retencao");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "retencao"
                  ? "bg-amber-500 text-zinc-950 shadow-sm font-black"
                  : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Recuperação</span>
              {retPending > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono font-bold">
                  {retPending}
                </span>
              )}
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aluno ou plano..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Lista de Lembretes Rolável */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {filteredReminders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-zinc-900/40 border border-white/[0.06]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Nenhum lembrete pendente</h4>
              <p className="text-xs text-zinc-400 max-w-sm">
                Todos os alunos desta categoria já foram notificados ou não possuem pendências de treino ou pagamento hoje.
              </p>
            </div>
          ) : (
            filteredReminders.map((item) => {
              const isClass = item.category === "aula";
              const isPayment = item.category === "pagamento";
              const isRetention = item.category === "retencao";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isSent
                      ? "bg-zinc-900/40 border-white/[0.04] opacity-75"
                      : item.urgency === "urgent"
                      ? "bg-gradient-to-r from-rose-950/20 via-zinc-900 to-zinc-900 border-rose-500/30 shadow-lg shadow-rose-500/5"
                      : isClass
                      ? "bg-zinc-900 border-emerald-500/20 hover:border-emerald-500/40"
                      : isPayment
                      ? "bg-zinc-900 border-purple-500/20 hover:border-purple-500/40"
                      : "bg-zinc-900 border-amber-500/20 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Ícone de Categoria */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isClass
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : isPayment
                            ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {isClass ? (
                          <Clock className="w-4 h-4" />
                        ) : isPayment ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      {/* Informações Principais */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-black text-white truncate">
                            {item.studentName}
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              item.urgency === "urgent"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                                : item.urgency === "today"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-zinc-800 text-zinc-300 border-white/[0.08]"
                            }`}
                          >
                            {item.timeTag}
                          </span>

                          {item.isSent && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" /> Enviado ({item.sentAt || "Hoje"})
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-300 font-medium leading-snug">
                          {item.description}
                        </p>

                        {/* Prévia da Mensagem de WhatsApp */}
                        <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] text-zinc-400 leading-relaxed font-sans">
                          <span className="font-bold text-zinc-500 block mb-0.5 text-[9px] uppercase tracking-wider">
                            Prévia da Mensagem:
                          </span>
                          "{item.whatsappText}"
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Ações Rápidas */}
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSent(item)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                          item.isSent
                            ? "bg-zinc-800 text-zinc-400 border-white/[0.06] hover:text-white"
                            : "bg-white/[0.03] text-zinc-400 hover:text-emerald-400 border-white/[0.08]"
                        }`}
                        title="Alternar se já foi enviado"
                      >
                        {item.isSent ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Desmarcar</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Marcar já enviado</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão Enviar Alerta no App */}
                      <button
                        onClick={() => handleSendToApp(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-white/[0.08] active:scale-95 transition-all"
                        title="Enviar notificação interna no aplicativo do aluno"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Avisar no App</span>
                      </button>

                      {/* Botão Enviar WhatsApp (Abre com texto pronto) */}
                      <button
                        onClick={() => handleSendWhatsApp(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                        <span>Enviar WhatsApp</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-3 sm:px-5 border-t border-white/[0.08] bg-zinc-900/90 flex items-center justify-between gap-2 shrink-0 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mensagens formatadas sem expor senhas ou dados sensíveis.</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
