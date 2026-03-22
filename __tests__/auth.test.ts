import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getAuthUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns synthetic dev user when NEXT_PUBLIC_DEV_BYPASS_AUTH is true", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "true";
    const { getAuthUser } = await import("@/lib/auth");
    const user = await getAuthUser();

    expect(user).not.toBeNull();
    expect(user!.email).toBe("dev@localhost");
    expect(user!.id).toContain("dev-user");
  });

  it("returns null when Supabase returns no user", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";

    // Mock the supabase server client
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }),
    }));

    const { getAuthUser } = await import("@/lib/auth");
    const user = await getAuthUser();
    expect(user).toBeNull();
  });

  it("returns user when Supabase returns a valid user", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";

    const mockUser = {
      id: "user-123",
      aud: "authenticated",
      role: "authenticated",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identities: [],
      factors: [],
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }),
    }));

    const { getAuthUser } = await import("@/lib/auth");
    const user = await getAuthUser();

    expect(user).not.toBeNull();
    expect(user!.id).toBe("user-123");
    expect(user!.email).toBe("test@example.com");
  });
});
