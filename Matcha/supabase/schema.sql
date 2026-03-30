-- Run this in Supabase → SQL Editor (new query), then Run.
-- Afterward: Settings → API → copy Project URL + anon public key into Matcha/.env
--
-- If rows never appear: Table Editor → confirm table name is matcha_entries (or set VITE_SUPABASE_TABLE).
-- Project Settings → Data API → ensure this table is exposed to the Data API (not restricted off).

-- ── Table ─────────────────────────────────────────────────────────
create table if not exists public.matcha_entries (
  id uuid primary key default gen_random_uuid(),
  cafe text not null,
  location text default ''::text,
  matcha_order text default ''::text,
  notes text default ''::text,
  visit_date date not null,
  rating double precision not null,
  image_url text,
  created_at timestamptz not null default now(),
  constraint matcha_entries_rating_range check (rating >= 0 and rating <= 5)
);

alter table public.matcha_entries enable row level security;

drop policy if exists "matcha_entries_anon_all" on public.matcha_entries;

-- ⚠️ Dev / single-user: lets anyone with your anon key read & write.
-- Before going public, switch to auth.uid() policies (see comment at bottom).
create policy "matcha_entries_anon_all"
  on public.matcha_entries
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ── Storage (photos) ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('matcha-images', 'matcha-images', true)
on conflict (id) do update set public = excluded.public;

-- Drop first if you re-run this script (names must match).
drop policy if exists "matcha_images_select" on storage.objects;
drop policy if exists "matcha_images_insert" on storage.objects;
drop policy if exists "matcha_images_update" on storage.objects;
drop policy if exists "matcha_images_delete" on storage.objects;

create policy "matcha_images_select"
  on storage.objects for select
  using (bucket_id = 'matcha-images');

create policy "matcha_images_insert"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'matcha-images');

create policy "matcha_images_update"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'matcha-images');

create policy "matcha_images_delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'matcha-images');

-- ── Optional: tighten later with Supabase Auth ───────────────────
-- add column: user_id uuid references auth.users (id);
-- drop policy "matcha_entries_anon_all";
-- create policy "own rows" on public.matcha_entries for all
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
