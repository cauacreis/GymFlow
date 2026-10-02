"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, CheckCircle2, TrendingUp, Users, Plus, X, MessageSquareHeart } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { getCurrentUser } from "@/lib/auth-store";
import { syncCoachReviewsRating } from "@/lib/gamification-service";

export interface ReviewData {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  date?: string;
  comment: string;
  verified: boolean;
  gain?: string;
}

const FALLBACK_REVIEWS: ReviewData[] = [
  {
    id: "rev_1",
    name: "Gabriel Martins",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    role: "Aluno há 8 meses",
    rating: 5,
    comment: "A evolução de cárdio e o timer de séries mudaram meu treino. O GymFlow é de longe o app mais fluido que já usei.",
    verified: true,
    gain: "+4.2kg de massa magra",
  },
  {
    id: "rev_2",
    name: "Juliana Mendes",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    role: "Aluna VIP",
    rating: 5,
    comment: "Meu personal prescreve a ficha e eu acompanho tudo em tempo real. A contagem de volume e PRs me mantém 100% focada.",
    verified: true,
    gain: "-6.8% de gordura corporal",
  },
  {
    id: "rev_3",
    name: "Lucas Vasconcelos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    role: "Aluno Intermediário",
    rating: 5,
    comment: "As medalhas 3D e as conquistas secretas dão um boost surreal na motivação. A catraca via QR Code funciona instantaneamente.",
    verified: true,
    gain: "+30kg no Supino Reto",
  },
];

export function SocialProof() {
  const [reviews, setReviews] = useState<ReviewData[]>(FALLBACK_REVIEWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    triggerHaptic("medium");
    setIsSubmitting(true);

    const user = getCurrentUser();

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name || "Aluno GymFlow",
          avatar: user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          rating,
          comment: comment.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          const updatedList = [data.review, ...reviews];
          setReviews(updatedList);

          // Sincroniza conquista Sensei 5 Estrelas
          const totalRev = updatedList.length;
          const avgScore = updatedList.reduce((acc, r) => acc + r.rating, 0) / Math.max(1, totalRev);
          syncCoachReviewsRating(avgScore, totalRev);
        }
        setIsModalOpen(false);
        setComment("");
        triggerHaptic("success");
      }
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

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
            Depoimentos da Comunidade
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic("light");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-zinc-300 text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Avaliar</span>
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-emerald-400" />
            <span>4.9</span>
          </div>
        </div>
      </div>

      {/* Lista de Avaliações em Carrossel Horizontal Tátil */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 snap-x">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="w-[280px] shrink-0 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-md flex flex-col justify-between snap-start"
          >
            <div>
              {/* Cabeçalho do Review */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-emerald-500/40 shrink-0">
                  <Image
                    src={rev.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                    alt={rev.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {rev.name}
                    </span>
                    {rev.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                    {rev.role || "Aluno Verificado"}
                  </span>
                </div>
              </div>

              {/* Estrelas */}
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(rev.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Comentário */}
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            {/* Resultado / Ganho Físico */}
            {rev.gain && (
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{rev.gain}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Envio de Avaliação */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Deixar Avaliação</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Sua Nota</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setRating(star);
                      }}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 transition-all ${
                          star <= rating
                            ? "text-amber-400 fill-amber-400 scale-110"
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Depoimento</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como o GymFlow te ajudou nos seus treinos e evolução..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? "Enviando..." : "Publicar Avaliação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
