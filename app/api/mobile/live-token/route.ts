import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
} from "@google/genai";
import type { InterviewStyle } from "@/lib/session-store";
import { buildSystemInstruction } from "@/lib/system-prompt";
import { GEMINI_LIVE_MODEL } from "@/lib/gemini-live-model";
import { interviewLiveTools } from "@/lib/interview-live-tools";
import { requireRelayAuth } from "@/lib/relay-auth";
import { assertRelayRateLimit } from "@/lib/relay-rate-limit";

const MAX_BODY_BYTES = 512_000;

export async function POST(request: Request) {
  const authErr = requireRelayAuth(request);
  if (authErr) return authErr;

  const limitErr = assertRelayRateLimit(request, "live-token");
  if (limitErr) return limitErr;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: {
    sessionId?: string;
    role?: string;
    style?: string;
    jobDescription?: string;
    resumeText?: string;
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  const role = body.role;
  if (!role || typeof role !== "string" || !role.trim()) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  }

  const interviewStyle: InterviewStyle =
    body.style === "behavioral" || body.style === "technical"
      ? body.style
      : "technical";

  const jobDescription =
    typeof body.jobDescription === "string" ? body.jobDescription : "";
  const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const systemInstruction = buildSystemInstruction({
    jobRole: role.trim(),
    jobDescription,
    resumeText,
    interviewStyle,
  });

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const authToken = await ai.authTokens.create({
      config: {
        uses: 5,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: GEMINI_LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Zephyr",
                },
              },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            tools: interviewLiveTools,
          },
        },
      },
    });

    const token = authToken.name;
    if (!token) {
      console.error("mobile live-token: auth token response missing name");
      return NextResponse.json(
        { error: "Failed to create live token" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      token,
      model: GEMINI_LIVE_MODEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("mobile live-token failed:", message);
    return NextResponse.json(
      { error: "Failed to create live token", detail: message },
      { status: 500 },
    );
  }
}
