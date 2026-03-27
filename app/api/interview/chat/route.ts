import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  createUserContent,
  createModelContent,
} from "@google/genai";
import { getAuthUser } from "@/lib/auth";
import { sessionStore } from "@/lib/session-store";
import { buildSystemInstruction } from "@/lib/system-prompt";
import type { Content } from "@google/genai";

const MODEL = "gemini-2.5-flash-lite";

const BOOTSTRAP_USER_TEXT =
  "Please begin the interview by introducing yourself and asking your first question.";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; message?: string; bootstrap?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, message, bootstrap } = body;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  const entry = sessionStore.get(sessionId);
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

  let userText: string;
  if (bootstrap === true) {
    if (entry.messages.length > 0) {
      const lastModel = [...entry.messages]
        .reverse()
        .find((m) => m.role === "model");
      if (lastModel) {
        return NextResponse.json({ text: lastModel.text, replay: true });
      }
    }
    userText = BOOTSTRAP_USER_TEXT;
  } else {
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    userText = message.trim();
  }

  const systemInstruction = buildSystemInstruction({
    jobRole: entry.jobRole,
    jobDescription: entry.jobDescription,
    resumeText: entry.resumeText,
    interviewStyle: entry.interviewStyle,
  });

  const historyContents: Content[] = entry.messages.map((m) =>
    m.role === "user" ? createUserContent(m.text) : createModelContent(m.text),
  );
  historyContents.push(createUserContent(userText));

  try {
    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: historyContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const assistantText = (response.text ?? "").trim();
    if (!assistantText) {
      return NextResponse.json(
        { error: "Empty model response" },
        { status: 502 },
      );
    }

    entry.messages.push({ role: "user", text: userText });
    entry.messages.push({ role: "model", text: assistantText });

    return NextResponse.json({ text: assistantText });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Interview chat failed:", msg);
    return NextResponse.json(
      { error: "Failed to generate reply", detail: msg },
      { status: 500 },
    );
  }
}
