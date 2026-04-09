"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ChevronDown, LogOut } from "lucide-react";

interface LandingHeaderProps {
  showBeta: boolean;
  focusRing: string;
}

export function LandingHeader({ showBeta, focusRing }: LandingHeaderProps) {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;

  const isSignedIn = !loading && user;

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/20 backdrop-blur-2xl backdrop-saturate-150">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-4"
        aria-label="Main"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
          <Link
            href="/"
            className="truncate text-base font-semibold tracking-tight text-white sm:text-lg"
          >
            Vocis
          </Link>
          {showBeta && (
            <span className="shrink-0 rounded-full border border-white/70 bg-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              Beta
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : isSignedIn ? (
            <>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-1 rounded-full p-1 pr-2 transition hover:bg-white/10 ${focusRing}`}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                      {initials || "?"}
                    </div>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="truncate text-sm font-medium text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 ${focusRing}`}
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await signOut();
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 ${focusRing}`}
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition motion-safe:hover:text-white ${focusRing}`}
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
