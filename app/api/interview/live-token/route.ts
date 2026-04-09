import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
} from "@google/genai";
import { getAuthUser } from "@/lib/auth";
import { sessionStore, type InterviewStyle } from "@/lib/session-store";
import { buildSystemInstruction } from "@/lib/system-prompt";
import { GEMINI_LIVE_MODEL } from "@/lib/gemini-live-model";
import { interviewLiveTools } from "@/lib/interview-live-tools";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; role?: string; style?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  let entry = sessionStore.get(sessionId);
  
  // If session not found but we have role info, recreate it (handles server restarts)
  if (!entry && body.role && typeof body.role === "string") {
    const interviewStyle: InterviewStyle = 
      body.style === "behavioral" || body.style === "technical" 
        ? body.style 
        : "technical";
    
    entry = {
      jobRole: body.role,
      jobDescription: "",
      resumeText: "",
      interviewStyle,
      createdAt: Date.now(),
      messages: [],
    };
    sessionStore.store(sessionId, entry);
  }
  
  if (!entry) {
    return NextResponse.json(
      { error: "Session not found or expired" },
      { status: 404 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const systemInstruction = buildSystemInstruction({
    jobRole: entry.jobRole,
    jobDescription: entry.jobDescription,
    resumeText: entry.resumeText,
    interviewStyle: entry.interviewStyle,
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
                  voiceName: "Zephyr", // Bright female voice for interviewer persona
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
      console.error("live-token: auth token response missing name");
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
    console.error("live-token failed:", message);
    return NextResponse.json(
      { error: "Failed to create live token", detail: message },
      { status: 500 },
    );
  }
}
