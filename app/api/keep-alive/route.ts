/**
 * Supabase keep-alive endpoint.
 *
 * Supabase free-tier projects pause after 7 days of inactivity.
 * This route performs a cheap, read-only query (no user data touched)
 * so the project registers activity and stays active.
 *
 * Called by the Vercel cron job defined in vercel.json every day at 05:00 UTC.
 * Protected by a CRON_SECRET bearer token so it cannot be triggered by random
 * external callers.
 */
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify the request comes from the authorised cron caller.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = await createClient();
    // A lightweight system-level query — counts nothing sensitive, just proves
    // the connection is alive and registers DB activity to prevent pausing.
    const { error } = await supabase.from("api_logs").select("id").limit(1);
    if (error) {
      console.error("[keep-alive] Supabase ping failed:", error.message);
      return Response.json({ ok: false, error: error.message }, { status: 502 });
    }
    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[keep-alive] Unexpected error:", msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
