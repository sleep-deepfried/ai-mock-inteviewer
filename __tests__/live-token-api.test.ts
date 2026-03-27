import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/session-store", () => ({
  sessionStore: {
    get: vi.fn(),
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

function buildJsonRequest(body: unknown): Request {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

function makeEntry() {
  return {
    jobRole: "Software Engineer",
    jobDescription: "Build",
    resumeText: "Resume",
    interviewStyle: "technical" as const,
    createdAt: Date.now(),
    messages: [] as { role: "user" | "model"; text: string }[],
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
    mockSessionGet.mockReturnValue(makeEntry());
    const res = await POST(
      buildJsonRequest({ sessionId: "sid-1" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("auth_tokens/test-token-123");
    expect(body.model).toBe("gemini-3.1-flash-live-preview");
    expect(mockAuthTokensCreate).toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const res = await POST(buildJsonRequest({ sessionId: "sid-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when session missing", async () => {
    mockSessionGet.mockReturnValue(null);
    const res = await POST(buildJsonRequest({ sessionId: "missing" }));
    expect(res.status).toBe(404);
  });
});
