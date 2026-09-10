"use client";

import React from "react";

interface MobileShellProps {
  children: React.ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#070709] text-zinc-100 flex justify-center selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Container limpo e responsivo sem moldura ou simulação de aparelho */}
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-7xl min-h-screen flex flex-col relative transition-all duration-200">
        {children}
      </div>
    </div>
  );
}
