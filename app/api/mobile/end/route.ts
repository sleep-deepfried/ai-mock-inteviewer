import { NextResponse } from "next/server";
import { requireRelayAuth } from "@/lib/relay-auth";

/**
 * Mobile apps do not use server sessionStore; this endpoint exists for API symmetry
 * and optional future server-side cleanup.
 */
export async function POST(request: Request) {
  const authErr = requireRelayAuth(request);
  if (authErr) return authErr;

  try {
    await request.json().catch(() => ({}));
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true });
}
