import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";

const checkDeviceSchema = z.object({
  deviceId: z.string().min(5).max(100),
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, email } = checkDeviceSchema.parse(body);

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ allowed: true, isLocalFallback: true });
    }

    // 1. Verifica se dispositivo já tem conta registrada
    const { data: deviceRecord, error: deviceError } = await supabase
      .from("device_registrations")
      .select("registered_email, trial_used")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (!deviceError && deviceRecord) {
      if (deviceRecord.registered_email && deviceRecord.registered_email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({
          allowed: false,
          reason: "Este dispositivo já possui uma conta registrada. Permitimos apenas 1 conta por aparelho.",
          registeredEmail: deviceRecord.registered_email,
        });
      }
    }

    // 2. Verifica se o email já existe
    const { data: emailRecord, error: emailError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (!emailError && emailRecord) {
      return NextResponse.json({
        allowed: false,
        reason: "Este e-mail já está em uso. Por favor faça login.",
      });
    }

    return NextResponse.json({
      allowed: true,
      trialAvailable: !deviceRecord?.trial_used,
    });
  } catch (err: any) {
    return NextResponse.json({ allowed: true, error: err.message });
  }
}
