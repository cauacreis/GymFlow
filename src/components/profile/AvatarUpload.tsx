"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Trash2, Link as LinkIcon } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  isCoach?: boolean;
  onSelectAvatar: (url: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  isCoach = false,
  onSelectAvatar,
}: AvatarUploadProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
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

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    triggerHaptic("success");
    onSelectAvatar(customUrl.trim());
    setCustomUrl("");
    setShowUrlInput(false);
  };

  const handleRemovePhoto = () => {
    triggerHaptic("warning");
    onSelectAvatar("");
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white flex items-center gap-1.5">
          <Camera className={`w-3.5 h-3.5 ${isCoach ? "text-amber-400" : "text-emerald-400"}`} />
          <span>Foto de Perfil</span>
        </label>
        <span className="text-[9px] text-zinc-400">Visível no seu perfil e na agenda</span>
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
            title="Escolher Foto da Galeria do Dispositivo"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-200" />
          </button>
        </div>

        {/* Informações e Botões de Ação */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm ${
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
                triggerHaptic("light");
                setShowUrlInput(!showUrlInput);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] transition-all flex items-center gap-1"
              title="Colar link de imagem da internet"
            >
              <LinkIcon className="w-3 h-3 text-zinc-400" />
              <span>{showUrlInput ? "Cancelar Link" : "Colar Link"}</span>
            </button>

            {currentAvatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-2 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                title="Remover foto atual"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[10px] text-zinc-400">
            Formatos JPG, PNG ou WEBP até 3MB
          </p>
        </div>
      </div>

      {/* Input opcional de link da web */}
      {showUrlInput && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06] animate-in fade-in duration-150">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Cole o link da foto (https://...)"
            className="flex-1 p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-[11px] text-white focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="button"
            onClick={handleApplyCustomUrl}
            className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition-all active:scale-95"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
