// OAuth callback handler — Supabase redirects here after Google sign-in.
// Exchanges the one-time `code` in the URL for a real session, then
// redirects the user to wherever they came from (via `next` param) or home.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` lets us send the user back to the page they were on before auth
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful — redirect to origin + next path
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to home with an error flag
  return NextResponse.redirect(`${origin}/?error=auth`);
}
