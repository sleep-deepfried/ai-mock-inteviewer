import { render, screen } from "@testing-library/react";
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
  transcript: [],
  timeRemaining: 900,
  error: null,
  endReason: null,
  isMicOn: true,
  toggleMic: vi.fn(),
  endSession: vi.fn(),
  sendTextMessage: vi.fn(),
  analyserNode: null,
};

vi.mock("@/hooks/use-interview", () => ({
  useInterview: vi.fn().mockReturnValue({
    status: "active",
    aiState: "listening",
    transcript: [],
    timeRemaining: 900,
    error: null,
    endReason: null,
    isMicOn: true,
    toggleMic: vi.fn(),
    endSession: vi.fn(),
    sendTextMessage: vi.fn(),
    analyserNode: null,
  }),
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
      screen.getByRole("button", { name: /mute microphone/i }),
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

  it("renders end-of-session overlay when status is ended", () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Session time limit reached",
    });
    render(<InterviewPage />);
    expect(screen.getByText("Interview Ended")).toBeInTheDocument();
    expect(screen.getByText("Session time limit reached")).toBeInTheDocument();
  });
});
