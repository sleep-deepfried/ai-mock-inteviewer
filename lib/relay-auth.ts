import { NextResponse } from "next/server";

/**
 * Validates `Authorization: Bearer <RELAY_CLIENT_SECRET>` for mobile relay routes.
 * Gemini API keys must never be sent to clients; this secret is app-embedded and rate-limited.
 */
export function requireRelayAuth(request: Request): NextResponse | null {
  const secret = process.env.RELAY_CLIENT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    console.error("[relay] RELAY_CLIENT_SECRET missing or too short");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization")?.trim();
  const expected = `Bearer ${secret}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
