import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("sessionId=test-session"),
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

// Default mock return value for useInterview
const defaultInterviewState = {
  status: "active" as const,
  aiState: "listening" as const,
  transcript: [] as { role: "user" | "ai"; text: string; timestamp: number }[],
  timeRemaining: 900,
  error: null,
  endReason: null,
  isMicOn: false,
  toggleMic: vi.fn(),
  endSession: vi.fn(),
  analyserNode: null,
  hintThinking: vi.fn(),
  sendActivityStart: vi.fn(),
  sendActivityEnd: vi.fn(),
};

vi.mock("@/hooks/use-interview", () => ({
  useInterview: vi.fn(),
}));

import InterviewPage from "@/app/interview/page";
import { useInterview } from "@/hooks/use-interview";

describe("Interview Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
    });
  });

  it("renders mic toggle, camera toggle, and end call buttons", () => {
    render(<InterviewPage />);
    expect(
      screen.getByRole("button", { name: /unmute microphone/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /turn on camera/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /end call/i }),
    ).toBeInTheDocument();
  });

  it("renders countdown timer", () => {
    render(<InterviewPage />);
    expect(screen.getByText("15:00")).toBeInTheDocument();
  });

  it("renders error banner when error state is set", () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      error: "Connection lost",
    });
    render(<InterviewPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");
  });

  it("renders end-of-session overlay when status is ended without transcript", () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Session time limit reached",
    });
    render(<InterviewPage />);
    expect(screen.getByText("Interview Ended")).toBeInTheDocument();
    expect(screen.getByText("Session time limit reached")).toBeInTheDocument();
  });

  it("shows review modal when interview ends with transcript", () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Session time limit reached",
      transcript: [
        { role: "user" as const, text: "Hello", timestamp: Date.now() },
      ],
    });
    render(<InterviewPage />);
    expect(
      screen.getByRole("dialog", { name: /how was your interview/i }),
    ).toBeInTheDocument();
  });

  it("navigates to results when skipping review", () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Interview ended by user",
      transcript: [
        { role: "user" as const, text: "Hello", timestamp: Date.now() },
      ],
    });
    render(<InterviewPage />);
    fireEvent.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(mockPush).toHaveBeenCalledWith("/interview/results");
  });
});
