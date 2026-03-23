import { describe, it, expect } from "vitest";
import { sanitizeForSheetCell } from "@/lib/sheets";

describe("sanitizeForSheetCell", () => {
  it("prefixes leading formula characters", () => {
    expect(sanitizeForSheetCell("=1+1")).toBe("'=1+1");
    expect(sanitizeForSheetCell("+evil")).toBe("'+evil");
    expect(sanitizeForSheetCell("-sum(a1)")).toBe("'-sum(a1)");
    expect(sanitizeForSheetCell("@ref")).toBe("'@ref");
  });

  it("returns empty for whitespace-only", () => {
    expect(sanitizeForSheetCell("   ")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitizeForSheetCell("Great session")).toBe("Great session");
  });
});
