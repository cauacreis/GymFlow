import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children: React.ReactNode;
  glow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", icon, children, glow = false, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 active:scale-[0.97] select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none group overflow-hidden";

    const sizeStyles = {
      sm: "text-xs px-3.5 py-1.5 gap-1.5",
      md: "text-sm px-5 py-2.5 gap-2",
      lg: "text-base px-6 py-3.5 gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-semibold shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_28px_rgba(16,185,129,0.5)] border border-emerald-400/40",
      secondary:
        "bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700/90 border border-white/10 shadow-sm",
      glass:
        "bg-white/[0.06] backdrop-blur-xl text-zinc-100 border border-white/12 hover:bg-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]",
      outline:
        "bg-transparent text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10",
      ghost:
        "bg-transparent text-zinc-300 hover:text-white hover:bg-white/5",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          glow && "animate-pulse-glow",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {icon && (
          <span className="relative z-10 w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
