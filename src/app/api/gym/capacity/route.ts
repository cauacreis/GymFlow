import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const HOURLY_FORECAST = [
  { hour: "06h", occupancyPercent: 45, label: "Moderado" },
  { hour: "07h", occupancyPercent: 65, label: "Moderado" },
  { hour: "08h", occupancyPercent: 55, label: "Moderado" },
  { hour: "09h", occupancyPercent: 35, label: "Tranquilo" },
  { hour: "10h", occupancyPercent: 25, label: "Tranquilo" },
  { hour: "12h", occupancyPercent: 50, label: "Moderado" },
  { hour: "14h", occupancyPercent: 30, label: "Tranquilo" },
  { hour: "16h", occupancyPercent: 40, label: "Moderado" },
  { hour: "18h", occupancyPercent: 88, label: "Pico" },
  { hour: "19h", occupancyPercent: 94, label: "Pico" },
  { hour: "20h", occupancyPercent: 82, label: "Pico" },
  { hour: "21h", occupancyPercent: 50, label: "Moderado" },
];

export async function GET() {
  const now = new Date();
  const currentHourNum = now.getHours();
  const hourKey = `${String(currentHourNum).padStart(2, "0")}h`;

  const foundForecast = HOURLY_FORECAST.find((h) => h.hour === hourKey) || {
    hour: hourKey,
    occupancyPercent: currentHourNum >= 18 && currentHourNum <= 20 ? 85 : currentHourNum >= 6 && currentHourNum <= 9 ? 60 : 35,
    label: currentHourNum >= 18 && currentHourNum <= 20 ? "Pico" : currentHourNum >= 6 && currentHourNum <= 9 ? "Moderado" : "Tranquilo",
  };

  const maxCapacity = 60;
  const currentPeopleCount = Math.round((foundForecast.occupancyPercent / 100) * maxCapacity);

  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client
        .from("gym_occupancy")
        .select("*")
        .eq("id", "main_facility")
        .maybeSingle();

      if (data) {
        return NextResponse.json({
          currentPeopleCount: data.current_count ?? currentPeopleCount,
          maxCapacity: data.max_capacity ?? maxCapacity,
          occupancyPercent: data.occupancy_percent ?? foundForecast.occupancyPercent,
          statusLabel: data.status_label ?? foundForecast.label,
          hourlyForecast: data.hourly_distribution?.length ? data.hourly_distribution : HOURLY_FORECAST,
          lastUpdated: data.updated_at || now.toISOString(),
        });
      }
    } catch {}
  }

  return NextResponse.json({
    currentPeopleCount,
    maxCapacity,
    occupancyPercent: foundForecast.occupancyPercent,
    statusLabel: foundForecast.label,
    hourlyForecast: HOURLY_FORECAST,
    lastUpdated: now.toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { currentCount, maxCapacity = 60 } = body;

  if (typeof currentCount !== "number" || currentCount < 0) {
    return NextResponse.json({ error: "Contagem de ocupação inválida." }, { status: 400 });
  }

  const percent = Math.min(100, Math.round((currentCount / maxCapacity) * 100));
  const statusLabel = percent >= 80 ? "Pico" : percent >= 45 ? "Moderado" : "Tranquilo";

  const client = getSupabase();
  if (client) {
    try {
      await client.from("gym_occupancy").upsert({
        id: "main_facility",
        current_count: currentCount,
        max_capacity: maxCapacity,
        occupancy_percent: percent,
        status_label: statusLabel,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  }

  return NextResponse.json({
    success: true,
    currentCount,
    maxCapacity,
    occupancyPercent: percent,
    statusLabel,
  });
}
