-- ============================================================
-- Part 2: API health / error log — Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

create table if not exists public.api_logs (
  id          uuid primary key default gen_random_uuid(),
  api         text not null check (api in ('tfl', 'pollinations', 'nominatim')),
  success     boolean not null,
  error       text,
  created_at  timestamptz not null default now()
);

alter table public.api_logs enable row level security;

-- These log writes happen server-side inside API routes that don't require
-- sign-in (e.g. anonymous station search), so there's often no authenticated
-- user on the request. Inserts must be allowed regardless of auth state.
-- No sensitive/user data is stored in this table, only integration health.
create policy "Anyone can insert api logs"
  on public.api_logs for insert
  with check (true);

create policy "Admins can view api logs"
  on public.api_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create index if not exists api_logs_created_at_idx
  on public.api_logs (created_at desc);
