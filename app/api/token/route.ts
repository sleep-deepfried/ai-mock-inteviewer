/**
 * Ephemeral Token API route.
 *
 * Accepts a session ID, retrieves interview context from the session store,
 * builds the system instruction, and generates an ephemeral token via
 * the Gemini API for browser-side Live connection.
 */

import { NextResponse } from "next/server";
import { GoogleGenAI, Modality, TurnCoverage } from "@google/genai";
import { getAuthUser } from "@/lib/auth";
import { sessionStore } from "@/lib/session-store";
import { buildSystemInstruction } from "@/lib/system-prompt";

export async function POST(request: Request) {
  // Auth check
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read JSON body
  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { sessionId } = body;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  // Retrieve session context (single-use)
  const context = sessionStore.get(sessionId);
  if (!context) {
    return NextResponse.json(
      { error: "Session not found or expired" },
      { status: 404 }
    );
  }

  // Build system instruction from context
  const systemPrompt = buildSystemInstruction({
    jobRole: context.jobRole,
    jobDescription: context.jobDescription,
    resumeText: context.resumeText,
  });

  // Generate ephemeral token
  try {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const authToken = await genai.authTokens.create({
      config: {
        httpOptions: { apiVersion: "v1alpha" },
        liveConnectConstraints: {
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Zephyr",
                },
              },
            },
            realtimeInputConfig: {
              automaticActivityDetection: { disabled: true },
              turnCoverage: TurnCoverage.TURN_INCLUDES_ALL_INPUT,
            },
            contextWindowCompression: {
              triggerTokens: "25000",
              slidingWindow: { targetTokens: "10000" },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
      },
    });

    // Clean up the consumed session
    sessionStore.delete(sessionId);

    return NextResponse.json({ token: authToken.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Token generation failed:", message);
    return NextResponse.json(
      { error: "Failed to generate session token", detail: message },
      { status: 500 }
    );
  }
}
