"use client";

import { useEffect, useMemo } from "react";

import clsx from "clsx";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
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

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function toDeg(value: number): number {
  return (value * 180) / Math.PI;
}

function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number,
): [number, number] {
  const earthRadiusM = 6_378_137;
  const angularDistance = distanceM / earthRadiusM;

  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const bearing = toRad(bearingDeg);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [toDeg(lat2), toDeg(lng2)];
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

  const userLatLng = useMemo<[number, number] | null>(() => {
    if (!currentPosition) {
      return null;
    }

    return [currentPosition.lat, currentPosition.lng];
  }, [currentPosition]);

  const headingGeometry = useMemo(() => {
    if (!userLatLng || headingDeg === null) {
      return null;
    }

    const [lat, lng] = userLatLng;
    const tip = destinationPoint(lat, lng, headingDeg, 14);
    const leftWing = destinationPoint(tip[0], tip[1], headingDeg + 145, 5);
    const rightWing = destinationPoint(tip[0], tip[1], headingDeg - 145, 5);

    return {
      shaft: [userLatLng, tip] as [number, number][],
      head: [leftWing, tip, rightWing] as [number, number][],
    };
  }, [headingDeg, userLatLng]);

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

        {currentPosition && userLatLng && (
          <>
            <RecenterMap
              lat={userLatLng[0]}
              lng={userLatLng[1]}
              followMe={followMe}
            />
            <Circle
              center={userLatLng}
              radius={Math.max(currentPosition.accuracyM ?? 4, 4)}
              pathOptions={{
                color: "#38a3ff",
                weight: 1,
                fillColor: "#38a3ff",
                fillOpacity: 0.1,
              }}
            />
            <CircleMarker
              center={userLatLng}
              radius={8}
              pathOptions={{
                color: "#0056b7",
                fillColor: "#19a0ff",
                fillOpacity: 1,
                weight: 2,
              }}
            />
            {headingGeometry && (
              <>
                <Polyline
                  positions={headingGeometry.shaft}
                  interactive={false}
                  pathOptions={{
                    color: "#0f172a",
                    weight: 3,
                    opacity: 0.95,
                    lineCap: "round",
                  }}
                />
                <Polygon
                  positions={headingGeometry.head}
                  interactive={false}
                  pathOptions={{
                    color: "#0f172a",
                    fillColor: "#0f172a",
                    fillOpacity: 0.98,
                    weight: 1,
                  }}
                />
              </>
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
