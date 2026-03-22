import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { SessionStore } from "@/lib/session-store";

// Arbitrary for generating valid session entries
const sessionEntryArb = fc.record({
  jobRole: fc.string({ minLength: 1 }),
  jobDescription: fc.string(),
  resumeText: fc.string(),
  createdAt: fc.constant(Date.now()),
});

const sessionIdArb = fc.uuid();

describe("SessionStore property tests", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: Date.now() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Feature: nextjs-gemini-live-migration, Property 1: Session store round-trip
  // **Validates: Requirements 3.5, 14.1, 14.2**
  it("Property 1: round-trip — store then get returns equivalent context", () => {
    fc.assert(
      fc.property(sessionIdArb, sessionEntryArb, (id, entry) => {
        const freshStore = new SessionStore();
        freshStore.store(id, entry);
        const retrieved = freshStore.get(id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.jobRole).toBe(entry.jobRole);
        expect(retrieved!.jobDescription).toBe(entry.jobDescription);
        expect(retrieved!.resumeText).toBe(entry.resumeText);
        expect(retrieved!.createdAt).toBe(entry.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: nextjs-gemini-live-migration, Property 2: Session store delete after retrieval
  // **Validates: Requirements 14.2**
  it("Property 2: delete — get returns entry, delete removes it, second get returns null", () => {
    fc.assert(
      fc.property(sessionIdArb, sessionEntryArb, (id, entry) => {
        const freshStore = new SessionStore();
        freshStore.store(id, entry);
        const first = freshStore.get(id);
        expect(first).not.toBeNull();
        freshStore.delete(id);
        const second = freshStore.get(id);
        expect(second).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: nextjs-gemini-live-migration, Property 3: Session store TTL enforcement
  // **Validates: Requirements 14.1, 14.3, 14.4**
  it("Property 3: TTL — get returns null for entries older than 30 minutes", () => {
    fc.assert(
      fc.property(
        sessionIdArb,
        sessionEntryArb,
        fc.integer({ min: 1, max: 60 }),
        (id, entry, extraMinutes) => {
          const freshStore = new SessionStore();
          freshStore.store(id, entry);
          // Advance time past 30 minutes
          vi.advanceTimersByTime((30 + extraMinutes) * 60 * 1000);
          const result = freshStore.get(id);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: nextjs-gemini-live-migration, Property 4: Session store lazy cleanup
  // **Validates: Requirements 14.3**
  it("Property 4: lazy cleanup — store() removes all expired entries", () => {
    fc.assert(
      fc.property(
        fc.array(sessionIdArb, { minLength: 1, maxLength: 20 }),
        sessionIdArb,
        sessionEntryArb,
        (expiredIds, newId, newEntry) => {
          // Ensure newId is not in expiredIds
          const uniqueExpiredIds = [...new Set(expiredIds)].filter(
            (eid) => eid !== newId
          );
          if (uniqueExpiredIds.length === 0) return; // skip degenerate case

          const freshStore = new SessionStore();

          // Store expired entries
          for (const eid of uniqueExpiredIds) {
            freshStore.store(eid, {
              jobRole: "expired",
              jobDescription: "",
              resumeText: "",
              createdAt: Date.now(),
            });
          }

          // Advance time past TTL
          vi.advanceTimersByTime(31 * 60 * 1000);

          // Store a new entry — this triggers lazy cleanup
          freshStore.store(newId, newEntry);

          // Only the new entry should remain
          expect(freshStore.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
