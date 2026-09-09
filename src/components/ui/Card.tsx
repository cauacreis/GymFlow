import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "double-bezel" | "glass" | "solid";
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "double-bezel", glow = false, children, ...props }, ref) => {
    if (variant === "double-bezel") {
      return (
        <div
          ref={ref}
          className={cn(
            "relative p-1.5 rounded-[1.75rem] bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300",
            glow && "shadow-[0_0_30px_rgba(16,185,129,0.2)] border-emerald-500/30",
            className
          )}
          {...props}
        >
          <div className="w-full h-full p-4 rounded-[calc(1.75rem-0.375rem)] bg-[#0A0A0E]/90 backdrop-blur-xl border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-4 transition-all duration-300",
          variant === "glass" &&
            "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]",
          variant === "solid" && "bg-zinc-900/90 border border-zinc-800 shadow-md",
          glow && "shadow-[0_0_24px_rgba(16,185,129,0.25)] border-emerald-500/30",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
