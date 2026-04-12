"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AudioPlayback } from "@/lib/audio-playback";
import { AudioCapture } from "@/lib/audio-capture";
import type { AIState } from "@/components/ai-state-indicator";
import { GEMINI_LIVE_MODEL } from "@/lib/gemini-live-model";
import {
  FunctionResponse,
  type LiveServerMessage,
  type Session,
} from "@google/genai";
import { END_INTERVIEW_FUNCTION_NAME } from "@/lib/interview-live-tools";

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
  userSpeaking: boolean;
  toggleMic: () => void;
  endSession: () => void;
  dismissError: () => void;
  transcript: TranscriptEntry[];
}

const DEFAULT_DURATION_SECONDS = 15 * 60;

const BOOTSTRAP_USER_TEXT =
  "Please begin the interview by introducing yourself and asking your first question.";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Base64-encode PCM bytes without blowing the stack on large chunks. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

export type UseInterviewOptions = {
  /** Session length in seconds (default 15 minutes). Web trial uses 30. */
  durationSeconds?: number;
  /** Anonymous web trial — forwarded to live-token for auth bypass. */
  trial?: boolean;
};

export function useInterview(
  sessionId: string | null,
  role?: string,
  style?: string,
  options?: UseInterviewOptions,
): UseInterviewReturn {
  const durationSeconds = options?.durationSeconds ?? DEFAULT_DURATION_SECONDS;
  const trial = options?.trial ?? false;

  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [aiState, setAiState] = useState<AIState>("idle");
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [error, setError] = useState<string | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const playbackRef = useRef<AudioPlayback | null>(null);
  const liveSessionRef = useRef<Session | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(sessionId);
  const inputTxDraftRef = useRef("");
  const outputTxDraftRef = useRef("");

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    setIsMicOn(false);
    setUserSpeaking(false);
  }, [sessionId]);

  useEffect(() => {
    setTimeRemaining(durationSeconds);
  }, [sessionId, durationSeconds]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const abortController = new AbortController();
    const sessionTimeoutMs = durationSeconds * 1000;

    const clearSessionTimeout = () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
    };

    const cleanupCore = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearSessionTimeout();
      captureRef.current?.stop();
      captureRef.current = null;
      playbackRef.current?.stop();
      playbackRef.current = null;
      try {
        liveSessionRef.current?.close();
      } catch {
        /* ignore */
      }
      liveSessionRef.current = null;
    };

    const endInterviewLocal = (reason: string) => {
      setStatus("ended");
      setEndReason(reason);
      void fetch("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      cleanupCore();
    };

    const pushTranscript = (entry: TranscriptEntry) => {
      transcriptRef.current = [...transcriptRef.current, entry];
      setTranscript(transcriptRef.current);
    };

    const flushTranscriptionDrafts = () => {
      const userText = inputTxDraftRef.current.trim();
      inputTxDraftRef.current = "";
      if (userText) {
        pushTranscript({
          role: "user",
          text: userText,
          timestamp: Date.now(),
        });
      }
      const aiText = outputTxDraftRef.current.trim();
      outputTxDraftRef.current = "";
      if (aiText) {
        pushTranscript({
          role: "ai",
          text: aiText,
          timestamp: Date.now(),
        });
      }
    };

    const handleServerMessage = async (msg: LiveServerMessage) => {
      if (cancelled) return;

      const functionCalls = msg.toolCall?.functionCalls;
      if (functionCalls?.length) {
        let shouldEnd = false;
        const session = liveSessionRef.current;
        for (const fc of functionCalls) {
          if (fc.name !== END_INTERVIEW_FUNCTION_NAME) continue;
          shouldEnd = true;
          if (session && fc.id && fc.name) {
            try {
              const functionResponse = new FunctionResponse();
              functionResponse.id = fc.id;
              functionResponse.name = fc.name;
              functionResponse.response = {
                output: { status: "interview_ended" },
              };
              session.sendToolResponse({ functionResponses: functionResponse });
            } catch {
              /* ignore */
            }
          }
        }
        if (shouldEnd) {
          flushTranscriptionDrafts();
          endInterviewLocal("Interview complete");
          return;
        }
      }

      const sc = msg.serverContent;
      if (!sc) return;

      if (sc.interrupted) {
        playbackRef.current?.stop();
        setAiState("listening");
      }

      if (sc.inputTranscription) {
        const t = sc.inputTranscription;
        if (typeof t.text === "string") {
          inputTxDraftRef.current = t.text;
        }
        if (t.finished) {
          const text = inputTxDraftRef.current.trim();
          inputTxDraftRef.current = "";
          if (text) {
            pushTranscript({
              role: "user",
              text,
              timestamp: Date.now(),
            });
          }
        }
      }

      if (sc.outputTranscription) {
        const t = sc.outputTranscription;
        if (typeof t.text === "string") {
          outputTxDraftRef.current = t.text;
        }
        if (t.finished) {
          const text = outputTxDraftRef.current.trim();
          outputTxDraftRef.current = "";
          if (text) {
            pushTranscript({
              role: "ai",
              text,
              timestamp: Date.now(),
            });
          }
        }
      }

      const parts = sc.modelTurn?.parts;
      if (parts?.length && playbackRef.current) {
        setAiState("speaking");
        for (const part of parts) {
          const data = part.inlineData?.data;
          if (typeof data === "string" && data.length > 0) {
            try {
              const pcm = base64ToArrayBuffer(data);
              await playbackRef.current.play(pcm);
            } catch {
              /* ignore bad chunk */
            }
          }
        }
      }

      if (sc.turnComplete) {
        setAiState("listening");
      }
    };

    const init = async () => {
      setStatus("connecting");
      setError(null);
      inputTxDraftRef.current = "";
      outputTxDraftRef.current = "";
      setTimeRemaining(durationSeconds);

      try {
        const tokenRes = await fetch("/api/interview/live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            role,
            style,
            ...(trial ? { trial: true } : {}),
          }),
          signal: abortController.signal,
        });
        if (!tokenRes.ok) {
          const data = (await tokenRes.json()) as { error?: string };
          throw new Error(data.error || "Failed to get live token");
        }
        const { token, model } = (await tokenRes.json()) as {
          token: string;
          model: string;
        };
        if (cancelled || abortController.signal.aborted) return;

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const playback = new AudioPlayback();
        playbackRef.current = playback;
        await playback.warmUp();
        if (cancelled || abortController.signal.aborted) return;

        const session = await ai.live.connect({
          model: model || GEMINI_LIVE_MODEL,
          callbacks: {
            onmessage: (e) => {
              void handleServerMessage(e);
            },
            onerror: (ev) => {
              const err = ev.error;
              const msg =
                err instanceof Error ? err.message : "Live connection error";
              setError(msg);
            },
            onclose: () => {
              if (!cancelled && sessionIdRef.current === sessionId) {
                setError((prev) => prev ?? "Live session closed");
              }
            },
          },
        });

        if (cancelled || abortController.signal.aborted) {
          session.close();
          return;
        }

        liveSessionRef.current = session;
        session.sendRealtimeInput({ text: BOOTSTRAP_USER_TEXT });

        setStatus("active");
        setAiState("listening");

        sessionTimeoutRef.current = setTimeout(() => {
          endInterviewLocal("Session time limit reached");
        }, sessionTimeoutMs);

        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              endInterviewLocal("Session time limit reached");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        if (cancelled || abortController.signal.aborted) return;
        cleanupCore();
        setError(
          err instanceof Error ? err.message : "Failed to start live session",
        );
        setStatus("idle");
      }
    };

    void init();

    return () => {
      cancelled = true;
      abortController.abort();
      cleanupCore();
    };
  }, [sessionId, durationSeconds, trial, role, style]);

  useEffect(() => {
    if (!isMicOn || status !== "active" || !sessionId) {
      setUserSpeaking(false);
      if (captureRef.current) {
        try {
          liveSessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
        } catch {
          /* ignore */
        }
        captureRef.current.stop();
        captureRef.current = null;
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const session = liveSessionRef.current;
    if (!session) return;

    let stopped = false;
    const capture = new AudioCapture();
    captureRef.current = capture;

    const pollVoice = () => {
      if (stopped) return;
      const analyser = capture.getAnalyserNode();
      if (analyser) {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const active = sum / buf.length > 8;
        setUserSpeaking(active);
      }
      rafRef.current = requestAnimationFrame(pollVoice);
    };

    capture
      .start()
      .then(() => {
        if (stopped) return;
        pollVoice();
        capture.onPcmChunk = (pcmBuffer) => {
          try {
            liveSessionRef.current?.sendRealtimeInput({
              audio: {
                data: arrayBufferToBase64(pcmBuffer),
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } catch {
            /* ignore */
          }
        };
      })
      .catch(() => {
        setError("Microphone permission denied or unavailable.");
        setIsMicOn(false);
      });

    return () => {
      stopped = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      try {
        liveSessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        /* ignore */
      }
      capture.stop();
      if (captureRef.current === capture) {
        captureRef.current = null;
      }
      setUserSpeaking(false);
    };
  }, [isMicOn, status, sessionId]);

  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  const endSession = useCallback(() => {
    setStatus("ended");
    setEndReason("Interview ended by user");
    setUserSpeaking(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    captureRef.current?.stop();
    captureRef.current = null;
    playbackRef.current?.stop();
    playbackRef.current = null;
    try {
      liveSessionRef.current?.close();
    } catch {
      /* ignore */
    }
    liveSessionRef.current = null;

    const sid = sessionIdRef.current;
    if (sid) {
      void fetch("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      });
    }
  }, []);

  return {
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
  };
}
