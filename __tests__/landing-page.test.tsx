import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

// Mock the auth context to avoid Supabase connection
vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn().mockReturnValue({
    session: null,
    user: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import HomePage from "@/app/page";
import { useAuth } from "@/context/auth-context";

describe("Landing Page", () => {
  const originalBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
  const originalStage = process.env.NEXT_PUBLIC_APP_STAGE;

  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "true";
    delete process.env.NEXT_PUBLIC_APP_STAGE;
    // Reset mock to default (not logged in)
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      session: null,
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      sendMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
  });

  afterEach(() => {
    if (originalBypass !== undefined) {
      process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = originalBypass;
    } else {
      delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    }
    if (originalStage !== undefined) {
      process.env.NEXT_PUBLIC_APP_STAGE = originalStage;
    } else {
      delete process.env.NEXT_PUBLIC_APP_STAGE;
    }
  });

  it("renders hero heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /practice interviews that feel real/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders header and Stitch-style composer", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("textbox", {
        name: /job title or full job description/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^attach resume$/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("landing-resume-input")).toBeTruthy();
    expect(screen.getByText(/^quick picks$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /use job role senior software engineer/i,
      }),
    ).toBeInTheDocument();
  });

  it("does not submit when composer role is empty", async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("POSTs setup and opens interview when role is filled", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-abc" }),
    });
    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /job title or full job description/i,
      }),
      { target: { value: "Software Engineer" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/interview?sessionId=session-abc&role=Software%20Engineer",
      );
    });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("fills role from a quick-pick chip and can start interview", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-xyz" }),
    });
    render(<HomePage />);
    fireEvent.click(
      screen.getByRole("button", { name: /use job role product manager/i }),
    );
    const box = screen.getByRole("textbox", {
      name: /job title or full job description/i,
    });
    expect(box).toHaveValue("Product Manager");
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/interview?sessionId=session-xyz&role=Product%20Manager",
      );
    });
  });

  it("renders bento feature titles", () => {
    render(<HomePage />);
    expect(screen.getByText("Voice practice")).toBeInTheDocument();
    expect(screen.getByText("Tailored questions")).toBeInTheDocument();
    expect(screen.getByText("Scored feedback")).toBeInTheDocument();
  });

  it("renders FAQ section and toggles accordion panels", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /questions\?/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/what is vocis\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /what is vocis/i }));
    expect(
      screen.getByText(/safe space to rehearse a real interview out loud/i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /which browser works best/i }),
    );
    expect(
      screen.getByText(/smoothest time on desktop chrome, edge, or arc/i),
    ).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<HomePage />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(
      new RegExp(`©\\s*${new Date().getFullYear()}\\s*Vocis`),
    );
  });

  it('renders "Sign in" link when not authenticated', () => {
    render(<HomePage />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("shows avatar dropdown when user is logged in", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      session: { access_token: "test" },
      user: {
        id: "user-1",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      },
      loading: false,
      signInWithGoogle: vi.fn(),
      sendMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
    render(<HomePage />);
    expect(
      screen.queryByRole("link", { name: /^sign in$/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Beta pill when NEXT_PUBLIC_APP_STAGE is beta", () => {
    process.env.NEXT_PUBLIC_APP_STAGE = "beta";
    render(<HomePage />);
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("does not show Beta pill when stage is unset", () => {
    render(<HomePage />);
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });
});
