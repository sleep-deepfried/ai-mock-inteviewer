"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useCyclingTypewriter,
  useReducedMotionPreference,
} from "@/components/landing/use-cycling-typewriter";
import { isValidFile } from "@/lib/validate-file";
import {
  ArrowUp,
  Code2,
  Loader2,
  MessageSquare,
  Plus,
  X,
} from "lucide-react";

type FocusMode = "behavioral" | "technical";

/** One-tap role suggestions; labels are sent as the interview role as-is. */
const SUGGESTED_ROLES = [
  "Senior Software Engineer",
  "Product Manager",
  "UX Designer",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Engineer",
  "Engineering Manager",
  "Solutions Architect",
] as const;

interface LandingHeroComposerProps {
  focusRing: string;
}

export function LandingHeroComposer({ focusRing }: LandingHeroComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [fieldFocused, setFieldFocused] = useState(false);
  const [focus, setFocus] = useState<FocusMode>("behavioral");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const placeholderActive =
    !prompt.trim() && !fieldFocused;
  const typewriterDisplay = useCyclingTypewriter(
    placeholderActive && !reducedMotion,
  );

  function onResumePicked(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const result = isValidFile(f);
    if (!result.valid) {
      setResumeError(result.error ?? "Invalid file");
      setResumeFile(null);
      return;
    }
    setResumeError(null);
    setResumeFile(f);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const trimmed = prompt.trim();

    if (!trimmed) {
      setSubmitError("Enter your target role above to start the interview.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("role", trimmed);
      formData.append("interviewStyle", focus);
      if (resumeFile) formData.append("resume", resumeFile);

      const res = await fetch("/api/interview/setup", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not start interview",
        );
      }

      const body = (await res.json()) as { sessionId?: string };
      if (!body.sessionId) {
        throw new Error("Invalid server response");
      }

      router.push(
        `/interview?sessionId=${encodeURIComponent(body.sessionId)}&role=${encodeURIComponent(trimmed)}`,
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-8 w-full rounded-[1.75rem] border border-white/10 bg-white/[0.03] text-left shadow-none sm:mt-10 sm:rounded-[2rem]"
      aria-label="Interview composer"
    >
      <label htmlFor="landing-hero-prompt" className="sr-only">
        Role or goal for your mock interview
      </label>
      <div className="relative">
        <textarea
          ref={promptRef}
          id="landing-hero-prompt"
          name="prompt"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setFieldFocused(true)}
          onBlur={() => setFieldFocused(false)}
          placeholder={
            reducedMotion
              ? "What role are you interviewing for?"
              : "\u00a0"
          }
          className="min-h-[9.5rem] w-full resize-none bg-transparent px-5 pb-3 pt-5 text-base leading-relaxed text-white outline-none placeholder:text-transparent sm:min-h-[11.5rem] sm:px-7 sm:pb-4 sm:pt-7 sm:text-lg"
        />
        {placeholderActive && !reducedMotion ? (
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 px-5 pt-5 text-base leading-relaxed text-zinc-500 sm:px-7 sm:pt-7 sm:text-lg"
            aria-hidden
          >
            {typewriterDisplay}
            <span
              className="motion-safe:animate-pulse ml-0.5 inline-block h-[1.15em] w-px translate-y-px bg-zinc-400 align-bottom"
              aria-hidden
            />
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10 px-5 pb-1 pt-3 sm:px-7 sm:pb-2 sm:pt-4">
        <p
          id="landing-role-suggestions-label"
          className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
        >
          Quick picks
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="landing-role-suggestions-label"
        >
          {SUGGESTED_ROLES.map((role) => {
            const selected = prompt.trim() === role;
            return (
              <button
                key={role}
                type="button"
                aria-pressed={selected}
                aria-label={`Use job role ${role}`}
                onClick={() => {
                  setSubmitError(null);
                  setPrompt(role);
                  window.requestAnimationFrame(() => {
                    promptRef.current?.focus();
                    const len = role.length;
                    promptRef.current?.setSelectionRange(len, len);
                  });
                }}
                className={`rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition sm:px-4 sm:py-2 sm:text-[0.9375rem] ${focusRing} ${
                  selected
                    ? "border-violet-400/45 bg-violet-500/15 text-white shadow-[0_0_20px_-8px_rgba(139,92,246,0.5)]"
                    : "border-white/12 bg-white/[0.04] text-zinc-300 motion-safe:hover:border-white/20 motion-safe:hover:bg-white/[0.08] motion-safe:hover:text-white"
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/10 px-4 pb-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:pb-5 sm:pt-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              id="landing-resume-input"
              type="file"
              accept=".pdf,.docx"
              className="sr-only"
              tabIndex={-1}
              onChange={onResumePicked}
            />
            <button
              type="button"
              title="Attach resume (PDF or DOCX, max 5 MB)"
              aria-label="Attach resume"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition motion-safe:hover:bg-white/10 motion-safe:hover:text-white sm:h-11 sm:w-11 ${focusRing}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </button>

            {resumeFile ? (
              <span className="flex max-w-[min(100%,18rem)] items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-300 sm:text-sm">
                <span className="truncate" title={resumeFile.name}>
                  {resumeFile.name}
                </span>
                <button
                  type="button"
                  aria-label="Remove attached resume"
                  className={`shrink-0 rounded p-0.5 text-zinc-500 motion-safe:hover:bg-white/10 motion-safe:hover:text-zinc-300 ${focusRing}`}
                  onClick={() => {
                    setResumeFile(null);
                    setResumeError(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            ) : null}
          </div>

          {resumeError ? (
            <p className="text-xs text-red-400 sm:text-sm" role="alert">
              {resumeError}
            </p>
          ) : null}
          {submitError ? (
            <p className="text-xs text-red-400 sm:text-sm" role="alert">
              {submitError}
            </p>
          ) : null}

          <div
            className="inline-flex rounded-full bg-zinc-800/90 p-1"
            role="group"
            aria-label="Interview focus"
          >
            <button
              type="button"
              aria-pressed={focus === "behavioral"}
              onClick={() => setFocus("behavioral")}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 sm:py-2.5 sm:text-base ${
                focus === "behavioral"
                  ? "bg-zinc-600/90 text-white"
                  : "text-zinc-400 motion-safe:hover:text-zinc-200"
              } ${focusRing}`}
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              Behavioral
            </button>
            <button
              type="button"
              aria-pressed={focus === "technical"}
              onClick={() => setFocus("technical")}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 sm:py-2.5 sm:text-base ${
                focus === "technical"
                  ? "bg-zinc-600/90 text-white"
                  : "text-zinc-400 motion-safe:hover:text-zinc-200"
              } ${focusRing}`}
            >
              <Code2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              Technical
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            aria-label={
              prompt.trim()
                ? "Start mock interview"
                : "Submit—add your target role first"
            }
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition motion-safe:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:w-12 ${focusRing}`}
          >
            {submitting ? (
              <Loader2
                className="h-5 w-5 motion-safe:animate-spin sm:h-5 sm:w-5"
                aria-hidden
              />
            ) : (
              <ArrowUp
                className="h-5 w-5 sm:h-5 sm:w-5"
                strokeWidth={2.5}
                aria-hidden
              />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
