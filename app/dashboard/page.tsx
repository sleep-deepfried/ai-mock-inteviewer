"use client";

import { useEffect, useState, useRef } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { LandingHeroComposer } from "@/components/landing/landing-hero-composer";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Clock,
  Timer,
  LogOut,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { StatSkeleton, InterviewListSkeleton } from "@/components/skeleton";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

/** Format a date as relative time (e.g., "2 days ago") */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "No interviews yet";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface SessionItem {
  id: string;
  type: string;
  role: string;
  score: number | null;
  feedback: string | null;
  date: string;
}

interface DashboardStats {
  total: number;
  topRole: string | null;
  totalPracticeMinutes: number;
  lastInterviewDate: string | null;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    topRole: null,
    totalPracticeMinutes: 0,
    lastInterviewDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if this is a fresh onboarding completion
    const justOnboarded = localStorage.getItem("vocis_just_onboarded");
    if (justOnboarded === "true") {
      setShowWelcome(true);
      localStorage.removeItem("vocis_just_onboarded");
    }
  }, []);

  useEffect(() => {
    fetch("/api/interview/history")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setStats(data.stats ?? { total: 0, avgScore: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.replace("/");
  };

  // Use saved display name from onboarding, or fall back to user metadata
  const savedName =
    typeof window !== "undefined"
      ? localStorage.getItem("vocis_display_name")
      : null;
  const savedRole =
    typeof window !== "undefined"
      ? localStorage.getItem("vocis_target_role")
      : null;
  const displayName =
    savedName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;

  return (
    <main className="relative flex min-h-dvh flex-col bg-[#050508] text-white">
      <div
        className="landing-stitch pointer-events-none absolute inset-0 z-0"
        aria-hidden
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/20 backdrop-blur-2xl backdrop-saturate-150">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
          aria-label="Dashboard"
        >
          <span className="text-base font-semibold tracking-tight text-white sm:text-lg">
            Vocis
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-white/10 ${focusRing}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="truncate text-sm font-medium text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {user?.email}
                  </p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleSignOut}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 ${focusRing}`}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Welcome banner for new users */}
        {showWelcome && (
          <div className="mb-8 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🎉 Welcome to Vocis!
                </h2>
                <p className="mt-1 text-sm text-purple-200/80">
                  You&apos;re all set. Start your first practice interview below
                  — pick a role, speak naturally, and get real feedback.
                </p>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className={`shrink-0 rounded-lg p-1 text-purple-300 transition hover:bg-purple-500/20 ${focusRing}`}
                aria-label="Dismiss welcome message"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Greeting */}
        <section className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-base text-zinc-400">
            Ready for another round of practice?
          </p>
        </section>

        {/* Stats */}
        <section
          className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-5"
          aria-label="Your stats"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Interviews
              </span>
            </div>
            <div className="mt-2">
              {loading ? (
                <StatSkeleton />
              ) : (
                <p className="text-3xl font-bold tabular-nums">{stats.total}</p>
              )}
            </div>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Briefcase className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Top Role
              </span>
            </div>
            <div className="mt-2">
              {loading ? (
                <StatSkeleton wide />
              ) : (
                <p className="text-lg font-bold">{stats.topRole ?? "—"}</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Timer className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Practice Time
              </span>
            </div>
            <div className="mt-2">
              {loading ? (
                <StatSkeleton />
              ) : (
                <p className="text-3xl font-bold tabular-nums">
                  {stats.totalPracticeMinutes > 0
                    ? `${stats.totalPracticeMinutes}m`
                    : "—"}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Last Interview
              </span>
            </div>
            <div className="mt-2">
              {loading ? (
                <StatSkeleton wide />
              ) : (
                <p className="text-lg font-bold">
                  {formatRelativeTime(stats.lastInterviewDate)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* New Interview Composer */}
        <section className="mb-12">
          <h2 className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Start a new interview
          </h2>
          <p className="mb-4 text-sm text-zinc-400">
            Pick your role, attach a resume if you like, and jump in.
          </p>
          <LandingHeroComposer
            focusRing={focusRing}
            defaultRole={savedRole ?? ""}
          />
        </section>

        {/* Recent Interviews */}
        <section aria-label="Recent interviews">
          <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
            Recent interviews
          </h2>
          {loading ? (
            <InterviewListSkeleton count={3} />
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
              <p className="text-sm text-zinc-500">
                No interviews yet. Start one above to see your history here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:bg-white/[0.05]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {typeof s.role === "string" ? s.role : s.type}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {new Date(s.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      <span className="capitalize">{s.type}</span>
                    </p>
                  </div>
                  {s.score !== null && s.score > 0 ? (
                    <span
                      className={`ml-4 shrink-0 text-lg font-bold tabular-nums ${
                        s.score >= 80
                          ? "text-emerald-400"
                          : s.score >= 60
                            ? "text-amber-400"
                            : "text-rose-400"
                      }`}
                    >
                      {s.score}
                    </span>
                  ) : (
                    <span className="ml-4 shrink-0 text-sm text-zinc-600">
                      —
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
