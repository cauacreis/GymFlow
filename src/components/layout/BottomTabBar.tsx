"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Dumbbell,
  CalendarDays,
  TrendingUp,
  UserCheck,
  Users,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

export type GymTabType = "treino" | "personal" | "aulas" | "evolucao" | "perfil" | "alunos" | "agenda";

interface BottomTabBarProps {
  currentTab: GymTabType;
  onSelectTab: (tab: GymTabType) => void;
  role?: "student" | "coach";
}

export function BottomTabBar({ currentTab, onSelectTab, role = "student" }: BottomTabBarProps) {
  const isCoach = role === "coach";

  const studentTabs = [
    { id: "treino" as GymTabType, label: "Treino", icon: Dumbbell },
    { id: "agenda" as GymTabType, label: "Agenda", icon: Calendar },
    { id: "personal" as GymTabType, label: "Personal", icon: UserCheck },
    { id: "evolucao" as GymTabType, label: "Evolução", icon: TrendingUp },
    { id: "perfil" as GymTabType, label: "Perfil", icon: User },
  ];

  const coachTabs = [
    { id: "alunos" as GymTabType, label: "Alunos", icon: Users },
    { id: "agenda" as GymTabType, label: "Agenda", icon: Calendar },
    { id: "aulas" as GymTabType, label: "Aulas", icon: CalendarDays },
    { id: "evolucao" as GymTabType, label: "Evolução", icon: TrendingUp },
    { id: "perfil" as GymTabType, label: "Perfil", icon: User },
  ];

  const activeTabs = isCoach ? coachTabs : studentTabs;

  return (
    <nav aria-label="Navegação Principal" className="sticky bottom-2 z-40 w-full px-4 pt-1 pb-1">
      <div className="relative flex items-center justify-around p-1.5 rounded-full bg-[#0E0E14]/90 backdrop-blur-2xl border border-white/[0.1] shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)]">
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic("selection");
                onSelectTab(tab.id);
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-colors cursor-pointer select-none"
            >
              {/* Indicador animado com Framer Motion layoutId */}
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className={`absolute inset-0 rounded-full border shadow-lg ${
                    isCoach
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-400/20 border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                      : "bg-gradient-to-r from-emerald-500/20 to-teal-400/20 border-emerald-500/35 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
                  }`}
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive
                      ? isCoach
                        ? "text-amber-400 scale-110 stroke-[2.4]"
                        : "text-emerald-400 scale-110 stroke-[2.4]"
                      : "text-zinc-400 hover:text-zinc-200 stroke-[1.8]"
                  }`}
                />
              </div>

              <span
                className={`relative z-10 text-[9px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive
                    ? isCoach
                      ? "text-amber-400 font-bold"
                      : "text-emerald-400 font-bold"
                    : "text-zinc-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
