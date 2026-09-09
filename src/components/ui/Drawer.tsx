"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop escuro com blur suave */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
            }}
            className="relative w-full max-w-[440px] max-h-[88vh] bg-[#0C0C10] border-t border-white/10 rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-10"
          >
            {/* Puxador táctil */}
            <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full" />
            </div>

            {/* Cabeçalho do Drawer */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/5">
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                {title || ""}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
