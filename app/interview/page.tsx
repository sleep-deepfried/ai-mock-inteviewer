"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { AIStateIndicator } from "@/components/ai-state-indicator";
import {
  InterviewReviewModal,
  type InterviewReviewPayload,
} from "@/components/interview-review-modal";
import { useInterview } from "@/hooks/use-interview";
import { ensureTranscriptForResults } from "@/lib/interview-transcript";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  const jobRole = searchParams.get("role") || "Interview";
  const interviewStyle = searchParams.get("style") || "technical";

  const {
    status,
    aiState,
    timeRemaining,
    error,
    endReason,
    isMicOn,
    userSpeaking,
    toggleMic,
    endSession,
    dismissError,
    transcript,
  } = useInterview(sessionId, jobRole, interviewStyle);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasRedirected = useRef(false);

  const showBeta =
    typeof process.env.NEXT_PUBLIC_APP_STAGE === "string" &&
    process.env.NEXT_PUBLIC_APP_STAGE.toLowerCase() === "beta";

  useEffect(() => {
    if (status !== "ended") return;
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (!cancelled) setShowReviewModal(true);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [status]);

  function goToResults(review: InterviewReviewPayload) {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    setShowReviewModal(false);
    const duration = 15 * 60 - timeRemaining;
    const hadTranscript = transcript.length > 0;
    const transcriptForApi = ensureTranscriptForResults(transcript);
    sessionStorage.setItem(
      "interview-results-data",
      JSON.stringify({
        transcript: transcriptForApi,
        jobRole,
        duration,
        transcriptWasEmpty: !hadTranscript,
        review: {
          rating: review.rating,
          ...(review.comment ? { comment: review.comment } : {}),
        },
      }),
    );
    router.push("/interview/results");
  }

  useEffect(() => {
    if (!isCameraOn) {
      const rid = window.requestAnimationFrame(() => setCameraError(null));
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      return () => window.cancelAnimationFrame(rid);
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      })
      .catch(() => {
        setIsCameraOn(false);
        setCameraError("Camera permission denied or unavailable.");
      });
  }, [isCameraOn]);

  const urgentTime = status === "active" && timeRemaining <= 120;
  const criticalTime = status === "active" && timeRemaining <= 60;

  if (!sessionId) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-xl shadow-black/20 backdrop-blur-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-400"
            aria-hidden
          >
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            No active session
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Start from the home page with your target role (and optional resume)
            so we can open a tailored session.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/#start-interview"
              className={`inline-flex items-center justify-center rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 ${focusRing}`}
            >
              Start an interview
            </Link>
            <Link
              href="/"
              className={`inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/5 ${focusRing}`}
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      id="interview-main"
      className="relative flex h-dvh flex-col overflow-hidden bg-slate-950 pb-[env(safe-area-inset-bottom)]"
    >
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/90 px-3 py-2 backdrop-blur-md sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/#start-interview"
            className={`inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white ${focusRing}`}
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-400">
              Mock interview
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {decodeURIComponent(jobRole)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showBeta && (
            <span className="hidden rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200 sm:inline">
              Beta
            </span>
          )}
          <div
            className={`rounded-xl border px-3 py-1.5 text-right tabular-nums backdrop-blur ${
              criticalTime
                ? "border-red-500/40 bg-red-500/10"
                : urgentTime
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-white/10 bg-slate-900/80"
            }`}
            role="timer"
            aria-live={urgentTime ? "polite" : "off"}
            aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Time left
            </p>
            <p
              className={`font-mono text-sm font-semibold sm:text-base ${
                criticalTime
                  ? "text-red-400"
                  : urgentTime
                    ? "text-amber-300"
                    : "text-white"
              }`}
            >
              {formatTime(timeRemaining)}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="relative z-20 flex items-start gap-3 border-b border-red-500/30 bg-red-950/50 px-4 py-3"
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
            aria-hidden
          />
          <p className="flex-1 text-sm text-red-100">{error}</p>
          <button
            type="button"
            onClick={dismissError}
            className={`shrink-0 rounded-lg p-1 text-red-300 transition hover:bg-red-500/20 hover:text-white ${focusRing}`}
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {cameraError && (
        <div
          role="status"
          className="relative z-20 border-b border-amber-500/25 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-200"
        >
          {cameraError}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
          <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
            {aiState === "speaking" && (
              <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-purple-500 opacity-25" />
            )}
            <div
              className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-800 text-3xl font-bold shadow-xl shadow-purple-900/40 transition-shadow motion-reduce:animate-none sm:h-36 sm:w-36 sm:text-4xl ${
                aiState === "speaking"
                  ? "ring-4 ring-purple-400/30 ring-offset-2 ring-offset-slate-950"
                  : ""
              }`}
              aria-hidden
            >
              AI
            </div>
          </div>

          <AIStateIndicator state={aiState} />

          {status === "connecting" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2
                className="h-8 w-8 motion-safe:animate-spin text-purple-400"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-white">
                  Preparing your session
                </p>
                <p className="mt-1 max-w-xs text-xs text-gray-500">
                  Connecting to the interviewer and audio. This usually takes a
                  few seconds.
                </p>
              </div>
            </div>
          )}

          {status === "active" && (
            <div className="max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xs font-medium text-purple-300">Quick tips</p>
              <ul className="mt-2 space-y-1 text-left text-xs text-gray-400">
                <li>
                  • <span className="text-gray-300">Unmute</span> when you are
                  ready to speak; audio streams to Gemini Live in real time (use
                  headphones to reduce echo).
                </li>
                <li>
                  • Use a recent{" "}
                  <span className="text-gray-300">Chrome or Edge</span> browser
                  for WebSocket audio.
                </li>
                <li>• Camera is optional—only for your own preview.</li>
              </ul>
            </div>
          )}
        </div>

        <div className="absolute bottom-24 right-2 z-10 sm:right-4 md:bottom-28">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-24 w-32 overflow-hidden rounded-xl border border-white/10 bg-slate-900 object-cover shadow-lg sm:h-32 sm:w-44 ${!isCameraOn ? "hidden" : ""}`}
          />
        </div>

        {status === "active" && !isCameraOn && (
          <div className="absolute bottom-24 right-2 z-10 flex h-28 w-40 flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-900/95 shadow-lg backdrop-blur sm:right-4 sm:h-36 sm:w-56">
            <div className="relative flex h-10 w-10 items-center justify-center">
              {userSpeaking && (
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-400/35" />
              )}
              <span
                className={`relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                  userSpeaking
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700 text-gray-300"
                } transition-colors`}
              >
                You
              </span>
            </div>
            {!isMicOn && (
              <span className="mt-2 text-xs font-medium text-red-400">
                Mic off
              </span>
            )}
            {isMicOn && (
              <span className="mt-2 text-[10px] text-gray-500">
                {userSpeaking ? "Listening…" : "Speak when ready"}
              </span>
            )}
          </div>
        )}
      </div>

      <nav
        className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-slate-950/95 px-3 py-3 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-4"
        aria-label="Call controls"
      >
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={toggleMic}
            disabled={status !== "active"}
            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
            className={`rounded-full p-3.5 transition ${
              isMicOn
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-red-600 text-white hover:bg-red-500"
            } disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            aria-pressed={isMicOn}
          >
            {isMicOn ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </button>
          <span className="text-[10px] font-medium text-gray-500">
            {isMicOn ? "Mic on" : "Mic off"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCameraOn((prev) => !prev)}
            title={isCameraOn ? "Turn camera off" : "Turn camera on"}
            className={`rounded-full p-3.5 transition ${
              isCameraOn
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "border border-white/15 bg-slate-800 text-gray-200 hover:bg-slate-700"
            } ${focusRing}`}
            aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            aria-pressed={isCameraOn}
          >
            {isCameraOn ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </button>
          <span className="text-[10px] font-medium text-gray-500">Camera</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={endSession}
            disabled={status !== "active"}
            title="End interview"
            className={`rounded-full bg-red-600 p-3.5 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            aria-label="End interview"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <span className="text-[10px] font-medium text-gray-500">End</span>
        </div>
      </nav>

      {status === "ended" && (
        <div
          className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm"
          aria-hidden
        />
      )}

      <InterviewReviewModal
        open={showReviewModal}
        endReason={endReason}
        transcriptEmpty={transcript.length === 0}
        onContinue={(payload) => goToResults(payload)}
      />
    </main>
  );
}

export default function InterviewPage() {
  return (
    <ProtectedRoute>
      <InterviewContent />
    </ProtectedRoute>
  );
}
