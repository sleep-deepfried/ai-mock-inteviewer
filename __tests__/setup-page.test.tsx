import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

import InterviewSetupPage from "@/app/interview/setup/page";

describe("Interview Setup Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders form with all fields", () => {
    render(<InterviewSetupPage />);
    expect(screen.getByLabelText(/job role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start interview/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid file", () => {
    render(<InterviewSetupPage />);
    const input = document.getElementById("resume-input") as HTMLInputElement;

    const invalidFile = new File(["data"], "test.txt", {
      type: "text/plain",
    });
    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(
      screen.getByText(/only pdf and docx files are accepted/i),
    ).toBeInTheDocument();
  });

  it("submit button disabled when role is empty", () => {
    render(<InterviewSetupPage />);
    const btn = screen.getByRole("button", { name: /start interview/i });
    expect(btn).toBeDisabled();
  });

  it("navigates to interview page on successful submission", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "abc-123" }),
    });

    render(<InterviewSetupPage />);

    const roleInput = screen.getByLabelText(/job role/i);
    fireEvent.change(roleInput, { target: { value: "Software Engineer" } });

    const btn = screen.getByRole("button", { name: /start interview/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/interview?sessionId=abc-123&role=Software%20Engineer",
      );
    });
  });
});
