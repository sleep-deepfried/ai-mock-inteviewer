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
  buildSystemInstruction: vi.fn().mockReturnValue("mock-system-prompt"),
}));

const mockGenerateContent = vi.fn().mockResolvedValue({
  text: "Welcome to your interview.",
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
  createUserContent: (text: string) => ({ role: "user", parts: [{ text }] }),
  createModelContent: (text: string) => ({ role: "model", parts: [{ text }] }),
}));

import { POST } from "@/app/api/interview/chat/route";
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

describe("POST /api/interview/chat", () => {
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

  it("returns 200 with assistant text on bootstrap", async () => {
    const entry = makeEntry();
    mockSessionGet.mockReturnValue(entry);

    const req = buildJsonRequest({ sessionId: "s1", bootstrap: true });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.text).toBe("Welcome to your interview.");
    expect(entry.messages).toHaveLength(2);
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });

  it("returns replay on duplicate bootstrap without calling Gemini again", async () => {
    const entry = makeEntry();
    entry.messages.push(
      { role: "user", text: "hi" },
      { role: "model", text: "Welcome to your interview." },
    );
    mockSessionGet.mockReturnValue(entry);
    mockGenerateContent.mockClear();

    const req = buildJsonRequest({ sessionId: "s1", bootstrap: true });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.text).toBe("Welcome to your interview.");
    expect(body.replay).toBe(true);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 404 for missing session", async () => {
    mockSessionGet.mockReturnValue(null);
    const req = buildJsonRequest({ sessionId: "x", bootstrap: true });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const req = buildJsonRequest({ sessionId: "s1", bootstrap: true });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when message missing for non-bootstrap", async () => {
    mockSessionGet.mockReturnValue(makeEntry());
    const req = buildJsonRequest({ sessionId: "s1" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
