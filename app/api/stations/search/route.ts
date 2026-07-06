import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query || query.trim().length < 2) {
    return Response.json({ matches: [] });
  }

  const appKey = process.env.TFL_APP_KEY;
  if (!appKey) {
    return Response.json(
      { error: "TfL API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL(
    `https://api.tfl.gov.uk/StopPoint/Search/${encodeURIComponent(query.trim())}`
  );
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("modes", "tube,bus,overground,elizabeth-line,dlr,tram,national-rail");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("faresOnly", "false");

  let data: {
    matches?: Array<{
      id: string;
      name: string;
      lat?: number;
      lon?: number;
      modes?: string[];
    }>;
  };

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("TfL StopPoint/Search error:", res.status, body);
      return Response.json(
        { error: `TfL API error (${res.status})` },
        { status: 502 }
      );
    }
    data = await res.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `TfL request failed: ${msg}` }, { status: 502 });
  }

  const matches = (data.matches ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    modes: m.modes ?? [],
  }));

  return Response.json({ matches });
}
