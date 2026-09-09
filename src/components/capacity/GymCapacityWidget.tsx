"use client";

import React, { useState } from "react";
import { Users, Clock, Flame, ChevronRight, Activity } from "lucide-react";

export interface HourlyCapacity {
  hour: string;
  occupancyPercent: number;
  label: "Tranquilo" | "Moderado" | "Pico";
}

const HOURLY_FORECAST: HourlyCapacity[] = [
  { hour: "06h", occupancyPercent: 45, label: "Moderado" },
  { hour: "07h", occupancyPercent: 65, label: "Moderado" },
  { hour: "08h", occupancyPercent: 55, label: "Moderado" },
  { hour: "09h", occupancyPercent: 35, label: "Tranquilo" },
  { hour: "10h", occupancyPercent: 25, label: "Tranquilo" },
  { hour: "12h", occupancyPercent: 50, label: "Moderado" },
  { hour: "14h", occupancyPercent: 30, label: "Tranquilo" },
  { hour: "16h", occupancyPercent: 40, label: "Moderado" },
  { hour: "18h", occupancyPercent: 88, label: "Pico" },
  { hour: "19h", occupancyPercent: 94, label: "Pico" },
  { hour: "20h", occupancyPercent: 82, label: "Pico" },
  { hour: "21h", occupancyPercent: 50, label: "Moderado" },
];

export function GymCapacityWidget() {
  const currentOccupancy = 68; // 68% no momento
  const currentPeopleCount = 41;
  const maxCapacity = 60;
  const currentHour = "18h";

  return (
    <div className="rounded-2xl p-4 bg-zinc-900/70 border border-white/[0.08] shadow-lg text-left w-full relative overflow-hidden">
      {/* Glow de Fundo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header do Widget */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Lotação da Academia</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[10px] text-zinc-400">Fluxo de catraca em tempo real</p>
          </div>
        </div>

        {/* Badge de Status */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300">
            Fluxo Moderado
          </span>
          <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
            {currentPeopleCount}/{maxCapacity} pessoas
          </span>
        </div>
      </div>

      {/* Barra de Ocupação Principal */}
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 text-[11px]">Capacidade da Musculação</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">{currentOccupancy}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${currentOccupancy}%` }}
          />
        </div>
      </div>

      {/* Previsão de Horários (Gráfico Minimalista de Barras Horárias) */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">
            Curva de Lotação por Horário
          </span>
          <span className="text-emerald-400 font-medium">Pico: 18h às 20h</span>
        </div>

        <div className="grid grid-cols-12 items-end gap-1 h-14 w-full px-1">
          {HOURLY_FORECAST.map((item) => {
            const isNow = item.hour === currentHour;
            const barHeight = `${item.occupancyPercent}%`;

            return (
              <div key={item.hour} className="flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className={`w-full rounded-t-sm transition-all relative group cursor-pointer ${
                    isNow
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : item.occupancyPercent > 80
                      ? "bg-red-500/60 hover:bg-red-400"
                      : item.occupancyPercent > 50
                      ? "bg-amber-500/50 hover:bg-amber-400"
                      : "bg-emerald-500/30 hover:bg-emerald-400"
                  }`}
                  style={{ height: barHeight }}
                  title={`${item.hour}: ${item.occupancyPercent}% (${item.label})`}
                />
                <span
                  className={`text-[8px] font-mono ${
                    isNow ? "text-emerald-300 font-bold" : "text-zinc-500"
                  }`}
                >
                  {item.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
