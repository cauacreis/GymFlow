import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rl = checkRateLimit(`checkin_${ip}`, 20, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas tentativas de check-in." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const studentName = sanitizeInput(body.studentName || "Aluno GymFlow");
    const matricula = sanitizeInput(body.matricula || "GF-00000");
    const deviceId = sanitizeInput(body.deviceId || "unknown_device");

    const token = `GF-TURNSTILE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    const client = getSupabase();
    if (client) {
      try {
        let userId: string | null = null;
        const { data: { session } } = await client.auth.getSession();
        if (session?.user?.id) userId = session.user.id;

        await client.from("access_logs").insert({
          id: `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          user_id: userId,
          student_name: studentName,
          matricula,
          device_id: deviceId,
          turnstile_token: token,
          status: "granted",
          access_method: "qr_code",
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("⚠️ [Checkin] Aviso ao registrar log no banco:", dbErr);
      }
    }

    return NextResponse.json({
      granted: true,
      message: "Acesso Liberado! Catraca liberada com sucesso.",
      turnstileCode: token,
      studentName,
      matricula,
      expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao processar check-in.", details: err?.message },
      { status: 500 }
    );
  }
}
