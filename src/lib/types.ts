export type MeasurementKind = "direct" | "calculated";
export type Unit = "imperial" | "metric";
export type SyncState = "pending" | "synced" | "error";

export interface JournalEntryDTO {
  id: string;
  visitId: string;
  capturedAt: string;
  updatedAt: string;
  lat: number;
  lng: number;
  accuracyM: number | null;
  headingDeg: number | null;
  measurementKind: MeasurementKind;
  directValue: number | null;
  calcBaseValue: number | null;
  calcTopValue: number | null;
  unit: Unit;
  notes: string;
  deleted: boolean;
}

export interface LocalJournalEntry extends JournalEntryDTO {
  syncState: SyncState;
  syncError: string | null;
}

export interface SensorSnapshot {
  lat: number;
  lng: number;
  accuracyM: number | null;
  headingDeg: number | null;
  capturedAt: string;
}
