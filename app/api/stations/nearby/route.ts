// GET /api/stations/nearby?lat=51.5&lon=-0.1&radius=500
// Returns up to 8 TfL stop points within `radius` metres of the given coordinates.
// Used after Nominatim resolves a landmark to lat/lon.
import { type NextRequest } from "next/server";
import { logApiCall } from "@/lib/apiLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lat = sp.get("lat");
  const lon = sp.get("lon");
  const radius = parseInt(sp.get("radius") ?? "600", 10);

  if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
    return Response.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const appKey = process.env.TFL_APP_KEY;
  if (!appKey) {
    return Response.json({ error: "TfL API key not configured" }, { status: 500 });
  }

  const url = new URL("https://api.tfl.gov.uk/StopPoint");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("radius", String(Math.min(radius, 1200)));
  url.searchParams.set("stopTypes", "NaptanMetroStation,NaptanRailStation,NaptanPublicBusCoachTram,NaptanFerryPort");
  url.searchParams.set("modes", "tube,elizabeth-line,overground,dlr,national-rail,bus,tram");
  url.searchParams.set("returnLines", "false");
  url.searchParams.set("app_key", appKey);

  let data: {
    stopPoints?: Array<{
      id: string;
      commonName: string;
      lat?: number;
      lon?: number;
      modes?: string[];
      distance?: number;
    }>;
  };

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const body = await res.text();
      console.error("TfL StopPoint nearby error:", res.status, body);
      await logApiCall("tfl", false, `HTTP ${res.status}`);
      return Response.json({ error: `TfL API error (${res.status})` }, { status: 502 });
    }
    data = await res.json();
    await logApiCall("tfl", true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logApiCall("tfl", false, msg);
    return Response.json({ error: `TfL request failed: ${msg}` }, { status: 502 });
  }

  // Sort by distance, deduplicate by name (TfL returns multiple entries per interchange)
  const seen = new Set<string>();
  const stops = (data.stopPoints ?? [])
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    .filter((s) => {
      const key = s.commonName.toLowerCase().replace(/\s+/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      name: s.commonName,
      modes: s.modes ?? [],
      lat: s.lat,
      lon: s.lon,
      distance: s.distance,
    }));

  return Response.json({ stops });
}
