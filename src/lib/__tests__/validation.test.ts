import { describe, expect, it } from "vitest";

import { journalEntrySchema } from "@/lib/validation";

function baseEntry() {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    visitId: "visit-1",
    capturedAt: now,
    updatedAt: now,
    lat: 33.12,
    lng: -117.34,
    accuracyM: 5,
    headingDeg: 90,
    measurementKind: "direct" as const,
    directValue: 22,
    calcBaseValue: null,
    calcTopValue: null,
    unit: "imperial" as const,
    notes: "test",
    deleted: false,
  };
}

describe("journalEntrySchema", () => {
  it("accepts valid direct measurement", () => {
    const entry = baseEntry();
    const result = journalEntrySchema.safeParse(entry);

    expect(result.success).toBe(true);
  });

  it("rejects direct measurement without directValue", () => {
    const entry = {
      ...baseEntry(),
      directValue: null,
    };

    const result = journalEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("accepts valid calculated measurement", () => {
    const entry = {
      ...baseEntry(),
      measurementKind: "calculated" as const,
      directValue: null,
      calcBaseValue: 4,
      calcTopValue: 15,
    };

    const result = journalEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("rejects calculated measurement with directValue set", () => {
    const entry = {
      ...baseEntry(),
      measurementKind: "calculated" as const,
      directValue: 10,
      calcBaseValue: 4,
      calcTopValue: 15,
    };

    const result = journalEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("accepts timezone offset timestamps from Supabase", () => {
    const entry = {
      ...baseEntry(),
      capturedAt: "2026-02-24T22:24:05+00:00",
      updatedAt: "2026-02-24T22:24:05+00:00",
    };

    const result = journalEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });
});
