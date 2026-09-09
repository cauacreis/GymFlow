"use client";

import React from "react";
import Image from "next/image";
import { REVIEWS } from "@/lib/data";
import { Star, CheckCircle2, TrendingUp, Users } from "lucide-react";

export function SocialProof() {
  return (
    <section className="w-full px-4 py-4 flex flex-col gap-3">
      {/* Título & Resumo */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Comunidade de Atletas</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
            Quem treina pesado, come GymFlow
          </h3>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-emerald-400" />
          <span>4.9 / 5.0</span>
        </div>
      </div>

      {/* Lista de Avaliações em Carrossel Horizontal Tátil */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 snap-x">
        {REVIEWS.map((rev) => (
          <div
            key={rev.id}
            className="w-[280px] shrink-0 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-md flex flex-col justify-between snap-start"
          >
            <div>
              {/* Cabeçalho do Review */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-emerald-500/40 shrink-0">
                  <Image
                    src={rev.avatar}
                    alt={rev.author}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {rev.author}
                    </span>
                    {rev.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                    {rev.role}
                  </span>
                </div>
              </div>

              {/* Estrelas */}
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Comentário */}
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            {/* Resultado / Ganho Físico */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{rev.gain}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
