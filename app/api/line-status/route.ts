export const dynamic = "force-dynamic";
// Revalidate every 60 seconds so status is reasonably fresh
export const revalidate = 60;

interface TflLineStatus {
  statusSeverityDescription: string;
  reason?: string;
}

interface TflLine {
  id: string;
  name: string;
  lineStatuses?: TflLineStatus[];
}

export async function GET() {
  const appKey = process.env.TFL_APP_KEY;
  if (!appKey) {
    return Response.json(
      { error: "TfL API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://api.tfl.gov.uk/Line/Mode/tube,elizabeth-line,overground,dlr/Status");
  url.searchParams.set("app_key", appKey);

  let data: TflLine[];
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("TfL line status error:", res.status, body);
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

  const lines = data.map((line) => ({
    id: line.id,
    name: line.name,
    status: line.lineStatuses?.[0]?.statusSeverityDescription ?? "Unknown",
    reason: line.lineStatuses?.[0]?.reason ?? null,
  }));

  return Response.json({ lines });
}
