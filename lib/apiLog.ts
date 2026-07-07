// Lightweight call logging for the TfL, Pollinations, and Nominatim
// integrations so the admin panel can surface failures. Never throws — a
// logging failure must not break the API route that's calling it.
import { createClient } from "@/lib/supabase/server";

export type LoggedApi = "tfl" | "pollinations" | "nominatim";

export async function logApiCall(api: LoggedApi, success: boolean, error?: string) {
  try {
    const supabase = await createClient();
    await supabase.from("api_logs").insert({ api, success, error: error ?? null });
  } catch {
    // Best-effort only.
  }
}
