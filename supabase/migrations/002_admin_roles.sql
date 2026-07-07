-- ============================================================
-- Part 1: Admin Role System — Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ============================================================
-- profiles table — extends auth.users with app-specific fields
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile (needed so the app can check its own admin status)
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read all profiles (needed for the admin panel's user list)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- Auto-create a profile row whenever a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Backfill profiles for users who signed up before this migration
-- ============================================================
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles);

-- ============================================================
-- last_sign_in_at sync — ADDITION beyond the literal spec above.
-- The admin panel's "Users overview" (Part 2) needs each user's last
-- sign-in time. auth.users isn't queryable from the app (no service-role
-- key is configured, only the anon key), so we mirror last_sign_in_at
-- onto public.profiles via a trigger every time Supabase auth updates it.
-- ============================================================
alter table public.profiles add column if not exists last_sign_in_at timestamptz;

create or replace function public.handle_user_login()
returns trigger as $$
begin
  update public.profiles set last_sign_in_at = new.last_sign_in_at
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_login
  after update of last_sign_in_at on auth.users
  for each row execute function public.handle_user_login();

-- ============================================================
-- Admins can view all saved routes (additional policy — the existing
-- user-scoped policies on saved_routes from 001_saved_routes.sql are
-- left untouched)
-- ============================================================
create policy "Admins can view all saved routes"
  on public.saved_routes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
