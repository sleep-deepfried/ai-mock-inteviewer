"use client";

import Image from "next/image";
import Link from "next/link";

interface LandingHeaderProps {
  showBeta: boolean;
  focusRing: string;
}

export function LandingHeader({ showBeta, focusRing }: LandingHeaderProps) {
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/20 backdrop-blur-2xl backdrop-saturate-150">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-4"
        aria-label="Main"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
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
          {appStoreUrl ? (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/10 sm:px-4 sm:text-sm ${focusRing}`}
            >
              App Store
            </a>
          ) : null}
          {playStoreUrl ? (
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/10 sm:px-4 sm:text-sm ${focusRing}`}
            >
              Google Play
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
