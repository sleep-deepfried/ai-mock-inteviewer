"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { AIStateIndicator } from "@/components/ai-state-indicator";
import { useInterview } from "@/hooks/use-interview";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  const jobRole = searchParams.get("role") || "Unknown Role";

  const {
    status,
    aiState,
    timeRemaining,
    error,
    endReason,
    isMicOn,
    toggleMic,
    endSession,
    analyserNode,
    transcript,
    hintThinking,
    sendActivityStart,
    sendActivityEnd,
  } = useInterview(sessionId);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userSpeakingRef = useRef(false);
  const hasRedirected = useRef(false);
  const thinkHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect to results when interview ends
  useEffect(() => {
    if (status !== "ended" || hasRedirected.current) return;
    if (transcript.length === 0) return;
    hasRedirected.current = true;

    const duration = 15 * 60 - timeRemaining;
    sessionStorage.setItem(
      "interview-results-data",
      JSON.stringify({ transcript, jobRole, duration }),
    );
    router.push("/interview/results");
  }, [status, transcript, timeRemaining, jobRole, router]);

  // Detect user speaking via analyser node volume + send activity signals
  useEffect(() => {
    if (!analyserNode || !isMicOn || status !== "active") {
      userSpeakingRef.current = false;
      Promise.resolve().then(() => setUserSpeaking(false));
      return;
    }

    const dataArray = new Uint8Array(analyserNode.fftSize);
    let rafId: number;
    let activityActive = false;

    const check = () => {
      analyserNode.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const speaking = rms > 0.02;
      if (speaking !== userSpeakingRef.current) {
        userSpeakingRef.current = speaking;
        setUserSpeaking(speaking);

        if (speaking) {
          // User started speaking — send activityStart to Gemini
          if (!activityActive) {
            activityActive = true;
            sendActivityStart();
          }
          // Clear any pending end timer
          if (thinkHintTimerRef.current) {
            clearTimeout(thinkHintTimerRef.current);
            thinkHintTimerRef.current = null;
          }
        } else if (activityActive) {
          // User stopped speaking — debounce 500ms before sending activityEnd
          thinkHintTimerRef.current = setTimeout(() => {
            activityActive = false;
            sendActivityEnd();
            hintThinking();
          }, 500);
        }
      }
      rafId = requestAnimationFrame(check);
    };

    rafId = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(rafId);
      if (thinkHintTimerRef.current) {
        clearTimeout(thinkHintTimerRef.current);
        thinkHintTimerRef.current = null;
      }
      // Clean up: if activity was active, end it
      if (activityActive) {
        sendActivityEnd();
      }
    };
  }, [
    analyserNode,
    isMicOn,
    status,
    sendActivityStart,
    sendActivityEnd,
    hintThinking,
  ]);

  // Camera toggle
  useEffect(() => {
    if (!isCameraOn) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setIsCameraOn(false);
      });
  }, [isCameraOn]);

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="border-b border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {/* Countdown Timer */}
      <div className="absolute right-4 top-4 z-10 rounded-lg bg-slate-900/80 px-3 py-1.5 text-sm font-mono tabular-nums backdrop-blur">
        {formatTime(timeRemaining)}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Center: AI Avatar + State */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {/* AI Avatar */}
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
            {aiState === "speaking" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500 opacity-30" />
            )}
            <div
              className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-3xl font-bold shadow-lg shadow-purple-600/20 transition-shadow sm:h-32 sm:w-32 sm:text-4xl ${aiState === "speaking" ? "shadow-purple-500/40 shadow-xl" : ""}`}
            >
              AI
            </div>
          </div>

          <AIStateIndicator state={aiState} />

          {status === "connecting" && (
            <p className="text-sm text-gray-400">Connecting...</p>
          )}
        </div>
      </div>

      {/* Self-view PIP */}
      <div className="absolute bottom-20 right-2 z-10 overflow-hidden rounded-xl shadow-lg sm:right-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-24 w-32 bg-slate-900 object-cover sm:h-32 sm:w-44 ${!isCameraOn ? "hidden" : ""}`}
        />
      </div>

      {/* User speaking indicator */}
      {status === "active" && !isCameraOn && (
        <div className="absolute bottom-20 right-2 z-10 flex h-28 w-40 flex-col items-center justify-center rounded-lg bg-slate-800 shadow-lg sm:right-4 sm:h-36 sm:w-56">
          <div className="relative flex h-10 w-10 items-center justify-center">
            {userSpeaking && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
            )}
            <span
              className={`relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                userSpeaking
                  ? "bg-green-500 text-white"
                  : "bg-slate-600 text-gray-300"
              } transition-colors`}
            >
              You
            </span>
          </div>
          {!isMicOn && <span className="mt-1 text-xs text-red-400">Muted</span>}
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-slate-900/80 px-4 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-4">
        <button
          onClick={toggleMic}
          disabled={status !== "active"}
          className={`rounded-full p-3 transition ${
            isMicOn
              ? "bg-slate-700 text-white hover:bg-slate-600"
              : "bg-red-600 text-white hover:bg-red-500"
          } disabled:opacity-50`}
          aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicOn ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => setIsCameraOn((prev) => !prev)}
          className={`rounded-full p-3 transition ${
            isCameraOn
              ? "bg-slate-700 text-white hover:bg-slate-600"
              : "bg-red-600 text-white hover:bg-red-500"
          }`}
          aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={endSession}
          disabled={status !== "active"}
          className="rounded-full bg-red-600 p-3 text-white transition hover:bg-red-500 disabled:opacity-50"
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      {/* End-of-Session Overlay */}
      {status === "ended" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <h2 className="text-2xl font-bold">Interview Ended</h2>
          {endReason && <p className="mt-2 text-gray-400">{endReason}</p>}
          <a
            href="/dashboard"
            className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Back to Dashboard
          </a>
        </div>
      )}
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
