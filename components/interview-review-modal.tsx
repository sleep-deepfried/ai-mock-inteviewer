"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

export interface InterviewReviewPayload {
  rating: number;
  comment: string;
}

interface InterviewReviewModalProps {
  open: boolean;
  endReason: string | null;
  onSkip: () => void;
  onContinue: (review: InterviewReviewPayload | null) => void;
}

export function InterviewReviewModal({
  open,
  endReason,
  onSkip,
  onContinue,
}: InterviewReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "interview-review-title";

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) return;
    setRating(0);
    setHover(0);
    setComment("");
  }, [open]);

  if (!open) return null;

  const display = hover || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40"
      >
        <h2 id={titleId} className="text-xl font-bold">
          How was your interview?
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Quick feedback helps us improve your experience. Optional—you can
          skip and go straight to your results.
        </p>
        {endReason && (
          <p className="mt-2 text-xs text-gray-500">{endReason}</p>
        )}

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-gray-300">
            Overall experience
          </p>
          <div
            className="flex gap-1"
            role="group"
            aria-label="Rate from 1 to 5 stars"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                className="rounded p-1 text-amber-400 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={rating === value}
              >
                <Star
                  className={`h-8 w-8 stroke-1 ${
                    value <= display
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <label htmlFor="review-comment" className="mt-6 block">
          <span className="text-sm font-medium text-gray-300">
            Comments (optional)
          </span>
          <textarea
            id="review-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What stood out? Anything we should know?"
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() =>
              onContinue(
                rating > 0
                  ? { rating, comment: comment.trim() }
                  : null,
              )
            }
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Continue to results
          </button>
        </div>
      </div>
    </div>
  );
}
