"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

interface ScoreCategory {
  name: string;
  score: number;
  feedback: string;
}

interface InterviewResults {
  overallScore: number;
  categories: ScoreCategory[];
  strengths: string[];
  improvements: string[];
  summary: string;
  transcriptWasEmpty?: boolean;
}

type ScoreBand = "strong" | "solid" | "developing";

function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "strong";
  if (score >= 60) return "solid";
  return "developing";
}

function bandTextClass(band: ScoreBand): string {
  if (band === "strong") return "text-emerald-400";
  if (band === "solid") return "text-amber-400";
  return "text-rose-400";
}

function bandBarClass(band: ScoreBand): string {
  if (band === "strong") return "bg-emerald-500";
  if (band === "solid") return "bg-amber-500";
  return "bg-rose-500";
}

function bandRingClass(band: ScoreBand): string {
  if (band === "strong")
    return "border-emerald-500/50 shadow-[0_0_40px_-8px_rgba(52,211,153,0.35)]";
  if (band === "solid")
    return "border-amber-500/50 shadow-[0_0_40px_-8px_rgba(251,191,36,0.25)]";
  return "border-rose-500/45 shadow-[0_0_40px_-8px_rgba(244,63,94,0.2)]";
}

const RESULTS_STORAGE_KEY = "interview-results-data";
const RESULTS_PENDING_KEY = "interview-results-pending";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function ResultsContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thankYouReview, setThankYouReview] = useState<{
    rating: number;
    comment?: string;
  } | null>(null);

  useEffect(() => {
    const payload: string | null = sessionStorage.getItem(RESULTS_STORAGE_KEY);

    if (payload) {
      sessionStorage.removeItem(RESULTS_STORAGE_KEY);
      sessionStorage.setItem(RESULTS_PENDING_KEY, payload);
    } else if (sessionStorage.getItem(RESULTS_PENDING_KEY)) {
      return;
    } else {
      Promise.resolve().then(() => {
        setError(
          "No interview data found. Please complete an interview first.",
        );
        setLoading(false);
      });
      return;
    }

    const parsed = JSON.parse(payload) as {
      transcript: unknown;
      jobRole: string;
      duration: number;
      review?: { rating: number; comment?: string };
      transcriptWasEmpty?: boolean;
    };

    setJobRole(typeof parsed.jobRole === "string" ? parsed.jobRole : "");

    if (parsed.review?.rating) {
      window.requestAnimationFrame(() => {
        setThankYouReview({
          rating: parsed.review!.rating,
          comment: parsed.review!.comment,
        });
      });
    }

    const { transcript, jobRole: role, duration, review, transcriptWasEmpty } =
      parsed;

    fetch("/api/interview/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        jobRole: role,
        duration,
        review,
        transcriptWasEmpty,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to generate results");
        }
        return res.json();
      })
      .then((data: InterviewResults) => {
        setResults(data);
        sessionStorage.removeItem(RESULTS_PENDING_KEY);
      })
      .catch((err) => {
        const pending = sessionStorage.getItem(RESULTS_PENDING_KEY);
        if (pending) {
          sessionStorage.removeItem(RESULTS_PENDING_KEY);
          sessionStorage.setItem(RESULTS_STORAGE_KEY, pending);
        }
        setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-950 via-slate-950 to-purple-950/30 px-4 pb-[env(safe-area-inset-bottom)] text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10">
          <Sparkles className="h-8 w-8 text-purple-400" aria-hidden />
        </div>
        <div className="max-w-sm text-center">
          <Loader2
            className="mx-auto h-8 w-8 animate-spin text-purple-400"
            aria-hidden
          />
          <p className="mt-4 text-sm font-medium text-white">
            Generating your feedback
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Analyzing your session. This usually takes under a minute.
          </p>
        </div>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-950 via-slate-950 to-purple-950/30 px-4 pb-[env(safe-area-inset-bottom)] text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <AlertCircle className="h-7 w-7" aria-hidden />
        </div>
        <p className="max-w-md text-center text-sm text-red-200/95">
          {error || "No results available"}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/#start-interview"
            className={`rounded-xl bg-purple-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-500 ${focusRing}`}
          >
            New interview
          </Link>
          <Link
            href="/"
            className={`rounded-xl border border-white/15 px-6 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/5 ${focusRing}`}
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  const limited = results.transcriptWasEmpty === true;
  const roleLabel =
    jobRole && jobRole !== "Interview"
      ? decodeURIComponent(jobRole)
      : "Your session";
  const overallBand = scoreBand(results.overallScore);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-950 to-purple-950/25 pb-[env(safe-area-inset-bottom)] text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className={`group mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white ${focusRing} rounded-lg`}
        >
          <ArrowLeft
            className="h-4 w-4 transition group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to home
        </Link>

        {thankYouReview ? (
          <div
            className="mb-8 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3.5 text-sm text-purple-100"
            role="status"
          >
            Thanks for your {thankYouReview.rating}-star feedback
            {thankYouReview.comment ? " — we read every comment." : "."}
          </div>
        ) : null}

        {limited ? (
          <LimitedResultsBody
            results={results}
            roleLabel={roleLabel}
            focusRing={focusRing}
          />
        ) : (
          <FullResultsBody
            results={results}
            roleLabel={roleLabel}
            overallBand={overallBand}
            focusRing={focusRing}
          />
        )}
      </div>
    </main>
  );
}

function LimitedResultsBody({
  results,
  roleLabel,
  focusRing,
}: {
  results: InterviewResults;
  roleLabel: string;
  focusRing: string;
}) {
  return (
    <>
      <header className="mb-8 text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
          Quick note
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          We didn&apos;t capture your side as text
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          You were set up for{" "}
          <span className="font-medium text-slate-300">{roleLabel}</span>, but
          nothing from your microphone made it into a transcript we can score.
          That is why this page skips numbers and focuses on what to try next—not
          because you did anything wrong.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          <span className="font-medium text-slate-300">Next try:</span> allow
          the mic when the browser asks, let the interviewer finish speaking,
          then answer out loud. A steady connection helps the session stay in
          sync.
        </p>
      </header>

      <section
        className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7"
        aria-labelledby="coach-notes-heading"
      >
        <div className="mb-4 flex items-center gap-2 text-slate-300">
          <ClipboardList className="h-5 w-5 text-purple-400" aria-hidden />
          <h2
            id="coach-notes-heading"
            className="text-base font-semibold text-white"
          >
            A word from your coach
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          {results.summary}
        </p>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold">Something to feel good about</span>
          </div>
          <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
            {results.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/80" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-5">
          <div className="mb-3 flex items-center gap-2 text-violet-300">
            <TrendingDown className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold">For your next run</span>
          </div>
          <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
            {results.improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ResultsFooter focusRing={focusRing} />
    </>
  );
}

function FullResultsBody({
  results,
  roleLabel,
  overallBand,
  focusRing,
}: {
  results: InterviewResults;
  roleLabel: string;
  overallBand: ScoreBand;
  focusRing: string;
}) {
  return (
    <>
      <header className="mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-400/90">
          {roleLabel}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Interview results
        </h1>
      </header>

      <section
        className="mb-10 flex flex-col items-center text-center"
        aria-labelledby="overall-score-label"
      >
        <div
          className={`relative flex h-36 w-36 items-center justify-center rounded-full border-4 bg-slate-950/80 sm:h-40 sm:w-40 ${bandRingClass(overallBand)}`}
        >
          <div className="flex flex-col items-center">
            <span
              className={`text-5xl font-bold tabular-nums sm:text-6xl ${bandTextClass(overallBand)}`}
            >
              {results.overallScore}
            </span>
            <span
              id="overall-score-label"
              className="mt-0.5 text-xs font-medium text-slate-500"
            >
              out of 100
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400">Overall score</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
          {results.summary}
        </p>
      </section>

      <section className="mb-10" aria-labelledby="breakdown-heading">
        <h2
          id="breakdown-heading"
          className="mb-4 text-lg font-semibold text-white"
        >
          Score breakdown
        </h2>
        <ul className="space-y-3">
          {results.categories.map((cat) => {
            const band = scoreBand(cat.score);
            return (
              <li
                key={cat.name}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-slate-200">
                    {cat.name}
                  </span>
                  <span
                    className={`shrink-0 text-lg font-bold tabular-nums ${bandTextClass(band)}`}
                  >
                    {cat.score}
                  </span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/80"
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full ${bandBarClass(band)} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {cat.feedback}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold">Key strengths</span>
          </div>
          <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
            {results.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/80" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-400">
            <TrendingDown className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold">Areas to improve</span>
          </div>
          <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
            {results.improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/80" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ResultsFooter focusRing={focusRing} />
    </>
  );
}

function ResultsFooter({ focusRing }: { focusRing: string }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:justify-center">
      <Link
        href="/#start-interview"
        className={`rounded-xl bg-purple-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-500 ${focusRing}`}
      >
        Start new interview
      </Link>
      <Link
        href="/"
        className={`rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/5 ${focusRing}`}
      >
        Back to home
      </Link>
    </footer>
  );
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <ResultsContent />
    </ProtectedRoute>
  );
}
