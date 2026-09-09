"use client";

import React, { useState } from "react";
import { GYM_HUBS } from "@/lib/data";
import { MapPin, Navigation, Clock, Dumbbell, ShieldCheck } from "lucide-react";

export function DeliveryMap() {
  const [selectedHub, setSelectedHub] = useState(GYM_HUBS[0]);
  const [userLocationGranted, setUserLocationGranted] = useState(false);
  const [simulatedDistance, setSimulatedDistance] = useState("850m");

  const handleRequestLocation = () => {
    // Conformidade LGPD: apenas com opt-in explícito do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setUserLocationGranted(true);
          setSimulatedDistance("420m (Você está bem perto!)");
        },
        () => {
          setUserLocationGranted(true);
          setSimulatedDistance("Localização estimada via IP: 850m");
        }
      );
    } else {
      setUserLocationGranted(true);
    }
  };

  return (
    <section className="w-full px-4 py-4 flex flex-col gap-3">
      {/* Cabeçalho do Mapa */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5" />
            <span>Radar de Entrega Rápida</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
            Entrega direta na sua Academia
          </h3>
        </div>

        <button
          onClick={handleRequestLocation}
          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
        >
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{userLocationGranted ? "GPS Ativo" : "Usar GPS"}</span>
        </button>
      </div>

      {/* Visualizador Tático Dark Mode do Mapa */}
      <div className="relative w-full h-56 rounded-3xl overflow-hidden border border-white/10 bg-[#09090D] shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex items-center justify-center p-4">
        {/* Linhas de Grid Noturno */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#22C55E 1px, transparent 1px), linear-gradient(90deg, #22C55E 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Raio de Entrega Pulsante */}
        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/25 bg-emerald-500/5 animate-pulse-glow flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full border border-emerald-500/40 bg-emerald-500/10" />
        </div>

        {/* Marcadores dos Hubs no Mapa Noturno */}
        <div className="relative z-10 w-full h-full flex items-center justify-around">
          {GYM_HUBS.map((hub, index) => {
            const isSelected = selectedHub.id === hub.id;
            return (
              <button
                key={hub.id}
                onClick={() => setSelectedHub(hub)}
                className={`relative flex flex-col items-center transition-transform duration-300 cursor-pointer ${
                  isSelected ? "scale-110 z-20" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  transform: `translateY(${index % 2 === 0 ? "-12px" : "16px"})`,
                }}
              >
                {/* Pino Pulsante */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.8)] ring-4 ring-emerald-400/30"
                      : "bg-[#181820] text-emerald-400 border border-white/10"
                  }`}
                >
                  <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                </div>

                {/* Nome do Hub Flutuante */}
                <span className="mt-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white whitespace-nowrap shadow-sm">
                  {hub.name.replace("Hub ", "")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selo de Entrega Rápida */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>Estimativa: <b className="text-white">{selectedHub.deliveryTime}</b></span>
        </div>
      </div>

      {/* Card de Detalhe do Hub Selecionado */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white">{selectedHub.name}</span>
          <span className="text-[11px] text-zinc-400">{selectedHub.address}</span>
          <span className="text-[10px] text-emerald-400 mt-0.5 font-medium">
            Distância: {simulatedDistance}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Entrega na Catraca</span>
        </div>
      </div>
    </section>
  );
}
