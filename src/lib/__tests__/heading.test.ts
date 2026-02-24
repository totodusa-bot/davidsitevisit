import { describe, expect, it } from "vitest";

import { normalizeHeading, smoothHeading } from "@/lib/heading";

describe("heading", () => {
  it("normalizes headings to 0-359", () => {
    expect(normalizeHeading(370)).toBe(10);
    expect(normalizeHeading(-10)).toBe(350);
  });

  it("smooths across wraparound", () => {
    const smoothed = smoothHeading(350, 10, 0.5);
    expect(smoothed).not.toBeNull();
    expect(smoothed).toBe(0);
  });

  it("returns previous heading when next is null", () => {
    expect(smoothHeading(20, null)).toBe(20);
  });
});
