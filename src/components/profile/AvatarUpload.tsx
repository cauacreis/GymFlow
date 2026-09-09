"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Sparkles, Check, Image as ImageIcon } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  isCoach?: boolean;
  onSelectAvatar: (url: string) => void;
}

const PRESET_AVATARS = [
  // Treinadores / Homens
  "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
  // Treinadoras / Mulheres
  "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
];

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  isCoach = false,
  onSelectAvatar,
}: AvatarUploadProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "presets">("upload");
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada. Escolha uma foto de até 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        triggerHaptic("success");
        onSelectAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (url: string) => {
    triggerHaptic("selection");
    onSelectAvatar(url);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    triggerHaptic("success");
    onSelectAvatar(customUrl.trim());
    setCustomUrl("");
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white flex items-center gap-1.5">
          <Camera className={`w-3.5 h-3.5 ${isCoach ? "text-amber-400" : "text-emerald-400"}`} />
          <span>Foto de Perfil & Avatar</span>
        </label>
        <span className="text-[9px] text-zinc-400">Visível no perfil e agenda</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Preview do Avatar Atual */}
        <div className="relative group shrink-0">
          <div
            className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-lg flex items-center justify-center bg-zinc-950 ${
              isCoach
                ? "border-amber-500/50 shadow-amber-500/10"
                : "border-emerald-500/50 shadow-emerald-500/10"
            }`}
          >
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-black text-xl text-zinc-400">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-zinc-900 border border-white/20 text-white shadow-md hover:scale-110 active:scale-95 transition-all"
            title="Trocar Foto"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-200" />
          </button>
        </div>

        {/* Informações e Botão Rápido de Arquivo */}
        <div className="flex-1 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
                isCoach
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Foto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setActiveTab(activeTab === "presets" ? "upload" : "presets");
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] transition-all"
            >
              {activeTab === "presets" ? "Ocultar Galeria" : "Galeria Fitness"}
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 truncate">
            Formatos JPG, PNG ou WEBP até 3MB
          </p>
        </div>
      </div>

      {/* Galeria de Avatares Predefinidos */}
      {activeTab === "presets" && (
        <div className="pt-2 border-t border-white/[0.06] space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Avatares Prontos em Alta Definição:
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PRESET_AVATARS.map((avatar, idx) => {
              const isSelected = currentAvatarUrl === avatar;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(avatar)}
                  className={`relative aspect-square rounded-xl overflow-hidden border transition-all hover:scale-105 active:scale-95 ${
                    isSelected
                      ? isCoach
                        ? "border-amber-400 ring-2 ring-amber-400/40"
                        : "border-emerald-400 ring-2 ring-emerald-400/40"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Campo para colar link de imagem */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Ou cole a URL de uma imagem..."
              className="flex-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-[11px] text-white focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition-all"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
