-- ================================================================
-- RadElement Supabase Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ================================================================

-- ── TABLES ──────────────────────────────────────────────────────

-- profiles: extends auth.users with role and CDE-specific fields
create table if not exists public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  email          text,
  name           text not null default '',
  role           text not null default 'viewer'
                   check (role in ('viewer','author','editor','reviewer','admin')),
  organization   text,
  orcid_id       text,
  is_active      boolean not null default true,
  last_login_at  timestamptz,
  login_count    integer not null default 0,
  created_at     timestamptz not null default now()
);

-- drafts: CDE set drafts (set_data stores the full CDESet as JSON)
create table if not exists public.drafts (
  id                    text primary key,
  author_id             uuid not null references public.profiles(id) on delete cascade,
  author_name           text not null default '',
  name                  text not null default '',
  set_data              jsonb not null default '{}',
  submitted_for_review  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- comments: review comments on drafts (set_id links to set_data->>'id')
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  set_id      text not null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  user_name   text not null default '',
  user_role   text not null default 'viewer',
  content     text not null,
  element_id  text,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── INDEXES ─────────────────────────────────────────────────────

create index if not exists drafts_author_id_idx on public.drafts(author_id);
create index if not exists drafts_submitted_idx on public.drafts(submitted_for_review);
create index if not exists comments_set_id_idx  on public.comments(set_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── HELPER: get current user role (security definer avoids RLS recursion) ──

create or replace function public.my_role()
returns text
language sql
security definer stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── HELPER: atomically record a successful login ──────────────────

create or replace function public.increment_login_stats(uid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    last_login_at = now(),
    login_count   = coalesce(login_count, 0) + 1
  where id = uid;
end;
$$;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.drafts   enable row level security;
alter table public.comments enable row level security;

-- Drop existing policies (safe to re-run)
drop policy if exists "profiles_select"         on public.profiles;
drop policy if exists "profiles_insert"         on public.profiles;
drop policy if exists "profiles_update_own"     on public.profiles;
drop policy if exists "profiles_update_admin"   on public.profiles;
drop policy if exists "drafts_select"           on public.drafts;
drop policy if exists "drafts_insert"           on public.drafts;
drop policy if exists "drafts_update"           on public.drafts;
drop policy if exists "drafts_delete"           on public.drafts;
drop policy if exists "comments_select"         on public.comments;
drop policy if exists "comments_insert"         on public.comments;
drop policy if exists "comments_update"         on public.comments;
drop policy if exists "comments_delete"         on public.comments;

-- PROFILES policies
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.my_role() = 'admin');

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (public.my_role() = 'admin');

-- DRAFTS policies
create policy "drafts_select" on public.drafts
  for select using (
    author_id = auth.uid()
    or (submitted_for_review = true and public.my_role() in ('reviewer', 'admin'))
    or public.my_role() in ('editor', 'admin')
  );

create policy "drafts_insert" on public.drafts
  for insert with check (
    author_id = auth.uid()
    and public.my_role() in ('author', 'editor', 'admin')
  );

create policy "drafts_update" on public.drafts
  for update using (
    author_id = auth.uid()
    or public.my_role() in ('editor', 'admin')
  );

create policy "drafts_delete" on public.drafts
  for delete using (
    author_id = auth.uid()
    or public.my_role() in ('editor', 'admin')
  );

-- COMMENTS policies
create policy "comments_select" on public.comments
  for select using (auth.uid() is not null);

create policy "comments_insert" on public.comments
  for insert with check (user_id = auth.uid() and auth.uid() is not null);

create policy "comments_update" on public.comments
  for update using (
    user_id = auth.uid()
    or public.my_role() in ('reviewer', 'admin')
  );

create policy "comments_delete" on public.comments
  for delete using (
    user_id = auth.uid()
    or public.my_role() = 'admin'
  );

-- ================================================================
-- MIGRATION — run this block if you have an existing database
-- (safe to run even on a fresh schema — all statements are idempotent)
-- ================================================================

-- Add new columns to profiles (IF NOT EXISTS guards against re-runs)
alter table public.profiles
  add column if not exists is_active     boolean not null default true;

alter table public.profiles
  add column if not exists last_login_at timestamptz;

alter table public.profiles
  add column if not exists login_count   integer not null default 0;

-- Add promoted column to drafts
alter table public.drafts
  add column if not exists promoted boolean not null default false;

-- Update role constraint to include 'editor'
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('viewer','author','editor','reviewer','admin'));

-- ================================================================
-- DEMO USERS — run AFTER creating users in Supabase Auth dashboard
--
-- 1. Go to Supabase Dashboard → Authentication → Users → Add user
-- 2. Create these three users (disable "Auto Confirm User" OFF so
--    they don't need email verification, or tick "Auto Confirm"):
--      author@radiology.org   / password: demo1234
--      reviewer@radiology.org / password: demo1234
--      admin@radiology.org    / password: demo1234
--
-- 3. Then run the SQL below to set their roles:
--
-- UPDATE public.profiles SET name = 'Dr. Sarah Chen',
--   role = 'author', organization = 'Johns Hopkins Radiology'
--   WHERE email = 'author@radiology.org';
--
-- UPDATE public.profiles SET name = 'Dr. Michael Flanders',
--   role = 'reviewer', organization = 'ACR Commission on Informatics'
--   WHERE email = 'reviewer@radiology.org';
--
-- UPDATE public.profiles SET name = 'RadElement Admin',
--   role = 'admin', organization = 'RSNA'
--   WHERE email = 'admin@radiology.org';
-- ================================================================
