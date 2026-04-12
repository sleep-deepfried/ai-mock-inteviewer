export type ChatTurnRole = "user" | "model";

export type InterviewStyle = "behavioral" | "technical";

export interface ChatTurn {
  role: ChatTurnRole;
  text: string;
}

export interface SessionEntry {
  jobRole: string;
  jobDescription: string;
  resumeText: string;
  /** Drives system-prompt emphasis (behavioral vs technical questions). */
  interviewStyle: InterviewStyle;
  createdAt: number; // Date.now()
  /** Interview turns; appended by POST /api/interview/chat. */
  messages: ChatTurn[];
  /** Anonymous web trial session (no account); relaxed auth on live-token / end. */
  isTrial: boolean;
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

  /** Remove a session entry (e.g. when the interview ends). */
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
