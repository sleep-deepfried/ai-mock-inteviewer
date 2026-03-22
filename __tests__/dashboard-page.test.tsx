import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn().mockReturnValue({
    session: { access_token: "test" },
    user: { id: "user-1", email: "test@example.com" },
    loading: false,
    signInWithGoogle: vi.fn(),
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import DashboardPage from "@/app/dashboard/page";

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome message", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it("renders link to /interview/setup", () => {
    render(<DashboardPage />);
    const link = screen.getByRole("link", { name: /start new interview/i });
    expect(link).toHaveAttribute("href", "/interview/setup");
  });

  it("renders sign out button", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });
});
