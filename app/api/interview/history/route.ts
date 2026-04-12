import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return NextResponse.json({ sessions: [], stats: { total: 0, topRole: null, totalPracticeMinutes: 0, lastInterviewDate: null } });
  }

  const { createSupabaseForRouteHandler } = await import("@/lib/supabase/route-handler");
  const supabase = await createSupabaseForRouteHandler(request);

  // Get user row from users table
  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .single();

  if (userError) {
    console.error("History API - user lookup error:", userError.message, "for email:", user.email);
  }

  if (!dbUser) {
    console.log("History API - no dbUser found for email:", user.email);
    return NextResponse.json({ sessions: [], stats: { total: 0, topRole: null, totalPracticeMinutes: 0, lastInterviewDate: null } });
  }

  // Fetch recent sessions with scorecards
  const { data: sessions, error: sessionsError } = await supabase
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

  if (sessionsError) {
    console.error("History API - sessions query error:", sessionsError.message);
  }

  const completed = sessions ?? [];

  // Last interview date
  const lastInterviewDate = completed.length > 0 ? completed[0].started_at : null;

  // Calculate total practice time in minutes
  const totalPracticeMinutes = completed.reduce((total, s) => {
    if (s.started_at && s.ended_at) {
      const start = new Date(s.started_at).getTime();
      const end = new Date(s.ended_at).getTime();
      const durationMs = end - start;
      // Only count positive durations (filter out bad data)
      if (durationMs > 0) {
        return total + Math.round(durationMs / 60000);
      }
    }
    return total;
  }, 0);

  // Find most practiced role
  const roleCounts: Record<string, number> = {};
  completed.forEach((s) => {
    const role = (s.metadata as Record<string, unknown>)?.role as string;
    if (role) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  });
  const topRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

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
      topRole,
      totalPracticeMinutes,
      lastInterviewDate,
    },
  });
}
