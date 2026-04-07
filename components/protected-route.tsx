"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface ProtectedRouteProps {
  children: ReactNode;
}

const AUTH_TIMEOUT_MS = 10_000;

/**
 * Wraps page content to enforce authentication.
 * Redirects to /login if the user is not authenticated.
 * Shows a loading indicator while auth state is being resolved.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const id = window.setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading && !timedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (timedOut && loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-slate-400">Taking longer than expected…</p>
        <button
          onClick={() => router.replace("/login")}
          className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
