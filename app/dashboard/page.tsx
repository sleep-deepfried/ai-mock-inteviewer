"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/context/auth-context";
import { Plus, LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Welcome back</h1>
            {user?.email && (
              <p className="mt-1 text-sm text-gray-400">{user.email}</p>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="mt-12 flex flex-1 flex-col items-center justify-center">
          <Link
            href="/interview/setup"
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-purple-500/30 hover:bg-white/10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 shadow-lg shadow-purple-600/20">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <span className="text-lg font-semibold">Start New Interview</span>
            <span className="text-sm text-gray-400">
              Set up and begin a mock interview session
            </span>
          </Link>
        </div>
      </main>
    </ProtectedRoute>
  );
}
