import { NextResponse } from "next/server";

/**
 * LGPD / GDPR: Endpoint para o usuário exportar todos os seus dados armazenados.
 * Rota: GET /api/export-data
 */
export async function GET(request: Request) {
  // Simulação de dados do usuário autenticado para exportação
  const exportPayload = {
    user: {
      id: "usr_athlete_01",
      name: "Atleta GymFlow",
      email: "atleta@gymflow.com.br",
      registeredAt: "2026-01-15T10:00:00.000Z",
      fitnessProfile: {
        weightKg: 78,
        heightCm: 180,
        goal: "Hipertrofia",
        dailyCalorieTarget: 2600,
        dailyProteinTargetGrams: 160,
      },
    },
    ordersHistory: [
      {
        orderId: "GF-84920",
        date: "2026-09-08T18:30:00.000Z",
        mealName: "Salmon Power Bowl",
        total: 46.9,
        macros: { calories: 560, protein: 42, carbs: 48, fat: 20 },
        paymentStatus: "approved",
      },
    ],
    consents: {
      cookiesAccepted: true,
      geolocationConsent: true,
      marketingOptIn: false,
    },
    generatedAt: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="gymflow-user-data.json"',
    },
  });
}
