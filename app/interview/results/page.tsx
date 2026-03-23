"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import Link from "next/link";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

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
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

const RESULTS_STORAGE_KEY = "interview-results-data";
/** Prevents double POST in React Strict Mode (dev): second effect sees pending only. */
const RESULTS_PENDING_KEY = "interview-results-pending";

function ResultsContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thankYouReview, setThankYouReview] = useState<{
    rating: number;
    comment?: string;
  } | null>(null);

  useEffect(() => {
    let payload: string | null = sessionStorage.getItem(RESULTS_STORAGE_KEY);

    if (payload) {
      sessionStorage.removeItem(RESULTS_STORAGE_KEY);
      sessionStorage.setItem(RESULTS_PENDING_KEY, payload);
    } else if (sessionStorage.getItem(RESULTS_PENDING_KEY)) {
      // Another effect already claimed the payload (e.g. Strict Mode double-invoke).
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

    const { transcript, jobRole, duration, review } = JSON.parse(payload) as {
      transcript: unknown;
      jobRole: string;
      duration: number;
      review?: { rating: number; comment?: string };
    };

    if (review?.rating) {
      setThankYouReview({
        rating: review.rating,
        comment: review.comment,
      });
    }

    fetch("/api/interview/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, jobRole, duration, review }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to generate results");
        }
        return res.json();
      })
      .then((data) => {
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-gray-400">Analyzing your interview performance...</p>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400">{error || "No results available"}</p>
        <Link
          href="/"
          className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {thankYouReview && (
        <div
          className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-200"
          role="status"
        >
          Thanks for your {thankYouReview.rating}-star feedback
          {thankYouReview.comment
            ? " — we read every comment."
            : "."}
        </div>
      )}

      {/* Overall Score */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Interview Results</h1>
        <div className="mt-6 inline-flex h-28 w-28 items-center justify-center rounded-full border-4 border-purple-500 sm:h-32 sm:w-32">
          <span
            className={`text-4xl font-bold sm:text-5xl ${scoreColor(results.overallScore)}`}
          >
            {results.overallScore}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-400">Overall Score</p>
        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-300">
          {results.summary}
        </p>
      </div>

      {/* Category Scores */}
      <div className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold">Score Breakdown</h2>
        {results.categories.map((cat) => (
          <div
            key={cat.name}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{cat.name}</span>
              <span className={`text-lg font-bold ${scoreColor(cat.score)}`}>
                {cat.score}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${scoreBg(cat.score)} transition-all`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">{cat.feedback}</p>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">Key Strengths</span>
          </div>
          <ul className="space-y-2">
            {results.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-300">
                • {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-yellow-400">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-semibold">Areas to Improve</span>
          </div>
          <ul className="space-y-2">
            {results.improvements.map((s, i) => (
              <li key={i} className="text-sm text-gray-300">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/interview/setup"
          className="rounded-xl bg-purple-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Start New Interview
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/5"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <ResultsContent />
    </ProtectedRoute>
  );
}
