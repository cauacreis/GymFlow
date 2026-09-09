"use client";

import React, { useEffect, useState } from "react";
import { Wifi, BatteryMedium, Signal } from "lucide-react";

interface MobileShellProps {
  children: React.ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  const [currentTime, setCurrentTime] = useState("09:41");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#020203] text-zinc-100 flex items-center justify-center p-0 md:py-6 md:px-4 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Luz ambiente de fundo no desktop */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Frame do Smartphone no Desktop / 100% tela no Mobile */}
      <div className="relative w-full max-w-[440px] h-[100dvh] md:h-[880px] md:max-h-[95vh] bg-[#070709] md:rounded-[48px] md:border-[7px] md:border-[#1E1E24] md:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden">
        
        {/* Status Bar Mobile */}
        <header className="relative z-50 w-full shrink-0 flex items-center justify-between px-6 pt-3 pb-1 text-xs font-medium text-zinc-300 select-none bg-transparent">
          <span className="tracking-tight text-xs font-semibold">{currentTime}</span>
          
          {/* Dynamic Island / Notch no Desktop */}
          <div className="hidden md:flex items-center justify-center w-28 h-5 bg-black rounded-full border border-white/5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0f] mr-2 border border-white/10" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse" />
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4 text-emerald-400" />
          </div>
        </header>

        {/* Conteúdo rolável interno */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar relative flex flex-col">
          {children}
        </div>

        {/* Home Bar inferior para iPhone / Android */}
        <footer className="w-full shrink-0 flex justify-center py-2 bg-transparent pointer-events-none select-none">
          <div className="w-36 h-1 bg-zinc-600/50 rounded-full" />
        </footer>
      </div>
    </main>
  );
}
