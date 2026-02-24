import { describe, expect, it } from "vitest";

import { rowToDto, type JournalEntryRow } from "@/lib/server/entry-row";

describe("rowToDto", () => {
  it("converts numeric strings from Supabase to numbers", () => {
    const row: JournalEntryRow = {
      id: crypto.randomUUID(),
      visit_id: "site-visit-1",
      captured_at: "2026-02-24T22:24:05+00:00",
      updated_at: "2026-02-24T22:24:05+00:00",
      lat: 1,
      lng: 2,
      accuracy_m: 3,
      heading_deg: 4,
      measurement_kind: "calculated",
      direct_value: null,
      calc_base_value: "4.5",
      calc_top_value: "12.75",
      unit: "imperial",
      notes: "note",
      deleted: false,
    };

    const dto = rowToDto(row);

    expect(dto.calcBaseValue).toBe(4.5);
    expect(dto.calcTopValue).toBe(12.75);
    expect(dto.capturedAt).toBe("2026-02-24T22:24:05+00:00");
  });
});
