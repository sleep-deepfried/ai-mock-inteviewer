import { describe, it, expect } from "vitest";
import {
  buildSystemInstruction,
  LEAD_INTERVIEWER_PERSONA,
} from "@/lib/system-prompt";

describe("System prompt unit tests", () => {
  it("returns persona only when context is null", () => {
    const result = buildSystemInstruction(null);
    expect(result).toBe(LEAD_INTERVIEWER_PERSONA);
    expect(result).not.toContain("Interview Context:");
  });

  it("output contains 'Alex Chen'", () => {
    const result = buildSystemInstruction(null);
    expect(result).toContain("Alex Chen");
  });

  it("includes role and resume even when jobDescription is empty", () => {
    const result = buildSystemInstruction({
      jobRole: "Backend Engineer",
      jobDescription: "",
      resumeText: "5 years of Go experience",
    });

    expect(result).toContain("Backend Engineer");
    expect(result).toContain("5 years of Go experience");
    expect(result).toContain("Interview Context:");
  });

  it("includes all interview context fields when provided", () => {
    const result = buildSystemInstruction({
      jobRole: "Frontend Developer",
      jobDescription: "React and TypeScript required",
      resumeText: "Built dashboards with React",
    });

    expect(result).toContain("Alex Chen");
    expect(result).toContain("Frontend Developer");
    expect(result).toContain("React and TypeScript required");
    expect(result).toContain("Built dashboards with React");
    expect(result).toContain("IMPORTANT: Tailor your questions");
  });
});
