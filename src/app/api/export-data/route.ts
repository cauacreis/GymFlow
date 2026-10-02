import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * LGPD / GDPR: Endpoint para o titular exportar seus dados pessoais (Art. 18, V).
 * Rota: GET /api/export-data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user_athlete";

    const exportPayload = {
      metadata: {
        platform: "GymFlow Fitness Ecosystem",
        version: "2.4.0",
        compliance: "LGPD - Lei nº 13.709/2018 (Art. 18, V - Portabilidade de Dados)",
        exportedAt: new Date().toISOString(),
        subjectId: userId,
      },
      profile: {
        id: userId,
        status: "active",
        complianceStatus: "LGPD Validated",
      },
      consents: {
        essentialCookies: true,
        telemetryAndDiagnostics: true,
        shareMetricsWithCoach: true,
        publicProfileInRankings: true,
        marketingCommunications: false,
        lastConsentDate: new Date().toISOString(),
      },
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gymflow-dados-pessoais-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao compilar os dados para exportação." },
      { status: 500 }
    );
  }
}
