import { NextResponse } from "next/server";
import { scoreInterview } from "@/lib/interview-scoring";
import { requireRelayAuth } from "@/lib/relay-auth";
import { assertRelayRateLimit } from "@/lib/relay-rate-limit";

const MAX_BODY_BYTES = 600_000;

export async function POST(request: Request) {
  const authErr = requireRelayAuth(request);
  if (authErr) return authErr;

  const limitErr = assertRelayRateLimit(request, "score");
  if (limitErr) return limitErr;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: {
    transcript?: { role: string; text: string }[];
    jobRole?: string;
    duration?: number;
    transcriptWasEmpty?: boolean;
    interviewStyle?: string;
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const transcript = body.transcript;
  const jobRole = body.jobRole;
  const duration = body.duration;

  if (!jobRole || typeof jobRole !== "string") {
    return NextResponse.json({ error: "jobRole is required" }, { status: 400 });
  }
  if (typeof duration !== "number" || Number.isNaN(duration)) {
    return NextResponse.json({ error: "duration is required" }, { status: 400 });
  }

  const normalized = (transcript ?? []).map((t) => ({
    role: t.role === "user" ? ("user" as const) : ("ai" as const),
    text: typeof t.text === "string" ? t.text : "",
  }));

  const result = await scoreInterview({
    transcript: normalized,
    jobRole,
    duration,
    transcriptWasEmpty: body.transcriptWasEmpty,
  });

  if (!result.ok) {
    const payload: Record<string, string> = { error: result.error };
    if (result.detail) payload.detail = result.detail;
    return NextResponse.json(payload, { status: result.status });
  }

  return NextResponse.json({
    ...result.feedback,
    transcriptWasEmpty: result.transcriptWasEmpty,
  });
}
