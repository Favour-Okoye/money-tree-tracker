-- MoneyTree migration 0005: weekly quiz results (Phase 5)

create table public.quiz_results (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_key date not null,   -- the Saturday this quiz unlocked
  score    int  not null default 0,
  total    int  not null default 0,
  grade    text,            -- A/B/C/D/F or 'missed'
  status   text not null default 'done' check (status in ('done','missed')),
  details  jsonb,           -- questions + given answers, for the history view
  taken_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

alter table public.quiz_results enable row level security;
create policy "own rows" on public.quiz_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
