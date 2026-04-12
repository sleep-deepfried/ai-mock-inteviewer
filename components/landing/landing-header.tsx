"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Apple } from "lucide-react";

interface LandingHeaderProps {
  showBeta: boolean;
  focusRing: string;
}

export function LandingHeader({ showBeta, focusRing }: LandingHeaderProps) {
  const appStoreUrl =
    process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "coming-soon";
  const playStoreUrl =
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || "coming-soon";

  // Check if URLs are valid (not placeholder values like "coming-soon")
  const isValidUrl = (url: string | undefined): url is string =>
    !!url && url.startsWith("http");
  const appStoreReady = isValidUrl(appStoreUrl);
  const playStoreReady = isValidUrl(playStoreUrl);

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/20 backdrop-blur-2xl backdrop-saturate-150">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-4"
        aria-label="Main"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Image
              src="/vocis-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
              priority
            />
            <span className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
              Vocis
            </span>
          </Link>
          {showBeta && (
            <span className="shrink-0 rounded-full border border-white/70 bg-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              Beta
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-2">
          {appStoreReady ? (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black px-3 py-1.5 transition hover:bg-zinc-900 ${focusRing}`}
            >
              <Apple className="h-5 w-5 text-white" aria-hidden />
              <div className="flex flex-col items-start">
                <span className="text-[8px] uppercase leading-tight tracking-wide text-zinc-300">
                  Download on the
                </span>
                <span className="text-xs font-semibold leading-tight text-white">
                  App Store
                </span>
              </div>
            </a>
          ) : appStoreUrl ? (
            <span className="inline-flex cursor-default items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-1.5">
              <Apple className="h-5 w-5 text-white" aria-hidden />
              <div className="flex flex-col items-start">
                <span className="text-[8px] uppercase leading-tight tracking-wide text-zinc-400">
                  Coming soon to
                </span>
                <span className="text-xs font-semibold leading-tight text-white">
                  App Store
                </span>
              </div>
            </span>
          ) : null}
          {playStoreReady ? (
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black px-3 py-1.5 transition hover:bg-zinc-900 ${focusRing}`}
            >
              <Play className="h-5 w-5 fill-current text-white" aria-hidden />
              <div className="flex flex-col items-start">
                <span className="text-[8px] uppercase leading-tight tracking-wide text-zinc-300">
                  Get it on
                </span>
                <span className="text-xs font-semibold leading-tight text-white">
                  Google Play
                </span>
              </div>
            </a>
          ) : playStoreUrl ? (
            <span className="inline-flex cursor-default items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-1.5">
              <Play className="h-5 w-5 fill-current text-white" aria-hidden />
              <div className="flex flex-col items-start">
                <span className="text-[8px] uppercase leading-tight tracking-wide text-zinc-400">
                  Coming soon to
                </span>
                <span className="text-xs font-semibold leading-tight text-white">
                  Google Play
                </span>
              </div>
            </span>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
