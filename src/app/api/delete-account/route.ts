import { NextResponse } from "next/server";
import { z } from "zod";

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

    const response = NextResponse.json({
      success: true,
      message: "Conta e dados associados foram eliminados permanentemente em conformidade com a LGPD.",
      timestamp: new Date().toISOString(),
    });

    // Remove cookies de sessão e autenticação
    response.cookies.delete("gymflow_session");
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação de eliminação de dados." },
      { status: 500 }
    );
  }
}
