// GET /api/places/search?query=UEL+Docklands
// Combines:
//   1. TfL StopPoint/Search (official station name matches)
//   2. Nominatim geocoding (landmark/place names) + TfL nearby lookup
// Returns a unified list of StationMatch objects, with landmark results
// labelled so the UI can show "UEL Docklands Campus (nearest: Cyprus DLR)"
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const LONDON_BOUNDS = {
  south: 51.28,
  north: 51.72,
  west: -0.51,
  east: 0.33,
};

function isInLondon(lat: number, lon: number): boolean {
  return (
    lat >= LONDON_BOUNDS.south &&
    lat <= LONDON_BOUNDS.north &&
    lon >= LONDON_BOUNDS.west &&
    lon <= LONDON_BOUNDS.east
  );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query || query.trim().length < 2) {
    return Response.json({ matches: [] });
  }

  const appKey = process.env.TFL_APP_KEY;
  if (!appKey) {
    return Response.json({ error: "TfL API key not configured" }, { status: 500 });
  }

  const q = query.trim();

  // ── 1. TfL StopPoint/Search ──────────────────────────────────────────────
  const tflUrl = new URL(`https://api.tfl.gov.uk/StopPoint/Search/${encodeURIComponent(q)}`);
  tflUrl.searchParams.set("app_key", appKey);
  tflUrl.searchParams.set("modes", "tube,bus,overground,elizabeth-line,dlr,tram,national-rail");
  tflUrl.searchParams.set("maxResults", "6");
  tflUrl.searchParams.set("faresOnly", "false");

  // ── 2. Nominatim geocoding ───────────────────────────────────────────────
  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", `${q}, London`);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("limit", "3");
  nominatimUrl.searchParams.set("addressdetails", "0");
  nominatimUrl.searchParams.set("bounded", "1");
  nominatimUrl.searchParams.set("viewbox", `${LONDON_BOUNDS.west},${LONDON_BOUNDS.south},${LONDON_BOUNDS.east},${LONDON_BOUNDS.north}`);

  // Run both in parallel; Nominatim requires a descriptive User-Agent
  const [tflRes, nominatimRes] = await Promise.allSettled([
    fetch(tflUrl.toString(), { signal: AbortSignal.timeout(10000) }),
    fetch(nominatimUrl.toString(), {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "TrackHopper/1.0 (london-commute-helper; contact@trackhopper.app)",
        "Accept-Language": "en",
      },
    }),
  ]);

  // Parse TfL results
  type TflMatch = { id: string; name: string; modes?: string[] };
  let tflMatches: TflMatch[] = [];
  if (tflRes.status === "fulfilled" && tflRes.value.ok) {
    const data = await tflRes.value.json();
    tflMatches = (data.matches ?? []).map((m: TflMatch) => ({
      id: m.id,
      name: m.name,
      modes: m.modes ?? [],
      source: "tfl",
    }));
  }

  // Parse Nominatim results + fetch nearby TfL stops for each
  type NominatimResult = { lat: string; lon: string; display_name: string; type: string; class: string };
  let nominatimMatches: Array<{ id: string; name: string; modes: string[]; label: string }> = [];

  if (nominatimRes.status === "fulfilled" && nominatimRes.value.ok) {
    const places: NominatimResult[] = await nominatimRes.value.json();
    const londonPlaces = places.filter((p) =>
      isInLondon(parseFloat(p.lat), parseFloat(p.lon))
    );

    // For each place found, look up the nearest TfL stop
    const nearbyResults = await Promise.allSettled(
      londonPlaces.slice(0, 2).map(async (place) => {
        const nearbyUrl = new URL("https://api.tfl.gov.uk/StopPoint");
        nearbyUrl.searchParams.set("lat", place.lat);
        nearbyUrl.searchParams.set("lon", place.lon);
        nearbyUrl.searchParams.set("radius", "600");
        nearbyUrl.searchParams.set("stopTypes", "NaptanMetroStation,NaptanRailStation,NaptanPublicBusCoachTram");
        nearbyUrl.searchParams.set("modes", "tube,elizabeth-line,overground,dlr,national-rail,bus");
        nearbyUrl.searchParams.set("returnLines", "false");
        nearbyUrl.searchParams.set("app_key", appKey);

        const res = await fetch(nearbyUrl.toString(), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const data = await res.json();

        type TflStop = { id: string; commonName: string; modes?: string[]; distance?: number };
        const stops: TflStop[] = (data.stopPoints ?? []).sort(
          (a: TflStop, b: TflStop) => (a.distance ?? 999) - (b.distance ?? 999)
        );

        if (stops.length === 0) return null;

        // Short place label: first two segments of display_name
        const placeLabel = place.display_name.split(",").slice(0, 2).join(",").trim();
        const nearestStop = stops[0];

        return {
          id: nearestStop.id,
          name: nearestStop.commonName,
          modes: nearestStop.modes ?? [],
          label: `${placeLabel} → nearest: ${nearestStop.commonName}`,
          source: "landmark",
        };
      })
    );

    nominatimMatches = nearbyResults
      .filter((r): r is PromiseFulfilledResult<NonNullable<typeof r extends PromiseFulfilledResult<infer T> ? T : never>> =>
        r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value as { id: string; name: string; modes: string[]; label: string });
  }

  // Merge: TfL results first, then landmark results that don't duplicate an existing TfL match
  const tflIds = new Set(tflMatches.map((m) => m.id));
  const uniqueLandmarks = nominatimMatches.filter((m) => !tflIds.has(m.id));

  const matches = [
    ...tflMatches.map((m) => ({ ...m, label: m.name })),
    ...uniqueLandmarks,
  ];

  return Response.json({ matches });
}
