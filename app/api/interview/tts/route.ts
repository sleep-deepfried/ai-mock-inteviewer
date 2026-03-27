import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

const ELEVEN_MODEL = "eleven_turbo_v2_5";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    console.error("ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID missing");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
  );
  url.searchParams.set("output_format", "pcm_24000");

  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/pcm",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("ElevenLabs fetch failed:", msg);
    return NextResponse.json(
      { error: "TTS upstream failed", detail: msg },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("ElevenLabs error:", upstream.status, errText);
    return NextResponse.json(
      { error: "TTS generation failed", detail: errText.slice(0, 200) },
      { status: upstream.status >= 500 ? 502 : 400 },
    );
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "Empty TTS response" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/pcm;rate=24000",
      "Cache-Control": "no-store",
    },
  });
}
