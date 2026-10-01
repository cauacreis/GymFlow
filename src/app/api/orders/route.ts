import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const client = getSupabase();
  if (client) {
    try {
      let targetId = userId;
      if (!targetId) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user?.id) targetId = session.user.id;
      }

      if (targetId) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        let query = client.from("orders").select("*");
        if (isUUID) {
          query = query.or(`user_id.eq.${targetId},student_id.eq.${targetId}`);
        } else {
          query = query.eq("student_id", targetId);
        }

        const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
        if (!error && data) {
          return NextResponse.json({ orders: data });
        }
      }
    } catch {}
  }

  return NextResponse.json({ orders: [] });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rl = checkRateLimit(`order_create_${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas tentativas de pedido." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const customerName = sanitizeInput(body.customerName || "Cliente GymFlow");
    const customerPhone = sanitizeInput(body.customerPhone || "");
    const deliveryAddress = sanitizeInput(body.deliveryAddress || "Retirada na Recepção GymFlow");
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = sanitizeInput(body.paymentMethod || "pix");

    if (items.length === 0) {
      return NextResponse.json({ error: "A sacola está vazia." }, { status: 400 });
    }

    const subtotal = items.reduce(
      (acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || 1)),
      0
    );
    const deliveryFee = body.deliveryFee !== undefined ? Number(body.deliveryFee) : 0;
    const total = subtotal + deliveryFee;
    const finalId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const orderPayload = {
      id: finalId,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      delivery_address: deliveryAddress,
      items,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: "preparing",
      payment_method: paymentMethod,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const client = getSupabase();
    if (client) {
      try {
        let userId: string | null = null;
        const { data: { session } } = await client.auth.getSession();
        if (session?.user?.id) userId = session.user.id;

        await client.from("orders").insert({
          ...orderPayload,
          user_id: userId,
          student_id: userId || "student_me",
        });
      } catch (dbErr) {
        console.warn("⚠️ [Orders] Falha ao persistir pedido no Supabase:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: finalId,
        customerName,
        customerPhone,
        deliveryAddress,
        items,
        subtotal,
        deliveryFee,
        total,
        status: "preparing",
        paymentMethod,
        createdAt: nowIso,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Erro ao criar pedido.", details: err?.message }, { status: 500 });
  }
}
