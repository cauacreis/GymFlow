"use client";

import React, { useState } from "react";
import {
  X,
  Scale,
  Sparkles,
  Calendar,
  Trash2,
  Plus,
  Activity,
  Ruler,
  AlertTriangle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { BodyMetricEntry, deleteBodyMetric } from "@/lib/body-metrics-store";

interface BodyMetricsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: BodyMetricEntry[];
  onOpenNewMetric: () => void;
}

export function BodyMetricsHistoryModal({
  isOpen,
  onClose,
  metrics,
  onOpenNewMetric,
}: BodyMetricsHistoryModalProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Lista da mais recente para a mais antiga para o histórico
  const sortedDesc = [...metrics].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = (id: string) => {
    triggerHaptic("warning");
    deleteBodyMetric(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white leading-none">
                Histórico de Bioimpedância
              </h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {metrics.length} {metrics.length === 1 ? "medição registrada" : "medições registradas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic("medium");
                onClose();
                onOpenNewMetric();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nova Medição</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Medições */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-left">
          {sortedDesc.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-center text-xs text-zinc-400">
              Nenhuma medição registrada ainda. Clique em "Nova Medição" para começar seu histórico!
            </div>
          ) : (
            sortedDesc.map((m, index) => {
              const prev = sortedDesc[index + 1];
              const weightDiff = prev ? Number((m.weight - prev.weight).toFixed(1)) : null;
              const bfDiff = prev ? Number((m.bodyFat - prev.bodyFat).toFixed(1)) : null;

              const dateObj = new Date(m.date + "T12:00:00");
              const dateFormattedFull = dateObj.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2.5 relative"
                >
                  {/* Cabeçalho da Medição */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/[0.06] text-zinc-300 border border-white/10 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>{dateFormattedFull}</span>
                      </span>
                      {index === 0 && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Mais Recente
                        </span>
                      )}
                    </div>

                    {deleteConfirmId === m.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-[10px]"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir medição"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Métricas Principais */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.04]">
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block">Peso Total</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-white font-mono">{m.weight.toFixed(1)}</span>
                        <span className="text-[10px] text-zinc-400">kg</span>
                        {weightDiff !== null && weightDiff !== 0 && (
                          <span
                            className={`text-[9px] font-mono font-bold ${
                              weightDiff < 0 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {weightDiff > 0 ? `+${weightDiff}` : weightDiff}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block">Gordura (%BF)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-teal-400 font-mono">{m.bodyFat.toFixed(1)}%</span>
                        {bfDiff !== null && bfDiff !== 0 && (
                          <span
                            className={`text-[9px] font-mono font-bold ${
                              bfDiff < 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {bfDiff > 0 ? `+${bfDiff}` : bfDiff}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block">Massa Magra</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {m.muscleMass.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-zinc-400">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Circunferências Opcionais */}
                  {(m.waistCm || m.armCm || m.chestCm || m.thighCm) && (
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-zinc-400 pt-1 border-t border-white/[0.04]">
                      {m.waistCm && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                          Cintura: <strong className="text-zinc-200">{m.waistCm} cm</strong>
                        </span>
                      )}
                      {m.armCm && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                          Braço: <strong className="text-zinc-200">{m.armCm} cm</strong>
                        </span>
                      )}
                      {m.chestCm && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                          Tórax: <strong className="text-zinc-200">{m.chestCm} cm</strong>
                        </span>
                      )}
                      {m.thighCm && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                          Coxa: <strong className="text-zinc-200">{m.thighCm} cm</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Observações */}
                  {m.notes && (
                    <p className="text-[10px] text-zinc-400 italic bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                      "{m.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
