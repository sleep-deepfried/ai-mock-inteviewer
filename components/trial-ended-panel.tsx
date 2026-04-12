"use client";

import Link from "next/link";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

type TrialEndedPanelProps = {
  endReason: string | null;
};

export function TrialEndedPanel({ endReason }: TrialEndedPanelProps) {
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur-md"
      role="dialog"
      aria-labelledby="trial-ended-title"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-8 text-center shadow-xl">
        <h2
          id="trial-ended-title"
          className="text-xl font-semibold tracking-tight text-white"
        >
          Trial complete
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Your 30-second web preview is over. Download the Vocis app for full
          sessions, history, and scored feedback—no web account required on
          mobile beyond sign-in.
        </p>
        {endReason ? (
          <p className="mt-2 text-xs text-zinc-500">{endReason}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {appStoreUrl ? (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 ${focusRing}`}
            >
              App Store
            </a>
          ) : null}
          {playStoreUrl ? (
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 ${focusRing}`}
            >
              Google Play
            </a>
          ) : null}
        </div>
        {(!appStoreUrl || !playStoreUrl) && (
          <p className="mt-4 text-xs text-zinc-500">
            Store links are configured via environment variables for production.
          </p>
        )}
        <Link
          href="/"
          className={`mt-6 inline-flex text-sm font-medium text-violet-400 hover:text-violet-300 ${focusRing}`}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
