import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "@/app/page";

describe("Landing Page", () => {
  it("renders hero heading", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Ace Your Next Interview with/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/AI-Powered Practice/i)).toBeInTheDocument();
  });

  it('renders "Get Started" link pointing to /interview/setup', () => {
    render(<HomePage />);
    const getStartedLinks = screen.getAllByRole("link", {
      name: /get started/i,
    });
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(1);
    expect(getStartedLinks[0]).toHaveAttribute("href", "/interview/setup");
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

  it('renders "Sign In" nav link pointing to /login', () => {
    render(<HomePage />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });
});
