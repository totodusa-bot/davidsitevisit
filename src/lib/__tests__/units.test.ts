import { describe, expect, it } from "vitest";

import { convertValue, formatDualMeasurement } from "@/lib/units";

describe("units", () => {
  it("converts imperial to metric and back", () => {
    const meters = convertValue(10, "imperial", "metric");
    const feet = convertValue(meters, "metric", "imperial");

    expect(meters).toBeCloseTo(3.048, 3);
    expect(feet).toBeCloseTo(10, 4);
  });

  it("formats dual measurements", () => {
    const value = formatDualMeasurement(10, "imperial");

    expect(value).toContain("10.00 ft");
    expect(value).toContain("3.05 m");
  });
});
