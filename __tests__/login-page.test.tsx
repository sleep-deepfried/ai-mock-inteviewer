import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((path: string) => {
  const err = new Error(`NEXT_REDIRECT:${path}`);
  throw err;
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

import LoginPage from "@/app/login/page";

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to home", () => {
    expect(() => {
      LoginPage();
    }).toThrow(/NEXT_REDIRECT:\//);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
