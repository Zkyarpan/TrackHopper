// Browser-side Supabase client — safe to call in Client Components.
// Uses @supabase/ssr's createBrowserClient which handles cookie-based
// session storage automatically.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
