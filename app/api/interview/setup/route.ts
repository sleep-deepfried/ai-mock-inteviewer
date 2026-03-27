/**
 * Interview Setup API route.
 *
 * Accepts multipart form POST with role (required), description (optional),
 * and resume file (optional). Validates file type/size, parses resume,
 * stores context in session store, and returns a session ID.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseResume } from "@/lib/resume-parser";
import {
  sessionStore,
  type SessionEntry,
  type InterviewStyle,
} from "@/lib/session-store";
import { getAuthUser } from "@/lib/auth";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate a resume file's MIME type and size.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateResumeFile(
  mimeType: string,
  size: number
): string | null {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Only PDF and DOCX files are accepted";
  }
  if (size > MAX_FILE_SIZE) {
    return "File size must be under 5MB";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // Auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const role = formData.get("role");
    const description = formData.get("description");
    const resume = formData.get("resume");
    const interviewStyleRaw = formData.get("interviewStyle");

    let interviewStyle: InterviewStyle = "technical";
    if (
      typeof interviewStyleRaw === "string" &&
      (interviewStyleRaw === "behavioral" || interviewStyleRaw === "technical")
    ) {
      interviewStyle = interviewStyleRaw;
    }

    // Validate required field
    if (!role || typeof role !== "string" || !role.trim()) {
      return NextResponse.json(
        { error: "Job role is required" },
        { status: 400 }
      );
    }

    let resumeText = "";

    // File validation and resume parsing
    if (resume && resume instanceof File && resume.size > 0) {
      const validationError = validateResumeFile(resume.type, resume.size);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // Parse resume
      try {
        const arrayBuffer = await resume.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        resumeText = await parseResume(buffer, resume.type);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json(
          { error: `Failed to parse resume: ${message}` },
          { status: 422 }
        );
      }
    }

    // Store context and return session ID
    const sessionId = randomUUID();
    const entry: SessionEntry = {
      jobRole: role.trim(),
      jobDescription: typeof description === "string" ? description.trim() : "",
      resumeText,
      interviewStyle,
      createdAt: Date.now(),
      messages: [],
    };

    sessionStore.store(sessionId, entry);

    return NextResponse.json({ sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Setup route error:", message);
    return NextResponse.json(
      { error: "Internal server error", detail: message },
      { status: 500 }
    );
  }
}
