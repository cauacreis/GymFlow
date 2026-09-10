"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  AppNotification,
} from "@/lib/booking-store";

interface NotificationBellModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: "student" | "coach";
}

export function NotificationBellModal({
  isOpen,
  onClose,
  targetRole = "student",
}: NotificationBellModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const refresh = () => {
      const all = getStoredNotifications();
      setNotifications(all.filter((n) => n.targetRole === targetRole));
    };
    refresh();
    const unsub = subscribeToNotifications(refresh);
    return () => unsub();
  }, [targetRole, isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "booking_accepted":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "payment_confirmed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "training_reminder":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "payment_overdue":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "missed_class":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case "delay_warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "workout_updated":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "rescheduled":
        return <RotateCcw className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-white/[0.1] sm:rounded-3xl rounded-t-3xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Central de Alertas</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                    {unreadCount} novos
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">Treinos, pagamentos e presenças</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  markAllNotificationsAsRead();
                }}
                className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Ler todas</span>
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-2 text-zinc-500">
              <Bell className="w-8 h-8 opacity-30" />
              <p className="text-xs">Nenhuma notificação registrada ainda.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) {
                    triggerHaptic("light");
                    markNotificationAsRead(notif.id);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all text-left flex gap-3 cursor-pointer ${
                  !notif.read
                    ? "bg-zinc-900 border-emerald-500/40 shadow-sm"
                    : "bg-white/[0.02] border-white/[0.05] opacity-75"
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                    <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
