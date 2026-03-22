// Feature: nextjs-gemini-live-migration, Property 5: Resume file validation rejects invalid files
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateResumeFile } from "@/app/api/interview/setup/route";

/**
 * **Validates: Requirements 3.2, 3.3**
 *
 * Property 5: For any file with a MIME type other than PDF/DOCX,
 * or with a size exceeding 5MB, the setup API should return HTTP 400.
 *
 * We test the extracted `validateResumeFile` helper directly.
 */

const VALID_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

describe("Property 5: Resume file validation rejects invalid files", () => {
  it("rejects any file with an invalid MIME type", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter((s) => !VALID_MIME_TYPES.includes(s)),
        fc.integer({ min: 1, max: MAX_FILE_SIZE }),
        (mimeType, size) => {
          const error = validateResumeFile(mimeType, size);
          expect(error).toBe("Only PDF and DOCX files are accepted");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any file exceeding 5MB regardless of MIME type", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_MIME_TYPES),
        fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 10 }),
        (mimeType, size) => {
          const error = validateResumeFile(mimeType, size);
          expect(error).toBe("File size must be under 5MB");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid PDF/DOCX files under 5MB", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_MIME_TYPES),
        fc.integer({ min: 1, max: MAX_FILE_SIZE }),
        (mimeType, size) => {
          const error = validateResumeFile(mimeType, size);
          expect(error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
