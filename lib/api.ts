// All client-side fetch calls to our own API routes live here.

import type { StationMatch, Journey, ParsedJourney, LineStatus } from "@/lib/types";

export async function searchStations(query: string): Promise<StationMatch[]> {
  // Use /api/places/search so landmark names (e.g. "UEL Docklands") also resolve
  const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Station search failed");
  return data.matches ?? [];
}

export async function parseJourneyText(text: string): Promise<ParsedJourney> {
  const res = await fetch("/api/parse-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to parse journey");
  return data as ParsedJourney;
}

export async function planJourney(
  from: string,
  to: string,
  arriveBy: string | null,
  departAt: string | null
): Promise<Journey[]> {
  const params = new URLSearchParams({ from, to });
  if (arriveBy) params.set("arriveBy", arriveBy);
  if (departAt) params.set("departAt", departAt);
  const res = await fetch(`/api/journey?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Journey planning failed");
  return data.journeys ?? [];
}

export async function fetchLineStatuses(): Promise<LineStatus[]> {
  const res = await fetch("/api/line-status");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load line status");
  return data.lines ?? [];
}

export async function fetchNearbyStations(
  lat: number,
  lon: number,
  radius = 800
): Promise<StationMatch[]> {
  const res = await fetch(`/api/stations/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load nearby stations");
  return data.stops ?? [];
}
