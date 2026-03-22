export interface SessionEntry {
  jobRole: string;
  jobDescription: string;
  resumeText: string;
  createdAt: number; // Date.now()
}

const TTL_MS = 30 * 60 * 1000; // 30 minutes

export class SessionStore {
  private entries = new Map<string, SessionEntry>();

  /** Store a session entry and run lazy cleanup of expired entries. */
  store(sessionId: string, context: SessionEntry): void {
    this.cleanup();
    this.entries.set(sessionId, context);
  }

  /** Retrieve a session entry, or null if expired/missing. */
  get(sessionId: string): SessionEntry | null {
    const entry = this.entries.get(sessionId);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > TTL_MS) {
      this.entries.delete(sessionId);
      return null;
    }

    return entry;
  }

  /** Remove a session entry (call after successful token generation). */
  delete(sessionId: string): void {
    this.entries.delete(sessionId);
  }

  /** Remove all entries older than 30 minutes. */
  cleanup(): void {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      if (now - entry.createdAt > TTL_MS) {
        this.entries.delete(id);
      }
    }
  }

  /** Exposed for testing only. */
  get size(): number {
    return this.entries.size;
  }
}

export const sessionStore = new SessionStore();
