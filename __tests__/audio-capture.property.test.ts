// Feature: nextjs-gemini-live-migration, Property 11: PCM downsampling output format
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { downsampleToPcm16 } from "@/lib/audio-worklet-processor";

describe("PCM downsampling property tests", () => {
  // Feature: nextjs-gemini-live-migration, Property 11: PCM downsampling output format
  // **Validates: Requirements 8.2**
  it("Property 11: output length in samples equals floor(inputLength * 16000 / sourceSampleRate) and every two bytes form a valid Int16", () => {
    fc.assert(
      fc.property(
        // Generate Float32 audio samples in [-1, 1]
        fc.array(fc.float({ min: -1, max: 1, noNaN: true }), {
          minLength: 1,
          maxLength: 4800,
        }),
        // Source sample rate between 16kHz and 96kHz
        fc.integer({ min: 16000, max: 96000 }),
        (samples, sourceSampleRate) => {
          const input = new Float32Array(samples);
          const result = downsampleToPcm16(input, sourceSampleRate);

          const expectedSamples = Math.floor(
            input.length * 16000 / sourceSampleRate
          );

          // Output byte length should be exactly 2 * expectedSamples
          expect(result.byteLength).toBe(expectedSamples * 2);

          // Every two bytes should form a valid little-endian Int16 in [-32768, 32767]
          const view = new DataView(result);
          for (let i = 0; i < expectedSamples; i++) {
            const value = view.getInt16(i * 2, true);
            expect(value).toBeGreaterThanOrEqual(-32768);
            expect(value).toBeLessThanOrEqual(32767);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
