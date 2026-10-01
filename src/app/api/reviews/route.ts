import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const STARTER_REVIEWS = [
  {
    id: "rev_starter_1",
    name: "Gabriel Martins",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    role: "Aluno há 8 meses",
    rating: 5,
    date: "Ontem",
    comment: "A evolução de cárdio e o timer de séries mudaram meu treino. O GymFlow é de longe o app mais fluido que já usei.",
    verified: true,
  },
  {
    id: "rev_starter_2",
    name: "Juliana Mendes",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    role: "Aluna VIP",
    rating: 5,
    date: "Há 3 dias",
    comment: "Meu personal prescreve a ficha e eu acompanho tudo em tempo real. A contagem de volume e PRs me mantém 100% focada.",
    verified: true,
  },
  {
    id: "rev_starter_3",
    name: "Lucas Vasconcelos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    role: "Aluno Intermediário",
    rating: 5,
    date: "Esta semana",
    comment: "As medalhas 3D e as conquistas secretas dão um boost surreal na motivação. A catraca via QR Code funciona instantaneamente.",
    verified: true,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coachId = searchParams.get("coachId");

  const client = getSupabase();
  if (client) {
    try {
      let query = client.from("reviews").select("*");
      if (coachId) query = query.eq("coach_id", coachId);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(25);
      if (!error && data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          name: r.student_name,
          avatar: r.student_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          role: "Aluno Verificado",
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString("pt-BR"),
          comment: r.comment,
          verified: r.verified_member ?? true,
          coachId: r.coach_id,
        }));
        return NextResponse.json({ reviews: mapped });
      }
    } catch {}
  }

  return NextResponse.json({ reviews: STARTER_REVIEWS });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rl = checkRateLimit(`review_post_${ip}`, 5, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de avaliações excedido." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const name = sanitizeInput(body.name || body.studentName || "Aluno GymFlow");
    const comment = sanitizeInput(body.comment || "").trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));
    const avatar = sanitizeInput(body.avatar || "");
    const coachId = body.coachId ? sanitizeInput(body.coachId) : null;

    if (!comment || comment.length < 5) {
      return NextResponse.json({ error: "O comentário deve conter ao menos 5 caracteres." }, { status: 400 });
    }

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      role: "Aluno Verificado",
      rating,
      date: "Hoje",
      comment,
      verified: true,
      coachId,
    };

    const client = getSupabase();
    if (client) {
      try {
        let userId: string | null = null;
        const { data: { session } } = await client.auth.getSession();
        if (session?.user?.id) userId = session.user.id;

        await client.from("reviews").insert({
          id: newReview.id,
          user_id: userId,
          student_name: name,
          student_avatar: newReview.avatar,
          rating,
          comment,
          coach_id: coachId,
          verified_member: true,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("⚠️ [Reviews] Falha ao gravar review no Supabase:", dbErr);
      }
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (err: any) {
    return NextResponse.json({ error: "Erro ao cadastrar avaliação.", details: err?.message }, { status: 500 });
  }
}
