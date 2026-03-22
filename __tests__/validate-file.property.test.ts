// Feature: nextjs-gemini-live-migration, Property 8: Client-side file validation
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidFile } from "@/lib/validate-file";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function makeFile(name: string, size: number): File {
  // Create a File-like object with the given name and size
  const content = new Uint8Array(size);
  return new File([content], name, { type: "application/octet-stream" });
}

describe("Client-side file validation property tests", () => {
  // Feature: nextjs-gemini-live-migration, Property 8: Client-side file validation
  // **Validates: Requirements 12.3**
  it("Property 8: accepts only .pdf or .docx files under 5MB, rejects all others", () => {
    // Arbitrary for valid extensions
    const validExtArb = fc.constantFrom(".pdf", ".docx");
    // Arbitrary for invalid extensions
    const invalidExtArb = fc
      .string({ minLength: 1, maxLength: 10 })
      .filter((s) => !s.endsWith(".pdf") && !s.endsWith(".docx"))
      .map((s) => "." + s.replace(/\./g, ""));
    // Arbitrary for base file name
    const baseNameArb = fc.string({ minLength: 1, maxLength: 20 }).map((s) =>
      s.replace(/[.\\/]/g, "a")
    );

    fc.assert(
      fc.property(
        baseNameArb,
        fc.oneof(validExtArb, invalidExtArb),
        // Size: 0 to 6MB
        fc.integer({ min: 0, max: 6 * 1024 * 1024 }),
        (baseName, ext, size) => {
          const fileName = baseName + ext;
          const file = makeFile(fileName, size);
          const result = isValidFile(file);

          const hasValidExt =
            fileName.toLowerCase().endsWith(".pdf") ||
            fileName.toLowerCase().endsWith(".docx");
          const isUnderSizeLimit = size < MAX_FILE_SIZE;

          if (hasValidExt && isUnderSizeLimit) {
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          } else {
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
