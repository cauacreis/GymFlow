"use client";

import React from "react";

interface MobileShellProps {
  children: React.ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <main className="min-h-screen w-full bg-[#020203] text-zinc-100 flex items-center justify-center p-0 md:py-6 md:px-4 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Luz ambiente de fundo no desktop */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Frame do Smartphone no Desktop / 100% tela no Mobile */}
      <div className="relative w-full max-w-[440px] h-[100dvh] md:h-[880px] md:max-h-[95vh] bg-[#070709] md:rounded-[48px] md:border-[7px] md:border-[#1E1E24] md:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden">
        {/* Conteúdo rolável interno */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar relative flex flex-col pt-1 md:pt-2">
          {children}
        </div>

        {/* Home Bar inferior apenas no preview Desktop */}
        <footer className="hidden md:flex w-full shrink-0 justify-center py-2 bg-transparent pointer-events-none select-none">
          <div className="w-36 h-1 bg-zinc-600/50 rounded-full" />
        </footer>
      </div>
    </main>
  );
}
