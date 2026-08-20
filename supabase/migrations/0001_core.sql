-- MoneyTree migration 0001: core tables (Phase 1)
-- Paste into Supabase Studio -> SQL Editor -> Run. Safe to run once.

create table public.profiles (
  user_id              uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name         text not null default 'Favour',
  timezone             text not null default 'Europe/Brussels',
  last_seen_catalog_at timestamptz not null default now(),  -- NEW-badge watermark
  xp_total             int  not null default 0,             -- cache; xp_events is the truth
  current_streak       int  not null default 0,
  longest_streak       int  not null default 0,
  last_activity_on     date,
  created_at           timestamptz not null default now()
);

create table public.media_status (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  media_type  text not null default 'video'
              check (media_type in ('video','podcast_episode','appearance')),
  media_id    text not null,
  status      text not null default 'watched'
              check (status in ('queued','watching','watched','skipped')),
  watched_at  timestamptz,
  liked       boolean not null default false,   -- "I liked it on YouTube"
  commented   boolean not null default false,
  rating      smallint check (rating between 1 and 5),
  updated_at  timestamptz not null default now(),
  unique (user_id, media_type, media_id)
);

create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_type text not null check (source_type in
              ('video','podcast_episode','appearance','book','book_chapter',
               'social_post','assignment','move','free')),
  source_id   text,
  body        text not null,
  takeaways   text[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index notes_source_idx on public.notes (user_id, source_type, source_id);

create table public.xp_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  action      text not null,
  points      int  not null,
  ref_type    text,
  ref_id      text,
  happened_on date not null,   -- Brussels-local day, computed client-side
  created_at  timestamptz not null default now()
);
-- Can't double-earn XP for the same item; conflicts are treated as "already earned".
create unique index xp_dedupe on public.xp_events (user_id, action, ref_type, ref_id)
  where ref_id is not null;
create index xp_day_idx on public.xp_events (user_id, happened_on);

create table public.badges (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  badge_id  text not null,   -- definitions live in frontend code
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create view public.v_xp_by_day with (security_invoker = true) as
  select user_id, happened_on, sum(points)::int as points
  from public.xp_events
  group by user_id, happened_on;

-- Row-level security: own rows only, on every table.
alter table public.profiles     enable row level security;
alter table public.media_status enable row level security;
alter table public.notes        enable row level security;
alter table public.xp_events    enable row level security;
alter table public.badges       enable row level security;

create policy "own rows" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.media_status
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.xp_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.badges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
