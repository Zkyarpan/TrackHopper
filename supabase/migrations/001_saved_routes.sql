-- ============================================================
-- Part B: Database Schema — Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Create the saved_routes table
create table if not exists public.saved_routes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  from_station_id  text not null,
  from_station_name text not null,
  to_station_id    text not null,
  to_station_name  text not null,
  nickname         text,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- RLS means the Postgres database itself enforces that users
-- can only see and modify their own rows. Even if application
-- code forgets to filter by user_id, the DB blocks it at the
-- query level using the JWT sub from the request headers.
--
-- COMMON GOTCHA: Enable RLS first (line below), then add each
-- policy. Without both steps, access is either fully open or
-- fully blocked. Test by logging in as two different users and
-- confirming each can only see their own rows.
-- ============================================================

alter table public.saved_routes enable row level security;

create policy "Users can view own saved routes"
  on public.saved_routes for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved routes"
  on public.saved_routes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved routes"
  on public.saved_routes for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own saved routes"
  on public.saved_routes for delete
  using (auth.uid() = user_id);

create index if not exists saved_routes_user_id_idx
  on public.saved_routes (user_id);
