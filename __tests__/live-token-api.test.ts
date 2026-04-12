import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/session-store", () => ({
  sessionStore: {
    get: vi.fn(),
    store: vi.fn(),
  },
}));

vi.mock("@/lib/system-prompt", () => ({
  buildSystemInstruction: vi.fn().mockReturnValue("mock-live-system"),
}));

const mockAuthTokensCreate = vi.fn().mockResolvedValue({
  name: "auth_tokens/test-token-123",
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    authTokens = {
      create: mockAuthTokensCreate,
    };
  },
  Modality: { AUDIO: "AUDIO" },
  ThinkingLevel: { MINIMAL: "MINIMAL" },
  Behavior: { BLOCKING: "BLOCKING" },
  Type: { OBJECT: "OBJECT" },
}));

import { POST } from "@/app/api/interview/live-token/route";
import { getAuthUser } from "@/lib/auth";
import { sessionStore } from "@/lib/session-store";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockSessionGet = vi.mocked(sessionStore.get);
const mockSessionStore = vi.mocked(sessionStore.store);

function buildJsonRequest(body: unknown): Request {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

function makeEntry(isTrial = false) {
  return {
    jobRole: "Software Engineer",
    jobDescription: "Build",
    resumeText: "Resume",
    interviewStyle: "technical" as const,
    createdAt: Date.now(),
    messages: [] as { role: "user" | "model"; text: string }[],
    isTrial,
  };
}

describe("POST /api/interview/live-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    mockGetAuthUser.mockResolvedValue({
      id: "user-1",
      aud: "authenticated",
      role: "authenticated",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identities: [],
      factors: [],
    });
  });

  it("returns token and model when session exists", async () => {
    mockSessionGet.mockReturnValue(makeEntry(false));
    const res = await POST(
      buildJsonRequest({ sessionId: "sid-1" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("auth_tokens/test-token-123");
    expect(body.model).toBe("gemini-3.1-flash-live-preview");
    expect(mockAuthTokensCreate).toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated and session is not trial", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    mockSessionGet.mockReturnValue(makeEntry(false));
    const res = await POST(buildJsonRequest({ sessionId: "sid-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 when unauthenticated for trial session", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    mockSessionGet.mockReturnValue(makeEntry(true));
    const res = await POST(buildJsonRequest({ sessionId: "sid-trial" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("auth_tokens/test-token-123");
  });

  it("returns 404 when session missing", async () => {
    mockSessionGet.mockReturnValue(null);
    const res = await POST(buildJsonRequest({ sessionId: "missing" }));
    expect(res.status).toBe(404);
  });

  it("recreates session from role/style when session missing but role provided", async () => {
    mockSessionGet.mockReturnValue(null);
    const res = await POST(
      buildJsonRequest({ sessionId: "new-sid", role: "Frontend Engineer", style: "behavioral" }),
    );
    expect(res.status).toBe(200);
    expect(mockSessionStore).toHaveBeenCalledWith(
      "new-sid",
      expect.objectContaining({
        jobRole: "Frontend Engineer",
        interviewStyle: "behavioral",
        isTrial: false,
      }),
    );
    const body = await res.json();
    expect(body.token).toBe("auth_tokens/test-token-123");
  });
});
