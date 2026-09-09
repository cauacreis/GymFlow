import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "emerald" | "zinc" | "outline" | "amber";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "emerald",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    emerald:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    zinc: "bg-white/5 text-zinc-300 border border-white/10",
    outline: "bg-transparent text-zinc-400 border border-zinc-700",
    amber: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[10px] tracking-wider font-semibold",
    md: "px-3 py-1 text-xs tracking-wide font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full uppercase select-none transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
