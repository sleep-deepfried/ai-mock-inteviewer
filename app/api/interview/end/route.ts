import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { sessionStore } from "@/lib/session-store";

export async function POST(request: Request) {
  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  const entry = sessionStore.get(sessionId);
  const user = await getAuthUser();

  if (entry && !entry.isTrial && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!entry) {
    return NextResponse.json({ ok: true });
  }

  sessionStore.delete(sessionId);
  return NextResponse.json({ ok: true });
}
