"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { EntryForm } from "@/components/entry-form";
import { JournalPanel } from "@/components/journal-panel";
import { PUBLIC_VISIT_ID, DEFAULT_UNIT } from "@/lib/config";
import { localToDto } from "@/lib/entry-transform";
import type { JournalEntryDTO } from "@/lib/types";
import { useCloudSync } from "@/hooks/use-cloud-sync";
import { useEntries } from "@/hooks/use-entries";
import { useLocationHeading } from "@/hooks/use-location-heading";

const DynamicMapPanel = dynamic(() => import("@/components/map-panel").then((module) => module.MapPanel), {
  ssr: false,
  loading: () => <section className="map-shell">Loading map...</section>,
});

type MapStyle = "street" | "satellite";

export default function HomePage() {
  const entriesApi = useEntries();
  const cloud = useCloudSync();
  const location = useLocationHeading();

  const [followMe, setFollowMe] = useState(true);
  const [manualPingMode, setManualPingMode] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>("street");
  const [draftMode, setDraftMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<JournalEntryDTO | null>(null);

  const hasLocation = location.locationPermission === "granted" && !!location.position;

  const activeEntries = useMemo(
    () => entriesApi.entries.filter((entry) => !entry.deleted),
    [entriesApi.entries],
  );

  function openDraftAt(
    lat: number,
    lng: number,
    accuracyM: number | null,
    sourceHeadingDeg: number | null,
  ) {
    const now = new Date().toISOString();
    setDraftMode("create");
    setDraft({
      id: crypto.randomUUID(),
      visitId: PUBLIC_VISIT_ID,
      capturedAt: now,
      updatedAt: now,
      lat,
      lng,
      accuracyM,
      headingDeg: sourceHeadingDeg,
      measurementKind: "direct",
      directValue: null,
      calcBaseValue: null,
      calcTopValue: null,
      unit: DEFAULT_UNIT,
      notes: "",
      deleted: false,
    });
  }

  return (
    <main className="page-shell">
      <section className="permission-banner">
        <h2>Permissions</h2>
        <div className="permission-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              void location.requestLocationPermission();
            }}
          >
            {location.locationPermission === "granted"
              ? "Location Enabled"
              : "Enable Location"}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              void location.requestOrientationPermission();
            }}
          >
            {location.orientationPermission === "granted"
              ? "Direction Enabled"
              : "Enable Direction Sensor"}
          </button>
          <span className="hint">
            Location: {location.locationPermission} | Orientation: {location.orientationPermission}
          </span>
        </div>
        {location.error && <p className="entry-form__error">{location.error}</p>}
      </section>

      <div className="content-shell">
        <DynamicMapPanel
          currentPosition={
            location.position
              ? {
                  lat: location.position.lat,
                  lng: location.position.lng,
                  accuracyM: location.position.accuracyM,
                }
              : null
          }
          headingDeg={location.headingDeg}
          entries={activeEntries}
          followMe={followMe}
          onToggleFollow={() => setFollowMe((prev) => !prev)}
          mapStyle={mapStyle}
          onToggleMapStyle={() =>
            setMapStyle((prev) => (prev === "street" ? "satellite" : "street"))
          }
          manualPingMode={manualPingMode}
          onMapSelectForManualPing={(lat, lng) => {
            setManualPingMode(false);
            openDraftAt(lat, lng, null, location.headingDeg);
          }}
        />

        <JournalPanel
          entries={entriesApi.entries}
          canDropPing={hasLocation}
          locationError={location.error}
          headingAvailable={location.headingDeg !== null}
          onDropPing={() => {
            if (!location.position) {
              return;
            }
            setManualPingMode(false);
            openDraftAt(
              location.position.lat,
              location.position.lng,
              location.position.accuracyM,
              location.headingDeg,
            );
          }}
          manualPingMode={manualPingMode}
          onStartManualPing={() => {
            setManualPingMode(true);
            setFollowMe(false);
          }}
          onCancelManualPing={() => setManualPingMode(false)}
          onEditEntry={(entry) => {
            setDraftMode("edit");
            setDraft(localToDto(entry));
          }}
          onDeleteEntry={async (id) => {
            await entriesApi.remove(id);
            if (cloud.isUnlocked) {
              await cloud.runSync();
            }
          }}
          onRestoreEntry={async (id) => {
            await entriesApi.restore(id);
            if (cloud.isUnlocked) {
              await cloud.runSync();
            }
          }}
          onUnlockCloud={async (passcode) => {
            await cloud.unlock(passcode);
          }}
          onSyncNow={async () => {
            await cloud.runSync();
          }}
          syncStatus={cloud.status}
          syncMessage={cloud.message}
          cloudUnlocked={cloud.isUnlocked}
          onImportEntries={async (entries) => {
            const importedCount = await entriesApi.importBulk(entries);
            if (cloud.isUnlocked) {
              await cloud.runSync();
            }
            return importedCount;
          }}
        />
      </div>

      <EntryForm
        key={draft?.id ?? "empty-draft"}
        draft={draft}
        mode={draftMode}
        onCancel={() => setDraft(null)}
        onSave={async (nextEntry) => {
          if (draftMode === "create") {
            await entriesApi.create(nextEntry);
          } else {
            await entriesApi.update(nextEntry);
          }

          setDraft(null);

          if (cloud.isUnlocked) {
            await cloud.runSync();
          }
        }}
      />
    </main>
  );
}
