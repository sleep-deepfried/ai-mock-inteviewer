export interface InterviewTranscriptEntry {
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

/**
 * Ensures POST /api/interview/results always receives a non-empty transcript.
 * Live sessions may end before any caption events were finalized.
 */
export function ensureTranscriptForResults(
  entries: InterviewTranscriptEntry[],
): InterviewTranscriptEntry[] {
  if (entries.length > 0) {
    return entries;
  }
  return [
    {
      role: "ai",
      text: "No dialogue transcript was captured for this session (mic, connection, or session ended before audio was saved).",
      timestamp: Date.now(),
    },
  ];
}
