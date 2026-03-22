// Feature: nextjs-gemini-live-migration, Property 9: PCM-to-Float32 audio conversion round-trip
// Feature: nextjs-gemini-live-migration, Property 10: Audio playback gapless scheduling
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  pcmToFloat32,
  float32ToPcm16,
  computeNextStartTime,
} from "@/lib/audio-playback";

describe("Audio Playback property tests", () => {
  // Feature: nextjs-gemini-live-migration, Property 9: PCM-to-Float32 audio conversion round-trip
  // **Validates: Requirements 9.2**
  it("Property 9: round-trip — Int16 PCM → Float32 → Int16 PCM produces original samples", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -32768, max: 32767 }), {
          minLength: 1,
          maxLength: 1000,
        }),
        (int16Samples) => {
          // Build a PCM ArrayBuffer from the Int16 samples
          const pcmBuffer = new ArrayBuffer(int16Samples.length * 2);
          const view = new DataView(pcmBuffer);
          for (let i = 0; i < int16Samples.length; i++) {
            view.setInt16(i * 2, int16Samples[i], true);
          }

          // Convert to Float32 and back
          const float32 = pcmToFloat32(pcmBuffer);
          const roundTripped = float32ToPcm16(float32);

          // Verify round-trip produces original samples
          const resultView = new DataView(roundTripped);
          expect(roundTripped.byteLength).toBe(pcmBuffer.byteLength);
          for (let i = 0; i < int16Samples.length; i++) {
            expect(resultView.getInt16(i * 2, true)).toBe(int16Samples[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: nextjs-gemini-live-migration, Property 10: Audio playback gapless scheduling
  // **Validates: Requirements 9.3**
  it("Property 10: gapless scheduling — start times form a contiguous sequence with no gaps or overlaps", () => {
    fc.assert(
      fc.property(
        // Sequence of buffer durations (in seconds), positive values
        fc.array(
          fc.float({ min: Math.fround(0.001), max: Math.fround(2.0), noNaN: true }),
          { minLength: 2, maxLength: 50 }
        ),
        // Initial context currentTime
        fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
        (durations, contextCurrentTime) => {
          let nextStartTime = 0;
          const scheduledTimes: { start: number; end: number }[] = [];

          for (const duration of durations) {
            const result = computeNextStartTime(
              nextStartTime,
              contextCurrentTime,
              duration
            );
            scheduledTimes.push({
              start: result.scheduleTime,
              end: result.newNextStartTime,
            });
            nextStartTime = result.newNextStartTime;
          }

          // Verify contiguous scheduling: each buffer starts where the previous one ends
          for (let i = 1; i < scheduledTimes.length; i++) {
            const prev = scheduledTimes[i - 1];
            const curr = scheduledTimes[i];
            // The start of the current buffer should equal the end of the previous buffer
            expect(curr.start).toBeCloseTo(prev.end, 10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
