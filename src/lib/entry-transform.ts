import type { JournalEntryDTO, LocalJournalEntry } from "@/lib/types";

export function localToDto(entry: LocalJournalEntry): JournalEntryDTO {
  return {
    id: entry.id,
    visitId: entry.visitId,
    capturedAt: entry.capturedAt,
    updatedAt: entry.updatedAt,
    lat: entry.lat,
    lng: entry.lng,
    accuracyM: entry.accuracyM,
    headingDeg: entry.headingDeg,
    measurementKind: entry.measurementKind,
    directValue: entry.directValue,
    calcBaseValue: entry.calcBaseValue,
    calcTopValue: entry.calcTopValue,
    unit: entry.unit,
    notes: entry.notes,
    deleted: entry.deleted,
  };
}
