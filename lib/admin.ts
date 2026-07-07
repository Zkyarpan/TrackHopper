// Server-side admin check — for guarding admin routes/pages.
// Queries the caller's own profiles row (readable via the "Users can view
// own profile" RLS policy) and checks is_admin.
import { createClient } from "@/lib/supabase/server";

export async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin === true;
}
