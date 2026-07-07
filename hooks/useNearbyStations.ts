/* eslint-disable react-hooks/set-state-in-effect */
"use client";

// Combines browser geolocation with the /api/stations/nearby lookup.
// Exposes both the single nearest station (for "Use my location" autofill)
// and the full nearby list (for the NearbySuggestions panel) so the app
// only has to ask for location permission once.

import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchNearbyStations } from "@/lib/api";
import type { StationMatch } from "@/lib/types";

export type NearbyPhase = "idle" | "locating" | "resolving" | "done" | "error";

export function useNearbyStations() {
  const { status: geoStatus, coords, error: geoError, locate, reset: resetGeo } = useGeolocation();
  const [stations, setStations] = useState<StationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchNearbyStations(coords.lat, coords.lon, 800)
      .then((stops) => {
        if (cancelled) return;
        if (stops.length === 0) {
          setError("No TfL stations found near your location. Try entering a station name.");
        }
        setStations(stops);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't look up nearby stations. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const reset = () => {
    resetGeo();
    setStations([]);
    setError(null);
  };

  const nearestStation = stations[0] ?? null;

  const phase: NearbyPhase =
    geoStatus === "locating"
      ? "locating"
      : geoStatus === "error"
      ? "error"
      : geoStatus === "done" && isLoading
      ? "resolving"
      : geoStatus === "done" && error
      ? "error"
      : geoStatus === "done" && nearestStation
      ? "done"
      : "idle";

  return {
    phase,
    stations,
    nearestStation,
    coords,
    isLoading,
    error: error ?? geoError,
    requestLocation: locate,
    reset,
  };
}
