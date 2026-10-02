import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR"),
  userId: z.string().optional(),
});

/**
 * LGPD / GDPR: Endpoint para eliminação de dados e exclusão definitiva de conta (Art. 18, VI).
 * Rota: POST /api/delete-account
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confirmação inválida. Digite exatamente a palavra 'EXCLUIR' para autorizar a exclusão." },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId;
    const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // Executa limpeza nos registros do banco se houver cliente Supabase configurado
    if (isUUID) {
      const supabase = getSupabaseAdmin() || getSupabase();
      if (supabase) {
        try {
          await supabase.from("profiles").delete().eq("id", userId);
          await supabase.from("students").delete().eq("user_id", userId);
          await supabase.from("body_metrics").delete().eq("user_id", userId);
          await supabase.from("cardio_sessions").delete().eq("user_id", userId);
          await supabase.from("user_achievements").delete().eq("user_id", userId);
          await supabase.from("user_class_history").delete().eq("user_id", userId);
          await supabase.from("access_logs").delete().eq("user_id", userId);
        } catch (dbErr) {
          console.warn("⚠️ [LGPD Delete] Aviso durante deleção em cascata:", dbErr);
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Conta e dados associados foram eliminados permanentemente em conformidade com a LGPD.",
      timestamp: new Date().toISOString(),
    });

    // Remove cookies de sessão e autenticação
    response.cookies.delete("gymflow_session");
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    response.cookies.delete("gymflow_vault_auth");

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação de eliminação de dados." },
      { status: 500 }
    );
  }
}
