"use client";

// Thin wrapper around the browser Geolocation API — resolves to lat/lon
// coordinates only. Station resolution lives in useNearbyStations.

import { useCallback, useState } from "react";

export type GeoStatus = "idle" | "locating" | "done" | "error";

export interface GeoCoords {
  lat: number;
  lon: number;
}

const ERROR_MESSAGES: Record<number, string> = {
  1: "Location access denied. Please allow location in your browser settings.",
  2: "Couldn't determine your location. Try again or enter a station name manually.",
  3: "Location request timed out. Please try again.",
};

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location access.");
      setStatus("error");
      return;
    }

    setStatus("locating");
    setError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 60000,
          enableHighAccuracy: false,
        });
      });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setStatus("done");
    } catch (err) {
      const e = err as GeolocationPositionError;
      setError(ERROR_MESSAGES[e.code] ?? "Location unavailable.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setCoords(null);
    setError(null);
  }, []);

  return { status, coords, error, locate, reset };
}
