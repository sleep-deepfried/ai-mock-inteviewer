import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import HomePage from "@/app/page";

describe("Landing Page", () => {
  const originalBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";
  });

  afterEach(() => {
    if (originalBypass !== undefined) {
      process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = originalBypass;
    } else {
      delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    }
  });

  it("renders hero heading", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Ace Your Next Interview with/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/AI-Powered Practice/i)).toBeInTheDocument();
  });

  it('renders "Get Started" links pointing to /interview/setup', () => {
    render(<HomePage />);
    const getStartedLinks = screen.getAllByRole("link", {
      name: /get started/i,
    });
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(1);
    getStartedLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/interview/setup");
    });
  });

  it("renders feature cards", () => {
    render(<HomePage />);
    expect(screen.getByText("Real-Time Voice")).toBeInTheDocument();
    expect(screen.getByText("AI Interviewer")).toBeInTheDocument();
    expect(screen.getByText("Resume-Aware")).toBeInTheDocument();
    expect(screen.getByText("Timed Sessions")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<HomePage />);
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it('renders "Sign In" links pointing to /login when dev bypass is off', () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";
    render(<HomePage />);
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThanOrEqual(1);
    signInLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/login");
    });
  });

  it('does not render "Sign In" when dev bypass is on', () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "true";
    render(<HomePage />);
    expect(
      screen.queryByRole("link", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it('renders "How it works" section', () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /how it works/i }),
    ).toBeInTheDocument();
  });
});
