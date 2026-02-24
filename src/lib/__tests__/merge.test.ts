import { describe, expect, it } from "vitest";

import { pickPreferredEntry } from "@/lib/storage/entries-repo";
import type { JournalEntryDTO, LocalJournalEntry } from "@/lib/types";

function buildEntry(updatedAt: string): JournalEntryDTO {
  return {
    id: crypto.randomUUID(),
    visitId: "visit-1",
    capturedAt: "2026-02-24T10:00:00.000Z",
    updatedAt,
    lat: 1,
    lng: 1,
    accuracyM: null,
    headingDeg: null,
    measurementKind: "direct",
    directValue: 11,
    calcBaseValue: null,
    calcTopValue: null,
    unit: "imperial",
    notes: "",
    deleted: false,
  };
}

describe("pickPreferredEntry", () => {
  it("chooses remote when newer", () => {
    const local: LocalJournalEntry = {
      ...buildEntry("2026-02-24T10:00:00.000Z"),
      syncState: "synced",
      syncError: null,
    };
    const remote = buildEntry("2026-02-24T12:00:00.000Z");

    expect(pickPreferredEntry(local, remote)).toBe("remote");
  });

  it("keeps local when local is newer", () => {
    const local: LocalJournalEntry = {
      ...buildEntry("2026-02-24T12:00:00.000Z"),
      syncState: "synced",
      syncError: null,
    };
    const remote = buildEntry("2026-02-24T10:00:00.000Z");

    expect(pickPreferredEntry(local, remote)).toBe("local");
  });

  it("keeps pending local when timestamps are equal", () => {
    const local: LocalJournalEntry = {
      ...buildEntry("2026-02-24T12:00:00.000Z"),
      syncState: "pending",
      syncError: null,
    };
    const remote = buildEntry("2026-02-24T12:00:00.000Z");

    expect(pickPreferredEntry(local, remote)).toBe("local");
  });
});
