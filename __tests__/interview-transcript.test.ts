import { describe, it, expect } from "vitest";
import { ensureTranscriptForResults } from "@/lib/interview-transcript";

describe("ensureTranscriptForResults", () => {
  it("returns entries unchanged when non-empty", () => {
    const entries = [
      { role: "user" as const, text: "Hi", timestamp: 1 },
    ];
    expect(ensureTranscriptForResults(entries)).toEqual(entries);
  });

  it("injects a coach placeholder when empty", () => {
    const out = ensureTranscriptForResults([]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("ai");
    expect(out[0].text).toMatch(/No dialogue transcript/i);
  });
});
