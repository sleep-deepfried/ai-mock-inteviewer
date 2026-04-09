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
    session: null,
    user: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import LoginPage from "@/app/login/page";
import { useAuth } from "@/context/auth-context";

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      session: null,
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      sendMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it("renders Google sign-in button", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it("renders magic link email input and button", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("redirects to onboarding when already authenticated and not onboarded", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      session: { access_token: "test" },
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signInWithGoogle: vi.fn(),
      sendMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
    // Mock localStorage to simulate not onboarded
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });
});
