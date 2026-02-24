import type { JournalEntryDTO } from "@/lib/types";

export interface JournalEntryRow {
  id: string;
  visit_id: string;
  captured_at: string;
  updated_at: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  heading_deg: number | null;
  measurement_kind: "direct" | "calculated";
  direct_value: number | string | null;
  calc_base_value: number | string | null;
  calc_top_value: number | string | null;
  unit: "imperial" | "metric";
  notes: string;
  deleted: boolean;
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function rowToDto(row: JournalEntryRow): JournalEntryDTO {
  return {
    id: row.id,
    visitId: row.visit_id,
    capturedAt: row.captured_at,
    updatedAt: row.updated_at,
    lat: row.lat,
    lng: row.lng,
    accuracyM: row.accuracy_m,
    headingDeg: row.heading_deg,
    measurementKind: row.measurement_kind,
    directValue: toNumberOrNull(row.direct_value),
    calcBaseValue: toNumberOrNull(row.calc_base_value),
    calcTopValue: toNumberOrNull(row.calc_top_value),
    unit: row.unit,
    notes: row.notes,
    deleted: row.deleted,
  };
}

export function dtoToRow(entry: JournalEntryDTO): JournalEntryRow {
  return {
    id: entry.id,
    visit_id: entry.visitId,
    captured_at: entry.capturedAt,
    updated_at: entry.updatedAt,
    lat: entry.lat,
    lng: entry.lng,
    accuracy_m: entry.accuracyM,
    heading_deg: entry.headingDeg,
    measurement_kind: entry.measurementKind,
    direct_value: entry.directValue,
    calc_base_value: entry.calcBaseValue,
    calc_top_value: entry.calcTopValue,
    unit: entry.unit,
    notes: entry.notes,
    deleted: entry.deleted,
  };
}
