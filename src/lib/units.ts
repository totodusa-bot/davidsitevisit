import type { Unit } from "@/lib/types";

const FEET_TO_METERS = 0.3048;

export function convertValue(value: number, from: Unit, to: Unit): number {
  if (from === to) {
    return value;
  }

  if (from === "imperial" && to === "metric") {
    return value * FEET_TO_METERS;
  }

  return value / FEET_TO_METERS;
}

export function formatMeasurement(value: number | null, unit: Unit): string {
  if (value === null) {
    return "-";
  }

  const rounded = value.toFixed(2);
  return unit === "imperial" ? `${rounded} ft` : `${rounded} m`;
}

export function formatDualMeasurement(
  value: number | null,
  sourceUnit: Unit,
): string {
  if (value === null) {
    return "-";
  }

  const metric =
    sourceUnit === "metric" ? value : convertValue(value, "imperial", "metric");
  const imperial =
    sourceUnit === "imperial"
      ? value
      : convertValue(value, "metric", "imperial");

  return `${imperial.toFixed(2)} ft / ${metric.toFixed(2)} m`;
}
