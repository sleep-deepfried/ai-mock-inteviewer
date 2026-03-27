import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("sessionId=test-session"),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

const defaultInterviewState = {
  status: "active" as const,
  aiState: "listening" as const,
  transcript: [] as { role: "user" | "ai"; text: string; timestamp: number }[],
  timeRemaining: 900,
  error: null,
  endReason: null,
  isMicOn: false,
  userSpeaking: false,
  toggleMic: vi.fn(),
  endSession: vi.fn(),
  dismissError: vi.fn(),
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

  it("renders mic toggle, camera toggle, and end interview button", () => {
    render(<InterviewPage />);
    expect(
      screen.getByRole("button", { name: /unmute microphone/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /turn on camera/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /end interview/i }),
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

  it("shows review modal when interview ends with empty transcript", async () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Interview ended by user",
      transcript: [],
    });
    render(<InterviewPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /how was your interview/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Interview ended by user")).toBeInTheDocument();
    expect(
      screen.getByText(/did not capture a full transcript/i),
    ).toBeInTheDocument();
  });

  it("shows review modal when interview ends with transcript", async () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Session time limit reached",
      transcript: [
        { role: "user" as const, text: "Hello", timestamp: Date.now() },
      ],
    });
    render(<InterviewPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /how was your interview/i }),
      ).toBeInTheDocument();
    });
  });

  it("navigates to results after submitting a required star rating", async () => {
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Interview ended by user",
      transcript: [
        { role: "user" as const, text: "Hello", timestamp: Date.now() },
      ],
    });
    render(<InterviewPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /how was your interview/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("radio", { name: /4 stars/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /continue to results/i }),
    );
    expect(mockPush).toHaveBeenCalledWith("/interview/results");
  });

  it("stores fallback transcript and review in sessionStorage when transcript was empty", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    (useInterview as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultInterviewState,
      status: "ended",
      endReason: "Interview ended by user",
      transcript: [],
    });
    render(<InterviewPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /how was your interview/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("radio", { name: /5 stars/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /continue to results/i }),
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/interview/results");
    });
    const resultsCall = setItemSpy.mock.calls.find(
      (c) => c[0] === "interview-results-data",
    );
    expect(resultsCall).toBeDefined();
    const parsed = JSON.parse(String(resultsCall?.[1])) as {
      transcript: { role: string; text: string }[];
      transcriptWasEmpty?: boolean;
      review?: { rating: number };
    };
    expect(parsed.transcript.length).toBeGreaterThan(0);
    expect(parsed.transcript[0].text).toMatch(/No dialogue transcript/i);
    expect(parsed.transcriptWasEmpty).toBe(true);
    expect(parsed.review?.rating).toBe(5);
    setItemSpy.mockRestore();
  });
});
