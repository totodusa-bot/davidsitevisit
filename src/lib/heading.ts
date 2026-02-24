export function normalizeHeading(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const normalized = ((value % 360) + 360) % 360;
  return Number(normalized.toFixed(2));
}

export function smoothHeading(
  previous: number | null,
  next: number | null,
  alpha = 0.3,
): number | null {
  if (next === null) {
    return previous;
  }

  if (previous === null) {
    return next;
  }

  const delta = ((((next - previous) % 360) + 540) % 360) - 180;
  return normalizeHeading(previous + alpha * delta);
}
