"use client";

import { useMemo, useRef, useState } from "react";

import clsx from "clsx";

import { toCsv } from "@/lib/csv";
import { localToDto } from "@/lib/entry-transform";
import { formatDualMeasurement } from "@/lib/units";
import type { JournalEntryDTO, LocalJournalEntry, MeasurementKind } from "@/lib/types";
import { journalEntrySchema } from "@/lib/validation";

interface JournalPanelProps {
  entries: LocalJournalEntry[];
  canDropPing: boolean;
  locationError: string | null;
  headingAvailable: boolean;
  onDropPing: () => void;
  manualPingMode: boolean;
  onStartManualPing: () => void;
  onCancelManualPing: () => void;
  onEditEntry: (entry: LocalJournalEntry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onRestoreEntry: (id: string) => Promise<void>;
  onUnlockCloud: (passcode: string) => Promise<void>;
  onSyncNow: () => Promise<void>;
  syncStatus: string;
  syncMessage: string;
  cloudUnlocked: boolean;
  onImportEntries: (entries: JournalEntryDTO[]) => Promise<number>;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatEntryValue(entry: LocalJournalEntry): string {
  if (entry.measurementKind === "direct") {
    return formatDualMeasurement(entry.directValue, entry.unit);
  }

  return `${formatDualMeasurement(entry.calcBaseValue, entry.unit)} base / ${formatDualMeasurement(entry.calcTopValue, entry.unit)} top`;
}

export function JournalPanel({
  entries,
  canDropPing,
  locationError,
  headingAvailable,
  onDropPing,
  manualPingMode,
  onStartManualPing,
  onCancelManualPing,
  onEditEntry,
  onDeleteEntry,
  onRestoreEntry,
  onUnlockCloud,
  onSyncNow,
  syncStatus,
  syncMessage,
  cloudUnlocked,
  onImportEntries,
}: JournalPanelProps) {
  const [unlocking, setUnlocking] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [measurementFilter, setMeasurementFilter] = useState<
    MeasurementKind | "all"
  >("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!showDeleted && entry.deleted) {
        return false;
      }

      if (measurementFilter !== "all" && entry.measurementKind !== measurementFilter) {
        return false;
      }

      if (dateFilter) {
        const localDate = new Date(entry.capturedAt).toLocaleDateString("en-CA");
        if (localDate !== dateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilter, entries, measurementFilter, showDeleted]);

  return (
    <section className="journal-panel" aria-label="Field journal controls">
      <header className="journal-header">
        <h1>Site Field Journal</h1>
        <p>Capture map-linked observations and measurements in real time.</p>
      </header>

      <div className="panel-block">
        <button
          type="button"
          className="button button--large"
          onClick={onDropPing}
          disabled={!canDropPing}
        >
          Drop Ping Here
        </button>
        <button
          type="button"
          className="button button--secondary button--large"
          onClick={() => {
            if (manualPingMode) {
              onCancelManualPing();
              return;
            }

            onStartManualPing();
          }}
        >
          {manualPingMode ? "Cancel Manual Ping" : "Place Manual Ping"}
        </button>
        {!canDropPing && (
          <p className="hint">
            Location is required before creating entries.
            {locationError ? ` ${locationError}` : ""}
          </p>
        )}
        {manualPingMode && (
          <p className="hint">
            Manual ping mode is active. Tap the map to place the next ping.
          </p>
        )}
        {!headingAvailable && (
          <p className="hint">Heading unavailable. Enable orientation for directional marker.</p>
        )}
      </div>

      <div className="panel-block panel-block--cloud">
        <div className="panel-block__row">
          <h2>Cloud Sync</h2>
          <span className={clsx("status-pill", `status-pill--${syncStatus}`)}>
            {syncStatus}
          </span>
        </div>

        <p className="hint">{syncMessage}</p>

        {!cloudUnlocked && (
          <form
            className="unlock-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setUnlocking(true);
              setCloudError(null);
              try {
                await onUnlockCloud(passcode);
                setPasscode("");
              } catch (error) {
                setCloudError(
                  error instanceof Error ? error.message : "Unlock failed.",
                );
              } finally {
                setUnlocking(false);
              }
            }}
          >
            <input
              type="password"
              autoComplete="off"
              placeholder="Shared passcode"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
            />
            <button type="submit" className="button" disabled={unlocking}>
              {unlocking ? "Unlocking..." : "Unlock Cloud"}
            </button>
          </form>
        )}

        {cloudError && <p className="entry-form__error">{cloudError}</p>}

        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            void onSyncNow();
          }}
          disabled={!cloudUnlocked}
        >
          Sync now
        </button>
      </div>

      <div className="panel-block panel-block--tools">
        <h2>Data Tools</h2>
        <div className="tool-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              const exportPayload = entries.map(localToDto);
              downloadFile(
                JSON.stringify(exportPayload, null, 2),
                "site-journal-export.json",
                "application/json",
              );
            }}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              const exportPayload = entries.map(localToDto);
              downloadFile(toCsv(exportPayload), "site-journal-export.csv", "text/csv");
            }}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => importInputRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  const parsed = JSON.parse(String(reader.result));
                  if (!Array.isArray(parsed)) {
                    throw new Error("Import payload must be an array.");
                  }

                  const validEntries = parsed
                    .map((item) => journalEntrySchema.safeParse(item))
                    .filter((result) => result.success)
                    .map((result) => result.data);

                  await onImportEntries(validEntries);
                } catch (error) {
                  setCloudError(
                    error instanceof Error ? error.message : "Import failed.",
                  );
                } finally {
                  event.target.value = "";
                }
              };
              reader.readAsText(file);
            }}
          />
        </div>
      </div>

      <div className="panel-block panel-block--filters">
        <h2>Filters</h2>
        <div className="filter-row">
          <label>
            Type
            <select
              value={measurementFilter}
              onChange={(event) =>
                setMeasurementFilter(event.target.value as MeasurementKind | "all")
              }
            >
              <option value="all">All</option>
              <option value="direct">Direct</option>
              <option value="calculated">Calculated</option>
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => setShowDeleted(event.target.checked)}
            />
            Show deleted
          </label>
        </div>
      </div>

      <div className="entry-list" aria-label="Entry list">
        {filteredEntries.length === 0 && <p className="hint">No entries match filters.</p>}

        {filteredEntries.map((entry) => (
          <article key={entry.id} className={clsx("entry-card", entry.deleted && "entry-card--deleted")}>
            <header>
              <div>
                <h3>
                  {entry.measurementKind === "direct" ? "Direct" : "Calculated"} measurement
                </h3>
                <p>{new Date(entry.capturedAt).toLocaleString()}</p>
              </div>
              <span className={clsx("status-pill", `status-pill--${entry.syncState}`)}>
                {entry.syncState}
              </span>
            </header>
            <p className="entry-value">{formatEntryValue(entry)}</p>
            <p className="entry-meta">
              {entry.lat.toFixed(6)}, {entry.lng.toFixed(6)}
              {entry.headingDeg !== null ? ` | heading ${entry.headingDeg.toFixed(0)}°` : ""}
            </p>
            {entry.notes && <p className="entry-notes">{entry.notes}</p>}
            {entry.syncError && <p className="entry-form__error">{entry.syncError}</p>}
            <footer>
              {!entry.deleted ? (
                <>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => onEditEntry(entry)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      void onDeleteEntry(entry.id);
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    void onRestoreEntry(entry.id);
                  }}
                >
                  Restore
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
