import type { JournalEntryDTO } from "@/lib/types";

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function toCsv(entries: JournalEntryDTO[]): string {
  const header = [
    "id",
    "visitId",
    "capturedAt",
    "updatedAt",
    "lat",
    "lng",
    "accuracyM",
    "headingDeg",
    "measurementKind",
    "directValue",
    "calcBaseValue",
    "calcTopValue",
    "unit",
    "notes",
    "deleted",
  ];

  const rows = entries.map((entry) =>
    [
      entry.id,
      entry.visitId,
      entry.capturedAt,
      entry.updatedAt,
      String(entry.lat),
      String(entry.lng),
      String(entry.accuracyM ?? ""),
      String(entry.headingDeg ?? ""),
      entry.measurementKind,
      String(entry.directValue ?? ""),
      String(entry.calcBaseValue ?? ""),
      String(entry.calcTopValue ?? ""),
      entry.unit,
      entry.notes,
      String(entry.deleted),
    ].map(escapeCell),
  );

  return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
