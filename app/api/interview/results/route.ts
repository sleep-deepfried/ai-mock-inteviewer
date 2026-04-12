import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthUser } from "@/lib/auth";
import { appendInterviewReviewRow } from "@/lib/sheets";

declare const process: { env: Record<string, string | undefined> };

interface TranscriptEntry {
  role: "user" | "ai";
  text: string;
}

const RESULTS_JSON_SCHEMA = `Respond ONLY with valid JSON in this exact format:
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
}`;

function buildScoringPrompt(
  jobRole: string,
  durationMinutes: number,
  conversationText: string,
): string {
  return `You are an expert interview coach. Analyze this mock interview transcript for a "${jobRole}" position that lasted ${durationMinutes} minutes.

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

${RESULTS_JSON_SCHEMA}

Transcript:
${conversationText}`;
}

function buildNoTranscriptCoachPrompt(
  jobRole: string,
  durationMinutes: number,
): string {
  return `You are a warm, plain-spoken interview coach. Someone just finished a practice session for a "${jobRole}" role (about ${durationMinutes} minutes on the timer), but **we did not capture what they said**—usually mic permission, browser, Wi‑Fi, or leaving before the conversation really started.

They will read this on a "limited feedback" screen. There is **nothing to grade**. Your job is encouragement and practical next steps only.

**Tone and wording (critical):**
- Write to **you** like a supportive peer. Short sentences. Zero shame.
- Do **not** use stiff phrases such as: "substantive scoring," "absence of dialogue," "cannot evaluate," "insufficient data," "complete absence," "actionable feedback" as jargon, or "no evidence."
- Do **not** blame "technology," "glitches," "bugs," or "the system." Stay human: we simply did not hear them this round; it happens; the next session can go differently.
- Do **not** pretend you heard their answers. Do not invent strengths about how they answered questions.

**JSON output rules:**
- Set \`overallScore\` to **0** and every category \`score\` to **0** (placeholders only).
- Each category \`feedback\`: one friendly sentence—e.g. a tip for next time so we can hear them—not a fake score.
- \`strengths\`: exactly **3** bullets. Honest positives: e.g. they showed up to practice, they care about the role, they can try again—**not** praise for answers we never heard.
- \`improvements\`: exactly **3** bullets. Concrete habits: allow microphone, wait until you hear the interviewer, use a stable connection, speak in full sentences out loud.
- \`summary\`: **2–3 sentences**. Warm and normal—e.g. it is common not to be heard on a first try, you are welcome back anytime, the bullets below will make the next run easier. No "glitch" or "tech" talk.

${RESULTS_JSON_SCHEMA}`;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transcript, jobRole, duration, review, transcriptWasEmpty, interviewStyle } =
      body as {
        transcript: TranscriptEntry[];
        jobRole: string;
        duration: number;
        review?: { rating: number; comment?: string };
        transcriptWasEmpty?: boolean;
        interviewStyle?: string;
      };

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 },
      );
    }

    const durationMinutes = Math.max(0, Math.round(duration / 60));
    const conversationText = transcript
      .map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.text}`)
      .join("\n");

    const prompt =
      transcriptWasEmpty === true
        ? buildNoTranscriptCoachPrompt(jobRole, durationMinutes)
        : buildScoringPrompt(jobRole, durationMinutes, conversationText);

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
        { status: 500 },
      );
    }

    const feedback = JSON.parse(jsonMatch[0]);

    // Persist session + scorecard to Supabase (best-effort, don't block response)
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true") {
      try {
        const { createSupabaseForRouteHandler } = await import(
          "@/lib/supabase/route-handler"
        );
        const supabase = await createSupabaseForRouteHandler(request);

        // Upsert user
        const { data: dbUser } = await supabase
          .from("users")
          .upsert({ email: user.email, display_name: user.user_metadata?.full_name ?? null }, { onConflict: "email" })
          .select("id")
          .single();

        if (dbUser) {
          const { data: session } = await supabase
            .from("interview_sessions")
            .insert({
              user_id: dbUser.id,
              session_type: interviewStyle === "technical" ? "technical" : "behavioral",
              status: "completed",
              metadata: { role: jobRole },
              ended_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (session) {
            await supabase.from("scorecards").insert({
              session_id: session.id,
              user_id: dbUser.id,
              overall_score: Math.max(1, Math.min(100, feedback.overallScore ?? 50)),
              category_scores: feedback.categories ?? {},
              feedback: feedback.summary ?? "",
            });
          }
        }
      } catch (dbErr) {
        console.error("[db] Failed to persist interview results:", dbErr);
      }
    }

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

    return NextResponse.json({
      ...feedback,
      transcriptWasEmpty: Boolean(transcriptWasEmpty),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Results generation failed:", message);
    return NextResponse.json(
      { error: "Failed to generate results", detail: message },
      { status: 500 },
    );
  }
}
