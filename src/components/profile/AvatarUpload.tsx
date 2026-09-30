"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Trash2, Loader2 } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { processAndCompressImageToWebP } from "@/lib/image-processor";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpa erro anterior
    setUploadError(null);

    // Validação de tamanho bruto (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("A foto selecionada deve ter até 5MB.");
      triggerHaptic("warning");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await processAndCompressImageToWebP(file, {
        maxDimension: 400,
        quality: 0.82,
      });

      triggerHaptic("success");
      onSelectAvatar(result.dataUrl);
    } catch {
      // Fallback defensivo com FileReader caso o navegador não suporte Canvas WebP
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          triggerHaptic("success");
          onSelectAvatar(reader.result);
        }
      };
      reader.onerror = () => {
        setUploadError("Não foi possível carregar a imagem selecionada. Tente outra foto.");
        triggerHaptic("warning");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    triggerHaptic("warning");
    onSelectAvatar("");
    setUploadError(null);
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
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-zinc-900 border border-white/20 text-white shadow-md hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
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
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm disabled:opacity-50 ${
                isCoach
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto</span>
                </>
              )}
            </button>

            {currentAvatarUrl && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRemovePhoto}
                className="px-2 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all disabled:opacity-50"
                title="Remover foto atual"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[10px] text-zinc-400">
            Formatos JPG, PNG ou WEBP até 5MB
          </p>

          {uploadError && (
            <p className="text-[10px] text-rose-400 font-medium animate-in fade-in">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
