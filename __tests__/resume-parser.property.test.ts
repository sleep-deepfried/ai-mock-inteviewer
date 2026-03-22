import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parseResume } from "@/lib/resume-parser";

describe("Resume parser property tests", () => {
  // Feature: nextjs-gemini-live-migration, Property 6: Resume parser handles corrupt input gracefully
  // **Validates: Requirements 4.4**
  it("Property 6: corrupt input — random bytes as PDF/DOCX throw descriptive Error, never unhandled", () => {
    fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1, maxLength: 1024 }),
        fc.constantFrom(
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        async (bytes, mimeType) => {
          try {
            await parseResume(Buffer.from(bytes), mimeType);
            // If it succeeds (unlikely but possible for valid-looking bytes), that's fine
          } catch (err) {
            // Must be a proper Error with a descriptive message, not an unhandled exception
            expect(err).toBeInstanceOf(Error);
            expect((err as Error).message).toBeTruthy();
            expect((err as Error).message.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
