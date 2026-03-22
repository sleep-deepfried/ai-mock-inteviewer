import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/session-store", () => ({
  sessionStore: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/system-prompt", () => ({
  buildSystemInstruction: vi.fn().mockReturnValue("mock-system-prompt"),
}));

const mockAuthTokensCreate = vi.fn().mockResolvedValue({ name: "ephemeral-token-abc" });

vi.mock("@google/genai", () => ({
  Modality: { AUDIO: "AUDIO" },
  EndSensitivity: { END_SENSITIVITY_HIGH: "END_SENSITIVITY_HIGH" },
  StartSensitivity: { START_SENSITIVITY_HIGH: "START_SENSITIVITY_HIGH" },
  TurnCoverage: { TURN_INCLUDES_ALL_INPUT: "TURN_INCLUDES_ALL_INPUT" },
  GoogleGenAI: class {
    authTokens = { create: mockAuthTokensCreate };
  },
}));

import { POST } from "@/app/api/token/route";
import { getAuthUser } from "@/lib/auth";
import { sessionStore } from "@/lib/session-store";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockSessionGet = vi.mocked(sessionStore.get);

function buildJsonRequest(body: unknown): Request {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

describe("POST /api/token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns 200 with token for a valid session", async () => {
    mockSessionGet.mockReturnValue({
      jobRole: "Software Engineer",
      jobDescription: "Build things",
      resumeText: "My resume",
      createdAt: Date.now(),
    });

    const req = buildJsonRequest({ sessionId: "valid-session-id" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe("ephemeral-token-abc");
    expect(mockSessionGet).toHaveBeenCalledWith("valid-session-id");
  });

  it("returns 404 for missing session", async () => {
    mockSessionGet.mockReturnValue(null);

    const req = buildJsonRequest({ sessionId: "nonexistent-id" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Session not found or expired");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const req = buildJsonRequest({ sessionId: "some-id" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when sessionId is missing", async () => {
    const req = buildJsonRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Session ID is required");
  });

  it("returns 500 when token creation fails", async () => {
    mockSessionGet.mockReturnValue({
      jobRole: "Engineer",
      jobDescription: "",
      resumeText: "",
      createdAt: Date.now(),
    });

    // Override the mock to throw
    mockAuthTokensCreate.mockRejectedValueOnce(new Error("API error"));

    const req = buildJsonRequest({ sessionId: "valid-id" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to generate session token");
  });
});
