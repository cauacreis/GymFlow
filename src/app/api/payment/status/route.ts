import { NextResponse } from "next/server";
import { getMercadoPagoStatus, OFFICIAL_PLANS } from "@/lib/mercadopago";

export async function GET() {
  const status = getMercadoPagoStatus();

  return NextResponse.json({
    mercadopago: status,
    plans: OFFICIAL_PLANS,
    timestamp: new Date().toISOString(),
  });
}
