import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/resume-parser", () => ({
  parseResume: vi.fn(),
}));

vi.mock("@/lib/session-store", () => {
  const storeFn = vi.fn();
  return {
    sessionStore: {
      store: storeFn,
      get: vi.fn(),
    },
  };
});

import { POST } from "@/app/api/interview/setup/route";
import { getAuthUser } from "@/lib/auth";
import { parseResume } from "@/lib/resume-parser";
import { sessionStore } from "@/lib/session-store";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockParseResume = vi.mocked(parseResume);
const mockStore = vi.mocked(sessionStore.store);

/**
 * Build a mock Request whose formData() returns a controlled FormData.
 */
function buildMockRequest(
  fields: Record<string, string | File>
): Request {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return {
    formData: () => Promise.resolve(fd),
  } as unknown as Request;
}

describe("POST /api/interview/setup", () => {
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

  it("returns 200 with sessionId for a valid request with role only", async () => {
    const req = buildMockRequest({ role: "Software Engineer" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sessionId).toBeDefined();
    expect(typeof body.sessionId).toBe("string");
    expect(mockStore).toHaveBeenCalledOnce();
  });

  it("returns 400 when role is missing", async () => {
    const req = buildMockRequest({ description: "Some description" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Job role is required");
  });

  it("returns 400 when role is empty string", async () => {
    const req = buildMockRequest({ role: "   " });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Job role is required");
  });

  it("returns 400 for invalid file type", async () => {
    const file = new File(["content"], "resume.txt", {
      type: "text/plain",
    });
    const req = buildMockRequest({ role: "Engineer", resume: file });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Only PDF and DOCX files are accepted");
  });

  it("returns 400 for file exceeding 5MB", async () => {
    // Create a File-like object with a large size without allocating memory
    const bigFile = new File(["x"], "resume.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(bigFile, "size", {
      value: 5 * 1024 * 1024 + 1,
    });
    const req = buildMockRequest({ role: "Engineer", resume: bigFile });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("File size must be under 5MB");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const req = buildMockRequest({ role: "Engineer" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 422 when resume parsing fails", async () => {
    mockParseResume.mockRejectedValue(new Error("Corrupt PDF"));
    const file = new File(["fake-pdf"], "resume.pdf", {
      type: "application/pdf",
    });
    const req = buildMockRequest({ role: "Engineer", resume: file });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toContain("Failed to parse resume");
    expect(body.error).toContain("Corrupt PDF");
  });

  it("returns 200 with sessionId when resume is valid", async () => {
    mockParseResume.mockResolvedValue("Extracted resume text");
    const file = new File(["pdf-content"], "resume.pdf", {
      type: "application/pdf",
    });
    const req = buildMockRequest({
      role: "Engineer",
      description: "Build things",
      resume: file,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sessionId).toBeDefined();
    expect(mockParseResume).toHaveBeenCalledOnce();
    expect(mockStore).toHaveBeenCalledOnce();
  });
});
