"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { normalizeHeading, smoothHeading } from "@/lib/heading";

type PermissionState = "idle" | "granted" | "denied" | "unsupported";

interface PositionState {
  lat: number;
  lng: number;
  accuracyM: number | null;
  geoHeadingDeg: number | null;
  capturedAt: string;
}

function extractOrientationHeading(event: DeviceOrientationEvent): number | null {
  const webkitHeading = (event as DeviceOrientationEvent & {
    webkitCompassHeading?: number;
  }).webkitCompassHeading;

  if (typeof webkitHeading === "number") {
    return normalizeHeading(webkitHeading);
  }

  if (typeof event.alpha === "number") {
    return normalizeHeading(360 - event.alpha);
  }

  return null;
}

export function useLocationHeading() {
  const [position, setPosition] = useState<PositionState | null>(null);
  const [locationPermission, setLocationPermission] =
    useState<PermissionState>("idle");
  const [orientationPermission, setOrientationPermission] =
    useState<PermissionState>("idle");
  const [orientationHeadingDeg, setOrientationHeadingDeg] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const locationWatchRef = useRef<number | null>(null);
  const smoothedHeadingRef = useRef<number | null>(null);
  const orientationEventTypeRef = useRef<string | null>(null);
  const orientationHandlerRef = useRef<((event: Event) => void) | null>(null);

  const startLocationWatch = useCallback(() => {
    if (typeof window === "undefined" || !window.navigator.geolocation) {
      setLocationPermission("unsupported");
      return;
    }

    if (locationWatchRef.current !== null) {
      return;
    }

    locationWatchRef.current = window.navigator.geolocation.watchPosition(
      (result) => {
        setPosition({
          lat: result.coords.latitude,
          lng: result.coords.longitude,
          accuracyM: result.coords.accuracy,
          geoHeadingDeg:
            typeof result.coords.heading === "number" &&
            !Number.isNaN(result.coords.heading)
              ? normalizeHeading(result.coords.heading)
              : null,
          capturedAt: new Date(result.timestamp).toISOString(),
        });
        setLocationPermission("granted");
        setError(null);
      },
      (geoError) => {
        setLocationPermission("denied");
        setError(geoError.message || "Location permission denied.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 2_000,
      },
    );
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !window.navigator.geolocation) {
      setLocationPermission("unsupported");
      return;
    }

    await new Promise<void>((resolve) => {
      window.navigator.geolocation.getCurrentPosition(
        (result) => {
          setPosition({
            lat: result.coords.latitude,
            lng: result.coords.longitude,
            accuracyM: result.coords.accuracy,
            geoHeadingDeg:
              typeof result.coords.heading === "number" &&
              !Number.isNaN(result.coords.heading)
                ? normalizeHeading(result.coords.heading)
                : null,
            capturedAt: new Date(result.timestamp).toISOString(),
          });
          setLocationPermission("granted");
          setError(null);
          startLocationWatch();
          resolve();
        },
        (geoError) => {
          setLocationPermission("denied");
          setError(geoError.message || "Location permission denied.");
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 0,
        },
      );
    });
  }, [startLocationWatch]);

  const requestOrientationPermission = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      typeof DeviceOrientationEvent === "undefined"
    ) {
      setOrientationPermission("unsupported");
      return;
    }

    const eventType =
      "ondeviceorientationabsolute" in window
        ? "deviceorientationabsolute"
        : "deviceorientation";

    const orientationHandler = (event: Event) => {
      const heading = extractOrientationHeading(event as DeviceOrientationEvent);
      const smoothed = smoothHeading(smoothedHeadingRef.current, heading);
      smoothedHeadingRef.current = smoothed;
      setOrientationHeadingDeg(smoothed);
    };

    try {
      const requestPermission = (
        DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<"granted" | "denied">;
        }
      ).requestPermission;

      if (typeof requestPermission === "function") {
        const state = await requestPermission();
        if (state !== "granted") {
          setOrientationPermission("denied");
          return;
        }
      }

      if (orientationEventTypeRef.current && orientationHandlerRef.current) {
        window.removeEventListener(
          orientationEventTypeRef.current,
          orientationHandlerRef.current,
          true,
        );
      }

      window.addEventListener(eventType, orientationHandler, true);
      orientationEventTypeRef.current = eventType;
      orientationHandlerRef.current = orientationHandler;
      setOrientationPermission("granted");
      setError(null);
    } catch {
      setOrientationPermission("denied");
      setError("Orientation permission denied.");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        locationWatchRef.current !== null &&
        window.navigator.geolocation
      ) {
        window.navigator.geolocation.clearWatch(locationWatchRef.current);
      }

      if (
        typeof window !== "undefined" &&
        orientationEventTypeRef.current &&
        orientationHandlerRef.current
      ) {
        window.removeEventListener(
          orientationEventTypeRef.current,
          orientationHandlerRef.current,
          true,
        );
      }
    };
  }, []);

  const headingDeg = useMemo(() => {
    if (orientationHeadingDeg !== null) {
      return orientationHeadingDeg;
    }

    return position?.geoHeadingDeg ?? null;
  }, [orientationHeadingDeg, position?.geoHeadingDeg]);

  return {
    position,
    headingDeg,
    locationPermission,
    orientationPermission,
    error,
    requestLocationPermission,
    requestOrientationPermission,
  };
}
