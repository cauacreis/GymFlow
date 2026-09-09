"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  User,
  Flame,
  Dumbbell,
  Clock,
  Download,
  Trash2,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Repeat,
} from "lucide-react";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
  onReorder: (mealName: string, price: number) => void;
}

export function UserProfileDrawer({
  isOpen,
  onClose,
  user,
  onLogout,
  onReorder,
}: UserProfileDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const pastOrders = [
    {
      id: "GF-84920",
      date: "Ontem às 19:20",
      mealName: "Salmon Power Bowl",
      price: 46.9,
      protein: "42g",
    },
    {
      id: "GF-81044",
      date: "05 de Setembro",
      mealName: "Kit 5 Marmitas: Frango & Batata Doce",
      price: 135.0,
      protein: "170g",
    },
  ];

  const handleExportData = () => {
    window.open("/api/export-data", "_blank");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") {
      alert("Digite 'EXCLUIR' em maiúsculo para confirmar a remoção permanente de seus dados.");
      return;
    }

    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "EXCLUIR" }),
      });

      if (res.ok) {
        alert("Sua conta e histórico foram excluídos com sucesso em conformidade com a LGPD.");
        onLogout();
        onClose();
      }
    } catch (err) {
      alert("Erro ao processar solicitação.");
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Perfil do Atleta">
      <div className="flex flex-col gap-4">
        {/* Card do Usuário */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-bold text-white">{user?.name || "Atleta Convidado"}</span>
            <span className="text-xs text-zinc-400">{user?.email || "atleta@gymflow.com.br"}</span>
          </div>
        </div>

        {/* Estatísticas de Treino & Dieta */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">14 Dias Seguidos</span>
              <span className="text-[10px] text-zinc-400">Streak de Dieta Limpa</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">212g Proteína</span>
              <span className="text-[10px] text-zinc-400">Média Diária Batida</span>
            </div>
          </div>
        </div>

        {/* Histórico de Pedidos Anteriores */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-white">Histórico Recente</span>
          <div className="flex flex-col gap-2">
            {pastOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">{ord.mealName}</span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                    <span>{ord.date}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{ord.protein} prot</span>
                  </div>
                </div>

                <button
                  onClick={() => onReorder(ord.mealName, ord.price)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Repeat className="w-3 h-3" />
                  <span>Repetir</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Seção LGPD & Privacidade de Dados */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacidade & Direitos LGPD</span>
          </div>

          <button
            onClick={handleExportData}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-200 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Baixar Meus Dados (JSON)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {!isDeleting ? (
            <button
              onClick={() => setIsDeleting(true)}
              className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs text-red-300 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Excluir Minha Conta (Direito ao Esquecimento)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-red-500" />
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2">
              <span className="text-[11px] text-red-300 font-semibold">
                Digite EXCLUIR para apagar todos os seus registros permanentemente:
              </span>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="bg-black/50 border border-red-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 py-1 rounded-lg bg-white/10 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <Button
          size="md"
          variant="secondary"
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="w-full text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sair da Conta</span>
        </Button>
      </div>
    </Drawer>
  );
}
