import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { appendInterviewReviewRow } from "@/lib/sheets";
import { scoreInterview } from "@/lib/interview-scoring";

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

    const scored = await scoreInterview({
      transcript,
      jobRole,
      duration,
      transcriptWasEmpty,
    });

    if (!scored.ok) {
      const payload: Record<string, string> = { error: scored.error };
      if (scored.detail) payload.detail = scored.detail;
      return NextResponse.json(payload, { status: scored.status });
    }

    const feedback = scored.feedback;

    // Persist session + scorecard to Supabase (best-effort, don't block response)
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true") {
      try {
        const { createSupabaseForRouteHandler } = await import(
          "@/lib/supabase/route-handler"
        );
        const supabase = await createSupabaseForRouteHandler(request);

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
              overall_score: Math.max(1, Math.min(100, (feedback.overallScore as number) ?? 50)),
              category_scores: (feedback.categories as object) ?? {},
              feedback: (feedback.summary as string) ?? "",
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
      transcriptWasEmpty: scored.transcriptWasEmpty,
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
