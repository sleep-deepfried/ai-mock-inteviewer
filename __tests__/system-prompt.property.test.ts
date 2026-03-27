// Feature: nextjs-gemini-live-migration, Property 7: System prompt contains persona and context
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  buildSystemInstruction,
  LEAD_INTERVIEWER_PERSONA,
} from "@/lib/system-prompt";

describe("System prompt property tests", () => {
  // Feature: nextjs-gemini-live-migration, Property 7: System prompt contains persona and context
  // **Validates: Requirements 5.1, 5.4**
  it("Property 7: output contains Alex Chen persona, job role, and resume text for any non-empty context", () => {
    fc.assert(
      fc.property(
        fc.record({
          jobRole: fc.string({ minLength: 1 }),
          jobDescription: fc.string(),
          resumeText: fc.string({ minLength: 1 }),
          interviewStyle: fc.constantFrom("behavioral", "technical"),
        }),
        (context) => {
          const result = buildSystemInstruction(context);

          // Must contain the full persona text
          expect(result).toContain(LEAD_INTERVIEWER_PERSONA);

          // Must contain "Alex Chen"
          expect(result).toContain("Alex Chen");

          // Must contain the job role
          expect(result).toContain(context.jobRole);

          // Must contain the resume text
          expect(result).toContain(context.resumeText);

          if (context.interviewStyle === "behavioral") {
            expect(result).toContain("BEHAVIORAL");
          } else {
            expect(result).toContain("TECHNICAL");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
