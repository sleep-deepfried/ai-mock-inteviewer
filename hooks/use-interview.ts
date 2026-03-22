"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GeminiLiveClient } from "@/lib/gemini-live-client";
import { AudioCapture } from "@/lib/audio-capture";
import { AudioPlayback } from "@/lib/audio-playback";
import type { AIState } from "@/components/ai-state-indicator";

export type InterviewStatus = "idle" | "connecting" | "active" | "ended";

export interface TranscriptEntry {
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

export interface UseInterviewReturn {
  status: InterviewStatus;
  aiState: AIState;
  timeRemaining: number;
  error: string | null;
  endReason: string | null;
  isMicOn: boolean;
  toggleMic: () => void;
  endSession: () => void;
  analyserNode: AnalyserNode | null;
  transcript: TranscriptEntry[];
  hintThinking: () => void;
  sendActivityStart: () => void;
  sendActivityEnd: () => void;
}

const SESSION_DURATION = 15 * 60; // 15 minutes in seconds

export function useInterview(sessionId: string | null): UseInterviewReturn {
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [aiState, setAiState] = useState<AIState>("idle");
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
  const [error, setError] = useState<string | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenCacheRef = useRef<Map<string, string>>(new Map());
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start session
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const init = async () => {
      setStatus("connecting");
      setError(null);

      try {
        // Fetch ephemeral token (cache for StrictMode double-mount)
        let token = tokenCacheRef.current.get(sessionId);
        if (!token) {
          const tokenRes = await fetch("/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });

          if (!tokenRes.ok) {
            const data = await tokenRes.json();
            throw new Error(data.error || "Failed to get session token");
          }

          const tokenData = await tokenRes.json();
          token = tokenData.token as string;
          tokenCacheRef.current.set(sessionId, token);
        }
        if (cancelled) return;

        // Initialize Gemini Live Client
        const client = new GeminiLiveClient(token);
        clientRef.current = client;

        client.onAudio = (pcmData) => {
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          setAiState("speaking");
          playbackRef.current?.play(pcmData);
        };

        client.onTurnComplete = () => {
          setAiState("listening");
          // Start a timer: if no audio comes within 3s of user silence, show "thinking"
          if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
          thinkingTimerRef.current = setTimeout(() => {
            setAiState((prev) => prev === "listening" ? "thinking" : prev);
          }, 3000);
        };

        client.onInterrupted = () => {
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          playbackRef.current?.stop();
          setAiState("listening");
        };

        client.onError = (err) => {
          setError(err.message);
        };

        client.onSessionTimeout = () => {
          setStatus("ended");
          setEndReason("Session time limit reached");
          cleanup();
        };

        client.onInputTranscript = (text) => {
          const entry: TranscriptEntry = { role: "user", text, timestamp: Date.now() };
          transcriptRef.current = [...transcriptRef.current, entry];
          setTranscript(transcriptRef.current);
          // User finished speaking — Gemini is now processing
          setAiState("thinking");
        };

        client.onOutputTranscript = (text) => {
          const entry: TranscriptEntry = { role: "ai", text, timestamp: Date.now() };
          transcriptRef.current = [...transcriptRef.current, entry];
          setTranscript(transcriptRef.current);
        };

        await client.connect();
        if (cancelled) {
          client.disconnect();
          return;
        }

        // Initialize Audio Capture
        const capture = new AudioCapture();
        captureRef.current = capture;
        capture.onPcmChunk = (chunk) => {
          client.sendAudio(chunk);
        };
        await capture.start();
        setAnalyserNode(capture.getAnalyserNode());

        // Initialize Audio Playback
        playbackRef.current = new AudioPlayback();

        setStatus("active");
        setAiState("listening");

        // Start countdown timer
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              setStatus("ended");
              setEndReason("Session time limit reached");
              cleanup();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to start session"
          );
          setStatus("idle");
        }
      }
    };

    const cleanup = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      captureRef.current?.stop();
      captureRef.current = null;
      playbackRef.current?.stop();
      playbackRef.current = null;
      clientRef.current?.disconnect();
      clientRef.current = null;
      setAnalyserNode(null);
    };

    init();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [sessionId]);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      captureRef.current?.stop();
      setIsMicOn(false);
    } else {
      captureRef.current?.start().then(() => {
        setAnalyserNode(captureRef.current?.getAnalyserNode() ?? null);
      });
      setIsMicOn(true);
    }
  }, [isMicOn]);

  const endSession = useCallback(() => {
    setStatus("ended");
    setEndReason("Interview ended by user");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    captureRef.current?.stop();
    playbackRef.current?.stop();
    clientRef.current?.disconnect();
  }, []);

  // Optimistic "thinking" hint — called by the UI when user stops speaking locally
  const hintThinking = useCallback(() => {
    setAiState((prev) => (prev === "listening" ? "thinking" : prev));
  }, []);

  // Manual VAD: send activity signals to Gemini
  const sendActivityStart = useCallback(() => {
    clientRef.current?.sendActivityStart();
  }, []);

  const sendActivityEnd = useCallback(() => {
    clientRef.current?.sendActivityEnd();
  }, []);

  return {
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
  };
}
