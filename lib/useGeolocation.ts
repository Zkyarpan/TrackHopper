"use client";

import { useState, useCallback } from "react";
import type { StationMatch } from "@/lib/types";

export type GeoState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "resolving" }
  | { status: "done"; station: StationMatch; lat: number; lon: number }
  | { status: "error"; message: string };

export function useGeolocation() {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", message: "Your browser doesn't support location access." });
      return;
    }

    setGeo({ status: "locating" });

    let lat: number, lon: number;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 60000,
          enableHighAccuracy: false,
        });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch (err) {
      const e = err as GeolocationPositionError;
      const messages: Record<number, string> = {
        1: "Location access denied. Please allow location in your browser settings.",
        2: "Couldn't determine your location. Try again or enter a station name manually.",
        3: "Location request timed out. Please try again.",
      };
      setGeo({ status: "error", message: messages[e.code] ?? "Location unavailable." });
      return;
    }

    // Resolve to nearest TfL station via our /api/stations/nearby route
    setGeo({ status: "resolving" });
    try {
      const res = await fetch(
        `/api/stations/nearby?lat=${lat}&lon=${lon}&radius=800`
      );
      const data = await res.json();
      const stops: StationMatch[] = data.stops ?? [];

      if (stops.length === 0) {
        setGeo({
          status: "error",
          message: "No TfL stations found near your location. Try entering a station name.",
        });
        return;
      }

      setGeo({ status: "done", station: stops[0], lat, lon });
    } catch {
      setGeo({
        status: "error",
        message: "Couldn't look up nearby stations. Check your connection and try again.",
      });
    }
  }, []);

  const reset = useCallback(() => setGeo({ status: "idle" }), []);

  return { geo, locate, reset };
}
