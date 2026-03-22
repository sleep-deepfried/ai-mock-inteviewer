"use client";

import { useState, useCallback, type FormEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { isValidFile } from "@/lib/validate-file";
import { Upload, Loader2, X } from "lucide-react";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    const result = isValidFile(f);
    if (!result.valid) {
      setFileError(result.error ?? "Invalid file");
      setFile(null);
    } else {
      setFileError(null);
      setFile(f);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("role", role);
      if (description.trim()) formData.append("description", description);
      if (file) formData.append("resume", file);

      const res = await fetch("/api/interview/setup", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Setup failed");
      }

      const { sessionId } = await res.json();
      router.push(
        `/interview?sessionId=${sessionId}&role=${encodeURIComponent(role)}`,
      );
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Interview Setup</h1>
            <p className="mt-2 text-sm text-gray-400">
              Configure your mock interview session
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium">
                Job Role
              </label>
              <input
                id="role"
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Job Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium"
              >
                Job Description{" "}
                <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium">
                Resume <span className="text-gray-500">(Optional)</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  dragOver
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Upload className="mb-2 h-6 w-6 text-gray-500" />
                <p className="text-sm text-gray-400">
                  Drag & drop your resume here, or{" "}
                  <label
                    htmlFor="resume-input"
                    className="cursor-pointer text-purple-400 underline"
                  >
                    browse
                  </label>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF or DOCX, max 5MB
                </p>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>

              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFileError(null);
                    }}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {fileError && (
                <p className="mt-2 text-sm text-red-400">{fileError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!role.trim() || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Starting..." : "Start Interview"}
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
