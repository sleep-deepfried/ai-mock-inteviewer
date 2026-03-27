"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Star } from "lucide-react";

export interface InterviewReviewPayload {
  rating: number;
  comment: string;
}

interface InterviewReviewModalProps {
  open: boolean;
  endReason: string | null;
  /** When true, we still generate results but feedback may be limited. */
  transcriptEmpty?: boolean;
  onContinue: (review: InterviewReviewPayload) => void;
}

export function InterviewReviewModal({
  open,
  endReason,
  transcriptEmpty = false,
  onContinue,
}: InterviewReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "interview-review-title";
  const ratingHintId = useId();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const id = window.requestAnimationFrame(() => {
      setRating(0);
      setHover(0);
      setComment("");
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  const display = hover || rating;
  const canContinue = rating >= 1;

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
          Rate your experience before we show your results—it only takes a
          moment and helps us improve.
        </p>
        {endReason && (
          <p className="mt-2 text-xs text-gray-500">{endReason}</p>
        )}
        {transcriptEmpty && (
          <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
            We did not capture a full transcript from this session. You can
            still continue—results will focus on general guidance and next
            steps.
          </p>
        )}

        <div className="mt-6">
          <p
            id={ratingHintId}
            className="mb-2 text-sm font-medium text-gray-300"
          >
            Overall experience{" "}
            <span className="font-normal text-amber-200/90">(required)</span>
          </p>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-labelledby={ratingHintId}
            aria-required="true"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                className="rounded p-1 text-amber-400 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
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
          {!canContinue ? (
            <p className="mt-2 text-xs text-gray-500">
              Select 1–5 stars to continue to your results.
            </p>
          ) : null}
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

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() =>
              onContinue({
                rating,
                comment: comment.trim(),
              })
            }
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to results
          </button>
        </div>
      </div>
    </div>
  );
}
