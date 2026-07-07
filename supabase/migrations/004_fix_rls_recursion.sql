-- ============================================================
-- Fix: Infinite recursion in RLS policies that query public.profiles
-- from inside a policy on public.profiles (or reference it from
-- saved_routes / api_logs policies).
--
-- Root cause: the "Admins can view all profiles" policy used
--   exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
-- Postgres evaluates that sub-select through RLS → re-enters the same
-- policy → infinite recursion.
--
-- Fix: replace every admin-check subquery with a security definer
-- function.  A security definer function executes as its *definer*
-- (postgres superuser), not the calling user, so RLS is bypassed for
-- that one narrow read.  The function itself is read-only and only
-- ever returns a boolean for the current JWT user — it cannot be
-- exploited to read arbitrary rows.
--
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── 1. Create the security-definer helper ──────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Revoke public execute so only authenticated sessions can call it
-- (the function already does nothing useful for anon since auth.uid() → NULL)
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── 2. Drop every broken recursive policy ─────────────────────────────────

drop policy if exists "Admins can view all profiles"    on public.profiles;
drop policy if exists "Admins can view all saved routes" on public.saved_routes;
drop policy if exists "Admins can view api logs"        on public.api_logs;

-- ── 3. Recreate them using the safe helper ─────────────────────────────────

-- profiles: admins can read every row
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.is_admin());

-- saved_routes: admins can read every row (user-scoped policies from
-- 001_saved_routes.sql are left untouched — this is an additional policy)
create policy "Admins can view all saved routes"
  on public.saved_routes
  for select
  using (public.is_admin());

-- api_logs: admins can read logs
create policy "Admins can view api logs"
  on public.api_logs
  for select
  using (public.is_admin());
