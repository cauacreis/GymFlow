"use client";

import React from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, ChefHat, MapPin, Bot, ShoppingBag } from "lucide-react";

export type TabType = "menu" | "customizer" | "map" | "ai" | "bag";

interface BottomTabBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  cartCount: number;
}

export function BottomTabBar({
  currentTab,
  onSelectTab,
  cartCount,
}: BottomTabBarProps) {
  const tabs = [
    { id: "menu" as TabType, label: "Cardápio", icon: UtensilsCrossed },
    { id: "customizer" as TabType, label: "Montador", icon: ChefHat },
    { id: "ai" as TabType, label: "IA Nutri", icon: Bot },
    { id: "map" as TabType, label: "Delivery", icon: MapPin },
    { id: "bag" as TabType, label: "Sacola", icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <nav aria-label="Navegação Principal" className="sticky bottom-2 z-40 w-full px-4 pt-1 pb-1">
      <div className="relative flex items-center justify-around p-1.5 rounded-full bg-[#0E0E14]/90 backdrop-blur-2xl border border-white/[0.1] shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-colors cursor-pointer select-none"
            >
              {/* Indicador animado com Framer Motion layoutId */}
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border border-emerald-500/35 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.25)]"
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive
                      ? "text-emerald-400 scale-110 stroke-[2.4]"
                      : "text-zinc-400 hover:text-zinc-200 stroke-[1.8]"
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`relative z-10 text-[9px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? "text-emerald-400 font-semibold" : "text-zinc-400"
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
