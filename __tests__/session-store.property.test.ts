import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { SessionStore } from "@/lib/session-store";

const sessionEntryArb = fc.record({
  jobRole: fc.string({ minLength: 1 }),
  jobDescription: fc.string(),
  resumeText: fc.string(),
  createdAt: fc.constant(Date.now()),
  messages: fc.constant([] as { role: "user" | "model"; text: string }[]),
});

const sessionIdArb = fc.uuid();

describe("SessionStore property tests", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: Date.now() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
        expect(retrieved!.messages).toEqual(entry.messages);
      }),
      { numRuns: 100 }
    );
  });

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

  it("Property 3: TTL — get returns null for entries older than 30 minutes", () => {
    fc.assert(
      fc.property(
        sessionIdArb,
        sessionEntryArb,
        fc.integer({ min: 1, max: 60 }),
        (id, entry, extraMinutes) => {
          const freshStore = new SessionStore();
          freshStore.store(id, entry);
          vi.advanceTimersByTime((30 + extraMinutes) * 60 * 1000);
          const result = freshStore.get(id);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 4: lazy cleanup — store() removes all expired entries", () => {
    fc.assert(
      fc.property(
        fc.array(sessionIdArb, { minLength: 1, maxLength: 20 }),
        sessionIdArb,
        sessionEntryArb,
        (expiredIds, newId, newEntry) => {
          const uniqueExpiredIds = [...new Set(expiredIds)].filter(
            (eid) => eid !== newId
          );
          if (uniqueExpiredIds.length === 0) return;

          const freshStore = new SessionStore();

          for (const eid of uniqueExpiredIds) {
            freshStore.store(eid, {
              jobRole: "expired",
              jobDescription: "",
              resumeText: "",
              createdAt: Date.now(),
              messages: [],
            });
          }

          vi.advanceTimersByTime(31 * 60 * 1000);

          freshStore.store(newId, newEntry);

          expect(freshStore.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
