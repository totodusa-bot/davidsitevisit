"use client";

import { useMemo, useState } from "react";

import type { JournalEntryDTO, MeasurementKind, Unit } from "@/lib/types";
import { journalEntrySchema } from "@/lib/validation";

interface EntryFormProps {
  draft: JournalEntryDTO | null;
  mode: "create" | "edit";
  onCancel: () => void;
  onSave: (entry: JournalEntryDTO) => Promise<void>;
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function EntryForm({ draft, mode, onCancel, onSave }: EntryFormProps) {
  const [measurementKind, setMeasurementKind] = useState<MeasurementKind>(
    draft?.measurementKind ?? "direct",
  );
  const [unit, setUnit] = useState<Unit>(draft?.unit ?? "imperial");
  const [directValue, setDirectValue] = useState<string>(
    draft?.directValue?.toString() ?? "",
  );
  const [calcBaseValue, setCalcBaseValue] = useState<string>(
    draft?.calcBaseValue?.toString() ?? "",
  );
  const [calcTopValue, setCalcTopValue] = useState<string>(
    draft?.calcTopValue?.toString() ?? "",
  );
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const title = useMemo(
    () => (mode === "create" ? "New Field Entry" : "Edit Field Entry"),
    [mode],
  );

  if (!draft) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <form
        className="entry-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);

          const nextEntry: JournalEntryDTO = {
            ...draft,
            updatedAt: new Date().toISOString(),
            measurementKind,
            unit,
            directValue:
              measurementKind === "direct" ? numberOrNull(directValue) : null,
            calcBaseValue:
              measurementKind === "calculated"
                ? numberOrNull(calcBaseValue)
                : null,
            calcTopValue:
              measurementKind === "calculated"
                ? numberOrNull(calcTopValue)
                : null,
            notes: notes.trim(),
          };

          const parseResult = journalEntrySchema.safeParse(nextEntry);
          if (!parseResult.success) {
            setSaving(false);
            setError(parseResult.error.issues[0]?.message ?? "Invalid entry.");
            return;
          }

          await onSave(nextEntry);
          setSaving(false);
        }}
      >
        <header className="entry-form__header">
          <h2>{title}</h2>
          <p>
            {new Date(draft.capturedAt).toLocaleString()} | {draft.lat.toFixed(6)},{" "}
            {draft.lng.toFixed(6)}
          </p>
        </header>

        <fieldset className="entry-form__fieldset">
          <legend>Measurement Type</legend>
          <label>
            <input
              type="radio"
              name="measurement-kind"
              value="direct"
              checked={measurementKind === "direct"}
              onChange={() => setMeasurementKind("direct")}
            />
            Direct height
          </label>
          <label>
            <input
              type="radio"
              name="measurement-kind"
              value="calculated"
              checked={measurementKind === "calculated"}
              onChange={() => setMeasurementKind("calculated")}
            />
            Calculated height
          </label>
        </fieldset>

        <label className="entry-form__field">
          Unit
          <select value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
            <option value="imperial">Imperial (ft)</option>
            <option value="metric">Metric (m)</option>
          </select>
        </label>

        {measurementKind === "direct" ? (
          <label className="entry-form__field">
            Direct measurement ({unit === "imperial" ? "ft" : "m"})
            <input
              inputMode="decimal"
              placeholder="e.g. 23.5"
              value={directValue}
              onChange={(event) => setDirectValue(event.target.value)}
            />
          </label>
        ) : (
          <>
            <label className="entry-form__field">
              Base reading ({unit === "imperial" ? "ft" : "m"})
              <input
                inputMode="decimal"
                placeholder="e.g. 4.5"
                value={calcBaseValue}
                onChange={(event) => setCalcBaseValue(event.target.value)}
              />
            </label>
            <label className="entry-form__field">
              Top reading ({unit === "imperial" ? "ft" : "m"})
              <input
                inputMode="decimal"
                placeholder="e.g. 28.2"
                value={calcTopValue}
                onChange={(event) => setCalcTopValue(event.target.value)}
              />
            </label>
          </>
        )}

        <label className="entry-form__field">
          Notes
          <textarea
            rows={4}
            placeholder="Describe context, target, and conditions."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        {error && <p className="entry-form__error">{error}</p>}

        <footer className="entry-form__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="button" disabled={saving}>
            {saving ? "Saving..." : "Save entry"}
          </button>
        </footer>
      </form>
    </div>
  );
}
