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

  it("output contains 'Vocis'", () => {
    const result = buildSystemInstruction(null);
    expect(result).toContain("Vocis");
  });

  it("includes role and resume even when jobDescription is empty", () => {
    const result = buildSystemInstruction({
      jobRole: "Backend Engineer",
      jobDescription: "",
      resumeText: "5 years of Go experience",
      interviewStyle: "technical",
    });

    expect(result).toContain("Backend Engineer");
    expect(result).toContain("5 years of Go experience");
    expect(result).toContain("Interview Context:");
    expect(result).toContain("TECHNICAL");
  });

  it("includes all interview context fields when provided", () => {
    const result = buildSystemInstruction({
      jobRole: "Frontend Developer",
      jobDescription: "React and TypeScript required",
      resumeText: "Built dashboards with React",
      interviewStyle: "technical",
    });

    expect(result).toContain("Vocis");
    expect(result).toContain("Frontend Developer");
    expect(result).toContain("React and TypeScript required");
    expect(result).toContain("Built dashboards with React");
    expect(result).toContain("IMPORTANT: Tailor your questions");
    expect(result).toContain("TECHNICAL");
  });

  it("uses behavioral style block when interviewStyle is behavioral", () => {
    const result = buildSystemInstruction({
      jobRole: "PM",
      jobDescription: "",
      resumeText: "Shipped three products",
      interviewStyle: "behavioral",
    });

    expect(result).toContain("Interview style for this session — BEHAVIORAL");
    expect(result).toContain("STAR");
  });
});
