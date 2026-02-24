"use client";

import { useEffect, useMemo } from "react";

import clsx from "clsx";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { formatDualMeasurement } from "@/lib/units";
import type { LocalJournalEntry } from "@/lib/types";

interface CurrentPosition {
  lat: number;
  lng: number;
  accuracyM: number | null;
}

interface MapPanelProps {
  currentPosition: CurrentPosition | null;
  headingDeg: number | null;
  entries: LocalJournalEntry[];
  followMe: boolean;
  onToggleFollow: () => void;
}

function RecenterMap({
  lat,
  lng,
  followMe,
}: {
  lat: number;
  lng: number;
  followMe: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!followMe) {
      return;
    }

    map.setView([lat, lng], Math.max(map.getZoom(), 17), {
      animate: true,
    });
  }, [followMe, lat, lng, map]);

  return null;
}

function createHeadingIcon(headingDeg: number): L.DivIcon {
  return L.divIcon({
    className: "heading-icon",
    html: `<div class=\"heading-icon__arrow\" style=\"transform: rotate(${headingDeg}deg);\">▲</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function MapPanel({
  currentPosition,
  headingDeg,
  entries,
  followMe,
  onToggleFollow,
}: MapPanelProps) {
  const center: [number, number] = useMemo(() => {
    if (currentPosition) {
      return [currentPosition.lat, currentPosition.lng];
    }

    return [37.773972, -122.431297];
  }, [currentPosition]);

  const headingIcon = useMemo(() => {
    if (headingDeg === null) {
      return null;
    }

    return createHeadingIcon(headingDeg);
  }, [headingDeg]);

  return (
    <section className="map-shell" aria-label="Field map">
      <MapContainer
        center={center}
        zoom={currentPosition ? 17 : 3}
        scrollWheelZoom
        className="map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentPosition && (
          <>
            <RecenterMap
              lat={currentPosition.lat}
              lng={currentPosition.lng}
              followMe={followMe}
            />
            <Circle
              center={[currentPosition.lat, currentPosition.lng]}
              radius={Math.max(currentPosition.accuracyM ?? 4, 4)}
              pathOptions={{
                color: "#38a3ff",
                weight: 1,
                fillColor: "#38a3ff",
                fillOpacity: 0.1,
              }}
            />
            <CircleMarker
              center={[currentPosition.lat, currentPosition.lng]}
              radius={8}
              pathOptions={{
                color: "#0056b7",
                fillColor: "#19a0ff",
                fillOpacity: 1,
                weight: 2,
              }}
            />
            {headingIcon && (
              <Marker
                position={[currentPosition.lat, currentPosition.lng]}
                icon={headingIcon}
              />
            )}
          </>
        )}

        {entries
          .filter((entry) => !entry.deleted)
          .map((entry) => (
            <CircleMarker
              key={entry.id}
              center={[entry.lat, entry.lng]}
              radius={7}
              pathOptions={{
                color:
                  entry.measurementKind === "direct" ? "#0f766e" : "#7c3aed",
                fillColor:
                  entry.measurementKind === "direct" ? "#14b8a6" : "#8b5cf6",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="popup-content">
                  <p>
                    <strong>{entry.measurementKind === "direct" ? "Direct" : "Calculated"}</strong>
                  </p>
                  <p>
                    {entry.measurementKind === "direct"
                      ? formatDualMeasurement(entry.directValue, entry.unit)
                      : `${formatDualMeasurement(
                          entry.calcBaseValue,
                          entry.unit,
                        )} (base) / ${formatDualMeasurement(entry.calcTopValue, entry.unit)} (top)`}
                  </p>
                  <p>{entry.notes || "No notes"}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      <button
        type="button"
        className={clsx("chip", followMe && "chip--active")}
        onClick={onToggleFollow}
      >
        {followMe ? "Following" : "Follow me"}
      </button>
    </section>
  );
}
