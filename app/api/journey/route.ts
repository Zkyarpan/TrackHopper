import { type NextRequest } from "next/server";
import { logApiCall } from "@/lib/apiLog";

export const dynamic = "force-dynamic";

interface TflLeg {
  duration: number;
  instruction?: { detailed?: string; summary?: string };
  mode?: { id?: string; name?: string };
  routeOptions?: Array<{ name?: string; lineIdentifier?: { name?: string } }>;
  departurePoint?: { commonName?: string; lat?: number; lon?: number };
  arrivalPoint?: { commonName?: string; lat?: number; lon?: number };
  departureTime?: string;
  arrivalTime?: string;
  path?: {
    stopPoints?: Array<{ name?: string; lat?: number; lon?: number }>;
    lineString?: string; // TfL encoded polyline
  };
}

interface TflJourney {
  duration?: number;
  startDateTime?: string;
  arrivalDateTime?: string;
  fare?: { totalCost?: number };
  legs?: TflLeg[];
}

interface TflJourneyResponse {
  journeys?: TflJourney[];
  httpStatusCode?: number;
  message?: string;
}

function parseLineString(lineString?: string): Array<{ lat: number; lon: number }> {
  if (!lineString) return [];
  try {
    // TfL lineString is a JSON array of [lat, lon] pairs (confirmed from live API)
    const pairs: [number, number][] = JSON.parse(lineString);
    return pairs.map(([lat, lon]) => ({ lat, lon }));
  } catch {
    return [];
  }
}

function formatLeg(leg: TflLeg) {
  const modeId = leg.mode?.id ?? "unknown";
  const lineName =
    leg.routeOptions?.[0]?.lineIdentifier?.name ??
    leg.routeOptions?.[0]?.name ??
    leg.mode?.name ??
    modeId;
  return {
    mode: modeId,
    lineName,
    duration: leg.duration ?? 0,
    instruction:
      leg.instruction?.detailed ?? leg.instruction?.summary ?? "",
    from: leg.departurePoint?.commonName ?? "",
    to: leg.arrivalPoint?.commonName ?? "",
    fromLat: leg.departurePoint?.lat,
    fromLon: leg.departurePoint?.lon,
    toLat: leg.arrivalPoint?.lat,
    toLon: leg.arrivalPoint?.lon,
    departureTime: leg.departureTime ?? null,
    arrivalTime: leg.arrivalTime ?? null,
    path: parseLineString(leg.path?.lineString),
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const arriveBy = sp.get("arriveBy");
  const departAt = sp.get("departAt");

  if (!from || !to) {
    return Response.json(
      { error: "from and to parameters are required" },
      { status: 400 }
    );
  }

  const appKey = process.env.TFL_APP_KEY;
  if (!appKey) {
    return Response.json(
      { error: "TfL API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL(
    `https://api.tfl.gov.uk/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}`
  );
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("journeyPreference", "LeastTime");

  // Build time string: TfL expects HHMM format
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  if (arriveBy) {
    const hhmm = arriveBy.replace(":", "");
    url.searchParams.set("time", hhmm);
    url.searchParams.set("timeIs", "Arriving");
    url.searchParams.set("date", dateStr);
  } else if (departAt) {
    const hhmm = departAt.replace(":", "");
    url.searchParams.set("time", hhmm);
    url.searchParams.set("timeIs", "Departing");
    url.searchParams.set("date", dateStr);
  }

  let data: TflJourneyResponse;
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 404) {
      await logApiCall("tfl", true);
      return Response.json(
        { error: "No routes found between these stations." },
        { status: 404 }
      );
    }

    if (!res.ok) {
      const body = await res.text();
      console.error("TfL Journey error:", res.status, body);
      await logApiCall("tfl", false, `HTTP ${res.status}`);
      return Response.json(
        { error: `TfL API error (${res.status})` },
        { status: 502 }
      );
    }

    data = await res.json();
    await logApiCall("tfl", true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logApiCall("tfl", false, msg);
    return Response.json({ error: `TfL request failed: ${msg}` }, { status: 502 });
  }

  if (!data.journeys || data.journeys.length === 0) {
    return Response.json(
      { error: "No routes found between these stations." },
      { status: 404 }
    );
  }

  const journeys = data.journeys.slice(0, 3).map((j) => ({
    duration: j.duration ?? 0,
    departureTime: j.startDateTime ?? null,
    arrivalTime: j.arrivalDateTime ?? null,
    fare: j.fare?.totalCost != null ? j.fare.totalCost / 100 : null,
    legs: (j.legs ?? []).map(formatLeg),
  }));

  return Response.json({ journeys });
}
