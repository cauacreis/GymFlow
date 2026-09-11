import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const VAULT_SALT = "gymflow_vault_salt_2026";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("gymflow_vault_auth")?.value ||
    req.headers.get("x-vault-token");

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const [payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", VAULT_SALT)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Checa expiração
  const [, expiresAtStr] = payload.split(":");
  const expiresAt = Number(expiresAtStr) || 0;

  if (Date.now() > expiresAt) {
    return NextResponse.json({ authenticated: false, reason: "expired" }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    expiresAt,
  });
}
