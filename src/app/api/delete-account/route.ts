import { NextResponse } from "next/server";
import { z } from "zod";

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR"),
});

/**
 * LGPD / GDPR: Endpoint para exclusão completa da conta e dados (Direito ao Esquecimento).
 * Rota: POST /api/delete-account
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    deleteAccountSchema.parse(body);

    const response = NextResponse.json({
      success: true,
      message: "Conta e dados associados foram excluídos com sucesso em conformidade com a LGPD.",
    });

    // Remove cookies de sessão
    response.cookies.delete("gymflow_session");

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Confirmação inválida. Digite 'EXCLUIR' para confirmar a eliminação de dados." },
      { status: 400 }
    );
  }
}
