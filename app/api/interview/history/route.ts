import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return NextResponse.json({ sessions: [], stats: { total: 0, avgScore: 0 } });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Get user row from users table
  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!dbUser) {
    return NextResponse.json({ sessions: [], stats: { total: 0, avgScore: 0 } });
  }

  // Fetch recent sessions with scorecards
  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select(`
      id,
      session_type,
      status,
      metadata,
      started_at,
      ended_at,
      scorecards (
        overall_score,
        category_scores,
        feedback
      )
    `)
    .eq("user_id", dbUser.id)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(10);

  const completed = sessions ?? [];
  const scores = completed
    .map((s) => {
      const sc = Array.isArray(s.scorecards) ? s.scorecards[0] : s.scorecards;
      return sc?.overall_score ?? null;
    })
    .filter((s): s is number => s !== null);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return NextResponse.json({
    sessions: completed.map((s) => {
      const sc = Array.isArray(s.scorecards) ? s.scorecards[0] : s.scorecards;
      return {
        id: s.id,
        type: s.session_type,
        role: (s.metadata as Record<string, unknown>)?.role ?? s.session_type,
        score: sc?.overall_score ?? null,
        feedback: sc?.feedback ?? null,
        date: s.started_at,
      };
    }),
    stats: {
      total: completed.length,
      avgScore,
    },
  });
}
