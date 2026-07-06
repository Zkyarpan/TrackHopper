// Server-side Supabase client — for use in Server Components, Route Handlers,
// and Server Actions. Uses @supabase/ssr's createServerClient which reads/writes
// cookies via Next.js's `cookies()` helper to keep the session in sync.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component — cookie writes are
            // silently ignored there but will succeed in Route Handlers/Actions.
          }
        },
      },
    }
  );
}
