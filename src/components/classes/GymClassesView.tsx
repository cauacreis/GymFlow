"use client";

import React, { useState } from "react";
import { CalendarDays, Clock, Users, Flame, CheckCircle2, Award, Sparkles } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export interface GymClass {
  id: string;
  title: string;
  category: "Cardio" | "Lutas" | "Força" | "Mobilidade";
  time: string;
  durationMinutes: number;
  instructor: string;
  totalSpots: number;
  bookedSpots: number;
  caloriesBurnEstimate: number;
  isBooked: boolean;
  description: string;
}

const INITIAL_CLASSES: GymClass[] = [
  {
    id: "class-1",
    title: "Spinning Indoor High Intensity",
    category: "Cardio",
    time: "07:00",
    durationMinutes: 45,
    instructor: "Prof. Rodrigo Costa",
    totalSpots: 25,
    bookedSpots: 23,
    caloriesBurnEstimate: 550,
    isBooked: false,
    description: "Treino intervalado em bike com sprints e subidas para queima máxima.",
  },
  {
    id: "class-2",
    title: "Muay Thai Técnico & Sparring",
    category: "Lutas",
    time: "08:30",
    durationMinutes: 60,
    instructor: "Mestre Felipe 'Cyborg'",
    totalSpots: 16,
    bookedSpots: 14,
    caloriesBurnEstimate: 700,
    isBooked: false,
    description: "Fundamentos de golpes, esquivas, manoplas e condicionamento de combate.",
  },
  {
    id: "class-3",
    title: "Cross Training WOD 'Murph Mod'",
    category: "Força",
    time: "18:00",
    durationMinutes: 50,
    instructor: "Coach Bruno Rocha",
    totalSpots: 20,
    bookedSpots: 19,
    caloriesBurnEstimate: 600,
    isBooked: true, // Já reservado
    description: "Circuito funcional com kettlebell, barras e tiros de corrida.",
  },
  {
    id: "class-4",
    title: "FitDance Hit & Funk",
    category: "Cardio",
    time: "19:15",
    durationMinutes: 45,
    instructor: "Profa. Camila Lima",
    totalSpots: 30,
    bookedSpots: 27,
    caloriesBurnEstimate: 480,
    isBooked: false,
    description: "Coreografias energéticas e ritmos atuais para queimar calorias dançando.",
  },
  {
    id: "class-5",
    title: "Yoga & Flexibilidade Articular",
    category: "Mobilidade",
    time: "20:15",
    durationMinutes: 45,
    instructor: "Profa. Amanda Prado",
    totalSpots: 15,
    bookedSpots: 11,
    caloriesBurnEstimate: 220,
    isBooked: false,
    description: "Posturas de descompressão da coluna e ganho de amplitude de movimento.",
  },
];

export function GymClassesView() {
  const [classes, setClasses] = useState<GymClass[]>(INITIAL_CLASSES);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const categories = ["Todas", "Cardio", "Lutas", "Força", "Mobilidade"];

  const filteredClasses =
    selectedCategory === "Todas"
      ? classes
      : classes.filter((c) => c.category === selectedCategory);

  const handleToggleBooking = (id: string) => {
    triggerHaptic("medium");
    setClasses((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newIsBooked = !item.isBooked;
        return {
          ...item,
          isBooked: newIsBooked,
          bookedSpots: newIsBooked ? item.bookedSpots + 1 : Math.max(0, item.bookedSpots - 1),
        };
      })
    );
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Header com Filtros de Categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              triggerHaptic("light");
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grade de Aulas */}
      <div className="flex flex-col gap-3">
        {filteredClasses.map((item) => {
          const spotsLeft = item.totalSpots - item.bookedSpots;
          const isFull = spotsLeft <= 0 && !item.isBooked;

          return (
            <div
              key={item.id}
              className={`rounded-2xl p-4 transition-all duration-300 border relative overflow-hidden ${
                item.isBooked
                  ? "bg-emerald-950/25 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
                  : "bg-zinc-900/60 border-white/[0.08]"
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                    {item.time}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-[11px] text-zinc-400">{item.instructor}</p>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300">
                  {item.category}
                </span>
              </div>

              {/* Descrição */}
              <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{item.description}</p>

              {/* Badges de Duração, Calorias e Vagas */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06] text-[11px]">
                <div className="flex items-center gap-3 text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {item.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    ~{item.caloriesBurnEstimate} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    {spotsLeft > 0 ? (
                      <span>{spotsLeft} vagas</span>
                    ) : (
                      <span className="text-red-400 font-bold">Esgotado</span>
                    )}
                  </span>
                </div>

                {/* Botão de Reserva */}
                <button
                  disabled={isFull}
                  onClick={() => handleToggleBooking(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    item.isBooked
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                      : isFull
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_18px_rgba(16,185,129,0.45)]"
                  }`}
                >
                  {item.isBooked ? "Inscrito ✓" : isFull ? "Lotada" : "Reservar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
