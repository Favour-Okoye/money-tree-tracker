-- MoneyTree migration 0004: mentor moves - events, programs, communities (Phase 4)

create table public.mentor_moves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null,
  category   text not null default 'other' check (category in
             ('event','program','community','podcast','book','appearance','other')),
  url        text,
  location   text,
  price      text,          -- display string, e.g. '£50 / £200 VIP'
  starts_on  date,
  ends_on    date,
  her_status text not null default 'announced'
             check (her_status in ('rumored','announced','open','ongoing','past')),
  my_status  text not null default 'tracking'
             check (my_status in ('tracking','interested','registered','attended','passed')),
  pinned     boolean not null default false,   -- pinned moves surface on the P5 dashboard
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index moves_date_idx on public.mentor_moves (user_id, starts_on);

alter table public.mentor_moves enable row level security;
create policy "own rows" on public.mentor_moves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
