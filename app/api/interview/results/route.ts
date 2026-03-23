import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthUser } from "@/lib/auth";
import { appendInterviewReviewRow } from "@/lib/sheets";

declare const process: { env: Record<string, string | undefined> };

interface TranscriptEntry {
  role: "user" | "ai";
  text: string;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transcript, jobRole, duration, review } = body as {
      transcript: TranscriptEntry[];
      jobRole: string;
      duration: number;
      review?: { rating: number; comment?: string };
    };

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const conversationText = transcript
      .map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.text}`)
      .join("\n");

    const prompt = `You are an expert interview coach. Analyze this mock interview transcript for a "${jobRole}" position that lasted ${Math.round(duration / 60)} minutes.

Score the candidate on these categories (0-100 each) and provide specific, actionable feedback:

1. Communication Skills - Clarity, articulation, conciseness
2. Technical Knowledge - Depth and accuracy of technical answers
3. Problem Solving - Approach to questions, structured thinking
4. Confidence & Delivery - Composure, enthusiasm, professionalism
5. Relevance - How well answers relate to the role

Also provide:
- An overall score (0-100, weighted average)
- 3 key strengths
- 3 areas for improvement
- A brief overall summary (2-3 sentences)

Respond ONLY with valid JSON in this exact format:
{
  "overallScore": number,
  "categories": [
    { "name": "Communication Skills", "score": number, "feedback": "string" },
    { "name": "Technical Knowledge", "score": number, "feedback": "string" },
    { "name": "Problem Solving", "score": number, "feedback": "string" },
    { "name": "Confidence & Delivery", "score": number, "feedback": "string" },
    { "name": "Relevance", "score": number, "feedback": "string" }
  ],
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "summary": "string"
}

Transcript:
${conversationText}`;

    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI feedback" },
        { status: 500 }
      );
    }

    const feedback = JSON.parse(jsonMatch[0]);

    if (
      review &&
      typeof review.rating === "number" &&
      review.rating > 0
    ) {
      try {
        await appendInterviewReviewRow({
          userEmail: user.email ?? "",
          userId: user.id,
          rating: review.rating,
          comment: typeof review.comment === "string" ? review.comment : "",
          jobRole,
          durationSec: duration,
        });
      } catch (sheetErr) {
        console.error("[sheets] Failed to append interview review:", sheetErr);
      }
    }

    return NextResponse.json(feedback);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Results generation failed:", message);
    return NextResponse.json(
      { error: "Failed to generate results", detail: message },
      { status: 500 }
    );
  }
}
